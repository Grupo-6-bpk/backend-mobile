import prisma from "../../infrastructure/config/prismaClient.js";

export class PrismaGroupRepository {
  async create(groupData) {
    const { name, description, driverId, members } = groupData;

    // Cria o grupo primeiro
    const group = await prisma.rideGroup.create({
      data: {
        name,
        description,
        driverId,
      },
    });

    // Cria os registros de associação na tabela RideGroupMember
    if (members && members.length > 0) {
      const membersData = members.map((passengerId) => ({
        groupId: group.id,
        passengerId,
        joinDate: Math.floor(Date.now() / 1000), // exemplo timestamp
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await prisma.rideGroupMember.createMany({
        data: membersData,
      });
    }

    // Retorna o grupo com os membros associados
    return await prisma.rideGroup.findUnique({
      where: { id: group.id },
      include: {
        members: {
          include: {
            passenger: {
              include: {
                user: true,
              },
            },
          },
        },
        driver: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll() {
    return await prisma.rideGroup.findMany({
      include: {
        members: {
          include: {
            passenger: {
              include: {
                user: true,
              },
            },
          },
        },
        driver: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findById(id) {
    return await prisma.rideGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            passenger: {
              include: {
                user: true,
              },
            },
          },
        },
        driver: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}
