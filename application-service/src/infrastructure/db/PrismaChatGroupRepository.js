import { PrismaClient } from '@prisma/client';
import ChatGroupRepository from '../../domain/repositories/ChatGroupRepository.js';

/**
 * Prisma implementation of ChatGroupRepository
 * This class implements the ChatGroupRepository interface using Prisma ORM
 */
export default class PrismaChatGroupRepository extends ChatGroupRepository {
  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  /**
   * Find all groups with pagination
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Promise<{groups: Array, totalPages: number}>}
   */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [groups, count] = await Promise.all([
      this.prisma.chatGroup.findMany({
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              last_name: true,
              email: true
            }
          },
          _count: {
            select: {
              members: true,
              messages: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.chatGroup.count()
    ]);
    
    const totalPages = Math.ceil(count / limit);
    
    return {
      groups,
      totalPages
    };
  }

  /**
   * Find group by ID
   * @param {number} id - Group ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return this.prisma.chatGroup.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true,
            messages: true
          }
        }
      }
    });
  }

  /**
   * Find groups by user ID
   * @param {number} userId - User ID
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Promise<{groups: Array, totalPages: number}>}
   */
  async findByUserId(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [groups, count] = await Promise.all([
      this.prisma.chatGroup.findMany({
        where: {
          members: {
            some: {
              userId: Number(userId),
              isActive: true
            }
          }
        },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              last_name: true,
              email: true
            }
          },
          _count: {
            select: {
              members: true,
              messages: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }),
      this.prisma.chatGroup.count({
        where: {
          members: {
            some: {
              userId: Number(userId),
              isActive: true
            }
          }
        }
      })
    ]);
    
    const totalPages = Math.ceil(count / limit);
    
    return {
      groups,
      totalPages,
      totalGroups: count
    };
  }

  /**
   * Find direct chat between two users
   * @param {number} user1Id - First user ID
   * @param {number} user2Id - Second user ID
   * @returns {Promise<Object|null>}
   */
  async findDirectChat(user1Id, user2Id) {
    return this.prisma.chatGroup.findFirst({
      where: {
        type: 'direct',
        isActive: true,
        members: {
          every: {
            userId: {
              in: [Number(user1Id), Number(user2Id)]
            },
            isActive: true
          }
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Search groups by name
   * @param {string} name - Name to search
   * @param {number} limit - Results limit
   * @returns {Promise<Array>}
   */
  async searchByName(name, limit = 10) {
    return this.prisma.chatGroup.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive'
        },
        isActive: true,
        type: 'group' // Apenas grupos públicos, não chats diretos
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        imageUrl: true,
        createdAt: true,
        _count: {
          select: {
            members: true
          }
        }
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Create a new group
   * @param {Object} groupData - Group data
   * @returns {Promise<Object>}
   */
  async create(groupData) {
    return this.prisma.chatGroup.create({
      data: {
        name: groupData.name,
        description: groupData.description,
        type: groupData.type || 'group',
        imageUrl: groupData.imageUrl,
        createdById: groupData.createdById,
        maxMembers: groupData.maxMembers || 100,
        isActive: true
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Update a group
   * @param {number} id - Group ID
   * @param {Object} groupData - New group data
   * @returns {Promise<Object>}
   */
  async update(id, groupData) {
    return this.prisma.chatGroup.update({
      where: { id: Number(id) },
      data: {
        ...groupData,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true,
            messages: true
          }
        }
      }
    });
  }

  /**
   * Delete a group (soft delete)
   * @param {number} id - Group ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      await this.prisma.chatGroup.update({
        where: { id: Number(id) },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error deleting chat group:', error);
      return false;
    }
  }

  /**
   * Count unread messages for a user in a group
   * @param {number} userId - User ID
   * @param {number} groupId - Group ID
   * @returns {Promise<number>}
   */
  async countUnreadMessages(userId, groupId) {
    // Buscar último acesso do usuário
    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(groupId)
        }
      },
      select: {
        lastSeenAt: true
      }
    });

    if (!member?.lastSeenAt) {
      // Se nunca viu, contar todas as mensagens
      return this.prisma.message.count({
        where: {
          groupId: Number(groupId),
          isDeleted: false
        }
      });
    }

    // Contar mensagens após o último acesso
    return this.prisma.message.count({
      where: {
        groupId: Number(groupId),
        isDeleted: false,
        createdAt: {
          gt: member.lastSeenAt
        }
      }
    });
  }

  /**
   * Get last seen timestamp for user in group
   * @param {number} userId - User ID
   * @param {number} groupId - Group ID
   * @returns {Promise<Date|null>}
   */
  async getLastSeenAt(userId, groupId) {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(groupId)
        }
      },
      select: {
        lastSeenAt: true
      }
    });

    return member?.lastSeenAt || null;
  }
} 