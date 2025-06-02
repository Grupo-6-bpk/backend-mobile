import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatRepository {
  async create(chatData) {
    const { participants, ...chatInfo } = chatData;
    
    return await prisma.chat.create({
      data: {
        ...chatInfo,
        participants: {
          create: participants.map(p => ({
            userId: p.userId,
            blocked: p.blocked || false
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
  }

  async findById(chatId) {
    return await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
  }

  async findDirectChatBetweenUsers(userId1, userId2) {
    const chat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: [userId1, userId2] }
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (chat && chat.participants.length === 2) {
      const participantIds = chat.participants.map(p => p.userId).sort();
      const expectedIds = [userId1, userId2].sort();
      
      if (participantIds[0] === expectedIds[0] && participantIds[1] === expectedIds[1]) {
        return chat;
      }
    }

    return null;
  }

  async findUserChats(userId, limit = 20, offset = 0) {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
            blocked: false
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    return chats.map(chat => {
      const lastMessage = chat.messages[0];
      const otherParticipant = chat.isGroup 
        ? null 
        : chat.participants.find(p => p.userId !== userId);

      const result = {
        chatId: chat.id,
        isGroup: chat.isGroup,
        chatName: chat.isGroup ? chat.name : otherParticipant?.user.name,
        chatAvatar: chat.isGroup ? null : otherParticipant?.user.avatarUrl,
        lastMessage: lastMessage?.content || null,
        lastMessageAt: lastMessage?.sentAt || chat.createdAt,
        participants: chat.participants.map(participant => ({
          userId: participant.user.id,
          name: participant.user.name,
          avatarUrl: participant.user.avatarUrl,
          isBlocked: participant.blocked
        }))
      };

      if (chat.isGroup) {
        result.adminId = chat.adminId;
      }

      return result;
    });
  }

  async getUserChatIds(userId) {
    const participants = await prisma.chatParticipant.findMany({
      where: {
        userId: userId,
        blocked: false
      },
      select: {
        chatId: true
      }
    });

    return participants.map(p => p.chatId);
  }

  async update(chatId, data) {
    return await prisma.chat.update({
      where: { id: chatId },
      data,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
  }

  async delete(chatId) {
    await prisma.chatParticipant.deleteMany({
      where: { chatId }
    });
    
    await prisma.chatMessage.deleteMany({
      where: { chatId }
    });

    return await prisma.chat.delete({
      where: { id: chatId }
    });
  }

  async addParticipant(chatId, userId) {
    return await prisma.chatParticipant.create({
      data: {
        chatId,
        userId,
        blocked: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  async removeParticipant(chatId, userId) {
    return await prisma.chatParticipant.delete({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      }
    });
  }

  async blockParticipant(chatId, userId) {
    return await prisma.chatParticipant.update({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      data: {
        blocked: true
      }
    });
  }

  async unblockParticipant(chatId, userId) {
    return await prisma.chatParticipant.update({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      data: {
        blocked: false
      }
    });
  }

  async findParticipant(chatId, userId) {
    return await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
} 