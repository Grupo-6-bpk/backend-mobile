import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import SendMessageUseCase from '../../application/chat/SendMessageUseCase.js';

describe('SendMessageUseCase', () => {
  let sendMessageUseCase;
  let mockMessageRepository;
  let mockGroupMemberRepository;
  let mockChatGroupRepository;

  beforeEach(() => {
    // Mock repositories
    mockMessageRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    mockGroupMemberRepository = {
      findByUserAndGroup: jest.fn(),
      isMember: jest.fn(),
      updateLastSeen: jest.fn()
    };

    mockChatGroupRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };

    sendMessageUseCase = new SendMessageUseCase(
      mockMessageRepository,
      mockGroupMemberRepository,
      mockChatGroupRepository
    );
  });

  describe('execute', () => {
    const validMessageData = {
      senderId: 1,
      groupId: 1,
      content: 'Hello World',
      type: 'text'
    };

    test('deve enviar mensagem de texto com sucesso', async () => {
      // Arrange
      const group = { id: 1, isActive: true };
      const membership = { 
        userId: 1, 
        groupId: 1, 
        isActive: true, 
        user: { 
          id: 1, 
          name: 'João', 
          last_name: 'Silva' 
        } 
      };
      const createdMessage = { 
        id: 1, 
        ...validMessageData, 
        createdAt: new Date() 
      };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);
      mockMessageRepository.create.mockResolvedValue(createdMessage);
      mockGroupMemberRepository.updateLastSeen.mockResolvedValue(true);

      // Act
      const result = await sendMessageUseCase.execute(validMessageData);

      // Assert
      expect(result).toEqual({
        ...createdMessage,
        sender: {
          id: 1,
          name: 'João',
          last_name: 'Silva'
        }
      });
      expect(mockChatGroupRepository.findById).toHaveBeenCalledWith(1);
      expect(mockGroupMemberRepository.findByUserAndGroup).toHaveBeenCalledWith(1, 1);
      expect(mockGroupMemberRepository.updateLastSeen).toHaveBeenCalledWith(1, 1);
    });

    test('deve rejeitar se senderId não fornecido', async () => {
      // Arrange
      const invalidData = { ...validMessageData, senderId: undefined };

      // Act & Assert
      await expect(sendMessageUseCase.execute(invalidData))
        .rejects.toThrow('Remetente da mensagem é obrigatório');
    });

    test('deve rejeitar se groupId não fornecido', async () => {
      // Arrange
      const invalidData = { ...validMessageData, groupId: undefined };

      // Act & Assert
      await expect(sendMessageUseCase.execute(invalidData))
        .rejects.toThrow('Grupo de destino é obrigatório');
    });

    test('deve rejeitar se grupo não encontrado', async () => {
      // Arrange
      mockChatGroupRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(sendMessageUseCase.execute(validMessageData))
        .rejects.toThrow('Grupo não encontrado');
    });

    test('deve rejeitar se grupo está inativo', async () => {
      // Arrange
      const inactiveGroup = { id: 1, isActive: false };
      mockChatGroupRepository.findById.mockResolvedValue(inactiveGroup);

      // Act & Assert
      await expect(sendMessageUseCase.execute(validMessageData))
        .rejects.toThrow('Não é possível enviar mensagem para grupo inativo');
    });

    test('deve rejeitar se usuário não é membro do grupo', async () => {
      // Arrange
      const group = { id: 1, isActive: true };
      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(null);

      // Act & Assert
      await expect(sendMessageUseCase.execute(validMessageData))
        .rejects.toThrow('Usuário não é membro deste grupo');
    });

    test('deve rejeitar se membro está inativo', async () => {
      // Arrange
      const group = { id: 1, isActive: true };
      const inactiveMembership = { userId: 1, groupId: 1, isActive: false };
      
      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(inactiveMembership);

      // Act & Assert
      await expect(sendMessageUseCase.execute(validMessageData))
        .rejects.toThrow('Usuário não é membro deste grupo');
    });

    test('deve rejeitar mensagem de texto vazia', async () => {
      // Arrange
      const group = { id: 1, isActive: true };
      const membership = { userId: 1, groupId: 1, isActive: true };
      const emptyTextMessage = { ...validMessageData, content: '' };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);

      // Act & Assert
      await expect(sendMessageUseCase.execute(emptyTextMessage))
        .rejects.toThrow('Mensagem de texto não pode estar vazia');
    });

    test('deve rejeitar mensagem de texto muito longa', async () => {
      // Arrange
      const group = { id: 1, isActive: true };
      const membership = { userId: 1, groupId: 1, isActive: true };
      const longMessage = { 
        ...validMessageData, 
        content: 'a'.repeat(4001) // Mais de 4000 caracteres
      };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);

      // Act & Assert
      await expect(sendMessageUseCase.execute(longMessage))
        .rejects.toThrow('Mensagem não pode ter mais de 4000 caracteres');
    });

    test('deve aceitar mensagem de imagem com fileUrl', async () => {
      // Arrange
      const group = { id: 1, isActive: true };
      const membership = { 
        userId: 1, 
        groupId: 1, 
        isActive: true, 
        user: { 
          id: 1, 
          name: 'Maria', 
          last_name: 'Santos' 
        } 
      };
      const imageMessage = {
        ...validMessageData,
        type: 'image',
        content: null,
        fileUrl: 'https://example.com/image.jpg'
      };
      const createdMessage = { id: 1, ...imageMessage, createdAt: new Date() };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);
      mockMessageRepository.create.mockResolvedValue(createdMessage);
      mockGroupMemberRepository.updateLastSeen.mockResolvedValue(true);

      // Act
      const result = await sendMessageUseCase.execute(imageMessage);

      // Assert
      expect(result).toEqual({
        ...createdMessage,
        sender: {
          id: 1,
          name: 'Maria',
          last_name: 'Santos'
        }
      });
      expect(mockGroupMemberRepository.updateLastSeen).toHaveBeenCalledWith(1, 1);
    });

    test('deve rejeitar mensagem de mídia sem fileUrl', async () => {
      // Arrange
      const group = { id: 1, isActive: true };
      const membership = { userId: 1, groupId: 1, isActive: true };
      const mediaMessage = {
        ...validMessageData,
        type: 'image',
        content: null,
        fileUrl: null
      };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);

      // Act & Assert
      await expect(sendMessageUseCase.execute(mediaMessage))
        .rejects.toThrow('Mensagem de mídia deve ter um arquivo');
    });

    test('deve rejeitar tipo de mensagem inválido', async () => {
      // Arrange
      const group = { id: 1, isActive: true };
      const membership = { userId: 1, groupId: 1, isActive: true };
      const invalidTypeMessage = {
        ...validMessageData,
        type: 'invalid_type'
      };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);

      // Act & Assert
      await expect(sendMessageUseCase.execute(invalidTypeMessage))
        .rejects.toThrow('Tipo de mensagem inválido');
    });

    test('deve aceitar reply para mensagem existente', async () => {
      // Arrange
      const messageData = {
        content: 'Esta é uma resposta',
        senderId: 1,
        groupId: 1,
        replyToId: 5
      };

      const group = { id: 1, isActive: true };
      const membership = { isActive: true, user: { id: 1, name: 'User 1' } };
      const replyToMessage = { 
        id: 5, 
        content: 'Mensagem original', 
        groupId: 1, // Mesmo groupId para evitar erro
        isDeleted: false 
      };
      const createdMessage = { 
        id: 10, 
        content: 'Esta é uma resposta', 
        senderId: 1, 
        groupId: 1, 
        replyToId: 5 
      };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);
      mockMessageRepository.findById.mockResolvedValue(replyToMessage);
      mockMessageRepository.create.mockResolvedValue(createdMessage);
      mockGroupMemberRepository.updateLastSeen.mockResolvedValue(true);

      // Act
      const result = await sendMessageUseCase.execute(messageData);

      // Assert
      expect(result.replyToId).toBe(5);
      expect(mockMessageRepository.findById).toHaveBeenCalledWith(5);
    });

    test('deve aceitar todos os tipos de mídia válidos', async () => {
      // Arrange
      const group = { id: 1, isActive: true };
      const membership = { 
        userId: 1, 
        groupId: 1, 
        isActive: true, 
        user: { 
          id: 1, 
          name: 'Carlos', 
          last_name: 'Pereira' 
        } 
      };
      const mediaTypes = ['image', 'file', 'audio', 'video'];

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(membership);
      mockGroupMemberRepository.updateLastSeen.mockResolvedValue(true);

      for (const type of mediaTypes) {
        const mediaMessage = {
          ...validMessageData,
          type,
          content: null,
          fileUrl: `https://example.com/file.${type}`
        };
        const createdMessage = { id: 1, ...mediaMessage, createdAt: new Date() };
        
        mockMessageRepository.create.mockResolvedValue(createdMessage);

        // Act
        const result = await sendMessageUseCase.execute(mediaMessage);

        // Assert
        expect(result).toEqual({
          ...createdMessage,
          sender: {
            id: 1,
            name: 'Carlos',
            last_name: 'Pereira'
          }
        });
      }
    });
  });
}); 