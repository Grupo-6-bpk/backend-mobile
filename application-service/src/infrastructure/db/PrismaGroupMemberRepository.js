import { PrismaClient } from '@prisma/client';
import GroupMemberRepository from '../../domain/repositories/GroupMemberRepository.js';

/**
 * Prisma implementation of GroupMemberRepository
 * This class implements the GroupMemberRepository interface using Prisma ORM
 */
export default class PrismaGroupMemberRepository extends GroupMemberRepository {
  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  /**
   * Find member by ID
   * @param {number} id - Member ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return this.prisma.groupMember.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true,
            verified: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true,
            imageUrl: true
          }
        },
        addedBy: {
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
   * Find member by user and group
   * @param {number} userId - User ID
   * @param {number} groupId - Group ID
   * @returns {Promise<Object|null>}
   */
  async findByUserAndGroup(userId, groupId) {
    return this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(groupId)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true,
            verified: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true,
            imageUrl: true,
            createdById: true
          }
        },
        addedBy: {
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
   * Find all members of a group
   * @param {number} groupId - Group ID
   * @param {boolean} activeOnly - Only active members
   * @returns {Promise<Array>}
   */
  async findByGroupId(groupId, activeOnly = true) {
    return this.prisma.groupMember.findMany({
      where: {
        groupId: Number(groupId),
        ...(activeOnly && { isActive: true })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true,
            verified: true,
            createAt: true
          }
        },
        addedBy: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // Admin primeiro
        { joinedAt: 'asc' }
      ]
    });
  }

  /**
   * Find groups by user ID
   * @param {number} userId - User ID
   * @param {boolean} activeOnly - Only active memberships
   * @returns {Promise<Array>}
   */
  async findByUserId(userId, activeOnly = true) {
    return this.prisma.groupMember.findMany({
      where: {
        userId: Number(userId),
        ...(activeOnly && { isActive: true })
      },
      include: {
        group: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                last_name: true
              }
            },
            _count: {
              select: {
                members: true,
                messages: true
              }
            }
          }
        },
        addedBy: {
          select: {
            id: true,
            name: true,
            last_name: true
          }
        }
      },
      orderBy: {
        lastSeenAt: 'desc'
      }
    });
  }

  /**
   * Find admins of a group
   * @param {number} groupId - Group ID
   * @returns {Promise<Array>}
   */
  async findAdminsByGroupId(groupId) {
    return this.prisma.groupMember.findMany({
      where: {
        groupId: Number(groupId),
        role: {
          in: ['admin', 'moderator']
        },
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: [
        { role: 'desc' },
        { joinedAt: 'asc' }
      ]
    });
  }

  /**
   * Count members of a group
   * @param {number} groupId - Group ID
   * @param {boolean} activeOnly - Only active members
   * @returns {Promise<number>}
   */
  async countByGroupId(groupId, activeOnly = true) {
    return this.prisma.groupMember.count({
      where: {
        groupId: Number(groupId),
        ...(activeOnly && { isActive: true })
      }
    });
  }

  /**
   * Check if user is member of group
   * @param {number} userId - User ID
   * @param {number} groupId - Group ID
   * @returns {Promise<boolean>}
   */
  async isMember(userId, groupId) {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(groupId)
        }
      },
      select: {
        isActive: true
      }
    });
    
    return member?.isActive === true;
  }

  /**
   * Check if user is admin of group
   * @param {number} userId - User ID
   * @param {number} groupId - Group ID
   * @returns {Promise<boolean>}
   */
  async isAdmin(userId, groupId) {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(groupId)
        }
      },
      select: {
        role: true,
        isActive: true
      }
    });
    
    return member?.isActive && ['admin', 'moderator'].includes(member.role);
  }

  /**
   * Add member to group
   * @param {Object} memberData - Member data
   * @returns {Promise<Object>}
   */
  async create(memberData) {
    return this.prisma.groupMember.create({
      data: {
        userId: memberData.userId,
        groupId: memberData.groupId,
        role: memberData.role || 'member',
        addedById: memberData.addedById,
        isActive: true,
        notifications: memberData.notifications !== false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            last_name: true,
            email: true,
            verified: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        addedBy: {
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
   * Update group member
   * @param {number} id - Member ID
   * @param {Object} memberData - New member data
   * @returns {Promise<Object>}
   */
  async update(id, memberData) {
    return this.prisma.groupMember.update({
      where: { id: Number(id) },
      data: memberData,
      include: {
        user: {
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
        }
      }
    });
  }

  /**
   * Remove member from group (soft delete)
   * @param {number} id - Member ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      await this.prisma.groupMember.update({
        where: { id: Number(id) },
        data: {
          isActive: false,
          leftAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error removing group member:', error);
      return false;
    }
  }

  /**
   * Remove member by user and group
   * @param {number} userId - User ID
   * @param {number} groupId - Group ID
   * @returns {Promise<boolean>}
   */
  async deleteByUserAndGroup(userId, groupId) {
    try {
      await this.prisma.groupMember.update({
        where: {
          userId_groupId: {
            userId: Number(userId),
            groupId: Number(groupId)
          }
        },
        data: {
          isActive: false,
          leftAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error removing group member by user and group:', error);
      return false;
    }
  }

  /**
   * Update last seen for user in group
   * @param {number} userId - User ID
   * @param {number} groupId - Group ID
   * @returns {Promise<boolean>}
   */
  async updateLastSeen(userId, groupId) {
    try {
      await this.prisma.groupMember.update({
        where: {
          userId_groupId: {
            userId: Number(userId),
            groupId: Number(groupId)
          }
        },
        data: {
          lastSeenAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error updating last seen:', error);
      return false;
    }
  }

  /**
   * Add multiple members to group
   * @param {Array<Object>} membersData - Array of member data
   * @returns {Promise<Array>}
   */
  async createMultiple(membersData) {
    const results = [];
    
    for (const memberData of membersData) {
      try {
        const member = await this.create(memberData);
        results.push(member);
      } catch (error) {
        console.error(`Error adding member ${memberData.userId}:`, error);
        // Continuar adicionando outros membros mesmo se um falhar
      }
    }
    
    return results;
  }
} 