/**
 * Message Domain Entity
 * Representa uma mensagem no domínio
 */
export default class Message {
  constructor({
    id,
    content,
    type = 'text', // 'text', 'image', 'file', 'audio', 'video'
    senderId,
    groupId,
    replyToId,
    status = 'sent', // 'sent', 'delivered', 'read'
    fileUrl,
    fileName,
    fileSize,
    createdAt,
    updatedAt,
    editedAt,
    deletedAt,
    isDeleted = false
  }) {
    this.id = id;
    this.content = content;
    this.type = type;
    this.senderId = senderId;
    this.groupId = groupId;
    this.replyToId = replyToId;
    this.status = status;
    this.fileUrl = fileUrl;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;
    this.editedAt = editedAt;
    this.deletedAt = deletedAt;
    this.isDeleted = isDeleted;
  }

  /**
   * Valida se a mensagem é válida
   */
  isValid() {
    if (!this.senderId) {
      throw new Error('Mensagem deve ter um remetente');
    }
    
    if (!this.groupId) {
      throw new Error('Mensagem deve pertencer a um grupo');
    }
    
    if (this.type === 'text' && (!this.content || this.content.trim().length === 0)) {
      throw new Error('Mensagem de texto não pode estar vazia');
    }
    
    if (['image', 'file', 'audio', 'video'].includes(this.type) && !this.fileUrl) {
      throw new Error('Mensagem de mídia deve ter um arquivo');
    }
    
    if (this.content && this.content.length > 4000) {
      throw new Error('Mensagem não pode ter mais de 4000 caracteres');
    }
    
    return true;
  }

  /**
   * Verifica se é uma mensagem de mídia
   */
  isMediaMessage() {
    return ['image', 'file', 'audio', 'video'].includes(this.type);
  }

  /**
   * Verifica se é uma resposta a outra mensagem
   */
  isReply() {
    return !!this.replyToId;
  }

  /**
   * Marca a mensagem como entregue
   */
  markAsDelivered() {
    if (this.status === 'sent') {
      this.status = 'delivered';
      this.updatedAt = new Date();
    }
    return this;
  }

  /**
   * Marca a mensagem como lida
   */
  markAsRead() {
    this.status = 'read';
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Edita o conteúdo da mensagem
   */
  edit(newContent) {
    if (this.isDeleted) {
      throw new Error('Não é possível editar uma mensagem deletada');
    }
    
    if (this.type !== 'text') {
      throw new Error('Apenas mensagens de texto podem ser editadas');
    }
    
    if (!newContent || newContent.trim().length === 0) {
      throw new Error('Conteúdo da mensagem não pode estar vazio');
    }
    
    this.content = newContent.trim();
    this.editedAt = new Date();
    this.updatedAt = new Date();
    
    return this;
  }

  /**
   * Marca a mensagem como deletada (soft delete)
   */
  delete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
    this.content = null; // Remove o conteúdo
    return this;
  }

  /**
   * Verifica se a mensagem foi editada
   */
  isEdited() {
    return !!this.editedAt;
  }

  /**
   * Retorna representação JSON limpa
   */
  toJSON() {
    return {
      id: this.id,
      content: this.isDeleted ? '[Mensagem deletada]' : this.content,
      type: this.type,
      senderId: this.senderId,
      groupId: this.groupId,
      replyToId: this.replyToId,
      status: this.status,
      fileUrl: this.isDeleted ? null : this.fileUrl,
      fileName: this.isDeleted ? null : this.fileName,
      fileSize: this.isDeleted ? null : this.fileSize,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      editedAt: this.editedAt,
      isDeleted: this.isDeleted,
      isEdited: this.isEdited()
    };
  }
} 