import { ChatService } from '../../application/services/ChatService.js';
import { MessageService } from '../../application/services/MessageService.js';
import { UserService } from '../../application/services/UserService.js';

const chatService = new ChatService();
const messageService = new MessageService();
const userService = new UserService();

// Referência para o Socket.IO - será definida durante a inicialização do servidor
let socketIO = null;

export const setSocketIO = (io) => {
  socketIO = io;
};

export const getChats = async (req, res, next) => {
  /*
  #swagger.tags = ["Chat"]
  #swagger.description = 'Lista conversas do usuário ordenadas pela última mensagem'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['limit'] = {
    in: 'query',
    description: 'Número de chats a retornar',
    required: false,
    type: 'integer',
    example: 20
  }
  #swagger.parameters['offset'] = {
    in: 'query', 
    description: 'Offset para paginação',
    required: false,
    type: 'integer',
    example: 0
  }
  #swagger.responses[200] = {
    description: 'Lista de chats recuperada com sucesso',
    schema: [
      {
        chatId: 123,
        isGroup: false,
        chatName: "João Silva",
        chatAvatar: "https://example.com/avatar.jpg",
        lastMessage: "Olá, tudo bem?",
        lastMessageAt: "2025-05-31T20:12:34.000Z",
        participants: [
          {
            userId: 123,
            name: "Maria Silva",
            avatarUrl: "https://example.com/maria.jpg",
            isBlocked: false
          },
          {
            userId: 456,
            name: "João Silva",
            avatarUrl: "https://example.com/joao.jpg",
            isBlocked: false
          }
        ]
      },
      {
        chatId: 124,
        isGroup: true,
        chatName: "Carona Turma FE2025",
        chatAvatar: null,
        adminId: 42,
        lastMessage: "Até que horas?",
        lastMessageAt: "2025-05-31T19:55:01.000Z",
        participants: [
          {
            userId: 42,
            name: "Maria Silva",
            avatarUrl: "https://example.com/maria.jpg",
            isBlocked: false
          },
          {
            userId: 789,
            name: "Carlos Souza",
            avatarUrl: null,
            isBlocked: false
          }
        ]
      }
    ]
  }
  #swagger.responses[401] = { description: 'Token de autenticação inválido' }
  */
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const chats = await chatService.getUserChats(userId, limit, offset);
    
    res.ok(chats);
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req, res, next) => {
  /*
  #swagger.tags = ["Chat"]
  #swagger.description = 'Retorna histórico de mensagens de um chat com paginação cursor-based'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['chatId'] = {
    in: 'path',
    description: 'ID do chat',
    required: true,
    type: 'integer',
    example: 123
  }
  #swagger.parameters['limit'] = {
    in: 'query',
    description: 'Número de mensagens a retornar (máx 100)',
    required: false,
    type: 'integer',
    example: 50
  }
  #swagger.parameters['cursor'] = {
    in: 'query',
    description: 'Timestamp para paginação cursor-based',
    required: false,
    type: 'string',
    example: "2025-05-31T19:50:00.000Z"
  }
  #swagger.responses[200] = {
    description: 'Mensagens recuperadas com sucesso',
    schema: {
      messages: [
        {
          messageId: 987,
          senderId: 42,
          senderName: "Maria",
          senderAvatar: "https://example.com/avatar.jpg",
          content: "Até que horas?",
          sentAt: "2025-05-31T19:55:01.000Z",
          chatId: 123
        }
      ],
      nextCursor: "2025-05-31T19:50:00.000Z"
    }
  }
  #swagger.responses[400] = { description: 'Usuário não é participante do chat' }
  #swagger.responses[401] = { description: 'Token de autenticação inválido' }
  #swagger.responses[404] = { description: 'Chat não encontrado' }
  */
  try {
    const userId = req.user.id;
    const chatId = parseInt(req.params.chatId);
    const limit = parseInt(req.query.limit) || 50;
    const cursor = req.query.cursor;

    const result = await messageService.getChatMessages(chatId, userId, limit, cursor);
    
    res.ok(result);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  /*
  #swagger.tags = ["Messages"]
  #swagger.description = 'Envia nova mensagem para um chat'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['chatId'] = {
    in: 'path',
    description: 'ID do chat para enviar a mensagem',
    required: true,
    type: 'integer',
    example: 123
  }
  #swagger.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Conteúdo da mensagem (máx 1000 caracteres)',
              example: "Olá pessoal! Alguém vai para o campus hoje?"
            }
          },
          required: ['content']
        }
      }
    }
  }
  #swagger.responses[201] = {
    description: 'Mensagem enviada com sucesso',
    schema: {
      messageId: 987,
      chatId: 123,
      senderId: 42,
      senderName: "Maria Silva",
      senderAvatar: "https://example.com/avatar.jpg",
      content: "Olá pessoal! Alguém vai para o campus hoje?",
      sentAt: "2025-05-31T20:30:15.000Z"
    }
  }
  #swagger.responses[400] = { description: 'Conteúdo inválido ou usuário não é participante' }
  #swagger.responses[401] = { description: 'Token de autenticação inválido' }
  #swagger.responses[404] = { description: 'Chat não encontrado' }
  */
  try {
    const userId = req.user.id;
    const chatId = parseInt(req.params.chatId);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Conteúdo da mensagem é obrigatório' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Mensagem não pode ter mais de 1000 caracteres' });
    }

    const message = await messageService.sendMessage(content.trim(), userId, chatId);

    // Emitir evento WebSocket para todos os participantes do chat
    if (socketIO) {
      socketIO.to(`chat.${chatId}`).emit('message_received', {
        chatId: message.chatId,
        messageId: message.id,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderAvatar: message.sender.avatarUrl,
        content: message.content,
        sentAt: message.sentAt
      });
    }

    res.created({
      messageId: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderAvatar: message.sender.avatarUrl,
      content: message.content,
      sentAt: message.sentAt
    });
  } catch (error) {
    next(error);
  }
};

