import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import rateLimit from 'socket.io-redis';

// Import dos repositórios e casos de uso
import PrismaUserRepository from '../db/PrismaUserRepository.js';
import PrismaChatGroupRepository from '../db/PrismaChatGroupRepository.js';
import PrismaMessageRepository from '../db/PrismaMessageRepository.js';
import PrismaGroupMemberRepository from '../db/PrismaGroupMemberRepository.js';

import SendMessageUseCase from '../../application/chat/SendMessageUseCase.js';
import ChatEventHandler from './ChatEventHandler.js';
import PresenceManager from './PresenceManager.js';
import MessageDeliveryManager from './MessageDeliveryManager.js';

/**
 * High-Performance Socket.IO Server for Real-time Chat
 * Optimized for Flutter clients with advanced features
 */
export default class SocketServer {
  constructor(httpServer) {
    this.httpServer = httpServer;
    this.connectedUsers = new Map(); // userId -> socket.id
    this.userRooms = new Map(); // userId -> Set of roomIds
    
    // Initialize repositories
    this.userRepository = new PrismaUserRepository();
    this.chatGroupRepository = new PrismaChatGroupRepository();
    this.messageRepository = new PrismaMessageRepository();
    this.groupMemberRepository = new PrismaGroupMemberRepository();
    
    // Initialize use cases
    this.sendMessageUseCase = new SendMessageUseCase(
      this.messageRepository,
      this.groupMemberRepository,
      this.chatGroupRepository
    );

    // Initialize managers
    this.presenceManager = new PresenceManager();
    this.messageDeliveryManager = new MessageDeliveryManager();
    this.chatEventHandler = new ChatEventHandler(
      this.sendMessageUseCase,
      this.groupMemberRepository,
      this.chatGroupRepository
    );

    this.initializeServer();
  }

