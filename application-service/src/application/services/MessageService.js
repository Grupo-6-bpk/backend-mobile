import { ChatMessage } from '../../domain/chat/entities/ChatMessage.js';
import { ChatMessageRepository } from '../../infrastructure/database/repositories/ChatMessageRepository.js';
import { ChatRepository } from '../../infrastructure/database/repositories/ChatRepository.js';
import { RabbitMQService } from '../../infrastructure/messaging/RabbitMQService.js';

export class MessageService {
  constructor() {
    this.messageRepository = new ChatMessageRepository();
    this.chatRepository = new ChatRepository();
    this.rabbitMQService = new RabbitMQService();
  }

  async sendMessage(content, senderId, chatId) {
    const participant = await this.chatRepository.findParticipant(chatId, senderId);
    if (!participant) {
      throw new Error('Usuário não é participante deste chat');
    }

    if (participant.blocked) {
      throw new Error('Usuário está bloqueado neste chat');
    }

    const message = ChatMessage.create(content, senderId, chatId);
    
    const savedMessage = await this.messageRepository.create({
      content: message.content,
      senderId: message.senderId,
      chatId: message.chatId
    });

    await this.rabbitMQService.publishMessage({
      messageId: savedMessage.id,
      chatId: savedMessage.chatId,
      senderId: savedMessage.senderId,
      content: savedMessage.content,
      sentAt: savedMessage.sentAt
    });

    await this.chatRepository.update(chatId, { updatedAt: new Date() });

    return savedMessage;
  }

  async getChatMessages(chatId, userId, limit = 50, cursor = null) {
    const participant = await this.chatRepository.findParticipant(chatId, userId);
    if (!participant) {
      throw new Error('Usuário não é participante deste chat');
    }

    return await this.messageRepository.findChatMessages(chatId, limit, cursor);
  }

  async getMessageById(messageId, userId) {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error('Mensagem não encontrada');
    }

    const participant = await this.chatRepository.findParticipant(message.chatId, userId);
    if (!participant) {
      throw new Error('Usuário não é participante deste chat');
    }

    return message;
  }

  async deleteMessage(messageId, userId) {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error('Mensagem não encontrada');
    }

    if (message.senderId !== userId) {
      throw new Error('Apenas o autor pode excluir a mensagem');
    }

    return await this.messageRepository.delete(messageId);
  }
} 