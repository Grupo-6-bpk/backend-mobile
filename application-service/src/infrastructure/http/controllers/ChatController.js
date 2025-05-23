import HTTP_STATUS from 'http-status';
import * as yup from 'yup';

// Import dos repositórios
import PrismaUserRepository from '../../db/PrismaUserRepository.js';
import PrismaChatGroupRepository from '../../db/PrismaChatGroupRepository.js';
import PrismaMessageRepository from '../../db/PrismaMessageRepository.js';
import PrismaGroupMemberRepository from '../../db/PrismaGroupMemberRepository.js';

// Import dos casos de uso
import CreateChatGroupUseCase from '../../../application/chat/CreateChatGroupUseCase.js';
import SendMessageUseCase from '../../../application/chat/SendMessageUseCase.js';
import GetGroupMessagesUseCase from '../../../application/chat/GetGroupMessagesUseCase.js';
import GetUserGroupsUseCase from '../../../application/chat/GetUserGroupsUseCase.js';
import SearchUsersUseCase from '../../../application/chat/SearchUsersUseCase.js';

/**
 * Chat Controller
 * Handles chat-related HTTP requests
 */
export default class ChatController {
  constructor() {
    // Initialize repositories
    this.userRepository = new PrismaUserRepository();
    this.chatGroupRepository = new PrismaChatGroupRepository();
    this.messageRepository = new PrismaMessageRepository();
    this.groupMemberRepository = new PrismaGroupMemberRepository();

    // Initialize use cases
    this.createChatGroupUseCase = new CreateChatGroupUseCase(
      this.chatGroupRepository,
      this.groupMemberRepository,
      this.userRepository
    );
    
    this.sendMessageUseCase = new SendMessageUseCase(
      this.messageRepository,
      this.groupMemberRepository,
      this.chatGroupRepository
    );
    
    this.getGroupMessagesUseCase = new GetGroupMessagesUseCase(
      this.messageRepository,
      this.groupMemberRepository,
      this.chatGroupRepository
    );
    
    this.getUserGroupsUseCase = new GetUserGroupsUseCase(
      this.chatGroupRepository,
      this.groupMemberRepository,
      this.messageRepository
    );
    
    this.searchUsersUseCase = new SearchUsersUseCase(
      this.userRepository,
      this.groupMemberRepository
    );
  }