  /**
   * Initialize Socket.IO server with optimizations
   */
  initializeServer() {
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: "*", // Configure appropriately for production
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization"],
        credentials: true
      },
      // Performance optimizations
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e8, // 100MB for file uploads
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      // Compression for better performance
      compression: true,
      httpCompression: true,
      // Connection limits
      maxConnections: 10000,
      // Performance tuning
      serveClient: false,
      path: '/socket.io/'
    });

    // Apply middleware
    this.setupMiddleware();
    
    // Setup event handlers
    this.setupEventHandlers();

    console.log('🚀 WebSocket Server initialized with high-performance settings');
  }

  /**
   * Setup authentication and rate limiting middleware
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Token de autenticação necessário'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details
        const user = await this.userRepository.findById(decoded.id);
        if (!user) {
          return next(new Error('Usuário não encontrado'));
        }

        // Attach user to socket
        socket.userId = user.id;
        socket.user = {
          id: user.id,
          name: user.name,
          lastName: user.last_name,
          email: user.email,
          verified: user.verified
        };

        next();
      } catch (error) {
        console.error('WebSocket Authentication Error:', error);
        next(new Error('Token inválido'));
      }
    });

    // Rate limiting middleware (events per minute)
    this.io.use((socket, next) => {
      const userId = socket.userId;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxEvents = 100; // max events per minute per user

      if (!this.rateLimitMap) {
        this.rateLimitMap = new Map();
      }

      const userLimit = this.rateLimitMap.get(userId) || { count: 0, resetTime: now + windowMs };
      
      if (now > userLimit.resetTime) {
        userLimit.count = 0;
        userLimit.resetTime = now + windowMs;
      }

      if (userLimit.count >= maxEvents) {
        return next(new Error('Rate limit exceeded'));
      }

      userLimit.count++;
      this.rateLimitMap.set(userId, userLimit);
      next();
    });
  }

  /**
   * Setup main event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new client connection
   */
  async handleConnection(socket) {
    const userId = socket.userId;
    const user = socket.user;

    console.log(`✅ User connected: ${user.name} (${userId}) - Socket: ${socket.id}`);

    try {
      // Store connection
      this.connectedUsers.set(userId, socket.id);
      
      // Join user to their personal room
      await socket.join(`user_${userId}`);
      
      // Join user to their group rooms
      await this.joinUserGroups(socket);
      
      // Update presence
      await this.presenceManager.setUserOnline(userId, socket.id);
      
      // Emit user online status to contacts
      await this.broadcastUserStatus(userId, 'online');
      
      // Setup socket event handlers
      this.setupSocketEvents(socket);
      
      // Send pending offline messages
      await this.sendPendingMessages(socket);

      // Emit connection success
      socket.emit('connected', {
        message: 'Conectado com sucesso ao chat',
        userId: userId,
        timestamp: new Date(),
        serverTime: Date.now()
      });

    } catch (error) {
      console.error('Error handling connection:', error);
      socket.emit('error', { message: 'Erro na conexão', error: error.message });
    }
  }

  /**
   * Setup individual socket event handlers
   */
  setupSocketEvents(socket) {
    const userId = socket.userId;

    // ========== CHAT EVENTS ==========
    
    // Send message
    socket.on('send_message', async (data, callback) => {
      try {
        await this.chatEventHandler.handleSendMessage(socket, data, callback, this.io);
      } catch (error) {
        console.error('Send message error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Join group
    socket.on('join_group', async (data, callback) => {
      try {
        await this.chatEventHandler.handleJoinGroup(socket, data, callback);
      } catch (error) {
        console.error('Join group error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Leave group
    socket.on('leave_group', async (data, callback) => {
      try {
        await this.chatEventHandler.handleLeaveGroup(socket, data, callback);
      } catch (error) {
        console.error('Leave group error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // ========== MESSAGE STATUS EVENTS ==========
    
    // Message delivered
    socket.on('message_delivered', async (data) => {
      try {
        await this.messageDeliveryManager.markAsDelivered(data.messageIds, this.io);
      } catch (error) {
        console.error('Message delivered error:', error);
      }
    });

    // Message read
    socket.on('message_read', async (data) => {
      try {
        await this.messageDeliveryManager.markAsRead(userId, data.messageIds, data.groupId, this.io);
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    // ========== TYPING EVENTS ==========
    
    // User typing
    socket.on('typing_start', (data) => {
      socket.to(`group_${data.groupId}`).emit('user_typing', {
        userId: userId,
        userName: socket.user.name,
        groupId: data.groupId,
        timestamp: Date.now()
      });
    });

    // User stopped typing
    socket.on('typing_stop', (data) => {
      socket.to(`group_${data.groupId}`).emit('user_stopped_typing', {
        userId: userId,
        groupId: data.groupId,
        timestamp: Date.now()
      });
    });

    // ========== PRESENCE EVENTS ==========
    
    // Update user status
    socket.on('update_status', async (data) => {
      try {
        await this.presenceManager.updateUserStatus(userId, data.status);
        await this.broadcastUserStatus(userId, data.status);
      } catch (error) {
        console.error('Update status error:', error);
      }
    });

    // Get online users in group
    socket.on('get_online_users', async (data, callback) => {
      try {
        const onlineUsers = await this.presenceManager.getOnlineUsersInGroup(data.groupId);
        if (callback) callback({ success: true, data: onlineUsers });
      } catch (error) {
        console.error('Get online users error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // ========== MESSAGE ACTIONS ==========
    
    // Edit message
    socket.on('edit_message', async (data, callback) => {
      try {
        await this.chatEventHandler.handleEditMessage(socket, data, callback, this.io);
      } catch (error) {
        console.error('Edit message error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Delete message
    socket.on('delete_message', async (data, callback) => {
      try {
        await this.chatEventHandler.handleDeleteMessage(socket, data, callback, this.io);
      } catch (error) {
        console.error('Delete message error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Recall message (cancel before read)
    socket.on('recall_message', async (data, callback) => {
      try {
        await this.messageDeliveryManager.recallMessage(data.messageId, userId, this.io);
        if (callback) callback({ success: true, message: 'Mensagem cancelada com sucesso' });
      } catch (error) {
        console.error('Recall message error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Upload file
    socket.on('upload_file', async (data, callback) => {
      try {
        await this.chatEventHandler.handleFileUpload(socket, data, callback);
      } catch (error) {
        console.error('File upload error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // ========== DISCONNECTION ==========
    
    socket.on('disconnect', async (reason) => {
      await this.handleDisconnection(socket, reason);
    });

    // ========== ERROR HANDLING ==========
    
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  }

  /**
   * Join user to their group rooms
   */
  async joinUserGroups(socket) {
    try {
      const userId = socket.userId;
      const memberships = await this.groupMemberRepository.findByUserId(userId, true);
      
      const roomIds = new Set();
      
      for (const membership of memberships) {
        const roomId = `group_${membership.groupId}`;
        await socket.join(roomId);
        roomIds.add(roomId);
      }
      
      this.userRooms.set(userId, roomIds);
      
      console.log(`📝 User ${userId} joined ${roomIds.size} group rooms`);
    } catch (error) {
      console.error('Error joining user groups:', error);
    }
  }

  /**
   * Send pending offline messages to user
   */
  async sendPendingMessages(socket) {
    try {
      const userId = socket.userId;
      
      // Get undelivered messages
      const undeliveredMessages = await this.messageRepository.findByStatus('sent', 50);
      
      // Filter messages for user's groups
      const userMemberships = await this.groupMemberRepository.findByUserId(userId, true);
      const userGroupIds = userMemberships.map(m => m.groupId);
      
      const userUndeliveredMessages = undeliveredMessages.filter(msg => 
        userGroupIds.includes(msg.groupId) && msg.senderId !== userId
      );

      if (userUndeliveredMessages.length > 0) {
        socket.emit('pending_messages', {
          messages: userUndeliveredMessages,
          count: userUndeliveredMessages.length
        });

        // Mark as delivered
        const messageIds = userUndeliveredMessages.map(msg => msg.id);
        await this.messageDeliveryManager.markAsDelivered(messageIds, this.io);
      }
    } catch (error) {
      console.error('Error sending pending messages:', error);
    }
  }

  /**
   * Broadcast user status to contacts
   */
  async broadcastUserStatus(userId, status) {
    try {
      // Get user's contacts (people in direct chats)
      const memberships = await this.groupMemberRepository.findByUserId(userId, true);
      const directChats = memberships.filter(m => m.group.type === 'direct');
      
      for (const membership of directChats) {
        const groupMembers = await this.groupMemberRepository.findByGroupId(membership.groupId, true);
        const otherMember = groupMembers.find(m => m.userId !== userId);
        
        if (otherMember && this.connectedUsers.has(otherMember.userId)) {
          this.io.to(`user_${otherMember.userId}`).emit('contact_status_changed', {
            userId: userId,
            status: status,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Error broadcasting user status:', error);
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnection(socket, reason) {
    const userId = socket.userId;
    const user = socket.user;

    console.log(`❌ User disconnected: ${user?.name} (${userId}) - Reason: ${reason}`);

    try {
      // Remove from connected users
      this.connectedUsers.delete(userId);
      this.userRooms.delete(userId);
      
      // Update presence
      await this.presenceManager.setUserOffline(userId);
      
      // Broadcast user offline status
      await this.broadcastUserStatus(userId, 'offline');
      
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`user_${userId}`).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Send message to group
   */
  sendToGroup(groupId, event, data, excludeUserId = null) {
    if (excludeUserId) {
      const excludeSocketId = this.connectedUsers.get(excludeUserId);
      if (excludeSocketId) {
        this.io.to(`group_${groupId}`).except(excludeSocketId).emit(event, data);
      } else {
        this.io.to(`group_${groupId}`).emit(event, data);
      }
    } else {
      this.io.to(`group_${groupId}`).emit(event, data);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get server statistics
   */
  getServerStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalRooms: this.userRooms.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: Date.now()
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down WebSocket server...');
    
    // Notify all clients
    this.io.emit('server_shutdown', {
      message: 'Servidor reiniciando, reconecte em alguns segundos',
      timestamp: Date.now()
    });

    // Close all connections
    this.io.close();
    
    console.log('✅ WebSocket server shutdown complete');
  }
} 