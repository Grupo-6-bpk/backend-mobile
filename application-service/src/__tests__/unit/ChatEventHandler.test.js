import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import ChatEventHandler from '../../infrastructure/websocket/ChatEventHandler.js';

describe('ChatEventHandler', () => {
  let chatEventHandler;
  let mockSendMessageUseCase;
  let mockGroupMemberRepository;
  let mockChatGroupRepository;
  let mockMessageRepository;
  let mockSocket;
  let mockIo;

  beforeEach(() => {
    // Mock use case
    mockSendMessageUseCase = {
      execute: jest.fn()
    };

    // Mock repositories
    mockGroupMemberRepository = {
      isMember: jest.fn(),
      findByUserAndGroup: jest.fn(),
      updateLastSeen: jest.fn()
    };

    mockChatGroupRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };

    mockMessageRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    // Mock socket
    mockSocket = {
      id: 'test-socket-id',
      userId: 1,
      user: { id: 1, name: 'Test User', email: 'test@test.com' },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn(() => ({
        emit: jest.fn()
      }))
    };

    // Mock IO
    mockIo = {
      to: jest.fn(() => ({
        emit: jest.fn(),
        except: jest.fn(() => ({
          emit: jest.fn()
        }))
      }))
    };

    chatEventHandler = new ChatEventHandler(
      mockSendMessageUseCase,
      mockGroupMemberRepository,
      mockChatGroupRepository
    );

    // Mock the message repository that gets created in constructor
    chatEventHandler.messageRepository = mockMessageRepository;
  });

  describe('handleSendMessage', () => {
    const validMessageData = {
      groupId: 1,
      content: 'Test message',
      type: 'text',
      tempId: 'temp-123'
    };

    test('deve enviar mensagem com sucesso', async () => {
      // Arrange
      const createdMessage = {
        id: 1,
        content: 'Test message',
        type: 'text',
        senderId: 1,
        groupId: 1,
        createdAt: new Date()
      };
      
      mockSendMessageUseCase.execute.mockResolvedValue(createdMessage);
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleSendMessage(mockSocket, validMessageData, callback, mockIo);

      // Assert
      expect(mockSendMessageUseCase.execute).toHaveBeenCalledWith({
        content: 'Test message',
        type: 'text',
        senderId: 1,
        groupId: 1,
        replyToId: undefined,
        fileUrl: undefined,
        fileName: undefined,
        fileSize: undefined
      });

      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: expect.objectContaining({
          id: 1,
          content: 'Test message',
          senderId: 1,
          senderName: 'Test User',
          groupId: 1,
          status: 'sent'
        }),
        tempId: 'temp-123'
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('message_sent', expect.objectContaining({
        tempId: 'temp-123',
        success: true
      }));
    });

    test('deve rejeitar mensagem sem groupId', async () => {
      // Arrange
      const invalidData = { ...validMessageData, groupId: undefined };
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleSendMessage(mockSocket, invalidData, callback, mockIo);

      // Assert
            expect(callback).toHaveBeenCalledWith({        success: false,        error: 'ID do grupo é obrigatório',        tempId: 'temp-123'      });

      expect(mockSocket.emit).toHaveBeenCalledWith('message_error', expect.objectContaining({
        error: 'ID do grupo é obrigatório'
      }));
    });

    test('deve rejeitar mensagem de texto sem conteúdo', async () => {
      // Arrange
      const invalidData = { ...validMessageData, content: '' };
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleSendMessage(mockSocket, invalidData, callback, mockIo);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Conteúdo da mensagem é obrigatório',
        tempId: 'temp-123'
      });
    });

    test('deve aceitar mensagem de mídia com fileUrl', async () => {
      // Arrange
      const mediaMessage = {
        groupId: 1,
        type: 'image',
        fileUrl: 'https://example.com/image.jpg',
        fileName: 'image.jpg',
        fileSize: 1024,
        tempId: 'temp-456'
      };

      const createdMessage = {
        id: 2,
        type: 'image',
        senderId: 1,
        groupId: 1,
        fileUrl: 'https://example.com/image.jpg',
        createdAt: new Date()
      };

      mockSendMessageUseCase.execute.mockResolvedValue(createdMessage);
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleSendMessage(mockSocket, mediaMessage, callback, mockIo);

      // Assert
      expect(mockSendMessageUseCase.execute).toHaveBeenCalledWith({
        content: undefined,
        type: 'image',
        senderId: 1,
        groupId: 1,
        replyToId: undefined,
        fileUrl: 'https://example.com/image.jpg',
        fileName: 'image.jpg',
        fileSize: 1024
      });

      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: expect.objectContaining({
          type: 'image',
          fileUrl: 'https://example.com/image.jpg'
        }),
        tempId: 'temp-456'
      });
    });

    test('deve tratar erro do use case', async () => {
      // Arrange
      mockSendMessageUseCase.execute.mockRejectedValue(new Error('Use case error'));
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleSendMessage(mockSocket, validMessageData, callback, mockIo);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Use case error',
        tempId: 'temp-123'
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('message_error', expect.objectContaining({
        error: 'Use case error',
        tempId: 'temp-123'
      }));
    });
  });

  describe('handleJoinGroup', () => {
    test('deve entrar no grupo com sucesso', async () => {
      // Arrange
      const joinData = { groupId: 1 };
      const group = { id: 1, name: 'Test Group', type: 'group' };
      const callback = jest.fn();

      mockGroupMemberRepository.isMember.mockResolvedValue(true);
      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.updateLastSeen.mockResolvedValue();

      // Act
      await chatEventHandler.handleJoinGroup(mockSocket, joinData, callback);

      // Assert
      expect(mockSocket.join).toHaveBeenCalledWith('group_1');
      expect(mockGroupMemberRepository.updateLastSeen).toHaveBeenCalledWith(1, 1);
      expect(callback).toHaveBeenCalledWith({
        success: true,
        group: {
          id: 1,
          name: 'Test Group',
          type: 'group',
          memberCount: 0
        },
        message: 'Entrou no grupo com sucesso'
      });
    });

    test('deve rejeitar se usuário não é membro', async () => {
      // Arrange
      const joinData = { groupId: 1 };
      const callback = jest.fn();

      mockGroupMemberRepository.isMember.mockResolvedValue(false);

      // Act
      await chatEventHandler.handleJoinGroup(mockSocket, joinData, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Usuário não é membro deste grupo'
      });
    });

    test('deve rejeitar sem groupId', async () => {
      // Arrange
      const joinData = {};
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleJoinGroup(mockSocket, joinData, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'ID do grupo é obrigatório'
      });
    });
  });

  describe('handleLeaveGroup', () => {
    test('deve sair do grupo com sucesso', async () => {
      // Arrange
      const leaveData = { groupId: 1 };
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleLeaveGroup(mockSocket, leaveData, callback);

      // Assert
      expect(mockSocket.leave).toHaveBeenCalledWith('group_1');
      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: 'Saiu do grupo com sucesso'
      });
    });

    test('deve rejeitar sem groupId', async () => {
      // Arrange
      const leaveData = {};
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleLeaveGroup(mockSocket, leaveData, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'ID do grupo é obrigatório'
      });
    });
  });

  describe('handleEditMessage', () => {
    test('deve editar mensagem com sucesso', async () => {
      // Arrange
      const editData = { messageId: 1, content: 'Mensagem editada' };
      const originalMessage = {
        id: 1,
        senderId: 1,
        groupId: 1,
        type: 'text',
        isDeleted: false
      };
      const updatedMessage = {
        id: 1,
        content: 'Mensagem editada',
        editedAt: new Date()
      };
      const callback = jest.fn();

      mockMessageRepository.findById.mockResolvedValue(originalMessage);
      mockMessageRepository.update.mockResolvedValue(updatedMessage);

      // Act
      await chatEventHandler.handleEditMessage(mockSocket, editData, callback, mockIo);

      // Assert
      expect(mockMessageRepository.update).toHaveBeenCalledWith(1, {
        content: 'Mensagem editada',
        editedAt: expect.any(Date)
      });

      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: expect.objectContaining({
          id: 1,
          content: 'Mensagem editada',
          isEdited: true
        })
      });
    });

    test('deve rejeitar edição de mensagem de outro usuário', async () => {
      // Arrange
      const editData = { messageId: 1, content: 'Tentativa de edição' };
      const originalMessage = {
        id: 1,
        senderId: 2, // Diferente do usuário atual (1)
        type: 'text',
        isDeleted: false
      };
      const callback = jest.fn();

      mockMessageRepository.findById.mockResolvedValue(originalMessage);

      // Act
      await chatEventHandler.handleEditMessage(mockSocket, editData, callback, mockIo);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Apenas o autor pode editar a mensagem'
      });
    });

    test('deve rejeitar edição de mensagem deletada', async () => {
      // Arrange
      const editData = { messageId: 1, content: 'Tentativa de edição' };
      const originalMessage = {
        id: 1,
        senderId: 1,
        type: 'text',
        isDeleted: true
      };
      const callback = jest.fn();

      mockMessageRepository.findById.mockResolvedValue(originalMessage);

      // Act
      await chatEventHandler.handleEditMessage(mockSocket, editData, callback, mockIo);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Apenas mensagens de texto não deletadas podem ser editadas'
      });
    });

    test('deve rejeitar edição de mensagem de mídia', async () => {
      // Arrange
      const editData = { messageId: 1, content: 'Tentativa de edição' };
      const originalMessage = {
        id: 1,
        senderId: 1,
        type: 'image',
        isDeleted: false
      };
      const callback = jest.fn();

      mockMessageRepository.findById.mockResolvedValue(originalMessage);

      // Act
      await chatEventHandler.handleEditMessage(mockSocket, editData, callback, mockIo);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Apenas mensagens de texto não deletadas podem ser editadas'
      });
    });
  });

  describe('handleDeleteMessage', () => {
    test('deve deletar mensagem própria com sucesso', async () => {
      // Arrange
      const deleteData = { messageId: 1 };
      const originalMessage = {
        id: 1,
        senderId: 1,
        groupId: 1
      };
      const membership = { userId: 1, groupId: 1, role: 'member' };
      const callback = jest.fn();

      mockMessageRepository.findById.mockResolvedValue(originalMessage);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);
      mockMessageRepository.delete.mockResolvedValue(true);

      // Act
      await chatEventHandler.handleDeleteMessage(mockSocket, deleteData, callback, mockIo);

      // Assert
      expect(mockMessageRepository.delete).toHaveBeenCalledWith(1);
      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: 'Mensagem deletada com sucesso'
      });
    });

    test('deve permitir admin deletar qualquer mensagem', async () => {
      // Arrange
      const deleteData = { messageId: 1 };
      const originalMessage = {
        id: 1,
        senderId: 2, // Mensagem de outro usuário
        groupId: 1
      };
      const membership = { userId: 1, groupId: 1, role: 'admin' };
      const callback = jest.fn();

      mockMessageRepository.findById.mockResolvedValue(originalMessage);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);
      mockMessageRepository.delete.mockResolvedValue(true);

      // Act
      await chatEventHandler.handleDeleteMessage(mockSocket, deleteData, callback, mockIo);

      // Assert
      expect(mockMessageRepository.delete).toHaveBeenCalledWith(1);
      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: 'Mensagem deletada com sucesso'
      });
    });

    test('deve rejeitar se usuário não tem permissão', async () => {
      // Arrange
      const deleteData = { messageId: 1 };
      const originalMessage = {
        id: 1,
        senderId: 2, // Mensagem de outro usuário
        groupId: 1
      };
      const membership = { userId: 1, groupId: 1, role: 'member' }; // Não é admin
      const callback = jest.fn();

      mockMessageRepository.findById.mockResolvedValue(originalMessage);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);

      // Act
      await chatEventHandler.handleDeleteMessage(mockSocket, deleteData, callback, mockIo);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Sem permissão para deletar esta mensagem'
      });
    });
  });

  describe('handleFileUpload', () => {
    test('deve fazer upload de arquivo com sucesso', async () => {
      // Arrange
      const uploadData = {
        file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
        fileName: 'test.jpg',
        fileSize: 1024,
        groupId: 1
      };
      const callback = jest.fn();

      mockGroupMemberRepository.isMember.mockResolvedValue(true);

      // Act
      await chatEventHandler.handleFileUpload(mockSocket, uploadData, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: true,
        fileUrl: expect.stringContaining('/uploads/chat/'),
        fileName: 'test.jpg',
        fileSize: 1024,
        message: 'Arquivo enviado com sucesso'
      });
    });

    test('deve rejeitar upload se arquivo muito grande', async () => {
      // Arrange
      const uploadData = {
        file: 'base64data',
        fileName: 'large.jpg',
        fileSize: 101 * 1024 * 1024, // 101MB
        groupId: 1
      };
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleFileUpload(mockSocket, uploadData, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Arquivo muito grande. Máximo 100MB'
      });
    });

    test('deve rejeitar upload se usuário não é membro', async () => {
      // Arrange
      const uploadData = {
        file: 'base64data',
        fileName: 'test.jpg',
        fileSize: 1024,
        groupId: 1
      };
      const callback = jest.fn();

      mockGroupMemberRepository.isMember.mockResolvedValue(false);

      // Act
      await chatEventHandler.handleFileUpload(mockSocket, uploadData, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Usuário não é membro deste grupo'
      });
    });

    test('deve rejeitar upload com dados incompletos', async () => {
      // Arrange
      const uploadData = {
        fileName: 'test.jpg',
        // file e groupId ausentes
      };
      const callback = jest.fn();

      // Act
      await chatEventHandler.handleFileUpload(mockSocket, uploadData, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Dados do arquivo incompletos'
      });
    });
  });

  describe('updateGroupLastActivity', () => {
    test('deve atualizar última atividade do grupo', async () => {
      // Arrange
      mockChatGroupRepository.update.mockResolvedValue(true);

      // Act
      await chatEventHandler.updateGroupLastActivity(1);

      // Assert
      expect(mockChatGroupRepository.update).toHaveBeenCalledWith(1, {
        updatedAt: expect.any(Date)
      });
    });
  });
}); 