export const createChat = async (req, res, next) => {
  /*
  #swagger.tags = ["Chat"]
  #swagger.description = 'Cria novo chat (direto ou grupo)'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            isGroup: {
              type: 'boolean',
              description: 'Se é um grupo ou chat direto',
              example: false
            },
            name: {
              type: 'string',
              description: 'Nome do grupo (obrigatório se isGroup=true)',
              example: "Carona Turma FE2025"
            },
            participantIds: {
              type: 'array',
              items: { type: 'integer' },
              description: 'IDs dos participantes',
              example: [456, 789]
            }
          },
          required: ['isGroup', 'participantIds']
        },
        examples: {
          'Chat Direto': {
            value: {
              isGroup: false,
              participantIds: [456]
            }
          },
          'Grupo': {
            value: {
              isGroup: true,
              name: "Carona Turma FE2025",
              participantIds: [456, 789]
            }
          }
        }
      }
    }
  }
  #swagger.responses[201] = {
    description: 'Chat criado com sucesso',
    schema: {
      chatId: 321,
      isGroup: true,
      name: "Carona Turma FE2025",
      adminId: 123,
      participants: [
        { userId: 123, blocked: false },
        { userId: 456, blocked: false }
      ],
      createdAt: "2025-05-31T12:05:00.000Z"
    }
  }
  #swagger.responses[400] = { description: 'Dados inválidos ou usuário não encontrado' }
  #swagger.responses[401] = { description: 'Token de autenticação inválido' }
  */
  try {
    const userId = req.user.id;
    const { isGroup, name, participantIds, adminId } = req.body;

    let chat;

    if (isGroup) {
      if (!name || !participantIds || participantIds.length < 1) {
        return res.status(400).json({ message: 'Nome e participantes são obrigatórios para grupos' });
      }
      
      chat = await chatService.createGroup(userId, name, participantIds);
    } else {
      if (!participantIds || participantIds.length !== 1) {
        return res.status(400).json({ message: 'Deve haver exatamente um participante para chat direto' });
      }
      
      chat = await chatService.createDirectChat(userId, participantIds[0]);
    }

    res.created({
      chatId: chat.id,
      isGroup: chat.isGroup,
      name: chat.name,
      adminId: chat.adminId,
      participants: chat.participants.map(p => ({
        userId: p.userId,
        blocked: p.blocked
      })),
      createdAt: chat.createdAt
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChat = async (req, res, next) => {
  /*
  #swagger.tags = ["Chat"]
  #swagger.description = 'Exclui chat (apenas grupos, apenas admin)'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['chatId'] = {
    in: 'path',
    description: 'ID do chat a ser excluído',
    required: true,
    type: 'integer',
    example: 123
  }
  #swagger.responses[204] = { description: 'Chat excluído com sucesso' }
  #swagger.responses[400] = { description: 'Não é possível excluir chat direto ou usuário não é admin' }
  #swagger.responses[401] = { description: 'Token de autenticação inválido' }
  #swagger.responses[404] = { description: 'Chat não encontrado' }
  */
  try {
    const userId = req.user.id;
    const chatId = parseInt(req.params.chatId);

    await chatService.deleteChat(chatId, userId);
    
    res.no_content();
  } catch (error) {
    next(error);
  }
};

export const inviteUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Chat"]
  #swagger.description = 'Adiciona membro ao grupo (apenas admin)'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['chatId'] = {
    in: 'path',
    description: 'ID do chat/grupo',
    required: true,
    type: 'integer',
    example: 123
  }
  #swagger.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            userId: {
              type: 'integer',
              description: 'ID do usuário a ser adicionado',
              example: 789
            }
          },
          required: ['userId']
        }
      }
    }
  }
  #swagger.responses[201] = {
    description: 'Usuário adicionado com sucesso',
    schema: {
      userId: 789,
      chatId: 123
    }
  }
  #swagger.responses[400] = { description: 'Dados inválidos, usuário não encontrado ou não é admin' }
  #swagger.responses[401] = { description: 'Token de autenticação inválido' }
  #swagger.responses[404] = { description: 'Chat não encontrado' }
  */
  try {
    const currentUserId = req.user.id;
    const chatId = parseInt(req.params.chatId);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    const participant = await chatService.addParticipant(chatId, currentUserId, userId);
    
    res.created({
      userId: participant.userId,
      chatId: chatId
    });
  } catch (error) {
    next(error);
  }
};

