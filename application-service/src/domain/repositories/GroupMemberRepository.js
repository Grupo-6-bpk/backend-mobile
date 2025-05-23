/**
 * GroupMember Repository Interface
 * Define o contrato para persistência de membros de grupos
 */
export default class GroupMemberRepository {
  /**
   * Busca membro por ID
   * @param {number} id - ID do membro
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Busca membro por usuário e grupo
   * @param {number} userId - ID do usuário
   * @param {number} groupId - ID do grupo
   * @returns {Promise<Object|null>}
   */
  async findByUserAndGroup(userId, groupId) {
    throw new Error('Method findByUserAndGroup must be implemented');
  }

  /**
   * Busca todos os membros de um grupo
   * @param {number} groupId - ID do grupo
   * @param {boolean} activeOnly - Apenas membros ativos
   * @returns {Promise<Array>}
   */
  async findByGroupId(groupId, activeOnly = true) {
    throw new Error('Method findByGroupId must be implemented');
  }

  /**
   * Busca grupos de um usuário
   * @param {number} userId - ID do usuário
   * @param {boolean} activeOnly - Apenas membros ativos
   * @returns {Promise<Array>}
   */
  async findByUserId(userId, activeOnly = true) {
    throw new Error('Method findByUserId must be implemented');
  }

  /**
   * Busca administradores de um grupo
   * @param {number} groupId - ID do grupo
   * @returns {Promise<Array>}
   */
  async findAdminsByGroupId(groupId) {
    throw new Error('Method findAdminsByGroupId must be implemented');
  }

  /**
   * Conta membros de um grupo
   * @param {number} groupId - ID do grupo
   * @param {boolean} activeOnly - Apenas membros ativos
   * @returns {Promise<number>}
   */
  async countByGroupId(groupId, activeOnly = true) {
    throw new Error('Method countByGroupId must be implemented');
  }

  /**
   * Verifica se usuário é membro do grupo
   * @param {number} userId - ID do usuário
   * @param {number} groupId - ID do grupo
   * @returns {Promise<boolean>}
   */
  async isMember(userId, groupId) {
    throw new Error('Method isMember must be implemented');
  }

  /**
   * Verifica se usuário é admin do grupo
   * @param {number} userId - ID do usuário
   * @param {number} groupId - ID do grupo
   * @returns {Promise<boolean>}
   */
  async isAdmin(userId, groupId) {
    throw new Error('Method isAdmin must be implemented');
  }

  /**
   * Adiciona membro ao grupo
   * @param {Object} memberData - Dados do membro
   * @returns {Promise<Object>}
   */
  async create(memberData) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Atualiza membro do grupo
   * @param {number} id - ID do membro
   * @param {Object} memberData - Novos dados do membro
   * @returns {Promise<Object>}
   */
  async update(id, memberData) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Remove membro do grupo (soft delete)
   * @param {number} id - ID do membro
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  /**
   * Remove membro por usuário e grupo
   * @param {number} userId - ID do usuário
   * @param {number} groupId - ID do grupo
   * @returns {Promise<boolean>}
   */
  async deleteByUserAndGroup(userId, groupId) {
    throw new Error('Method deleteByUserAndGroup must be implemented');
  }

  /**
   * Atualiza último acesso do usuário ao grupo
   * @param {number} userId - ID do usuário
   * @param {number} groupId - ID do grupo
   * @returns {Promise<boolean>}
   */
  async updateLastSeen(userId, groupId) {
    throw new Error('Method updateLastSeen must be implemented');
  }

  /**
   * Adiciona múltiplos membros ao grupo
   * @param {Array<Object>} membersData - Array com dados dos membros
   * @returns {Promise<Array>}
   */
  async createMultiple(membersData) {
    throw new Error('Method createMultiple must be implemented');
  }
} 