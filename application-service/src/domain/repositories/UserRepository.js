/**
 * User Repository Interface
 * Define o contrato para persistência de usuários
 */
export default class UserRepository {
  /**
   * Busca todos os usuários com paginação
   * @param {number} page - Página atual
   * @param {number} limit - Limite por página
   * @returns {Promise<{users: Array, totalPages: number}>}
   */
  async findAll(page, limit) {
    throw new Error('Method findAll must be implemented');
  }

  /**
   * Busca usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    throw new Error('Method findByEmail must be implemented');
  }

  /**
   * Busca usuários por nome (para busca no chat)
   * @param {string} name - Nome a buscar
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>}
   */
  async searchByName(name, limit = 10) {
    throw new Error('Method searchByName must be implemented');
  }

  /**
   * Busca usuários por IDs
   * @param {Array<number>} ids - IDs dos usuários
   * @returns {Promise<Array>}
   */
  async findByIds(ids) {
    throw new Error('Method findByIds must be implemented');
  }

  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>}
   */
  async create(userData) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Atualiza um usuário
   * @param {number} id - ID do usuário
   * @param {Object} userData - Novos dados do usuário
   * @returns {Promise<Object>}
   */
  async update(id, userData) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Deleta um usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }
} 