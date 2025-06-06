import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatMessageRepository {
  async create(messageData) {
    return await prisma.chatMessage.create({
      data: messageData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  async findById(messageId) {
    return await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  async findChatMessages(chatId, limit = 50, cursor = null) {
    const where = { chatId };
    
    if (cursor) {
      where.sentAt = {
        lt: new Date(cursor)
      };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { sentAt: 'desc' },
      take: limit
    });

    const nextCursor = messages.length === limit 
      ? messages[messages.length - 1].sentAt.toISOString()
      : null;

    return {
      messages: messages.map(msg => ({
        messageId: msg.id,
        senderId: msg.senderId,
        senderName: msg.sender.name,
        senderAvatar: msg.sender.avatarUrl,
        content: msg.content,
        sentAt: msg.sentAt,
        chatId: msg.chatId
      })),
      nextCursor
    };
  }

  async delete(messageId) {
    return await prisma.chatMessage.delete({
      where: { id: messageId }
    });
  }

  async deleteChatMessages(chatId) {
    return await prisma.chatMessage.deleteMany({
      where: { chatId }
    });
  }

  async countChatMessages(chatId) {
    return await prisma.chatMessage.count({
      where: { chatId }
    });
  }
} 