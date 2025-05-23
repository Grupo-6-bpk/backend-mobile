import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock das dependências antes dos imports
const mockUserRepository = {
  findById: jest.fn(),
  findByIds: jest.fn(),
  findByEmail: jest.fn()
};

const mockChatGroupRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findDirectChat: jest.fn(),
  update: jest.fn()
};

const mockMessageRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByGroupId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockGroupMemberRepository = {
  create: jest.fn(),
  findByUserAndGroup: jest.fn(),
  findByUserId: jest.fn(),
  findByGroupId: jest.fn(),
  updateLastSeen: jest.fn(),
  delete: jest.fn()
};

const mockCreateChatGroupUseCase = {
  execute: jest.fn(),
  addMembers: jest.fn(),
  removeMember: jest.fn()
};

const mockSendMessageUseCase = {
  execute: jest.fn()
};

const mockGetGroupMessagesUseCase = {
  execute: jest.fn()
};

const mockGetUserGroupsUseCase = {
  execute: jest.fn()
};

const mockSearchUsersUseCase = {
  execute: jest.fn(),
  getRecentContacts: jest.fn()
};

// Mocks dos módulos usando jest.mock
jest.mock('../../infrastructure/db/PrismaUserRepository.js', () => ({
  default: jest.fn(() => mockUserRepository)
}));

jest.mock('../../infrastructure/db/PrismaChatGroupRepository.js', () => ({
  default: jest.fn(() => mockChatGroupRepository)
}));

jest.mock('../../infrastructure/db/PrismaMessageRepository.js', () => ({
  default: jest.fn(() => mockMessageRepository)
}));

jest.mock('../../infrastructure/db/PrismaGroupMemberRepository.js', () => ({
  default: jest.fn(() => mockGroupMemberRepository)
}));

jest.mock('../../../application/chat/CreateChatGroupUseCase.js', () => ({
  default: jest.fn(() => mockCreateChatGroupUseCase)
}));

jest.mock('../../../application/chat/SendMessageUseCase.js', () => ({
  default: jest.fn(() => mockSendMessageUseCase)
}));

jest.mock('../../../application/chat/GetGroupMessagesUseCase.js', () => ({
  default: jest.fn(() => mockGetGroupMessagesUseCase)
}));

jest.mock('../../../application/chat/GetUserGroupsUseCase.js', () => ({
  default: jest.fn(() => mockGetUserGroupsUseCase)
}));

jest.mock('../../../application/chat/SearchUsersUseCase.js', () => ({
  default: jest.fn(() => mockSearchUsersUseCase)
}));

// Mock do módulo yup
jest.mock('yup', () => ({
  object: jest.fn().mockReturnThis(),
  string: jest.fn().mockReturnThis(),
  array: jest.fn().mockReturnThis(),
  number: jest.fn().mockReturnThis(),
  shape: jest.fn().mockReturnThis(),
  required: jest.fn().mockReturnThis(),
  min: jest.fn().mockReturnThis(),
  max: jest.fn().mockReturnThis(),
  url: jest.fn().mockReturnThis(),
  oneOf: jest.fn().mockReturnThis(),
  default: jest.fn().mockReturnThis(),
  when: jest.fn().mockReturnThis(),
  length: jest.fn().mockReturnThis(),
  positive: jest.fn().mockReturnThis(),
  of: jest.fn().mockReturnThis(),
  notRequired: jest.fn().mockReturnThis(),
  validate: jest.fn().mockImplementation((data) => Promise.resolve(data))
}));

import ChatController from '../../infrastructure/http/controllers/ChatController.js';

