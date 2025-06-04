import prisma from "../../infrastructure/config/prismaClient.js";

export class PrismaGroupRepository {
  async create(groupData) {
    const { name, description, driverId, members: passengerIds } = groupData;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error("O nome do grupo é obrigatório e não pode ser vazio.");
    }
    if (driverId === undefined || driverId === null || isNaN(parseInt(driverId))) {
      throw new Error("O ID do motorista (driverId) é obrigatório e deve ser um número.");
    }
    if (passengerIds && (!Array.isArray(passengerIds) || passengerIds.some(id => isNaN(parseInt(id))))) {
        throw new Error("Os IDs dos passageiros (members) devem ser um array de números.");
    }

    try {
      const driverExists = await prisma.driver.findUnique({ where: { id: parseInt(driverId) } });
      if (!driverExists) {
          throw new Error(`Motorista com ID ${driverId} não encontrado ou não é um motorista válido.`);
      }

      if (passengerIds && passengerIds.length > 0) {
        const existingPassengers = await prisma.passenger.findMany({
          where: { id: { in: passengerIds.map(id => parseInt(id)) } }
        });
        if (existingPassengers.length !== passengerIds.length) {
          throw new Error("Um ou mais IDs de passageiros fornecidos não existem ou não são válidos.");
        }
      }

      return await prisma.rideGroup.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          driver: {
            connect: { id: parseInt(driverId) }
          },
          members: (passengerIds && passengerIds.length > 0)
            ? {
                create: passengerIds.map(pId => {
                  return {
                    passenger: {
                      connect: { id: parseInt(pId) }
                    },
                  };
                }),
              }
            : undefined,
        },
        include: {
          driver: { include: { user: true } },
          members: {
            include: {
              passenger: { include: { user: true } }
            }
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        throw new Error(`Falha ao criar grupo: Já existe um grupo com este ${Array.isArray(target) ? target.join(', ') : 'valor único'}. (P2002)`);
      }
      if (error.code === 'P2025') {
        const message = error.meta?.cause || "Um registro relacionado (como motorista ou passageiro) não foi encontrado.";
        throw new Error(`Falha ao criar grupo: ${message}. (P2025)`);
      }
      console.error("Erro em PrismaGroupRepository.create:", error);
      throw new Error(error.message || "Erro no banco de dados ao criar o grupo.");
    }
  }

  async findAll() {
    console.log("PrismaGroupRepository: Executando findAll");
    try {
      return await prisma.rideGroup.findMany({
        include: {
          driver: { include: { user: true } },
          members: {
            select: {
              id: true,
              passenger: {
                select: {
                  id: true,
                  user: { select: { id: true, name: true } }
                }
              }
            }
          },
          _count: {
            select: { members: true }
          }
        },
        orderBy: {
          createdAt: 'desc',
        }
      });
    } catch (error) {
      console.error("Erro em PrismaGroupRepository.findAll:", error);
      throw new Error(`Erro no banco de dados ao buscar todos os grupos: ${error.message}`);
    }
  }

  async findGroupWithMembers(id) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
        throw new Error("ID do grupo inválido. Deve ser um número.");
    }
    console.log(`PrismaGroupRepository: Executando findById para ID: ${numericId}`);
    try {
      const group = await prisma.rideGroup.findUnique({
        where: { id: numericId },
        include: {
          driver: { include: { user: true } },
          members: {
            orderBy: { createdAt: 'asc' },
            include: {
              passenger: { include: { user: true } }
            }
          },
        },
      });
      return group;
    } catch (error) {
      console.error(`Erro em PrismaGroupRepository.findById para ID ${numericId}:`, error);
      throw new Error(`Erro no banco de dados ao buscar grupo por ID ${numericId}: ${error.message}`);
    }
  }

  async addMembersToGroup(groupId, passengerIdsToAdd) {
    const numericGroupId = parseInt(groupId);
    if (isNaN(numericGroupId)) {
        throw new Error("ID do grupo inválido. Deve ser um número.");
    }
    if (!Array.isArray(passengerIdsToAdd) || passengerIdsToAdd.some(id => isNaN(parseInt(id)))) {
        throw new Error("Os IDs dos passageiros para adicionar devem ser um array de números.");
    }
    if (passengerIdsToAdd.length === 0) {
        throw new Error("Nenhum ID de passageiro fornecido para adicionar.");
    }

    try {
      const group = await prisma.rideGroup.findUnique({
        where: { id: numericGroupId },
        select: { id: true }
      });
      if (!group) {
        const err = new Error(`Grupo com ID ${numericGroupId} não encontrado.`);
        throw err;
      }

      const existingPassengers = await prisma.passenger.findMany({
        where: { id: { in: passengerIdsToAdd.map(id => parseInt(id)) } },
        select: { id: true }
      });
      if (existingPassengers.length !== passengerIdsToAdd.length) {
        throw new Error("Um ou mais IDs de passageiros fornecidos para adicionar não existem ou não são válidos.");
      }

      const updatedGroup = await prisma.rideGroup.update({
        where: { id: numericGroupId },
        data: {
          members: {
            create: passengerIdsToAdd.map(pId => ({
              passenger: {
                connect: { id: parseInt(pId) }
              }
            }))
          }
        },
        include: {
          driver: { include: { user: true } },
          members: { include: { passenger: { include: { user: true } } } },
        }
      });
      return updatedGroup;

    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error(`Falha ao adicionar membros: Um ou mais passageiros já são membros deste grupo ou outra restrição de unicidade foi violada. (P2002)`);
      }
      if (error.code === 'P2025') {
        const message = error.meta?.cause || "Um registro relacionado (como passageiro) não foi encontrado durante a adição de membros.";
        throw new Error(`Falha ao adicionar membros: ${message}. (P2025)`);
      }
      console.error(`Erro em PrismaGroupRepository.addMembersToGroup para grupo ${numericGroupId}:`, error);
      throw new Error(error.message || `Erro no banco de dados ao adicionar membros ao grupo ${numericGroupId}.`);
    }
  }

  async removeMembersFromGroup(groupId, passengerIdsToRemove) {
    const numericGroupId = parseInt(groupId);
     if (isNaN(numericGroupId)) {
        throw new Error("ID do grupo inválido. Deve ser um número.");
    }
    if (!Array.isArray(passengerIdsToRemove) || passengerIdsToRemove.some(id => isNaN(parseInt(id)))) {
        throw new Error("Os IDs dos passageiros para remover devem ser um array de números.");
    }
    if (passengerIdsToRemove.length === 0) {
        throw new Error("Nenhum ID de passageiro fornecido para remover.");
    }

    try {
      const group = await prisma.rideGroup.findUnique({
        where: { id: numericGroupId },
        select: { id: true }
      });
      if (!group) {
        const err = new Error(`Grupo com ID ${numericGroupId} não encontrado.`);
        throw err;
      }

      await prisma.rideGroup.update({
          where: { id: numericGroupId },
          data: {
              members: {
                  deleteMany: {
                      passengerId: { in: passengerIdsToRemove.map(id => parseInt(id)) }
                  }
              }
          }
      });

      return this.findById(numericGroupId);

    } catch (error) {
       if (error.code === 'P2025' && error.meta?.cause?.includes("Record to delete does not exist")) {
        console.warn(`Tentativa de remover membros não encontrados do grupo ${numericGroupId} ou o grupo não existe.`);
        return this.findById(numericGroupId);
      }
      console.error(`Erro em PrismaGroupRepository.removeMembersFromGroup para grupo ${numericGroupId}:`, error);
      throw new Error(error.message || `Erro no banco de dados ao remover membros do grupo ${numericGroupId}.`);
    }
  }
}