export const removeUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Chat"]
  #swagger.description = 'Remove membro do grupo (apenas admin)'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['chatId'] = {
    in: 'path',
    description: 'ID do chat/grupo',
    required: true,
    type: 'integer',
    example: 123
  }
  #swagger.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            userId: {
              type: 'integer',
              description: 'ID do usuário a ser removido',
              example: 789
            }
          },
          required: ['userId']
        }
      }
    }
  }
  #swagger.responses[204] = { description: 'Usuário removido com sucesso' }
  #swagger.responses[400] = { description: 'Dados inválidos ou usuário não é admin' }
  #swagger.responses[401] = { description: 'Token de autenticação inválido' }
  #swagger.responses[404] = { description: 'Chat não encontrado' }
  */
  try {
    const currentUserId = req.user.id;
    const chatId = parseInt(req.params.chatId);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    await chatService.removeParticipant(chatId, currentUserId, userId);
    
    res.no_content();
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Chat"]
  #swagger.description = 'Bloqueia usuário no escopo do chat'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['chatId'] = {
    in: 'path',
    description: 'ID do chat',
    required: true,
    type: 'integer',
    example: 123
  }
  #swagger.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            targetUserId: {
              type: 'integer',
              description: 'ID do usuário a ser bloqueado',
              example: 789
            }
          },
          required: ['targetUserId']
        }
      }
    }
  }
  #swagger.responses[204] = { description: 'Usuário bloqueado com sucesso' }
  #swagger.responses[400] = { description: 'Dados inválidos ou usuário não é participante' }
  #swagger.responses[401] = { description: 'Token de autenticação inválido' }
  #swagger.responses[404] = { description: 'Chat não encontrado' }
  */
  try {
    const currentUserId = req.user.id;
    const chatId = parseInt(req.params.chatId);
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId é obrigatório' });
    }

    await chatService.blockParticipant(chatId, currentUserId, targetUserId);
    
    res.no_content();
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Chat"] 
  #swagger.description = 'Desbloqueia usuário no chat'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['chatId'] = {
    in: 'path',
    description: 'ID do chat',
    required: true,
    type: 'integer',
    example: 123
  }
  #swagger.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            targetUserId: {
              type: 'integer',
              description: 'ID do usuário a ser desbloqueado',
              example: 789
            }
          },
          required: ['targetUserId']
        }
      }
    }
  }
  #swagger.responses[204] = { description: 'Usuário desbloqueado com sucesso' }
  #swagger.responses[400] = { description: 'Dados inválidos ou usuário não é participante' }
  #swagger.responses[401] = { description: 'Token de autenticação inválido' }
  #swagger.responses[404] = { description: 'Chat não encontrado' }
  */
  try {
    const currentUserId = req.user.id;
    const chatId = parseInt(req.params.chatId);
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId é obrigatório' });
    }

    await chatService.unblockParticipant(chatId, currentUserId, targetUserId);
    
    res.no_content();
  } catch (error) {
    next(error);
  }
}; 