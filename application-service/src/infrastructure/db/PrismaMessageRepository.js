import { PrismaClient } from '@prisma/client';
import MessageRepository from '../../domain/repositories/MessageRepository.js';

/**
 * Prisma implementation of MessageRepository
 * This class implements the MessageRepository interface using Prisma ORM
 */
export default class PrismaMessageRepository extends MessageRepository {
  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  /**
   * Find messages by group ID with pagination
   * @param {number} groupId - Group ID
   * @param {number} page - Current page
   * @param {number} limit - Messages per page
   * @returns {Promise<{messages: Array, totalPages: number}>}
   */
  async findByGroupId(groupId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [messages, count] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          groupId: Number(groupId)
        },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              last_name: true,
              email: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              type: true,
              senderId: true,
              isDeleted: true,
              sender: {
                select: {
                  id: true,
                  name: true,
                  last_name: true
                }
              }
            }
          },
          reads: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  last_name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.message.count({
        where: {
          groupId: Number(groupId)
        }
      })
    ]);
    
    const totalPages = Math.ceil(count / limit);
    
    return {
      messages: messages.reverse(), // Reverter para ordem cronológica
      totalPages,
      totalMessages: count
    };
  }

  /**
   * Find message by ID
   * @param {number} id - Message ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return this.prisma.message.findUnique({
      where: { id: Number(id) },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            senderId: true,
            isDeleted: true,
            sender: {
              select: {
                id: true,
                name: true,
                last_name: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Search messages in group by text
   * @param {number} groupId - Group ID
   * @param {string} searchText - Text to search
   * @param {number} limit - Results limit
   * @returns {Promise<Array>}
   */
  async searchInGroup(groupId, searchText, limit = 20) {
    return this.prisma.message.findMany({
      where: {
        groupId: Number(groupId),
        content: {
          contains: searchText,
          mode: 'insensitive'
        },
        isDeleted: false,
        type: 'text'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Find media messages by group ID
   * @param {number} groupId - Group ID
   * @param {Array<string>} types - Media types
   * @param {number} limit - Results limit
   * @returns {Promise<Array>}
   */
  async findMediaByGroupId(groupId, types, limit = 20) {
    return this.prisma.message.findMany({
      where: {
        groupId: Number(groupId),
        type: {
          in: types
        },
        isDeleted: false,
        fileUrl: {
          not: null
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Find unread messages for user in group
   * @param {number} userId - User ID
   * @param {number} groupId - Group ID
   * @param {Date} lastSeenAt - Last seen timestamp
   * @returns {Promise<Array>}
   */
  async findUnreadMessages(userId, groupId, lastSeenAt) {
    return this.prisma.message.findMany({
      where: {
        groupId: Number(groupId),
        isDeleted: false,
        senderId: {
          not: Number(userId) // Não incluir próprias mensagens
        },
        createdAt: {
          gt: lastSeenAt
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  /**
   * Count unread messages
   * @param {number} userId - User ID
   * @param {number} groupId - Group ID
   * @param {Date} lastSeenAt - Last seen timestamp
   * @returns {Promise<number>}
   */
  async countUnreadMessages(userId, groupId, lastSeenAt) {
    return this.prisma.message.count({
      where: {
        groupId: Number(groupId),
        isDeleted: false,
        senderId: {
          not: Number(userId)
        },
        createdAt: {
          gt: lastSeenAt
        }
      }
    });
  }

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>}
   */
  async create(messageData) {
    return this.prisma.message.create({
      data: {
        content: messageData.content,
        type: messageData.type,
        senderId: messageData.senderId,
        groupId: messageData.groupId,
        replyToId: messageData.replyToId,
        status: messageData.status || 'sent',
        fileUrl: messageData.fileUrl,
        fileName: messageData.fileName,
        fileSize: messageData.fileSize
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            senderId: true,
            isDeleted: true
          }
        }
      }
    });
  }

  /**
   * Update a message
   * @param {number} id - Message ID
   * @param {Object} messageData - New message data
   * @returns {Promise<Object>}
   */
  async update(id, messageData) {
    return this.prisma.message.update({
      where: { id: Number(id) },
      data: {
        ...messageData,
        updatedAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        }
      }
    });
  }

  /**
   * Delete a message (soft delete)
   * @param {number} id - Message ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      await this.prisma.message.update({
        where: { id: Number(id) },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          content: null,
          fileUrl: null,
          fileName: null,
          fileSize: null,
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  /**
   * Mark messages as read
   * @param {number} userId - User ID
   * @param {Array<number>} messageIds - Message IDs
   * @returns {Promise<boolean>}
   */
  async markAsRead(userId, messageIds) {
    try {
      // Criar registros de leitura
      const readData = messageIds.map(messageId => ({
        messageId: Number(messageId),
        userId: Number(userId)
      }));

      await this.prisma.messageRead.createMany({
        data: readData,
        skipDuplicates: true
      });

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  /**
   * Mark messages as delivered
   * @param {Array<number>} messageIds - Message IDs
   * @returns {Promise<boolean>}
   */
  async markAsDelivered(messageIds) {
    try {
      await this.prisma.message.updateMany({
        where: {
          id: {
            in: messageIds.map(id => Number(id))
          },
          status: 'sent'
        },
        data: {
          status: 'delivered',
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error marking messages as delivered:', error);
      return false;
    }
  }

  /**
   * Find messages by status
   * @param {string} status - Message status
   * @param {number} limit - Results limit
   * @returns {Promise<Array>}
   */
  async findByStatus(status, limit = 100) {
    return this.prisma.message.findMany({
      where: {
        status: status,
        isDeleted: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'asc'
      }
    });
  }
} 