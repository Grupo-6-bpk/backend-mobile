export class ChatMessage {
  constructor({ id, content, sentAt, senderId, chatId, sender }) {
    this.id = id;
    this.content = content;
    this.sentAt = sentAt || new Date();
    this.senderId = senderId;
    this.chatId = chatId;
    this.sender = sender;
  }

  static create(content, senderId, chatId) {
    if (!content || content.trim().length === 0) {
      throw new Error('Conteúdo da mensagem é obrigatório');
    }

    if (content.length > 1000) {
      throw new Error('Mensagem não pode ter mais de 1000 caracteres');
    }

    return new ChatMessage({
      content: content.trim(),
      senderId,
      chatId
    });
  }

  toJSON() {
    return {
      messageId: this.id,
      senderId: this.senderId,
      senderName: this.sender?.name,
      senderAvatar: this.sender?.avatarUrl,
      content: this.content,
      sentAt: this.sentAt,
      chatId: this.chatId
    };
  }
} 