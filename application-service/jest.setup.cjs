const { jest } = require('@jest/globals');

// Configurar variáveis de ambiente para teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';

// Mock do Prisma
const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  chatGroup: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  message: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  groupMember: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  messageRead: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn()
  },
  $disconnect: jest.fn(),
  $connect: jest.fn()
};

// Mock do socket.io
const mockSocket = {
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
    auth: { token: 'test-token' },
    headers: { authorization: 'Bearer test-token' }
  }
};

const mockIo = {
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

// Disponibilizar mocks globalmente
global.mockPrisma = mockPrisma;
global.mockSocket = mockSocket;
global.mockIo = mockIo;

// Helper para criar mocks de resposta HTTP
global.createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis()
});

// Helper para criar mocks de request HTTP
global.createMockRequest = (overrides = {}) => ({
  user: { id: 1, name: 'Test User' },
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides
});

// Helper para resetar todos os mocks
global.resetAllMocks = () => {
  Object.values(mockPrisma).forEach(model => {
    if (typeof model === 'object') {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && method.mockReset) {
          method.mockReset();
        }
      });
    }
  });
  
  [mockSocket.join, mockSocket.leave, mockSocket.emit, mockSocket.on].forEach(mock => {
    if (mock.mockReset) mock.mockReset();
  });
  
  [mockIo.on, mockIo.emit, mockIo.use, mockIo.close].forEach(mock => {
    if (mock.mockReset) mock.mockReset();
  });
};

// Executar reset antes de cada teste
beforeEach(() => {
  resetAllMocks();
}); 