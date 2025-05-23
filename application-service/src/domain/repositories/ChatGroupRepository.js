/**
 * ChatGroup Repository Interface
 * Define o contrato para persistência de grupos de chat
 */
export default class ChatGroupRepository {
  /**
   * Busca todos os grupos com paginação
   * @param {number} page - Página atual
   * @param {number} limit - Limite por página
   * @returns {Promise<{groups: Array, totalPages: number}>}
   */
  async findAll(page, limit) {
    throw new Error('Method findAll must be implemented');
  }

  /**
   * Busca grupo por ID
   * @param {number} id - ID do grupo
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Busca grupos do usuário
   * @param {number} userId - ID do usuário
   * @param {number} page - Página atual
   * @param {number} limit - Limite por página
   * @returns {Promise<{groups: Array, totalPages: number}>}
   */
  async findByUserId(userId, page = 1, limit = 20) {
    throw new Error('Method findByUserId must be implemented');
  }

  /**
   * Busca chat direto entre dois usuários
   * @param {number} user1Id - ID do primeiro usuário
   * @param {number} user2Id - ID do segundo usuário
   * @returns {Promise<Object|null>}
   */
  async findDirectChat(user1Id, user2Id) {
    throw new Error('Method findDirectChat must be implemented');
  }

  /**
   * Busca grupos por nome
   * @param {string} name - Nome a buscar
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>}
   */
  async searchByName(name, limit = 10) {
    throw new Error('Method searchByName must be implemented');
  }

  /**
   * Cria um novo grupo
   * @param {Object} groupData - Dados do grupo
   * @returns {Promise<Object>}
   */
  async create(groupData) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Atualiza um grupo
   * @param {number} id - ID do grupo
   * @param {Object} groupData - Novos dados do grupo
   * @returns {Promise<Object>}
   */
  async update(id, groupData) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Deleta um grupo (soft delete)
   * @param {number} id - ID do grupo
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  /**
   * Conta mensagens não lidas de um usuário em um grupo
   * @param {number} userId - ID do usuário
   * @param {number} groupId - ID do grupo
   * @returns {Promise<number>}
   */
  async countUnreadMessages(userId, groupId) {
    throw new Error('Method countUnreadMessages must be implemented');
  }

  /**
   * Busca último timestamp de acesso do usuário ao grupo
   * @param {number} userId - ID do usuário
   * @param {number} groupId - ID do grupo
   * @returns {Promise<Date|null>}
   */
  async getLastSeenAt(userId, groupId) {
    throw new Error('Method getLastSeenAt must be implemented');
  }
} 