describe('ChatController', () => {
  let chatController;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    chatController = new ChatController();

    // Mock request object
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 1 }
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('constructor', () => {
    test('deve inicializar todos os repositórios e use cases', () => {
      expect(chatController.userRepository).toBeDefined();
      expect(chatController.chatGroupRepository).toBeDefined();
      expect(chatController.messageRepository).toBeDefined();
      expect(chatController.groupMemberRepository).toBeDefined();
      expect(chatController.createChatGroupUseCase).toBeDefined();
      expect(chatController.sendMessageUseCase).toBeDefined();
      expect(chatController.getGroupMessagesUseCase).toBeDefined();
      expect(chatController.getUserGroupsUseCase).toBeDefined();
      expect(chatController.searchUsersUseCase).toBeDefined();
    });
  });

  describe('createGroup', () => {
    test('deve criar grupo com sucesso', async () => {
      // Arrange
      const groupData = {
        name: 'Grupo Teste',
        description: 'Descrição do grupo',
        type: 'group',
        memberIds: [2, 3]
      };
      
      const createdGroup = {
        id: 1,
        name: 'Grupo Teste',
        type: 'group',
        createdById: 1
      };

      mockReq.body = groupData;
      mockCreateChatGroupUseCase.execute.mockResolvedValue(createdGroup);

      // Act
      await chatController.createGroup(mockReq, mockRes);

      // Assert
      expect(mockCreateChatGroupUseCase.execute).toHaveBeenCalledWith(
        { ...groupData, createdById: 1 },
        [2, 3]
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Grupo criado com sucesso',
          data: createdGroup,
          links: expect.any(Array)
        })
      );
    });

    test('deve criar chat direto com sucesso', async () => {
      // Arrange
      const chatData = {
        type: 'direct',
        memberIds: [2]
      };
      
      const createdChat = {
        id: 1,
        name: 'João & Maria',
        type: 'direct',
        createdById: 1
      };

      mockReq.body = chatData;
      mockCreateChatGroupUseCase.execute.mockResolvedValue(createdChat);

      // Act
      await chatController.createGroup(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Chat direto criado com sucesso',
          data: createdChat
        })
      );
    });

    test('deve retornar erro de validação para dados inválidos', async () => {
      // Arrange
      const invalidData = {
        name: 'a', // Muito curto
        type: 'group'
      };

      mockReq.body = invalidData;

      // Act
      await chatController.createGroup(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Dados inválidos',
          error: expect.any(String)
        })
      );
    });

    test('deve tratar erro do use case', async () => {
      // Arrange
      const groupData = {
        name: 'Grupo Teste',
        type: 'group'
      };

      mockReq.body = groupData;
      mockCreateChatGroupUseCase.execute.mockRejectedValue(new Error('Erro do use case'));

      // Act
      await chatController.createGroup(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erro interno do servidor',
          error: 'Erro do use case'
        })
      );
    });
  });

  describe('getUserGroups', () => {
    test('deve retornar grupos do usuário com sucesso', async () => {
      // Arrange
      const groupsResult = {
        groups: [
          {
            id: 1,
            name: 'Grupo 1',
            type: 'group',
            lastMessage: { content: 'Última mensagem' }
          },
          {
            id: 2,
            name: 'João & Maria',
            type: 'direct'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
        },
        summary: {
          totalGroups: 1,
          totalDirectChats: 1,
          unreadMessages: 5
        }
      };

      mockReq.query = { page: '1', limit: '20' };
      mockGetUserGroupsUseCase.execute.mockResolvedValue(groupsResult);

      // Act
      await chatController.getUserGroups(mockReq, mockRes);

      // Assert
      expect(mockGetUserGroupsUseCase.execute).toHaveBeenCalledWith(1, 1, 20);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Grupos recuperados com sucesso',
          data: expect.objectContaining({
            groups: expect.arrayContaining([
              expect.objectContaining({
                id: 1,
                links: expect.any(Array)
              })
            ])
          }),
          links: expect.any(Array)
        })
      );
    });

    test('deve usar valores padrão para page e limit', async () => {
      // Arrange
      const groupsResult = {
        groups: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        },
        summary: {
          totalGroups: 0,
          totalDirectChats: 0,
          unreadMessages: 0
        }
      };

      mockReq.query = {}; // Sem page e limit
      mockGetUserGroupsUseCase.execute.mockResolvedValue(groupsResult);

      // Act
      await chatController.getUserGroups(mockReq, mockRes);

      // Assert
      expect(mockGetUserGroupsUseCase.execute).toHaveBeenCalledWith(1, 1, 20);
    });

    test('deve tratar erro do use case', async () => {
      // Arrange
      mockGetUserGroupsUseCase.execute.mockRejectedValue(new Error('Erro do use case'));

      // Act
      await chatController.getUserGroups(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erro interno do servidor',
          error: 'Erro do use case'
        })
      );
    });
  });

  describe('sendMessage', () => {
    test('deve enviar mensagem de texto com sucesso', async () => {
      // Arrange
      const messageData = {
        content: 'Olá mundo!',
        type: 'text'
      };

      const createdMessage = {
        id: 1,
        content: 'Olá mundo!',
        type: 'text',
        senderId: 1,
        groupId: 1,
        createdAt: new Date()
      };

      mockReq.body = messageData;
      mockReq.params = { groupId: '1' };
      mockSendMessageUseCase.execute.mockResolvedValue(createdMessage);

      // Act
      await chatController.sendMessage(mockReq, mockRes);

      // Assert
      expect(mockSendMessageUseCase.execute).toHaveBeenCalledWith({
        ...messageData,
        groupId: 1,
        senderId: 1
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Mensagem enviada com sucesso',
          data: createdMessage,
          links: expect.any(Array)
        })
      );
    });

    test('deve enviar mensagem de mídia com sucesso', async () => {
      // Arrange
      const messageData = {
        type: 'image',
        fileUrl: 'https://example.com/image.jpg',
        fileName: 'image.jpg',
        fileSize: 1024
      };

      const createdMessage = {
        id: 1,
        type: 'image',
        fileUrl: 'https://example.com/image.jpg',
        senderId: 1,
        groupId: 1,
        createdAt: new Date()
      };

      mockReq.body = messageData;
      mockReq.params = { groupId: '1' };
      mockSendMessageUseCase.execute.mockResolvedValue(createdMessage);

      // Act
      await chatController.sendMessage(mockReq, mockRes);

      // Assert
      expect(mockSendMessageUseCase.execute).toHaveBeenCalledWith({
        ...messageData,
        groupId: 1,
        senderId: 1
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('deve retornar erro para groupId inválido', async () => {
      // Arrange
      mockReq.body = { content: 'Test', type: 'text' };
      mockReq.params = { groupId: 'invalid' };

      // Act
      await chatController.sendMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'ID do grupo inválido'
      });
    });

    test('deve retornar erro de validação para dados inválidos', async () => {
      // Arrange
      const invalidData = {
        content: '', // Conteúdo vazio para tipo text
        type: 'text'
      };

      mockReq.body = invalidData;
      mockReq.params = { groupId: '1' };

      // Act
      await chatController.sendMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Dados inválidos',
          error: expect.any(String)
        })
      );
    });

    test('deve tratar erro do use case', async () => {
      // Arrange
      const messageData = {
        content: 'Test message',
        type: 'text'
      };

      mockReq.body = messageData;
      mockReq.params = { groupId: '1' };
      mockSendMessageUseCase.execute.mockRejectedValue(new Error('Erro do use case'));

      // Act
      await chatController.sendMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erro interno do servidor',
          error: 'Erro do use case'
        })
      );
    });
  });

  describe('getGroupMessages', () => {
    test('deve retornar mensagens do grupo com sucesso', async () => {
      // Arrange
      const messagesResult = {
        messages: [
          {
            id: 1,
            content: 'Primeira mensagem',
            type: 'text',
            senderId: 1,
            sender: { name: 'João' },
            canEdit: true,
            canDelete: true
          },
          {
            id: 2,
            content: 'Segunda mensagem',
            type: 'text',
            senderId: 2,
            sender: { name: 'Maria' },
            canEdit: false,
            canDelete: false
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
        }
      };

      mockReq.params = { groupId: '1' };
      mockReq.query = { page: '1', limit: '50' };
      mockGetGroupMessagesUseCase.execute.mockResolvedValue(messagesResult);

      // Act
      await chatController.getGroupMessages(mockReq, mockRes);

      // Assert
      expect(mockGetGroupMessagesUseCase.execute).toHaveBeenCalledWith(1, 1, 1, 50);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Mensagens recuperadas com sucesso',
          data: expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                id: 1,
                links: expect.any(Array)
              })
            ])
          }),
          links: expect.any(Array)
        })
      );
    });

    test('deve usar valores padrão para page e limit', async () => {
      // Arrange
      const messagesResult = {
        messages: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      };

      mockReq.params = { groupId: '1' };
      mockReq.query = {}; // Sem page e limit
      mockGetGroupMessagesUseCase.execute.mockResolvedValue(messagesResult);

      // Act
      await chatController.getGroupMessages(mockReq, mockRes);

      // Assert
      expect(mockGetGroupMessagesUseCase.execute).toHaveBeenCalledWith(1, 1, 1, 50);
    });

    test('deve retornar erro para groupId inválido', async () => {
      // Arrange
      mockReq.params = { groupId: 'invalid' };
      mockReq.query = {};

      // Act
      await chatController.getGroupMessages(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'ID do grupo inválido'
      });
    });

    test('deve tratar erro do use case', async () => {
      // Arrange
      mockReq.params = { groupId: '1' };
      mockGetGroupMessagesUseCase.execute.mockRejectedValue(new Error('Erro do use case'));

      // Act
      await chatController.getGroupMessages(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erro interno do servidor',
          error: 'Erro do use case'
        })
      );
    });
  });

  describe('searchUsers', () => {
    test('deve buscar usuários com sucesso', async () => {
      // Arrange
      const users = [
        {
          id: 2,
          name: 'João',
          email: 'joao@test.com',
          isAlreadyMember: false
        },
        {
          id: 3,
          name: 'Maria',
          email: 'maria@test.com',
          isAlreadyMember: true
        }
      ];

      mockReq.query = { q: 'João', limit: '10' };
      mockSearchUsersUseCase.execute.mockResolvedValue(users);

      // Act
      await chatController.searchUsers(mockReq, mockRes);

      // Assert
      expect(mockSearchUsersUseCase.execute).toHaveBeenCalledWith('João', 1, null, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuários encontrados com sucesso',
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 2,
              links: expect.any(Array)
            })
          ]),
          links: expect.any(Array)
        })
      );
    });

    test('deve buscar usuários com groupId opcional', async () => {
      // Arrange
      const users = [
        {
          id: 2,
          name: 'João',
          email: 'joao@test.com',
          isAlreadyMember: false
        }
      ];

      mockReq.query = { q: 'João', groupId: '1', limit: '5' };
      mockSearchUsersUseCase.execute.mockResolvedValue(users);

      // Act
      await chatController.searchUsers(mockReq, mockRes);

      // Assert
      expect(mockSearchUsersUseCase.execute).toHaveBeenCalledWith('João', 1, 1, 5);
    });

    test('deve retornar erro se parâmetro q não fornecido', async () => {
      // Arrange
      mockReq.query = {}; // Sem parâmetro q

      // Act
      await chatController.searchUsers(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Parâmetro de busca "q" é obrigatório'
      });
    });

    test('deve usar valores padrão para limit', async () => {
      // Arrange
      const users = [];
      mockReq.query = { q: 'test' }; // Sem limit
      mockSearchUsersUseCase.execute.mockResolvedValue(users);

      // Act
      await chatController.searchUsers(mockReq, mockRes);

      // Assert
      expect(mockSearchUsersUseCase.execute).toHaveBeenCalledWith('test', 1, null, 10);
    });

    test('deve tratar erro do use case', async () => {
      // Arrange
      mockReq.query = { q: 'test' };
      mockSearchUsersUseCase.execute.mockRejectedValue(new Error('Erro do use case'));

      // Act
      await chatController.searchUsers(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erro interno do servidor',
          error: 'Erro do use case'
        })
      );
    });
  });

  describe('getRecentContacts', () => {
    test('deve retornar contatos recentes com sucesso', async () => {
      // Arrange
      const contacts = [
        {
          id: 2,
          name: 'João',
          email: 'joao@test.com',
          chatGroupId: 1,
          lastInteraction: new Date()
        },
        {
          id: 3,
          name: 'Maria',
          email: 'maria@test.com',
          chatGroupId: 2,
          lastInteraction: new Date()
        }
      ];

      mockReq.query = { limit: '10' };
      mockSearchUsersUseCase.getRecentContacts.mockResolvedValue(contacts);

      // Act
      await chatController.getRecentContacts(mockReq, mockRes);

      // Assert
      expect(mockSearchUsersUseCase.getRecentContacts).toHaveBeenCalledWith(1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Contatos recentes recuperados com sucesso',
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 2,
              links: expect.any(Array)
            })
          ]),
          links: expect.any(Array)
        })
      );
    });

    test('deve usar valor padrão para limit', async () => {
      // Arrange
      const contacts = [];
      mockReq.query = {}; // Sem limit
      mockSearchUsersUseCase.getRecentContacts.mockResolvedValue(contacts);

      // Act
      await chatController.getRecentContacts(mockReq, mockRes);

      // Assert
      expect(mockSearchUsersUseCase.getRecentContacts).toHaveBeenCalledWith(1, 10);
    });

    test('deve tratar erro do use case', async () => {
      // Arrange
      mockSearchUsersUseCase.getRecentContacts.mockRejectedValue(new Error('Erro do use case'));

      // Act
      await chatController.getRecentContacts(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erro interno do servidor',
          error: 'Erro do use case'
        })
      );
    });
  });
}); 