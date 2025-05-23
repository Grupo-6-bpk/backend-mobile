/**
 * Use case for sending a message
 */
export default class SendMessageUseCase {
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
   * @param {Object} messageData - The message data to create
   * @returns {Promise<Object>} - A promise that resolves to the created message
   * @throws {Error} - If validation fails
   */
  async execute(messageData) {
    // Validações básicas
    if (!messageData.senderId) {
      throw new Error('Remetente da mensagem é obrigatório');
    }

    if (!messageData.groupId) {
      throw new Error('Grupo de destino é obrigatório');
    }

    // Verificar se o grupo existe e está ativo
    const group = await this.chatGroupRepository.findById(messageData.groupId);
    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    if (!group.isActive) {
      throw new Error('Não é possível enviar mensagem para grupo inativo');
    }

    // Verificar se o usuário é membro do grupo
    const membership = await this.groupMemberRepository.findByUserAndGroup(
      messageData.senderId, 
      messageData.groupId
    );
    
    if (!membership || !membership.isActive) {
      throw new Error('Usuário não é membro deste grupo');
    }

    // Validar conteúdo da mensagem
    const type = messageData.type || 'text';
    
    if (type === 'text') {
      if (!messageData.content || messageData.content.trim().length === 0) {
        throw new Error('Mensagem de texto não pode estar vazia');
      }
      
      if (messageData.content.length > 4000) {
        throw new Error('Mensagem não pode ter mais de 4000 caracteres');
      }
    } else if (['image', 'file', 'audio', 'video'].includes(type)) {
      if (!messageData.fileUrl) {
        throw new Error('Mensagem de mídia deve ter um arquivo');
      }
    } else {
      throw new Error('Tipo de mensagem inválido');
    }

    // Verificar se é resposta a uma mensagem existente
    if (messageData.replyToId) {
      const replyToMessage = await this.messageRepository.findById(messageData.replyToId);
      if (!replyToMessage) {
        throw new Error('Mensagem de resposta não encontrada');
      }
      
      if (replyToMessage.groupId !== messageData.groupId) {
        throw new Error('Não é possível responder mensagem de outro grupo');
      }
      
      if (replyToMessage.isDeleted) {
        throw new Error('Não é possível responder mensagem deletada');
      }
    }

    try {
      // Preparar dados da mensagem
      const messageToCreate = {
        content: messageData.content?.trim(),
        type: type,
        senderId: messageData.senderId,
        groupId: messageData.groupId,
        replyToId: messageData.replyToId || null,
        fileUrl: messageData.fileUrl,
        fileName: messageData.fileName,
        fileSize: messageData.fileSize,
        status: 'sent'
      };

      // Criar a mensagem
      const message = await this.messageRepository.create(messageToCreate);

      // Atualizar último acesso do remetente
      await this.groupMemberRepository.updateLastSeen(
        messageData.senderId, 
        messageData.groupId
      );

      return {
        ...message,
        sender: {
          id: membership.user?.id,
          name: membership.user?.name,
          last_name: membership.user?.last_name
        }
      };

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw new Error('Falha ao enviar mensagem');
    }
  }
} 