import prisma from "../../infrastructure/config/prismaClient.js";

export class PrismaGroupRepository {
  async create(groupData) {
    const { name, description, driverId, members } = groupData; // 'members' aqui são os passengerIds

    if (!name || typeof name !== 'string' || name.trim() === '') {
      // Adicionando validação mais robusta para o nome, que deve vir do Service
      throw new Error("Group name is required and must be a non-empty string.");
    }
    if (driverId === undefined || driverId === null) {
      throw new Error("driverId is required.");
    }

    const parsedDriverId = parseInt(driverId);
    if (isNaN(parsedDriverId)) {
      throw new Error("driverId must be a valid number.");
    }

    try {
      return await prisma.rideGroup.create({
        data: {
          name,
          description,
          driverId: parsedDriverId, // Prisma espera o ID escalar aqui
          createdAt: new Date(),   // Mantendo manual, pois seu schema não tem @default(now())
          updatedAt: new Date(),   // Mantendo manual, pois seu schema não tem @updatedAt
          // Usando nested writes para criar membros
          members: (members && members.length > 0)
            ? {
                createMany: { // Ou create: members.map(...) se quiser mais controle por membro
                  data: members.map(passengerId => ({
                    passengerId: parseInt(passengerId),
                    joinDate: Math.floor(Date.now() / 1000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  })),
                },
              }
            : undefined, // Não cria a chave 'members' se não houver membros
        },
        include: { // Para retornar o grupo completo com o motorista e os membros
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
      });
    } catch (error) {
      // Prisma lança erros específicos que podem ser úteis
      if (error.code === 'P2002') { // Exemplo: Unique constraint failed
        // Isso poderia acontecer se você tivesse um unique constraint no nome do grupo, por exemplo
        throw new Error(`Failed to create group: A group with similar unique properties might already exist. Details: ${error.message}`);
      }
      if (error.code === 'P2003') { // Foreign key constraint failed
        // ESTE É UM CANDIDATO FORTE SE O driverId OU passengerId NÃO EXISTIR
        if (error.meta && error.meta.field_name) {
            if (String(error.meta.field_name).includes('driver_id')) {
                 throw new Error(`Failed to create group: The specified driverId (${parsedDriverId}) does not exist or is invalid.`);
            }
            if (String(error.meta.field_name).includes('passenger_id')) {
                throw new Error(`Failed to create group: One or more specified passengerIds do not exist or are invalid.`);
            }
        }
        throw new Error(`Failed to create group due to a data integrity issue (e.g., non-existent related record). Details: ${error.message}`);
      }
      console.error("Error in PrismaGroupRepository.create:", error);
      throw new Error(`Database error while creating group: ${error.message}`);
    }
  }

  // ... (restante dos seus métodos: findAll, findById, addMemberToGroup, removeMemberFromGroup, updateGroupDetails)
  // Eles parecem bons como estão. Apenas certifique-se de que o tratamento de erro e a consistência
  // com os timestamps (manual vs. schema-driven) estejam alinhados.
}