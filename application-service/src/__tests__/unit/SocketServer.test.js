import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock do socket.io antes dos imports
const mockSocketIOServer = jest.fn();
jest.unstable_mockModule('socket.io', () => ({
  Server: mockSocketIOServer
}));

// Mock do JWT
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn()
  }
}));

// Import após os mocks
const { default: SocketServer } = await import('../../infrastructure/websocket/SocketServer.js');

describe('SocketServer', () => {
  let socketServer;
  let mockHttpServer;
  let mockIoInstance;
  let mockSocket;

  beforeEach(() => {
    // Mock HTTP Server
    mockHttpServer = {
      listen: jest.fn(),
      close: jest.fn()
    };

    // Mock Socket instance
    mockSocket = {
      id: 'test-socket-id',
      userId: 1,
      user: { id: 1, name: 'Test User', email: 'test@test.com' },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn(() => ({
        emit: jest.fn(),
        except: jest.fn(() => ({
          emit: jest.fn()
        }))
      })),
      on: jest.fn(),
      disconnect: jest.fn(),
      handshake: {
        auth: { token: 'valid-token' },
        headers: { authorization: 'Bearer valid-token' }
      }
    };

    // Mock IO instance
    mockIoInstance = {
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn(() => ({
        emit: jest.fn(),
        except: jest.fn(() => ({
          emit: jest.fn()
        }))
      })),
      use: jest.fn(),
      close: jest.fn()
    };

    // Mock SocketIO Server constructor
    mockSocketIOServer.mockReturnValue(mockIoInstance);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('deve inicializar servidor WebSocket com configurações corretas', () => {
      // Act
      socketServer = new SocketServer(mockHttpServer);

      // Assert
      expect(mockSocketIOServer).toHaveBeenCalledWith(mockHttpServer, expect.objectContaining({
        cors: expect.objectContaining({
          origin: "*",
          methods: ["GET", "POST"],
          allowedHeaders: ["Authorization"],
          credentials: true
        }),
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 30000,
        maxHttpBufferSize: 1e8,
        transports: ['websocket', 'polling'],
        compression: true,
        httpCompression: true,
        maxConnections: 10000,
        serveClient: false,
        path: '/socket.io/'
      }));
    });

    test('deve configurar middleware e event handlers', () => {
      // Act
      socketServer = new SocketServer(mockHttpServer);

      // Assert
      expect(mockIoInstance.use).toHaveBeenCalled();
      expect(mockIoInstance.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('setupMiddleware', () => {
    test('deve configurar middleware de autenticação', async () => {
      // Arrange
      const jwt = (await import('jsonwebtoken')).default;
      const next = jest.fn();
      
      jwt.verify.mockReturnValue({ id: 1, email: 'test@test.com' });
      
      socketServer = new SocketServer(mockHttpServer);
      
      // Capturar o middleware de autenticação
      const authMiddleware = mockIoInstance.use.mock.calls.find(call => 
        call[0].toString().includes('token')
      )[0];

      // Mock repository
      socketServer.userRepository.findById = jest.fn().mockResolvedValue({
        id: 1,
        name: 'Test User',
        last_name: 'Last',
        email: 'test@test.com',
        verified: true
      });

      // Act
      await authMiddleware(mockSocket, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(mockSocket.userId).toBe(1);
      expect(mockSocket.user).toEqual({
        id: 1,
        name: 'Test User',
        lastName: 'Last',
        email: 'test@test.com',
        verified: true
      });
      expect(next).toHaveBeenCalledWith();
    });

    test('deve rejeitar conexão sem token', async () => {
      // Arrange
      const next = jest.fn();
      const socketWithoutToken = { 
        ...mockSocket, 
        handshake: { auth: {}, headers: {} } 
      };
      
      socketServer = new SocketServer(mockHttpServer);
      
      const authMiddleware = mockIoInstance.use.mock.calls.find(call => 
        call[0].toString().includes('token')
      )[0];

      // Act
      await authMiddleware(socketWithoutToken, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Token de autenticação necessário');
    });

    test('deve configurar rate limiting', () => {
      // Arrange
      socketServer = new SocketServer(mockHttpServer);
      
      // Assert
      expect(mockIoInstance.use).toHaveBeenCalledTimes(2); // Auth + Rate limiting
    });
  });

  describe('handleConnection', () => {
    beforeEach(() => {
      socketServer = new SocketServer(mockHttpServer);
      
      // Mock repositories
      socketServer.groupMemberRepository.findByUserId = jest.fn().mockResolvedValue([
        { groupId: 1 }, { groupId: 2 }
      ]);
      socketServer.messageRepository.findByStatus = jest.fn().mockResolvedValue([]);
      socketServer.groupMemberRepository.findByUserId = jest.fn().mockResolvedValue([]);
    });

    test('deve processar conexão de usuário com sucesso', async () => {
      // Act
      await socketServer.handleConnection(mockSocket);

      // Assert
      expect(socketServer.connectedUsers.get(1)).toBe('test-socket-id');
      expect(mockSocket.join).toHaveBeenCalledWith('user_1');
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.objectContaining({
        message: 'Conectado com sucesso ao chat',
        userId: 1
      }));
    });

    test('deve entrar usuário em grupos automaticamente', async () => {
      // Arrange
      socketServer.groupMemberRepository.findByUserId.mockResolvedValue([
        { groupId: 1 }, { groupId: 2 }
      ]);

      // Act
      await socketServer.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.join).toHaveBeenCalledWith('group_1');
      expect(mockSocket.join).toHaveBeenCalledWith('group_2');
    });

    test('deve configurar event listeners do socket', async () => {
      // Act
      await socketServer.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.on).toHaveBeenCalledWith('send_message', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('join_group', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('leave_group', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  describe('setupSocketEvents', () => {
    beforeEach(() => {
      socketServer = new SocketServer(mockHttpServer);
    });

    test('deve configurar todos os eventos de chat', () => {
      // Act
      socketServer.setupSocketEvents(mockSocket);

      // Assert
      const expectedEvents = [
        'send_message', 'join_group', 'leave_group',
        'message_delivered', 'message_read',
        'typing_start', 'typing_stop',
        'update_status', 'get_online_users',
        'edit_message', 'delete_message', 'recall_message', 'upload_file',
        'disconnect', 'error'
      ];

      expectedEvents.forEach(event => {
        expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function));
      });
    });

    test('deve processar evento send_message', async () => {
      // Arrange
      const messageData = { groupId: 1, content: 'Test message' };
      const callback = jest.fn();
      
      socketServer.chatEventHandler.handleSendMessage = jest.fn().mockResolvedValue();
      socketServer.setupSocketEvents(mockSocket);
      
      // Capturar o handler do evento
      const sendMessageHandler = mockSocket.on.mock.calls.find(call => 
        call[0] === 'send_message'
      )[1];

      // Act
      await sendMessageHandler(messageData, callback);

      // Assert
      expect(socketServer.chatEventHandler.handleSendMessage).toHaveBeenCalledWith(
        mockSocket, messageData, callback, socketServer.io
      );
    });

    test('deve processar evento typing_start', () => {
      // Arrange
      const typingData = { groupId: 1 };
      
      socketServer.setupSocketEvents(mockSocket);
      
      const typingHandler = mockSocket.on.mock.calls.find(call => 
        call[0] === 'typing_start'
      )[1];

      // Act
      typingHandler(typingData);

      // Assert
      expect(mockSocket.to).toHaveBeenCalledWith('group_1');
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      socketServer = new SocketServer(mockHttpServer);
      socketServer.connectedUsers.set(1, 'socket-1');
      socketServer.connectedUsers.set(2, 'socket-2');
    });

    test('sendToUser deve enviar evento para usuário específico', () => {
      // Act
      const result = socketServer.sendToUser(1, 'test_event', { data: 'test' });

      // Assert
      expect(result).toBe(true);
      expect(mockIoInstance.to).toHaveBeenCalledWith('user_1');
    });

    test('sendToUser deve retornar false para usuário não conectado', () => {
      // Act
      const result = socketServer.sendToUser(999, 'test_event', { data: 'test' });

      // Assert
      expect(result).toBe(false);
    });

    test('sendToGroup deve enviar evento para grupo', () => {
      // Act
      socketServer.sendToGroup(1, 'test_event', { data: 'test' });

      // Assert
      expect(mockIoInstance.to).toHaveBeenCalledWith('group_1');
    });

    test('sendToGroup deve excluir usuário específico', () => {
      // Act
      socketServer.sendToGroup(1, 'test_event', { data: 'test' }, 1);

      // Assert
      expect(mockIoInstance.to).toHaveBeenCalledWith('group_1');
    });

    test('getConnectedUsersCount deve retornar número correto', () => {
      // Act
      const count = socketServer.getConnectedUsersCount();

      // Assert
      expect(count).toBe(2);
    });

    test('getServerStats deve retornar estatísticas do servidor', () => {
      // Act
      const stats = socketServer.getServerStats();

      // Assert
      expect(stats).toMatchObject({
        connectedUsers: 2,
        totalRooms: 0,
        uptime: expect.any(Number),
        memoryUsage: expect.any(Object),
        timestamp: expect.any(Number)
      });
    });
  });

  describe('handleDisconnection', () => {
    beforeEach(() => {
      socketServer = new SocketServer(mockHttpServer);
      socketServer.connectedUsers.set(1, 'test-socket-id');
      socketServer.userRooms.set(1, new Set(['group_1', 'group_2']));
    });

    test('deve processar desconexão corretamente', async () => {
      // Act
      await socketServer.handleDisconnection(mockSocket, 'client disconnect');

      // Assert
      expect(socketServer.connectedUsers.has(1)).toBe(false);
      expect(socketServer.userRooms.has(1)).toBe(false);
    });

    test('deve atualizar status de presença', async () => {
      // Arrange
      socketServer.presenceManager.setUserOffline = jest.fn();

      // Act
      await socketServer.handleDisconnection(mockSocket, 'client disconnect');

      // Assert
      expect(socketServer.presenceManager.setUserOffline).toHaveBeenCalledWith(1);
    });
  });

  describe('shutdown', () => {
    beforeEach(() => {
      socketServer = new SocketServer(mockHttpServer);
    });

    test('deve notificar clientes sobre shutdown', async () => {
      // Act
      await socketServer.shutdown();

      // Assert
      expect(mockIoInstance.emit).toHaveBeenCalledWith('server_shutdown', expect.objectContaining({
        message: 'Servidor reiniciando, reconecte em alguns segundos'
      }));
      expect(mockIoInstance.close).toHaveBeenCalled();
    });
  });
}); 