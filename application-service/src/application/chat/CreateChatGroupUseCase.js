/**
 * Use case for creating chat groups and direct chats
 */
export default class CreateChatGroupUseCase {
  /**
   * Constructor
   * @param {Object} chatGroupRepository - Repository to interact with chat group data
   * @param {Object} groupMemberRepository - Repository to interact with group member data
   * @param {Object} userRepository - Repository to interact with user data
   */
  constructor(chatGroupRepository, groupMemberRepository, userRepository) {
    this.chatGroupRepository = chatGroupRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {Object} groupData - The group data
   * @param {Array<number>} memberIds - Array of user IDs to add as members
   * @return {Promise<Object>} - A promise that resolves to the created group
   * @throws {Error} - If validation fails or group could not be created
   */
  async execute(groupData, memberIds = []) {
    try {
      // Validações básicas
      if (groupData.type === 'group' && (!groupData.name || groupData.name.trim().length < 2)) {
        throw new Error('Nome é obrigatório para grupos e deve ter pelo menos 2 caracteres');
      }

      if (groupData.type === 'direct' && memberIds.length !== 1) {
        throw new Error('Chat direto deve ter exatamente 1 outro membro');
      }

      if (groupData.type === 'group' && memberIds.length > 99) {
        throw new Error('Máximo 99 membros por grupo');
      }

      // Verificar se o criador existe
      const creator = await this.userRepository.findById(groupData.createdById);
      if (!creator) {
        throw new Error('Usuário criador não encontrado');
      }

      // Para chat direto, verificar se já existe um chat entre os usuários
      if (groupData.type === 'direct') {
        const otherUserId = memberIds[0];
        const existingDirectChat = await this.chatGroupRepository.findDirectChat(
          groupData.createdById, 
          otherUserId
        );
        
        if (existingDirectChat) {
          return existingDirectChat; // Retornar chat direto existente
        }

        // Verificar se o outro usuário existe
        const otherUser = await this.userRepository.findById(otherUserId);
        if (!otherUser) {
          throw new Error('Usuário destinatário não encontrado');
        }

        // Para chat direto, definir nome baseado nos usuários
        groupData.name = `${creator.name} & ${otherUser.name}`;
      }

      // Verificar se todos os membros existem
      if (memberIds.length > 0) {
        const members = await this.userRepository.findByIds(memberIds);
        if (members.length !== memberIds.length) {
          throw new Error('Um ou mais usuários não foram encontrados');
        }
      }

      // Criar o grupo
      const createdGroup = await this.chatGroupRepository.create({
        name: groupData.name,
        description: groupData.description,
        type: groupData.type || 'group',
        imageUrl: groupData.imageUrl,
        createdById: groupData.createdById,
        maxMembers: groupData.maxMembers || (groupData.type === 'direct' ? 2 : 100)
      });

      // Adicionar o criador como admin
      await this.groupMemberRepository.create({
        userId: groupData.createdById,
        groupId: createdGroup.id,
        role: 'admin',
        addedById: groupData.createdById
      });

      // Adicionar outros membros
      if (memberIds.length > 0) {
        const memberPromises = memberIds.map(userId =>
          this.groupMemberRepository.create({
            userId: userId,
            groupId: createdGroup.id,
            role: 'member',
            addedById: groupData.createdById
          })
        );

        await Promise.all(memberPromises);
      }

      // Buscar grupo completo com informações dos membros
      const completeGroup = await this.chatGroupRepository.findById(createdGroup.id);
      const members = await this.groupMemberRepository.findByGroupId(createdGroup.id, true);

      return {
        ...completeGroup,
        members: members,
        memberCount: members.length,
        isCreator: true,
        userRole: 'admin'
      };

    } catch (error) {
      console.error('Error creating chat group:', error);
      throw error;
    }
  }

  /**
   * Add members to existing group
   * @param {number} groupId - Group ID
   * @param {number} requesterId - ID of user making the request
   * @param {Array<number>} memberIds - Array of user IDs to add
   * @returns {Promise<Array>} - Array of added members
   */
  async addMembers(groupId, requesterId, memberIds) {
    try {
      // Verificar se o grupo existe
      const group = await this.chatGroupRepository.findById(groupId);
      if (!group) {
        throw new Error('Grupo não encontrado');
      }

      // Verificar se o solicitante tem permissão (admin ou moderator)
      const requesterMembership = await this.groupMemberRepository.findByUserAndGroup(requesterId, groupId);
      if (!requesterMembership || !['admin', 'moderator'].includes(requesterMembership.role)) {
        throw new Error('Sem permissão para adicionar membros');
      }

      // Verificar se todos os usuários existem
      const users = await this.userRepository.findByIds(memberIds);
      if (users.length !== memberIds.length) {
        throw new Error('Um ou mais usuários não foram encontrados');
      }

      // Verificar se algum usuário já é membro
      const existingMemberships = await Promise.all(
        memberIds.map(userId => this.groupMemberRepository.isMember(userId, groupId))
      );

      const newMemberIds = memberIds.filter((userId, index) => !existingMemberships[index]);

      if (newMemberIds.length === 0) {
        throw new Error('Todos os usuários já são membros do grupo');
      }

      // Verificar limite de membros
      const currentMemberCount = await this.groupMemberRepository.countByGroupId(groupId, true);
      if (currentMemberCount + newMemberIds.length > group.maxMembers) {
        throw new Error(`Limite de membros excedido. Máximo: ${group.maxMembers}`);
      }

      // Adicionar novos membros
      const addedMembers = await this.groupMemberRepository.createMultiple(
        newMemberIds.map(userId => ({
          userId: userId,
          groupId: groupId,
          role: 'member',
          addedById: requesterId
        }))
      );

      return addedMembers;

    } catch (error) {
      console.error('Error adding members to group:', error);
      throw error;
    }
  }

  /**
   * Remove member from group
   * @param {number} groupId - Group ID
   * @param {number} requesterId - ID of user making the request
   * @param {number} memberToRemoveId - ID of member to remove
   * @returns {Promise<boolean>} - Success status
   */
  async removeMember(groupId, requesterId, memberToRemoveId) {
    try {
      // Verificar se o grupo existe
      const group = await this.chatGroupRepository.findById(groupId);
      if (!group) {
        throw new Error('Grupo não encontrado');
      }

      // Não permitir remoção em chats diretos
      if (group.type === 'direct') {
        throw new Error('Não é possível remover membros de chats diretos');
      }

      // Verificar permissões
      const requesterMembership = await this.groupMemberRepository.findByUserAndGroup(requesterId, groupId);
      const memberToRemove = await this.groupMemberRepository.findByUserAndGroup(memberToRemoveId, groupId);

      if (!requesterMembership || !memberToRemove) {
        throw new Error('Membro não encontrado no grupo');
      }

      // Verificar se pode remover (admin pode remover qualquer um, moderator pode remover members, member pode sair)
      const canRemove = 
        requesterId === memberToRemoveId || // Usuário saindo voluntariamente
        requesterMembership.role === 'admin' || // Admin pode remover qualquer um
        (requesterMembership.role === 'moderator' && memberToRemove.role === 'member'); // Moderator pode remover members

      if (!canRemove) {
        throw new Error('Sem permissão para remover este membro');
      }

      // Não permitir remoção do último admin
      if (memberToRemove.role === 'admin') {
        const adminCount = (await this.groupMemberRepository.findAdminsByGroupId(groupId)).length;
        if (adminCount <= 1) {
          throw new Error('Não é possível remover o último administrador do grupo');
        }
      }

      // Remover membro
      const success = await this.groupMemberRepository.deleteByUserAndGroup(memberToRemoveId, groupId);
      
      return success;

    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  }
} 