  /**
   * Create a new chat group or direct chat
   * POST /api/chat/groups
   */
  async createGroup(req, res) {
    try {
      // Validation schema
      const schema = yup.object().shape({
        name: yup.string().when('type', {
          is: 'group',
          then: (schema) => schema.required('Nome é obrigatório para grupos').min(2, 'Nome deve ter pelo menos 2 caracteres'),
          otherwise: (schema) => schema.notRequired()
        }),
        description: yup.string().max(500, 'Descrição não pode ter mais de 500 caracteres'),
        type: yup.string().oneOf(['group', 'direct'], 'Tipo deve ser group ou direct').default('group'),
        imageUrl: yup.string().url('URL da imagem inválida'),
        memberIds: yup.array().of(yup.number().positive('ID do membro deve ser positivo'))
          .when('type', {
            is: 'direct',
            then: (schema) => schema.length(1, 'Chat direto deve ter exatamente 1 outro membro'),
            otherwise: (schema) => schema.max(99, 'Máximo 99 membros por grupo')
          })
      });

      const validatedData = await schema.validate(req.body);
      const createdById = req.user.id; // Vem do middleware de autenticação

      // Execute use case
      const group = await this.createChatGroupUseCase.execute(
        {
          ...validatedData,
          createdById
        },
        validatedData.memberIds || []
      );

      // HATEOAS links
      const links = [
        { rel: 'self', href: `/api/chat/groups/${group.id}`, method: 'GET' },
        { rel: 'messages', href: `/api/chat/groups/${group.id}/messages`, method: 'GET' },
        { rel: 'send-message', href: `/api/chat/groups/${group.id}/messages`, method: 'POST' },
        { rel: 'members', href: `/api/chat/groups/${group.id}/members`, method: 'GET' }
      ];

      if (group.type === 'group') {
        links.push(
          { rel: 'update', href: `/api/chat/groups/${group.id}`, method: 'PUT' },
          { rel: 'add-member', href: `/api/chat/groups/${group.id}/members`, method: 'POST' }
        );
      }

      res.status(HTTP_STATUS.CREATED).json({
        message: group.type === 'direct' ? 'Chat direto criado com sucesso' : 'Grupo criado com sucesso',
        data: group,
        links
      });

    } catch (error) {
      console.error('Error creating chat group:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Dados inválidos',
          error: error.message,
          details: error.errors
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Get user's chat groups
   * GET /api/chat/groups
   */
  async getUserGroups(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const userId = req.user.id;

      const result = await this.getUserGroupsUseCase.execute(userId, page, limit);

      // Add HATEOAS links to each group
      result.groups = result.groups.map(group => ({
        ...group,
        links: [
          { rel: 'self', href: `/api/chat/groups/${group.id}`, method: 'GET' },
          { rel: 'messages', href: `/api/chat/groups/${group.id}/messages`, method: 'GET' },
          { rel: 'send-message', href: `/api/chat/groups/${group.id}/messages`, method: 'POST' }
        ]
      }));

      // Pagination links
      const paginationLinks = [];
      if (result.pagination.hasPrevious) {
        paginationLinks.push({
          rel: 'prev',
          href: `/api/chat/groups?page=${page - 1}&limit=${limit}`,
          method: 'GET'
        });
      }
      if (result.pagination.hasNext) {
        paginationLinks.push({
          rel: 'next',
          href: `/api/chat/groups?page=${page + 1}&limit=${limit}`,
          method: 'GET'
        });
      }

      res.status(HTTP_STATUS.OK).json({
        message: 'Grupos recuperados com sucesso',
        data: result,
        links: [
          { rel: 'self', href: `/api/chat/groups?page=${page}&limit=${limit}`, method: 'GET' },
          { rel: 'create', href: '/api/chat/groups', method: 'POST' },
          { rel: 'search-users', href: '/api/chat/users/search', method: 'GET' },
          ...paginationLinks
        ]
      });

    } catch (error) {
      console.error('Error getting user groups:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Send a message to a group
   * POST /api/chat/groups/:groupId/messages
   */
  async sendMessage(req, res) {
    try {
      // Validation schema
      const schema = yup.object().shape({
        content: yup.string().when('type', {
          is: 'text',
          then: (schema) => schema.required('Conteúdo é obrigatório para mensagens de texto').max(4000, 'Mensagem muito longa'),
          otherwise: (schema) => schema.notRequired()
        }),
        type: yup.string().oneOf(['text', 'image', 'file', 'audio', 'video'], 'Tipo de mensagem inválido').default('text'),
        replyToId: yup.number().positive('ID da mensagem de resposta deve ser positivo'),
        fileUrl: yup.string().url('URL do arquivo inválida'),
        fileName: yup.string().max(255, 'Nome do arquivo muito longo'),
        fileSize: yup.number().positive('Tamanho do arquivo deve ser positivo')
      });

      const validatedData = await schema.validate(req.body);
      const groupId = parseInt(req.params.groupId);
      const senderId = req.user.id;

      if (!groupId || isNaN(groupId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'ID do grupo inválido'
        });
      }

      // Execute use case
      const message = await this.sendMessageUseCase.execute({
        ...validatedData,
        groupId,
        senderId
      });

      // HATEOAS links
      const links = [
        { rel: 'self', href: `/api/chat/messages/${message.id}`, method: 'GET' },
        { rel: 'group', href: `/api/chat/groups/${groupId}`, method: 'GET' },
        { rel: 'group-messages', href: `/api/chat/groups/${groupId}/messages`, method: 'GET' }
      ];

      if (message.senderId === senderId && message.type === 'text') {
        links.push({ rel: 'edit', href: `/api/chat/messages/${message.id}`, method: 'PUT' });
      }

      res.status(HTTP_STATUS.CREATED).json({
        message: 'Mensagem enviada com sucesso',
        data: message,
        links
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Dados inválidos',
          error: error.message,
          details: error.errors
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Get messages from a group
   * GET /api/chat/groups/:groupId/messages
   */
  async getGroupMessages(req, res) {
    try {
      const groupId = parseInt(req.params.groupId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const userId = req.user.id;

      if (!groupId || isNaN(groupId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'ID do grupo inválido'
        });
      }

      const result = await this.getGroupMessagesUseCase.execute(groupId, userId, page, limit);

      // Add HATEOAS links to each message
      result.messages = result.messages.map(message => ({
        ...message,
        links: [
          { rel: 'self', href: `/api/chat/messages/${message.id}`, method: 'GET' },
          ...(message.canEdit ? [{ rel: 'edit', href: `/api/chat/messages/${message.id}`, method: 'PUT' }] : []),
          ...(message.canDelete ? [{ rel: 'delete', href: `/api/chat/messages/${message.id}`, method: 'DELETE' }] : [])
        ]
      }));

      // Pagination links
      const paginationLinks = [];
      if (result.pagination.hasPrevious) {
        paginationLinks.push({
          rel: 'prev',
          href: `/api/chat/groups/${groupId}/messages?page=${page - 1}&limit=${limit}`,
          method: 'GET'
        });
      }
      if (result.pagination.hasNext) {
        paginationLinks.push({
          rel: 'next',
          href: `/api/chat/groups/${groupId}/messages?page=${page + 1}&limit=${limit}`,
          method: 'GET'
        });
      }

      res.status(HTTP_STATUS.OK).json({
        message: 'Mensagens recuperadas com sucesso',
        data: result,
        links: [
          { rel: 'self', href: `/api/chat/groups/${groupId}/messages?page=${page}&limit=${limit}`, method: 'GET' },
          { rel: 'group', href: `/api/chat/groups/${groupId}`, method: 'GET' },
          { rel: 'send-message', href: `/api/chat/groups/${groupId}/messages`, method: 'POST' },
          ...paginationLinks
        ]
      });

    } catch (error) {
      console.error('Error getting group messages:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Search users for chat
   * GET /api/chat/users/search
   */
  async searchUsers(req, res) {
    try {
      const searchTerm = req.query.q;
      const groupId = req.query.groupId ? parseInt(req.query.groupId) : null;
      const limit = parseInt(req.query.limit) || 10;
      const currentUserId = req.user.id;

      if (!searchTerm) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Parâmetro de busca "q" é obrigatório'
        });
      }

      const users = await this.searchUsersUseCase.execute(searchTerm, currentUserId, groupId, limit);

      // Add HATEOAS links to each user
      const usersWithLinks = users.map(user => ({
        ...user,
        links: [
          { rel: 'profile', href: `/api/users/${user.id}`, method: 'GET' },
          { rel: 'start-direct-chat', href: '/api/chat/groups', method: 'POST', body: { type: 'direct', memberIds: [user.id] } }
        ]
      }));

      res.status(HTTP_STATUS.OK).json({
        message: 'Usuários encontrados com sucesso',
        data: usersWithLinks,
        links: [
          { rel: 'self', href: `/api/chat/users/search?q=${encodeURIComponent(searchTerm)}${groupId ? `&groupId=${groupId}` : ''}&limit=${limit}`, method: 'GET' },
          { rel: 'recent-contacts', href: '/api/chat/users/contacts', method: 'GET' }
        ]
      });

    } catch (error) {
      console.error('Error searching users:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Get recent contacts
   * GET /api/chat/users/contacts
   */
  async getRecentContacts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const userId = req.user.id;

      const contacts = await this.searchUsersUseCase.getRecentContacts(userId, limit);

      // Add HATEOAS links to each contact
      const contactsWithLinks = contacts.map(contact => ({
        ...contact,
        links: [
          { rel: 'profile', href: `/api/users/${contact.id}`, method: 'GET' },
          { rel: 'chat', href: `/api/chat/groups/${contact.chatGroupId}`, method: 'GET' },
          { rel: 'messages', href: `/api/chat/groups/${contact.chatGroupId}/messages`, method: 'GET' }
        ]
      }));

      res.status(HTTP_STATUS.OK).json({
        message: 'Contatos recentes recuperados com sucesso',
        data: contactsWithLinks,
        links: [
          { rel: 'self', href: `/api/chat/users/contacts?limit=${limit}`, method: 'GET' },
          { rel: 'search-users', href: '/api/chat/users/search', method: 'GET' },
          { rel: 'my-groups', href: '/api/chat/groups', method: 'GET' }
        ]
      });

    } catch (error) {
      console.error('Error getting recent contacts:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
} 