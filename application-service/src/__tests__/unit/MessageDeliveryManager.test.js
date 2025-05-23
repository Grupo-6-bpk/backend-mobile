import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import MessageDeliveryManager from '../../infrastructure/websocket/MessageDeliveryManager.js';

// Mock do PrismaMessageRepository
const mockMessageRepository = {
  markAsDelivered: jest.fn(),
  markAsRead: jest.fn(),
  findById: jest.fn(),
  findByGroupIdAndDateRange: jest.fn(),
  delete: jest.fn()
};

// Mock do Socket.io
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn()
};

jest.mock('../../infrastructure/db/PrismaMessageRepository.js', () => {
  return {
    default: jest.fn(() => mockMessageRepository)
  };
});

describe('MessageDeliveryManager', () => {
  let messageDeliveryManager;

  beforeEach(() => {
    jest.clearAllMocks();
    messageDeliveryManager = new MessageDeliveryManager();
    
    // Limpar queues entre testes
    messageDeliveryManager.deliveryQueue.clear();
    messageDeliveryManager.readQueue.clear();
  });

  afterEach(() => {
    // Limpar intervalos para evitar vazamentos
    if (messageDeliveryManager.deliveryInterval) {
      clearInterval(messageDeliveryManager.deliveryInterval);
    }
  });

  describe('constructor', () => {
    test('deve inicializar com configurações corretas', () => {
      expect(messageDeliveryManager.messageRepository).toBeDefined();
      expect(messageDeliveryManager.deliveryQueue).toBeInstanceOf(Map);
      expect(messageDeliveryManager.readQueue).toBeInstanceOf(Map);
      expect(messageDeliveryManager.deliveryInterval).toBeDefined();
    });
  });

  describe('markAsDelivered', () => {
    test('deve marcar mensagens como entregues com sucesso', async () => {
      // Arrange
      const messageIds = [1, 2, 3];
      const message = { 
        id: 1, 
        senderId: 1, 
        groupId: 1, 
        content: 'Test message' 
      };

      mockMessageRepository.markAsDelivered.mockResolvedValue(true);
      mockMessageRepository.findById.mockResolvedValue(message);

      // Act
      const result = await messageDeliveryManager.markAsDelivered(messageIds, mockIo);

      // Assert
      expect(result).toBe(true);
      expect(mockMessageRepository.markAsDelivered).toHaveBeenCalledWith(messageIds);
      expect(mockIo.to).toHaveBeenCalledWith('user_1');
      expect(mockIo.emit).toHaveBeenCalledWith('message_delivered', expect.objectContaining({
        messageId: 1,
        groupId: 1,
        status: 'delivered'
      }));
    });

    test('deve rejeitar array vazio de messageIds', async () => {
      // Act
      const result = await messageDeliveryManager.markAsDelivered([], mockIo);

      // Assert
      expect(result).toBe(false);
      expect(mockMessageRepository.markAsDelivered).not.toHaveBeenCalled();
    });

    test('deve rejeitar messageIds não-array', async () => {
      // Act
      const result = await messageDeliveryManager.markAsDelivered(null, mockIo);

      // Assert
      expect(result).toBe(false);
      expect(mockMessageRepository.markAsDelivered).not.toHaveBeenCalled();
    });

    test('deve tratar erro do repository', async () => {
      // Arrange
      const messageIds = [1, 2];
      mockMessageRepository.markAsDelivered.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await messageDeliveryManager.markAsDelivered(messageIds, mockIo);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('markAsRead', () => {
    test('deve marcar mensagens como lidas com sucesso', async () => {
      // Arrange
      const userId = 1;
      const messageIds = [1, 2];
      const groupId = 1;
      const message = { 
        id: 1, 
        senderId: 2, 
        groupId: 1 
      };

      mockMessageRepository.markAsRead.mockResolvedValue(true);
      mockMessageRepository.findById.mockResolvedValue(message);

      // Act
      const result = await messageDeliveryManager.markAsRead(userId, messageIds, groupId, mockIo);

      // Assert
      expect(result).toBe(true);
      expect(mockMessageRepository.markAsRead).toHaveBeenCalledWith(userId, messageIds);
      expect(mockIo.to).toHaveBeenCalledWith('group_1');
      expect(mockIo.emit).toHaveBeenCalledWith('message_read', expect.objectContaining({
        messageId: 1,
        readBy: userId,
        groupId: groupId,
        status: 'read'
      }));
    });

    test('deve enviar notificação especial ao remetente', async () => {
      // Arrange
      const userId = 1;
      const messageIds = [1];
      const groupId = 1;
      const message = { 
        id: 1, 
        senderId: 2, // Diferente do userId (leitor)
        groupId: 1 
      };

      mockMessageRepository.markAsRead.mockResolvedValue(true);
      mockMessageRepository.findById.mockResolvedValue(message);

      // Act
      await messageDeliveryManager.markAsRead(userId, messageIds, groupId, mockIo);

      // Assert
      expect(mockIo.to).toHaveBeenCalledWith('user_2');
      expect(mockIo.emit).toHaveBeenCalledWith('message_read_by_recipient', expect.objectContaining({
        messageId: 1,
        readBy: userId,
        groupId: groupId
      }));
    });

    test('deve atualizar read queue', async () => {
      // Arrange
      const userId = 1;
      const messageIds = [1];
      const groupId = 1;
      const message = { id: 1, senderId: 2, groupId: 1 };

      mockMessageRepository.markAsRead.mockResolvedValue(true);
      mockMessageRepository.findById.mockResolvedValue(message);

      // Act
      await messageDeliveryManager.markAsRead(userId, messageIds, groupId, mockIo);

      // Assert
      expect(messageDeliveryManager.readQueue.has(1)).toBe(true);
      expect(messageDeliveryManager.readQueue.get(1).has(userId)).toBe(true);
    });
  });

  describe('addToDeliveryQueue', () => {
    test('deve adicionar mensagens à fila de entrega', () => {
      // Arrange
      const messageIds = [1, 2, 3];
      const recipients = [1, 2];

      // Act
      messageDeliveryManager.addToDeliveryQueue(messageIds, recipients);

      // Assert
      expect(messageDeliveryManager.deliveryQueue.size).toBe(3);
      
      const delivery = messageDeliveryManager.deliveryQueue.get(1);
      expect(delivery).toEqual(expect.objectContaining({
        attempts: 0,
        maxAttempts: 5,
        recipients: new Set(recipients)
      }));
    });

    test('deve usar recipients vazio por padrão', () => {
      // Arrange
      const messageIds = [1];

      // Act
      messageDeliveryManager.addToDeliveryQueue(messageIds);

      // Assert
      const delivery = messageDeliveryManager.deliveryQueue.get(1);
      expect(delivery.recipients).toEqual(new Set([]));
    });
  });

  describe('processDeliveryQueue', () => {
    test('deve retornar early se queue estiver vazia', async () => {
      // Act
      await messageDeliveryManager.processDeliveryQueue();

      // Assert - Não deve haver erro ou log
      expect(messageDeliveryManager.deliveryQueue.size).toBe(0);
    });

    test('deve processar entradas expiradas', async () => {
      // Arrange
      const messageId = 1;
      const oldTimestamp = Date.now() - 35000; // 35 segundos atrás (> 30s threshold)
      
      messageDeliveryManager.deliveryQueue.set(messageId, {
        timestamp: oldTimestamp,
        attempts: 0,
        recipients: new Set(),
        maxAttempts: 5
      });

      // Act
      await messageDeliveryManager.processDeliveryQueue();

      // Assert
      const delivery = messageDeliveryManager.deliveryQueue.get(messageId);
      expect(delivery.attempts).toBe(1);
    });

    test('deve remover mensagens após máximo de tentativas', async () => {
      // Arrange
      const messageId = 1;
      const oldTimestamp = Date.now() - 35000;
      
      messageDeliveryManager.deliveryQueue.set(messageId, {
        timestamp: oldTimestamp,
        attempts: 5, // Já no máximo
        recipients: new Set(),
        maxAttempts: 5
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      await messageDeliveryManager.processDeliveryQueue();

      // Assert
      expect(messageDeliveryManager.deliveryQueue.has(messageId)).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Message ${messageId} delivery failed`)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getMessageDeliveryStatus', () => {
    test('deve retornar status de entrega das mensagens', async () => {
      // Arrange
      const messageIds = [1, 2];
      const message = { 
        id: 1, 
        status: 'delivered', 
        updatedAt: new Date() 
      };

      messageDeliveryManager.readQueue.set(1, new Set([1, 2]));
      mockMessageRepository.findById.mockResolvedValue(message);

      // Act
      const result = await messageDeliveryManager.getMessageDeliveryStatus(messageIds);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        messageId: 1,
        status: 'delivered',
        readBy: [1, 2],
        readCount: 2
      }));
    });

    test('deve tratar erro do repository', async () => {
      // Arrange
      const messageIds = [1];
      mockMessageRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await messageDeliveryManager.getMessageDeliveryStatus(messageIds);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getMessageReadReceipts', () => {
    test('deve retornar recibos de leitura da mensagem', async () => {
      // Arrange
      const messageId = 1;
      const message = {
        id: 1,
        reads: [
          { userId: 1, user: { name: 'João' }, readAt: new Date() },
          { userId: 2, user: { name: 'Maria' }, readAt: new Date() }
        ]
      };

      mockMessageRepository.findById.mockResolvedValue(message);

      // Act
      const result = await messageDeliveryManager.getMessageReadReceipts(messageId);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        messageId: 1,
        totalReads: 2,
        readBy: expect.arrayContaining([
          expect.objectContaining({ userId: 1, userName: 'João' }),
          expect.objectContaining({ userId: 2, userName: 'Maria' })
        ])
      }));
    });

    test('deve retornar null para mensagem não encontrada', async () => {
      // Arrange
      mockMessageRepository.findById.mockResolvedValue(null);

      // Act
      const result = await messageDeliveryManager.getMessageReadReceipts(1);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('generateGroupDeliveryReport', () => {
    test('deve gerar relatório de entrega do grupo', async () => {
      // Arrange
      const groupId = 1;
      const fromDate = new Date('2023-01-01');
      const toDate = new Date('2023-01-31');
      const messages = [
        { 
          id: 1, 
          status: 'delivered', 
          createdAt: new Date('2023-01-15'), 
          updatedAt: new Date('2023-01-15T10:01:00'),
          reads: []
        },
        { 
          id: 2, 
          status: 'read', 
          createdAt: new Date('2023-01-16'), 
          updatedAt: new Date('2023-01-16T10:01:00'),
          reads: [{ readAt: new Date('2023-01-16T10:02:00') }]
        }
      ];

      mockMessageRepository.findByGroupIdAndDateRange.mockResolvedValue(messages);

      // Act
      const result = await messageDeliveryManager.generateGroupDeliveryReport(
        groupId, 
        fromDate, 
        toDate
      );

      // Assert
      expect(result).toEqual(expect.objectContaining({
        groupId: groupId,
        period: { from: fromDate, to: toDate },
        stats: expect.objectContaining({
          totalMessages: 2,
          deliveredMessages: 2,
          readMessages: 1
        }),
        deliveryRate: 100,
        readRate: 50
      }));
    });
  });

  describe('recallMessage', () => {
    test('deve cancelar mensagem com sucesso', async () => {
      // Arrange
      const messageId = 1;
      const requesterId = 1;
      const recentTime = new Date(Date.now() - 2 * 60 * 1000); // 2 minutos atrás
      const message = {
        id: 1,
        senderId: 1,
        groupId: 1,
        createdAt: recentTime
      };

      mockMessageRepository.findById.mockResolvedValue(message);
      mockMessageRepository.delete.mockResolvedValue(true);

      // Act
      const result = await messageDeliveryManager.recallMessage(
        messageId, 
        requesterId, 
        mockIo
      );

      // Assert
      expect(result).toBe(true);
      expect(mockMessageRepository.delete).toHaveBeenCalledWith(messageId);
      expect(mockIo.to).toHaveBeenCalledWith('group_1');
      expect(mockIo.emit).toHaveBeenCalledWith('message_recalled', expect.objectContaining({
        messageId: messageId,
        recalledBy: requesterId
      }));
    });

    test('deve rejeitar se não for o remetente', async () => {
      // Arrange
      const messageId = 1;
      const requesterId = 2;
      const message = {
        id: 1,
        senderId: 1, // Diferente do requesterId
        groupId: 1,
        createdAt: new Date()
      };

      mockMessageRepository.findById.mockResolvedValue(message);

      // Act & Assert
      await expect(
        messageDeliveryManager.recallMessage(messageId, requesterId, mockIo)
      ).rejects.toThrow('Apenas o remetente pode cancelar a mensagem');
    });

    test('deve rejeitar se passou do tempo limite', async () => {
      // Arrange
      const messageId = 1;
      const requesterId = 1;
      const oldTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos atrás
      const message = {
        id: 1,
        senderId: 1,
        groupId: 1,
        createdAt: oldTime
      };

      mockMessageRepository.findById.mockResolvedValue(message);

      // Act & Assert
      await expect(
        messageDeliveryManager.recallMessage(messageId, requesterId, mockIo)
      ).rejects.toThrow('Tempo limite para cancelar a mensagem expirou');
    });

    test('deve rejeitar se mensagem já foi lida', async () => {
      // Arrange
      const messageId = 1;
      const requesterId = 1;
      const message = {
        id: 1,
        senderId: 1,
        groupId: 1,
        createdAt: new Date()
      };

      messageDeliveryManager.readQueue.set(messageId, new Set([2])); // Lida por usuário 2
      mockMessageRepository.findById.mockResolvedValue(message);

      // Act & Assert
      await expect(
        messageDeliveryManager.recallMessage(messageId, requesterId, mockIo)
      ).rejects.toThrow('Não é possível cancelar mensagem já lida');
    });
  });

  describe('getPendingDeliveriesCount', () => {
    test('deve retornar número de entregas pendentes', () => {
      // Arrange
      messageDeliveryManager.deliveryQueue.set(1, {});
      messageDeliveryManager.deliveryQueue.set(2, {});

      // Act
      const count = messageDeliveryManager.getPendingDeliveriesCount();

      // Assert
      expect(count).toBe(2);
    });
  });

  describe('getDeliveryStats', () => {
    test('deve retornar estatísticas de entrega', () => {
      // Arrange
      messageDeliveryManager.deliveryQueue.set(1, { attempts: 2 });
      messageDeliveryManager.deliveryQueue.set(2, { attempts: 1 });
      messageDeliveryManager.readQueue.set(1, new Set([1, 2]));
      messageDeliveryManager.readQueue.set(2, new Set([1]));

      // Act
      const stats = messageDeliveryManager.getDeliveryStats();

      // Assert
      expect(stats).toEqual({
        pendingDeliveries: 2,
        totalReadReceipts: 3,
        averageDeliveryAttempts: 1.5
      });
    });
  });

  describe('cleanupOldReadReceipts', () => {
    test('deve limpar recibos antigos quando exceder limite', () => {
      // Arrange
      for (let i = 0; i < 15000; i++) {
        messageDeliveryManager.readQueue.set(i, new Set([1]));
      }

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      messageDeliveryManager.cleanupOldReadReceipts();

      // Assert
      expect(messageDeliveryManager.readQueue.size).toBe(5000);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 10000 old read receipts')
      );

      consoleSpy.mockRestore();
    });

    test('não deve limpar se abaixo do limite', () => {
      // Arrange
      messageDeliveryManager.readQueue.set(1, new Set([1]));

      // Act
      messageDeliveryManager.cleanupOldReadReceipts();

      // Assert
      expect(messageDeliveryManager.readQueue.size).toBe(1);
    });
  });

  describe('shutdown', () => {
    test('deve limpar recursos e intervalos', () => {
      // Arrange
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      messageDeliveryManager.deliveryQueue.set(1, {});
      messageDeliveryManager.readQueue.set(1, new Set([1]));

      // Act
      messageDeliveryManager.shutdown();

      // Assert
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(messageDeliveryManager.deliveryQueue.size).toBe(0);
      expect(messageDeliveryManager.readQueue.size).toBe(0);

      clearIntervalSpy.mockRestore();
    });
  });
}); 