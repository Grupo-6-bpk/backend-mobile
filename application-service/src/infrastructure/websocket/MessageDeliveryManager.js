import PrismaMessageRepository from '../db/PrismaMessageRepository.js';

/**
 * Message Delivery Manager for WebSocket
 * Handles message delivery confirmations and read receipts
 */
export default class MessageDeliveryManager {
  constructor() {
    this.messageRepository = new PrismaMessageRepository();
    this.deliveryQueue = new Map(); // messageId -> { timestamp, attempts, recipients }
    this.readQueue = new Map(); // messageId -> Set of userIds who read it
    
    // Process delivery confirmations every 10 seconds
    this.deliveryInterval = setInterval(() => {
      this.processDeliveryQueue();
    }, 10 * 1000);
  }

  /**
   * Mark messages as delivered
   */
  async markAsDelivered(messageIds, io) {
    try {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return false;
      }

      // Update database
      const success = await this.messageRepository.markAsDelivered(messageIds);
      
      if (success) {
        // Emit delivery confirmations to senders
        for (const messageId of messageIds) {
          const message = await this.messageRepository.findById(messageId);
          if (message) {
            // Notify sender
            io.to(`user_${message.senderId}`).emit('message_delivered', {
              messageId: messageId,
              groupId: message.groupId,
              timestamp: Date.now(),
              status: 'delivered'
            });
          }
        }

        // Remove from delivery queue
        messageIds.forEach(id => this.deliveryQueue.delete(id));

        console.log(`✅ ${messageIds.length} messages marked as delivered`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error marking messages as delivered:', error);
      return false;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(userId, messageIds, groupId, io) {
    try {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return false;
      }

      // Update database
      const success = await this.messageRepository.markAsRead(userId, messageIds);
      
      if (success) {
        // Update read queue
        messageIds.forEach(messageId => {
          if (!this.readQueue.has(messageId)) {
            this.readQueue.set(messageId, new Set());
          }
          this.readQueue.get(messageId).add(userId);
        });

        // Emit read confirmations to group members
        for (const messageId of messageIds) {
          const message = await this.messageRepository.findById(messageId);
          if (message) {
            // Notify all group members about read receipt
            io.to(`group_${groupId}`).emit('message_read', {
              messageId: messageId,
              readBy: userId,
              groupId: groupId,
              timestamp: Date.now(),
              status: 'read'
            });

            // Special notification to sender
            if (message.senderId !== userId) {
              io.to(`user_${message.senderId}`).emit('message_read_by_recipient', {
                messageId: messageId,
                readBy: userId,
                groupId: groupId,
                timestamp: Date.now()
              });
            }
          }
        }

        console.log(`👁️ ${messageIds.length} messages marked as read by user ${userId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  /**
   * Add messages to delivery queue
   */
  addToDeliveryQueue(messageIds, recipients = []) {
    const timestamp = Date.now();
    
    messageIds.forEach(messageId => {
      this.deliveryQueue.set(messageId, {
        timestamp: timestamp,
        attempts: 0,
        recipients: new Set(recipients),
        maxAttempts: 5
      });
    });
  }

  /**
   * Process pending delivery confirmations
   */
  async processDeliveryQueue() {
    if (this.deliveryQueue.size === 0) {
      return;
    }

    const now = Date.now();
    const timeoutThreshold = 30 * 1000; // 30 seconds
    const maxAttempts = 5;
    
    const expiredEntries = [];

    this.deliveryQueue.forEach(async (delivery, messageId) => {
      const timeSinceQueued = now - delivery.timestamp;
      
      // Check if delivery timed out
      if (timeSinceQueued > timeoutThreshold) {
        delivery.attempts++;
        
        if (delivery.attempts >= maxAttempts) {
          // Mark as failed delivery
          expiredEntries.push(messageId);
          console.warn(`⚠️ Message ${messageId} delivery failed after ${maxAttempts} attempts`);
        } else {
          // Retry delivery
          delivery.timestamp = now;
          console.log(`🔄 Retrying delivery for message ${messageId} (attempt ${delivery.attempts})`);
        }
      }
    });

    // Clean up failed deliveries
    expiredEntries.forEach(messageId => {
      this.deliveryQueue.delete(messageId);
    });
  }

  /**
   * Get delivery status for messages
   */
  async getMessageDeliveryStatus(messageIds) {
    try {
      const statusList = [];
      
      for (const messageId of messageIds) {
        const message = await this.messageRepository.findById(messageId);
        if (message) {
          const readByUsers = this.readQueue.get(messageId) || new Set();
          
          statusList.push({
            messageId: messageId,
            status: message.status,
            deliveredAt: message.updatedAt,
            readBy: Array.from(readByUsers),
            readCount: readByUsers.size
          });
        }
      }
      
      return statusList;
    } catch (error) {
      console.error('Error getting message delivery status:', error);
      return [];
    }
  }

  /**
   * Get read receipts for a message
   */
  async getMessageReadReceipts(messageId) {
    try {
      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        return null;
      }

      // Get read receipts from database (MessageRead table)
      const readReceipts = message.reads || [];
      
      return {
        messageId: messageId,
        totalReads: readReceipts.length,
        readBy: readReceipts.map(read => ({
          userId: read.userId,
          userName: read.user?.name,
          readAt: read.readAt
        }))
      };
    } catch (error) {
      console.error('Error getting message read receipts:', error);
      return null;
    }
  }

  /**
   * Generate delivery report for group
   */
  async generateGroupDeliveryReport(groupId, fromDate, toDate) {
    try {
      // Get comprehensive delivery data
      const messages = await this.messageRepository.findByGroupIdAndDateRange(
        groupId, 
        fromDate, 
        toDate
      );

      const stats = {
        totalMessages: messages.length,
        deliveredMessages: 0,
        readMessages: 0,
        pendingDelivery: 0,
        failedDelivery: 0
      };

      let totalDeliveryTime = 0;
      let totalReadTime = 0;
      let deliveryCount = 0;
      let readCount = 0;

      for (const message of messages) {
        const createdAt = new Date(message.createdAt).getTime();
        
        if (message.status === 'delivered' || message.status === 'read') {
          stats.deliveredMessages++;
          
          if (message.updatedAt) {
            const deliveredAt = new Date(message.updatedAt).getTime();
            totalDeliveryTime += (deliveredAt - createdAt);
            deliveryCount++;
          }
        }
        
        if (message.status === 'read') {
          stats.readMessages++;
          
          // Get read receipts for read time calculation
          const reads = message.reads || [];
          if (reads.length > 0) {
            const firstReadAt = new Date(reads[0].readAt).getTime();
            totalReadTime += (firstReadAt - createdAt);
            readCount++;
          }
        }
        
        if (message.status === 'sent') {
          // Check if it's been too long since sent
          const timeSinceSent = Date.now() - createdAt;
          if (timeSinceSent > 5 * 60 * 1000) { // 5 minutes
            stats.failedDelivery++;
          } else {
            stats.pendingDelivery++;
          }
        }
      }

      const report = {
        groupId: groupId,
        period: {
          from: fromDate,
          to: toDate
        },
        stats: stats,
        deliveryRate: stats.totalMessages > 0 ? 
          (stats.deliveredMessages / stats.totalMessages) * 100 : 0,
        readRate: stats.deliveredMessages > 0 ? 
          (stats.readMessages / stats.deliveredMessages) * 100 : 0,
        averageDeliveryTime: deliveryCount > 0 ? 
          totalDeliveryTime / deliveryCount : 0,
        averageReadTime: readCount > 0 ? 
          totalReadTime / readCount : 0
      };

      return report;
    } catch (error) {
      console.error('Error generating delivery report:', error);
      return null;
    }
  }

  /**
   * Handle message recall (delete before read)
   */
  async recallMessage(messageId, requesterId, io) {
    try {
      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        throw new Error('Mensagem não encontrada');
      }

      // Check if requester can recall (sender only, within time limit)
      if (message.senderId !== requesterId) {
        throw new Error('Apenas o remetente pode cancelar a mensagem');
      }

      const timeSinceSent = Date.now() - new Date(message.createdAt).getTime();
      const recallTimeLimit = 5 * 60 * 1000; // 5 minutes

      if (timeSinceSent > recallTimeLimit) {
        throw new Error('Tempo limite para cancelar a mensagem expirou');
      }

      // Check if message was already read
      const readByUsers = this.readQueue.get(messageId);
      if (readByUsers && readByUsers.size > 0) {
        throw new Error('Não é possível cancelar mensagem já lida');
      }

      // Delete the message
      await this.messageRepository.delete(messageId);

      // Emit recall notification to group
      io.to(`group_${message.groupId}`).emit('message_recalled', {
        messageId: messageId,
        recalledBy: requesterId,
        groupId: message.groupId,
        timestamp: Date.now()
      });

      // Remove from queues
      this.deliveryQueue.delete(messageId);
      this.readQueue.delete(messageId);

      console.log(`🔄 Message ${messageId} recalled by user ${requesterId}`);
      return true;

    } catch (error) {
      console.error('Error recalling message:', error);
      throw error;
    }
  }

  /**
   * Get pending deliveries count
   */
  getPendingDeliveriesCount() {
    return this.deliveryQueue.size;
  }

  /**
   * Get delivery queue statistics
   */
  getDeliveryStats() {
    const stats = {
      pendingDeliveries: this.deliveryQueue.size,
      totalReadReceipts: 0,
      averageDeliveryAttempts: 0
    };

    let totalAttempts = 0;
    this.deliveryQueue.forEach(delivery => {
      totalAttempts += delivery.attempts;
    });

    if (this.deliveryQueue.size > 0) {
      stats.averageDeliveryAttempts = totalAttempts / this.deliveryQueue.size;
    }

    this.readQueue.forEach(readers => {
      stats.totalReadReceipts += readers.size;
    });

    return stats;
  }

  /**
   * Clear old read receipts from memory
   */
  cleanupOldReadReceipts() {
    const threshold = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    let cleanedCount = 0;
    
    // TODO: Add timestamp to read receipts to enable cleanup
    // For now, limit by size
    if (this.readQueue.size > 10000) {
      const entries = Array.from(this.readQueue.entries());
      const entriesToKeep = entries.slice(-5000); // Keep last 5000
      
      this.readQueue.clear();
      entriesToKeep.forEach(([messageId, readers]) => {
        this.readQueue.set(messageId, readers);
      });
      
      cleanedCount = entries.length - entriesToKeep.length;
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old read receipts from memory`);
    }
  }

  /**
   * Cleanup and shutdown
   */
  shutdown() {
    if (this.deliveryInterval) {
      clearInterval(this.deliveryInterval);
    }
    
    this.deliveryQueue.clear();
    this.readQueue.clear();
    
    console.log('✅ Message Delivery Manager shutdown complete');
  }
} 