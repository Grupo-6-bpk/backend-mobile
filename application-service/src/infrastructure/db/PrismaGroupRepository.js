import prisma from "../../infrastructure/config/prismaClient.js"; 

export class PrismaGroupRepository {

  async create(groupData) {
    const { name, description, driverId, members } = groupData;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error("Group name is required and must be a non-empty string.");
    }
    if (driverId === undefined || driverId === null) {
      throw new Error("driverId is required.");
    }

    let parsedDriverId;
    try {
      parsedDriverId = parseInt(driverId);
      if (isNaN(parsedDriverId)) {
        throw new Error("driverId must be a valid number string or number.");
      }
    } catch (e) {
      throw new Error("driverId is invalid.");
    }

    try {
      return await prisma.rideGroup.create({
        data: {
          name,
          description,
          driver: {
            connect: { id: driverId }
          },
          members: (members && members.length > 0)
            ? {
                create: members.map(passengerId => {
                  return {
                    passenger: {
                      connect: { id: passengerId }
                    },
                  };
                }),
              }
            : undefined,
        },
        include: {
          driver: { include: { user: true } },
          members: { include: { passenger: { include: { user: true } } } },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error(`Failed to create group: A group with this name or other unique property might already exist. Prisma Code: P2002. Details: ${error.meta?.target?.join(', ')}`);
      }
      if (error.code === 'P2025') {
         const message = error.meta?.cause || "A related record (like a driver or passenger) was not found.";
        throw new Error(`Failed to create group: ${message}. Prisma Code: P2025.`);
      }
      console.error("Error in PrismaGroupRepository.create:", error);
      throw new Error(`Database error while creating group: ${error.message}`);
    }
  }

  async findAll() {
    console.log("PrismaGroupRepository: Executing findAll");
    try {
      return await prisma.rideGroup.findMany({
        include: {
          driver: {
            include: {
              user: true,
            },
          },
          members: {
            include: {
              passenger: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        }
      });
    } catch (error) {
      console.error("Error in PrismaGroupRepository.findAll:", error);
      throw new Error(`Database error while fetching all groups: ${error.message}`);
    }
  }

  async findById(id) {
    console.log(`PrismaGroupRepository: Executing findById for ID: ${id}`);
    try {
      const group = await prisma.rideGroup.findUnique({
        where: { id: id },
        include: {
          driver: { include: { user: true } },
          members: { include: { passenger: { include: { user: true } } } },
        },
      });
      return group;
    } catch (error) {
      console.error(`Error in PrismaGroupRepository.findById for ID ${id}:`, error);
      throw new Error(`Database error while fetching group by ID ${id}: ${error.message}`);
    }
  }
}
