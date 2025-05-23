/**
 * Use case for getting group messages
 */
export default class GetGroupMessagesUseCase {
  /**
   * Constructor
   * @param {Object} messageRepository - Repository to interact with message data
   * @param {Object} groupMemberRepository - Repository to interact with group member data
   * @param {Object} chatGroupRepository - Repository to interact with chat group data
   */
  constructor(messageRepository, groupMemberRepository, chatGroupRepository) {
    this.messageRepository = messageRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.chatGroupRepository = chatGroupRepository;
  }

  /**
   * Execute the use case
   * @param {number} groupId - ID of the group
   * @param {number} userId - ID of the requesting user
   * @param {number} page - Page number for pagination
   * @param {number} limit - Messages per page
   * @returns {Promise<Object>} - A promise that resolves to messages and pagination info
   * @throws {Error} - If validation fails
   */
  async execute(groupId, userId, page = 1, limit = 50) {
    // Validações básicas
    if (!groupId) {
      throw new Error('ID do grupo é obrigatório');
    }

    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    // Verificar se o grupo existe
    const group = await this.chatGroupRepository.findById(groupId);
    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    // Verificar se o usuário é membro do grupo
    const membership = await this.groupMemberRepository.findByUserAndGroup(userId, groupId);
    if (!membership || !membership.isActive) {
      throw new Error('Usuário não é membro deste grupo');
    }

    try {
      // Buscar mensagens do grupo
      const result = await this.messageRepository.findByGroupId(groupId, page, limit);

      // Atualizar último acesso do usuário
      await this.groupMemberRepository.updateLastSeen(userId, groupId);

      return {
        messages: result.messages.map(message => ({
          ...message,
          canEdit: message.senderId === userId && message.type === 'text' && !message.isDeleted,
          canDelete: message.senderId === userId || membership.role === 'admin' || membership.role === 'moderator'
        })),
        pagination: {
          currentPage: page,
          totalPages: result.totalPages,
          totalMessages: result.totalMessages || 0,
          hasNext: page < result.totalPages,
          hasPrevious: page > 1
        },
        groupInfo: {
          id: group.id,
          name: group.name,
          type: group.type,
          memberRole: membership.role,
          canManageMembers: membership.role === 'admin' || membership.role === 'moderator',
          canEditGroup: membership.role === 'admin'
        }
      };

    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw new Error('Falha ao buscar mensagens do grupo');
    }
  }
} 