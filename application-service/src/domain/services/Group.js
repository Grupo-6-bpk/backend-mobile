import { PrismaGroupRepository } from '../../domain/repositories/PrismaGroupRepository.js';
import prisma from '../../infrastructure/config/prismaClient.js';

/**
 * @typedef {object} CreateRideGroupData
 * @property {string} name - O nome do grupo de carona.
 * @property {string} [description] - Uma descrição opcional para o grupo.
 * @property {string} driverId - O ID do usuário que é o motorista do grupo.
 * @property {string[]} [memberPassengerIds] - Um array opcional de IDs de Passageiros a serem adicionados inicialmente.
 */

export class RideGroupService {
  /**
   * @param {PrismaGroupRepository} groupRepository
   */
  constructor(groupRepository) {
    this.groupRepository = groupRepository; // 'private' é um conceito de TypeScript, em JS a propriedade é apenas atribuída
  }

  /**
   * Cria um novo grupo de carona.
   * @param {CreateRideGroupData} data - Os dados para criar o grupo.
   * @returns {Promise<object>} O grupo de carona criado, conforme retornado pelo repositório.
   */
  async createRideGroup(data) {
    // A lógica de `create` no seu repositório já lida bem com a criação
    // do grupo e dos membros.
    // A validação de dados (ex: se driverId existe, se memberPassengerIds existem)
    // pode ocorrer aqui ou ser delegada ao repositório/Prisma (constraints).

    const groupInputForRepo = {
        name: data.name,
        description: data.description,
        driverId: data.driverId,
        members: data.memberPassengerIds || [], // O repo espera 'members' como passengerId
    };

    return this.groupRepository.create(groupInputForRepo);
  }

  /**
   * Busca todos os grupos de carona.
   * @returns {Promise<object[]>} Uma lista de todos os grupos de carona.
   */
  async getAllRideGroups() {
    return this.groupRepository.findAll();
  }

  /**
   * Busca um grupo de carona pelo ID.
   * @param {string} id - O ID do grupo de carona.
   * @returns {Promise<object>} O grupo de carona encontrado.
   * @throws {Error} Se o grupo não for encontrado.
   */
  async getRideGroupById(id) {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new Error(`RideGroup com ID ${id} não encontrado.`);
    }
    return group; // Este já é um objeto rico com includes do Prisma
  }

  /**
   * Adiciona um passageiro a um grupo de carona.
   * @param {string} groupId - O ID do grupo de carona.
   * @param {string} passengerId - O ID do passageiro a ser adicionado.
   * @returns {Promise<object>} O objeto do membro do grupo criado.
   * @throws {Error} Se o grupo ou passageiro não for encontrado, ou se o passageiro já estiver no grupo.
   */
  async addPassengerToGroup(groupId, passengerId) {
    // 1. Verificar se o grupo existe (opcional, o DB pode reclamar com foreign key constraint)
    const groupExists = await prisma.rideGroup.findUnique({ where: { id: groupId } });
    if (!groupExists) {
      throw new Error(`Grupo com ID ${groupId} não encontrado.`);
    }

    // 2. Verificar se o passageiro existe (opcional)
    const passengerExists = await prisma.passenger.findUnique({ where: { id: passengerId } });
    if (!passengerExists) {
      throw new Error(`Passageiro com ID ${passengerId} não encontrado.`);
    }

    // 3. Adicionar à tabela de junção
    // O @@unique([groupId, passengerId]) no schema.prisma previne duplicatas
    try {
      const newMember = await prisma.rideGroupMember.create({
        data: {
          groupId,
          passengerId,
          joinDate: Math.floor(Date.now() / 1000), // Se joinDate for Int no schema
          // Se joinDate for DateTime, use: new Date()
          // createdAt e updatedAt são automáticos se @default(now()) e @updatedAt no schema
        },
        include: { // Opcional: retornar o membro com detalhes
            passenger: { include: { user: true }}
        }
      });
      return newMember;
    } catch (error) {
      if (error.code === 'P2002') { // Erro de unique constraint do Prisma
        throw new Error(`Passageiro ${passengerId} já está no grupo ${groupId}.`);
      }
      console.error("Erro ao adicionar passageiro ao grupo:", error);
      throw error; // Relança outros erros
    }
  }

  /**
   * Remove um passageiro de um grupo de carona.
   * @param {string} groupId - O ID do grupo de carona.
   * @param {string} passengerId - O ID do passageiro a ser removido.
   * @returns {Promise<{success: boolean, deletedCount: number}>} Um objeto indicando sucesso e a contagem de membros removidos.
   */
  async removePassengerFromGroup(groupId, passengerId) {
    const result = await prisma.rideGroupMember.deleteMany({
      where: {
        groupId,
        passengerId,
      },
    });

    if (result.count === 0) {
      console.warn(`Nenhum membro encontrado para remover do grupo ${groupId} com passageiro ${passengerId}`);
      // Você pode optar por lançar um erro aqui se a remoção de um membro inexistente
      // for considerada uma condição de erro para sua aplicação.
      // Ex: throw new Error(`Passageiro ${passengerId} não encontrado no grupo ${groupId}.`);
    }
    return { success: true, deletedCount: result.count };
  }

  /**
   * Formata um objeto RideGroup (geralmente do Prisma) para uma resposta de API.
   * Adapte esta função conforme a estrutura exata que sua API precisa retornar.
   * @param {object} rideGroup - O objeto RideGroup, tipicamente com includes do Prisma.
   * @returns {object|null} O objeto formatado para a API, ou null se a entrada for nula.
   */
  formatGroupForApiResponse(rideGroup) {
    if (!rideGroup) return null;

    // A estrutura do rideGroup aqui depende dos `include` que você usou ao buscá-lo.
    // O exemplo abaixo assume a estrutura que você tinha no seu PrismaGroupRepository.
    return {
      id: rideGroup.id,
      name: rideGroup.name,
      description: rideGroup.description,
      driver: rideGroup.driver && rideGroup.driver.user ? { // Verifica se driver e driver.user existem
        id: rideGroup.driver.user.id,
        name: rideGroup.driver.user.name, // Assumindo que User tem 'name'
        // Adicione outros campos do usuário do motorista se necessário
      } : null,
      members: rideGroup.members ? rideGroup.members.map(member => {
        if (!member.passenger || !member.passenger.user) return null; // Checagem de segurança
        return {
          passengerId: member.passenger.id,
          userId: member.passenger.user.id,
          userName: member.passenger.user.name, // Assumindo que User tem 'name'
          joinDate: member.joinDate,
          // Adicione outros campos do membro ou do usuário do passageiro se necessário
        };
      }).filter(member => member !== null) : [], // Filtra membros nulos se a checagem acima falhar
    };
  }
}