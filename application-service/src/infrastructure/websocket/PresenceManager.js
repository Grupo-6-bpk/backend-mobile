/**
 * Presence Manager for WebSocket
 * Manages user online/offline status and presence information
 */
export default class PresenceManager {
  constructor() {
    this.onlineUsers = new Map(); // userId -> { socketId, status, lastSeen, joinedAt }
    this.userStatus = new Map(); // userId -> 'online' | 'away' | 'busy' | 'offline'
    
    // Cleanup offline users every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOfflineUsers();
    }, 5 * 60 * 1000);
  }

  /**
   * Set user as online
   */
  async setUserOnline(userId, socketId) {
    try {
      const now = Date.now();
      
      this.onlineUsers.set(userId, {
        socketId: socketId,
        status: 'online',
        lastSeen: now,
        joinedAt: now,
        lastActivity: now
      });

      this.userStatus.set(userId, 'online');
      
      console.log(`🟢 User ${userId} is now online`);
      
      return true;
    } catch (error) {
      console.error('Error setting user online:', error);
      return false;
    }
  }

  /**
   * Set user as offline
   */
  async setUserOffline(userId) {
    try {
      // Update last seen before removing
      const userPresence = this.onlineUsers.get(userId);
      if (userPresence) {
        userPresence.lastSeen = Date.now();
        userPresence.status = 'offline';
      }

      // Remove from online users
      this.onlineUsers.delete(userId);
      this.userStatus.set(userId, 'offline');
      
      console.log(`🔴 User ${userId} is now offline`);
      
      return true;
    } catch (error) {
      console.error('Error setting user offline:', error);
      return false;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId, status) {
    try {
      const validStatuses = ['online', 'away', 'busy', 'offline'];
      if (!validStatuses.includes(status)) {
        throw new Error('Status inválido');
      }

      const userPresence = this.onlineUsers.get(userId);
      if (userPresence) {
        userPresence.status = status;
        userPresence.lastActivity = Date.now();
      }

      this.userStatus.set(userId, status);
      
      console.log(`📊 User ${userId} status updated to: ${status}`);
      
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  }

  /**
   * Update user's last activity
   */
  updateUserActivity(userId) {
    const userPresence = this.onlineUsers.get(userId);
    if (userPresence) {
      userPresence.lastActivity = Date.now();
      userPresence.lastSeen = Date.now();
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get user status
   */
  getUserStatus(userId) {
    if (this.isUserOnline(userId)) {
      const userPresence = this.onlineUsers.get(userId);
      return userPresence?.status || 'online';
    }
    return 'offline';
  }

  /**
   * Get user's last seen timestamp
   */
  getUserLastSeen(userId) {
    const userPresence = this.onlineUsers.get(userId);
    if (userPresence) {
      return userPresence.lastSeen;
    }
    
    // Return from persistent storage or null
    return null;
  }

  /**
   * Get all online users
   */
  getOnlineUsers() {
    const onlineUsersList = [];
    
    this.onlineUsers.forEach((presence, userId) => {
      onlineUsersList.push({
        userId: Number(userId),
        status: presence.status,
        lastSeen: presence.lastSeen,
        joinedAt: presence.joinedAt,
        socketId: presence.socketId
      });
    });
    
    return onlineUsersList;
  }

  /**
   * Get online users in a specific group
   */
  async getOnlineUsersInGroup(groupId) {
    try {
      // This would require group member repository
      // For now, return basic online users info
      const onlineUsers = this.getOnlineUsers();
      
      // TODO: Filter by actual group membership
      // const groupMembers = await this.groupMemberRepository.findByGroupId(groupId, true);
      // const groupUserIds = groupMembers.map(m => m.userId);
      // return onlineUsers.filter(user => groupUserIds.includes(user.userId));
      
      return onlineUsers;
    } catch (error) {
      console.error('Error getting online users in group:', error);
      return [];
    }
  }

  /**
   * Get presence info for multiple users
   */
  getMultipleUsersPresence(userIds) {
    const presenceList = [];
    
    userIds.forEach(userId => {
      const status = this.getUserStatus(userId);
      const lastSeen = this.getUserLastSeen(userId);
      
      presenceList.push({
        userId: Number(userId),
        status: status,
        isOnline: this.isUserOnline(userId),
        lastSeen: lastSeen
      });
    });
    
    return presenceList;
  }

  /**
   * Set user as away if inactive
   */
  async checkAndUpdateAwayUsers() {
    const now = Date.now();
    const awayThreshold = 5 * 60 * 1000; // 5 minutes
    
    this.onlineUsers.forEach(async (presence, userId) => {
      if (presence.status === 'online' && 
          (now - presence.lastActivity) > awayThreshold) {
        await this.updateUserStatus(userId, 'away');
      }
    });
  }

  /**
   * Cleanup offline users from memory
   */
  cleanupOfflineUsers() {
    const now = Date.now();
    const offlineThreshold = 30 * 60 * 1000; // 30 minutes
    
    let cleanedCount = 0;
    
    this.onlineUsers.forEach((presence, userId) => {
      if ((now - presence.lastSeen) > offlineThreshold) {
        this.onlineUsers.delete(userId);
        this.userStatus.set(userId, 'offline');
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} offline users from memory`);
    }
  }

  /**
   * Get presence statistics
   */
  getPresenceStats() {
    const stats = {
      totalOnline: this.onlineUsers.size,
      statusBreakdown: {
        online: 0,
        away: 0,
        busy: 0,
        offline: 0
      },
      averageSessionTime: 0,
      peakConcurrentUsers: this.onlineUsers.size // This would be tracked over time
    };

    let totalSessionTime = 0;
    const now = Date.now();

    this.onlineUsers.forEach((presence) => {
      stats.statusBreakdown[presence.status]++;
      totalSessionTime += (now - presence.joinedAt);
    });

    if (this.onlineUsers.size > 0) {
      stats.averageSessionTime = totalSessionTime / this.onlineUsers.size;
    }

    return stats;
  }

  /**
   * Force user offline (admin function)
   */
  async forceUserOffline(userId, reason = 'Admin action') {
    try {
      await this.setUserOffline(userId);
      
      console.log(`🔨 User ${userId} forced offline. Reason: ${reason}`);
      
      return true;
    } catch (error) {
      console.error('Error forcing user offline:', error);
      return false;
    }
  }

  /**
   * Get user's online duration
   */
  getUserOnlineDuration(userId) {
    const userPresence = this.onlineUsers.get(userId);
    if (userPresence) {
      return Date.now() - userPresence.joinedAt;
    }
    return 0;
  }

  /**
   * Check if user was recently active
   */
  isUserRecentlyActive(userId, thresholdMinutes = 5) {
    const userPresence = this.onlineUsers.get(userId);
    if (userPresence) {
      const threshold = thresholdMinutes * 60 * 1000;
      return (Date.now() - userPresence.lastActivity) < threshold;
    }
    return false;
  }

  /**
   * Cleanup and shutdown
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Set all users as offline
    this.onlineUsers.forEach(async (presence, userId) => {
      await this.setUserOffline(userId);
    });
    
    this.onlineUsers.clear();
    this.userStatus.clear();
    
    console.log('✅ Presence Manager shutdown complete');
  }
} 