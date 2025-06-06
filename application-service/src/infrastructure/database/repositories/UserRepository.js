import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserRepository {
  async findById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        phone: true,
        email: true
      }
    });
  }

  async searchByPhone(phone, limit = 10) {
    return await prisma.user.findMany({
      where: {
        phone: {
          contains: phone
        }
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        phone: true
      },
      take: limit
    });
  }

  async findByPhone(phone) {
    return await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        phone: true
      }
    });
  }

  async findMany(userIds) {
    return await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        phone: true
      }
    });
  }
} 