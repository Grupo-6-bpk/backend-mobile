/**
 * Use case for getting user's chat groups
 */
export default class GetUserGroupsUseCase {
  /**
   * Constructor
   * @param {Object} chatGroupRepository - Repository to interact with chat group data
   * @param {Object} groupMemberRepository - Repository to interact with group member data
   * @param {Object} messageRepository - Repository to interact with message data
   */
  constructor(chatGroupRepository, groupMemberRepository, messageRepository) {
    this.chatGroupRepository = chatGroupRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.messageRepository = messageRepository;
  }

  /**
   * Execute the use case
   * @param {number} userId - ID of the user
   * @param {number} page - Page number for pagination
   * @param {number} limit - Groups per page
   * @returns {Promise<Object>} - A promise that resolves to user's groups
   * @throws {Error} - If validation fails
   */
  async execute(userId, page = 1, limit = 20) {
    // Validações básicas
    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    try {
      // Buscar grupos do usuário
      const result = await this.chatGroupRepository.findByUserId(userId, page, limit);

      // Para cada grupo, buscar informações adicionais
      const groupsWithInfo = await Promise.all(
        result.groups.map(async (group) => {
          // Buscar informações de membership do usuário
          const membership = await this.groupMemberRepository.findByUserAndGroup(userId, group.id);
          
          // Contar mensagens não lidas
          const unreadCount = membership.lastSeenAt 
            ? await this.messageRepository.countUnreadMessages(userId, group.id, membership.lastSeenAt)
            : 0;

          // Buscar última mensagem do grupo
          const lastMessageResult = await this.messageRepository.findByGroupId(group.id, 1, 1);
          const lastMessage = lastMessageResult.messages[0] || null;

          // Contar membros do grupo
          const memberCount = await this.groupMemberRepository.countByGroupId(group.id);

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            type: group.type,
            imageUrl: group.imageUrl,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            isActive: group.isActive,
            
            // Informações de membership
            memberRole: membership?.role || 'member',
            joinedAt: membership?.joinedAt,
            lastSeenAt: membership?.lastSeenAt,
            notifications: membership?.notifications !== false,
            
            // Estatísticas
            memberCount,
            unreadCount,
            
            // Última mensagem
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessage.isDeleted ? '[Mensagem deletada]' : lastMessage.content,
              type: lastMessage.type,
              senderId: lastMessage.senderId,
              senderName: lastMessage.sender ? `${lastMessage.sender.name} ${lastMessage.sender.last_name}` : 'Usuário',
              createdAt: lastMessage.createdAt,
              isDeleted: lastMessage.isDeleted
            } : null,
            
            // Permissões
            permissions: {
              canSendMessages: membership?.isActive === true,
              canManageMembers: ['admin', 'moderator'].includes(membership?.role),
              canEditGroup: membership?.role === 'admin',
              canDeleteGroup: membership?.role === 'admin' && group.createdById === userId
            }
          };
        })
      );

      // Ordenar grupos por última atividade (última mensagem ou data de criação)
      groupsWithInfo.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.createdAt;
        const bTime = b.lastMessage?.createdAt || b.createdAt;
        return new Date(bTime) - new Date(aTime);
      });

      return {
        groups: groupsWithInfo,
        pagination: {
          currentPage: page,
          totalPages: result.totalPages,
          totalGroups: result.totalGroups || 0,
          hasNext: page < result.totalPages,
          hasPrevious: page > 1
        },
        summary: {
          totalGroups: groupsWithInfo.length,
          totalUnreadMessages: groupsWithInfo.reduce((sum, group) => sum + group.unreadCount, 0),
          activeGroups: groupsWithInfo.filter(group => group.isActive).length,
          directChats: groupsWithInfo.filter(group => group.type === 'direct').length,
          groups: groupsWithInfo.filter(group => group.type === 'group').length
        }
      };

    } catch (error) {
      console.error('Erro ao buscar grupos do usuário:', error);
      throw new Error('Falha ao buscar grupos do usuário');
    }
  }
} 