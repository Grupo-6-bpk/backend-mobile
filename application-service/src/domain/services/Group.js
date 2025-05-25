

export default class GroupService {
    constructor(groupRepository) {
        this.groupRepository = groupRepository;
    }

    /**
     * Creates a new group with the provided data.
     * 
     * @param {Object} groupData - The data for the group to be created.
     * @param {string} groupData.name - The name of the group.
     * @param {Array} groupData.members - The members of the group.
     * @returns {Promise<Object>} The newly created group.
     * @throws {Error} If the group data is invalid or creation fails.
     */
    async createGroup(groupData) {
        if (typeof groupData.name !== 'string' || groupData.name.trim() === '') {
            throw new Error('O nome do grupo é obrigatório.');
        }

        const members = Array.isArray(groupData.members) ? groupData.members : [];
        if (!Array.isArray(members)) {
            throw new Error('O campo members deve ser um array.');
        }

        if (members.length < 1) {
            throw new Error('O grupo deve ter pelo menos 1 pessoa.');
        }

        if (members.length > 5) {
            throw new Error('O grupo pode ter no máximo 5 pessoas.');
        }

        try {
            const newGroup = await this.groupRepository.create(groupData);
            return newGroup;
        } catch (error) {
            throw new Error(`Erro ao criar o grupo: ${error.message}`);
        }
    }
}
