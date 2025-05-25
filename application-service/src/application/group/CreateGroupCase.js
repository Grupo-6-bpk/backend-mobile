export default class CreateGroupUseCase {
  constructor(groupRepository) {
    this.groupRepository = groupRepository;
  }

  async execute(groupData) {
    const { name, members, description, driverId } = groupData;

    if (!name || typeof name !== "string") {
      throw new Error("Nome do grupo é obrigatório e deve ser uma string.");
    }

    if (!Array.isArray(members)) {
      throw new Error("Members deve ser um array.");
    }

    if (members.length < 1 || members.length > 5) {
      throw new Error("O grupo deve ter entre 1 e 5 membros.");
    }

    if (!driverId || typeof driverId !== "number") {
      throw new Error("driverId é obrigatório e deve ser um número.");
    }

    const group = await this.groupRepository.create({
      name,
      description,
      driverId,
      members,
    });

    return group;
  }
}
