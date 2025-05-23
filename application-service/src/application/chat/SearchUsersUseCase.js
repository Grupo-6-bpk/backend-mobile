/**
 * Use case for searching users for chat
 */
export default class SearchUsersUseCase {
  /**
   * Constructor
   * @param {Object} userRepository - Repository to interact with user data
   * @param {Object} groupMemberRepository - Repository to interact with group member data
   */
  constructor(userRepository, groupMemberRepository) {
    this.userRepository = userRepository;
    this.groupMemberRepository = groupMemberRepository;
  }

  /**
   * Execute the use case - search users for chat
   * @param {string} searchTerm - Term to search (name, last_name, email)
   * @param {number} currentUserId - ID of the current user (to exclude from results)
   * @param {number} groupId - Optional: group ID to show membership status
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} - A promise that resolves to an array of users
   * @throws {Error} - If validation fails
   */
  async execute(searchTerm, currentUserId, groupId = null, limit = 10) {
    // Validações básicas
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
    }

    if (!currentUserId) {
      throw new Error('ID do usuário atual é obrigatório');
    }

    try {
      // Buscar usuários pelo termo
      const users = await this.userRepository.searchByName(searchTerm.trim(), limit + 1); // +1 para excluir usuário atual

      // Filtrar usuário atual dos resultados
      const filteredUsers = users.filter(user => user.id !== currentUserId);

      // Limitar resultados
      const limitedUsers = filteredUsers.slice(0, limit);

      // Se um grupo foi especificado, verificar status de membership
      let usersWithMembershipStatus = limitedUsers;
      
      if (groupId) {
        usersWithMembershipStatus = await Promise.all(
          limitedUsers.map(async (user) => {
            const isMember = await this.groupMemberRepository.isMember(user.id, groupId);
            const isAdmin = isMember ? await this.groupMemberRepository.isAdmin(user.id, groupId) : false;
            
            return {
              ...user,
              membership: {
                isMember,
                isAdmin,
                canBeAdded: !isMember
              }
            };
          })
        );
      }

      // Formatar resposta
      return usersWithMembershipStatus.map(user => ({
        id: user.id,
        name: user.name,
        lastName: user.last_name,
        email: user.email,
        verified: user.verified,
        fullName: `${user.name} ${user.last_name}`,
        membership: user.membership || null,
        canStartDirectChat: true // Sempre pode iniciar chat direto
      }));

    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw new Error('Falha ao buscar usuários');
    }
  }

  /**
   * Get recent contacts for user (users with existing direct chats)
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} - A promise that resolves to recent contacts
   */
  async getRecentContacts(userId, limit = 10) {
    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    try {
      // Buscar memberships do usuário em chats diretos
      const memberships = await this.groupMemberRepository.findByUserId(userId, true);
      
      // Filtrar apenas chats diretos
      const directChats = memberships.filter(membership => 
        membership.group.type === 'direct'
      );

      // Buscar outros usuários desses chats diretos
      const contactPromises = directChats.map(async (membership) => {
        const groupMembers = await this.groupMemberRepository.findByGroupId(membership.groupId, true);
        
        // Encontrar o outro usuário (não é o usuário atual)
        const otherMember = groupMembers.find(member => member.userId !== userId);
        
        if (otherMember) {
          return {
            id: otherMember.user.id,
            name: otherMember.user.name,
            lastName: otherMember.user.last_name,
            email: otherMember.user.email,
            verified: otherMember.user.verified,
            fullName: `${otherMember.user.name} ${otherMember.user.last_name}`,
            chatGroupId: membership.groupId,
            lastSeenAt: membership.lastSeenAt,
            canStartDirectChat: true
          };
        }
        return null;
      });

      const contacts = await Promise.all(contactPromises);
      
      // Filtrar nulls e limitar resultados
      const validContacts = contacts
        .filter(contact => contact !== null)
        .slice(0, limit);

      // Ordenar por último acesso
      validContacts.sort((a, b) => {
        const aTime = a.lastSeenAt || new Date(0);
        const bTime = b.lastSeenAt || new Date(0);
        return new Date(bTime) - new Date(aTime);
      });

      return validContacts;

    } catch (error) {
      console.error('Erro ao buscar contatos recentes:', error);
      throw new Error('Falha ao buscar contatos recentes');
    }
  }
} 