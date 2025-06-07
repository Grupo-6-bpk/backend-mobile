import { Chat } from '../../domain/chat/entities/Chat.js';
import { ChatRepository } from '../../infrastructure/database/repositories/ChatRepository.js';
import { UserRepository } from '../../infrastructure/database/repositories/UserRepository.js';

export class ChatService {
  constructor() {
    this.chatRepository = new ChatRepository();
    this.userRepository = new UserRepository();
  }

  async createDirectChat(currentUserId, otherUserId) {
    const existingChat = await this.chatRepository.findDirectChatBetweenUsers(currentUserId, otherUserId);
    if (existingChat) {
      return existingChat;
    }

    const otherUser = await this.userRepository.findById(otherUserId);
    if (!otherUser) {
      throw new Error('Usuário não encontrado');
    }

    const chat = Chat.createDirectChat(currentUserId, otherUserId);
    return await this.chatRepository.create({
      isGroup: chat.isGroup,
      adminId: chat.adminId,
      participants: chat.participants
    });
  }

  async createGroup(currentUserId, name, participantIds) {
    const users = await this.userRepository.findMany([currentUserId, ...participantIds]);
    if (users.length !== participantIds.length + 1) {
      throw new Error('Um ou mais usuários não foram encontrados');
    }

    const allParticipantIds = [currentUserId, ...participantIds];
    const chat = Chat.createGroup(name, currentUserId, allParticipantIds);
    
    return await this.chatRepository.create({
      isGroup: chat.isGroup,
      name: chat.name,
      adminId: chat.adminId,
      participants: chat.participants
    });
  }

  async getUserChats(userId, limit = 20, offset = 0) {
    return await this.chatRepository.findUserChats(userId, limit, offset);
  }

  async getChatById(chatId, userId) {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat não encontrado');
    }

    const isParticipant = chat.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new Error('Usuário não é participante deste chat');
    }

    return chat;
  }

  async deleteChat(chatId, userId) {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat não encontrado');
    }

    if (!chat.isGroup) {
      throw new Error('Chats diretos não podem ser excluídos');
    }

    if (chat.adminId !== userId) {
      throw new Error('Apenas o admin pode excluir o grupo');
    }

    return await this.chatRepository.delete(chatId);
  }

  async addParticipant(chatId, userId, targetUserId) {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat não encontrado');
    }

    if (!chat.isGroup) {
      throw new Error('Não é possível adicionar participantes em chats diretos');
    }

    if (chat.adminId !== userId) {
      throw new Error('Apenas o admin pode adicionar participantes');
    }

    const existingParticipant = await this.chatRepository.findParticipant(chatId, targetUserId);
    if (existingParticipant) {
      throw new Error('Usuário já é participante do chat');
    }

    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new Error('Usuário não encontrado');
    }

    return await this.chatRepository.addParticipant(chatId, targetUserId);
  }

  async removeParticipant(chatId, userId, targetUserId) {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat não encontrado');
    }

    if (!chat.isGroup) {
      throw new Error('Não é possível remover participantes de chats diretos');
    }

    if (chat.adminId !== userId) {
      throw new Error('Apenas o admin pode remover participantes');
    }

    const participant = await this.chatRepository.findParticipant(chatId, targetUserId);
    if (!participant) {
      throw new Error('Usuário não é participante do chat');
    }

    return await this.chatRepository.removeParticipant(chatId, targetUserId);
  }

  async blockParticipant(chatId, userId, targetUserId) {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat não encontrado');
    }

    const userParticipant = await this.chatRepository.findParticipant(chatId, userId);
    if (!userParticipant) {
      throw new Error('Você não é participante deste chat');
    }

    const targetParticipant = await this.chatRepository.findParticipant(chatId, targetUserId);
    if (!targetParticipant) {
      throw new Error('Usuário não é participante do chat');
    }

    return await this.chatRepository.blockParticipant(chatId, targetUserId);
  }

  async unblockParticipant(chatId, userId, targetUserId) {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat não encontrado');
    }

    const userParticipant = await this.chatRepository.findParticipant(chatId, userId);
    if (!userParticipant) {
      throw new Error('Você não é participante deste chat');
    }

    const targetParticipant = await this.chatRepository.findParticipant(chatId, targetUserId);
    if (!targetParticipant) {
      throw new Error('Usuário não é participante do chat');
    }

    return await this.chatRepository.unblockParticipant(chatId, targetUserId);
  }

  async getUserChatIds(userId) {
    return await this.chatRepository.getUserChatIds(userId);
  }
} 