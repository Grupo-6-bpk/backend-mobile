import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import PresenceManager from '../../infrastructure/websocket/PresenceManager.js';

describe('PresenceManager', () => {
  let presenceManager;

  beforeEach(() => {
    presenceManager = new PresenceManager();
    
    // Limpar dados antes de cada teste
    presenceManager.onlineUsers.clear();
    presenceManager.userStatus.clear();
  });

  afterEach(() => {
    // Limpar intervalos para evitar vazamentos
    if (presenceManager.cleanupInterval) {
      clearInterval(presenceManager.cleanupInterval);
    }
  });

  describe('setUserOnline', () => {
    test('deve marcar usuário como online', async () => {
      // Act
      await presenceManager.setUserOnline(1, 'socket-123');

      // Assert
      expect(presenceManager.isUserOnline(1)).toBe(true);
      expect(presenceManager.getUserStatus(1)).toBe('online');
      expect(presenceManager.onlineUsers.get(1).socketId).toBe('socket-123');
    });

    test('deve atualizar socket ID se usuário já estiver online', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');

      // Act
      await presenceManager.setUserOnline(1, 'socket-456');

      // Assert
      expect(presenceManager.onlineUsers.get(1).socketId).toBe('socket-456');
      expect(presenceManager.isUserOnline(1)).toBe(true);
    });

    test('deve atualizar última atividade', async () => {
      // Arrange
      const beforeTime = Date.now();

      // Act
      await presenceManager.setUserOnline(1, 'socket-123');

      // Assert
      const userPresence = presenceManager.onlineUsers.get(1);
      expect(userPresence.lastActivity).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('setUserOffline', () => {
    test('deve marcar usuário como offline', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');

      // Act
      await presenceManager.setUserOffline(1);

      // Assert
      expect(presenceManager.isUserOnline(1)).toBe(false);
      expect(presenceManager.getUserStatus(1)).toBe('offline');
      expect(presenceManager.onlineUsers.has(1)).toBe(false);
    });

    test('deve manter última atividade ao marcar offline', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');

      // Act
      await presenceManager.setUserOffline(1);

      // Assert - User should be offline now
      expect(presenceManager.isUserOnline(1)).toBe(false);
    });

    test('deve funcionar mesmo se usuário não estiver online', async () => {
      // Act & Assert (não deve lançar erro)
      await presenceManager.setUserOffline(999);
      expect(presenceManager.isUserOnline(999)).toBe(false);
    });
  });

  describe('updateUserStatus', () => {
    test('deve atualizar status de usuário online', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');

      // Act
      await presenceManager.updateUserStatus(1, 'away');

      // Assert
      expect(presenceManager.getUserStatus(1)).toBe('away');
      expect(presenceManager.isUserOnline(1)).toBe(true);
    });

    test('deve aceitar status válidos', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');
      const validStatuses = ['online', 'away', 'busy', 'offline'];

      // Act & Assert
      for (const status of validStatuses) {
        await presenceManager.updateUserStatus(1, status);
        expect(presenceManager.getUserStatus(1)).toBe(status);
      }
    });

    test('deve rejeitar status inválido', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');

      // Act & Assert
      await expect(presenceManager.updateUserStatus(1, 'invalid'))
        .rejects.toThrow('Status inválido');
    });

    test('deve atualizar última atividade', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');
      const oldPresence = presenceManager.onlineUsers.get(1);
      const oldActivity = oldPresence.lastActivity;
      
      // Aguardar um pouco para garantir diferença de timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      await presenceManager.updateUserStatus(1, 'away');

      // Assert
      const newPresence = presenceManager.onlineUsers.get(1);
      expect(newPresence.lastActivity).toBeGreaterThan(oldActivity);
    });
  });

  describe('isUserOnline', () => {
    test('deve retornar true para usuário online', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');

      // Act & Assert
      expect(presenceManager.isUserOnline(1)).toBe(true);
    });

    test('deve retornar false para usuário offline', () => {
      // Act & Assert
      expect(presenceManager.isUserOnline(999)).toBe(false);
    });

    test('deve retornar false para usuário que foi desconectado', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');
      await presenceManager.setUserOffline(1);

      // Act & Assert
      expect(presenceManager.isUserOnline(1)).toBe(false);
    });
  });

  describe('getUserStatus', () => {
    test('deve retornar status atual do usuário', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');
      await presenceManager.updateUserStatus(1, 'busy');

      // Act & Assert
      expect(presenceManager.getUserStatus(1)).toBe('busy');
    });

    test('deve retornar offline para usuário não encontrado', () => {
      // Act & Assert
      expect(presenceManager.getUserStatus(999)).toBe('offline');
    });

    test('deve retornar offline para usuário desconectado', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');
      await presenceManager.setUserOffline(1);

      // Act & Assert
      expect(presenceManager.getUserStatus(1)).toBe('offline');
    });
  });

  describe('getUserLastSeen', () => {
    test('deve retornar última atividade do usuário', async () => {
      // Arrange
      const beforeTime = Date.now();
      await presenceManager.setUserOnline(1, 'socket-123');
      const afterTime = Date.now();

      // Act
      const lastSeen = presenceManager.getUserLastSeen(1);

      // Assert
      expect(lastSeen).toBeGreaterThanOrEqual(beforeTime);
      expect(lastSeen).toBeLessThanOrEqual(afterTime);
    });

    test('deve retornar null para usuário sem atividade', () => {
      // Act & Assert
      expect(presenceManager.getUserLastSeen(999)).toBeNull();
    });

    test('deve manter informação após disconnect', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-123');
      
      // Act
      await presenceManager.setUserOffline(1);

      // Assert - após disconnect, getUserLastSeen retorna null pois user foi removido do mapa
      expect(presenceManager.getUserLastSeen(1)).toBeNull();
    });
  });

  describe('getPresenceStats', () => {
    test('deve retornar estatísticas de presença', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-1');
      await presenceManager.setUserOnline(2, 'socket-2');
      await presenceManager.updateUserStatus(2, 'away');

      // Act
      const stats = presenceManager.getPresenceStats();

      // Assert
      expect(stats).toEqual({
        totalOnlineUsers: 2,
        statusBreakdown: {
          online: 1,
          away: 1,
          busy: 0,
          offline: 0
        },
        totalTrackedUsers: 2
      });
    });

    test('deve retornar estatísticas vazias quando não há usuários', () => {
      // Act
      const stats = presenceManager.getPresenceStats();

      // Assert
      expect(stats).toEqual({
        totalOnlineUsers: 0,
        statusBreakdown: {
          online: 0,
          away: 0,
          busy: 0,
          offline: 0
        },
        totalTrackedUsers: 0
      });
    });
  });

  describe('cleanupOfflineUsers', () => {
    test('deve remover usuários inativos', async () => {
      // Arrange
      const oldTime = Date.now() - (35 * 60 * 1000); // 35 minutos atrás (mais que o threshold de 30 min)
      
      await presenceManager.setUserOnline(1, 'socket-1');
      await presenceManager.setUserOnline(2, 'socket-2');
      
      // Simular usuário 1 como inativo (forçar timestamp antigo)
      const user1Presence = presenceManager.onlineUsers.get(1);
      user1Presence.lastSeen = oldTime;

      // Act
      presenceManager.cleanupOfflineUsers();

      // Assert
      expect(presenceManager.isUserOnline(1)).toBe(false);
      expect(presenceManager.isUserOnline(2)).toBe(true);
      expect(presenceManager.getUserStatus(1)).toBe('offline');
    });

    test('deve manter usuários ativos', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-1');
      await presenceManager.setUserOnline(2, 'socket-2');

      // Act
      presenceManager.cleanupOfflineUsers();

      // Assert
      expect(presenceManager.isUserOnline(1)).toBe(true);
      expect(presenceManager.isUserOnline(2)).toBe(true);
    });

    test('deve logar quantidade de usuários removidos', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const oldTime = Date.now() - (35 * 60 * 1000); // 35 minutos atrás
      
      await presenceManager.setUserOnline(1, 'socket-1');
      await presenceManager.setUserOnline(2, 'socket-2');
      
      // Simular usuários inativos
      const user1Presence = presenceManager.onlineUsers.get(1);
      const user2Presence = presenceManager.onlineUsers.get(2);
      user1Presence.lastSeen = oldTime;
      user2Presence.lastSeen = oldTime;

      // Act
      presenceManager.cleanupOfflineUsers();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🧹 Cleaned up 2 offline users from memory');
      
      consoleSpy.mockRestore();
    });
  });

  describe('shutdown', () => {
    test('deve limpar dados e intervalos', async () => {
      // Arrange
      presenceManager.cleanupInterval = setInterval(() => {}, 1000);
      await presenceManager.setUserOnline(1, 'socket-1');

      // Act
      presenceManager.shutdown();

      // Assert
      expect(presenceManager.onlineUsers.size).toBe(0);
      expect(presenceManager.userStatus.size).toBe(0);
    });

    test('deve funcionar mesmo sem interval ativo', () => {
      // Act & Assert (não deve lançar erro)
      presenceManager.shutdown();
      expect(presenceManager.onlineUsers.size).toBe(0);
    });
  });

  describe('edge cases', () => {
    test('deve lidar com userId nulo ou undefined', async () => {
      // Act & Assert
      expect(() => presenceManager.isUserOnline(null)).not.toThrow();
      expect(() => presenceManager.isUserOnline(undefined)).not.toThrow();
      expect(presenceManager.isUserOnline(null)).toBe(false);
      expect(presenceManager.isUserOnline(undefined)).toBe(false);
    });

    test('deve lidar com status nulo', async () => {
      // Arrange
      await presenceManager.setUserOnline(1, 'socket-1');

      // Act & Assert
      await expect(presenceManager.updateUserStatus(1, null))
        .rejects.toThrow('Status inválido');
    });

    test('deve lidar com socketId nulo', async () => {
      // Act
      await presenceManager.setUserOnline(1, null);

      // Assert
      expect(presenceManager.isUserOnline(1)).toBe(true);
      expect(presenceManager.onlineUsers.get(1).socketId).toBeNull();
    });
  });
}); 