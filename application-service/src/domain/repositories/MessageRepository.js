/**
 * Message Repository Interface
 * Define o contrato para persistência de mensagens
 */
export default class MessageRepository {
  /**
   * Busca mensagens de um grupo com paginação
   * @param {number} groupId - ID do grupo
   * @param {number} page - Página atual
   * @param {number} limit - Limite por página
   * @returns {Promise<{messages: Array, totalPages: number}>}
   */
  async findByGroupId(groupId, page = 1, limit = 50) {
    throw new Error('Method findByGroupId must be implemented');
  }

  /**
   * Busca mensagem por ID
   * @param {number} id - ID da mensagem
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Busca mensagens por texto (busca)
   * @param {number} groupId - ID do grupo
   * @param {string} searchText - Texto a buscar
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>}
   */
  async searchInGroup(groupId, searchText, limit = 20) {
    throw new Error('Method searchInGroup must be implemented');
  }

  /**
   * Busca mensagens de mídia de um grupo
   * @param {number} groupId - ID do grupo
   * @param {Array<string>} types - Tipos de mídia ['image', 'file', 'audio', 'video']
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>}
   */
  async findMediaByGroupId(groupId, types, limit = 20) {
    throw new Error('Method findMediaByGroupId must be implemented');
  }

  /**
   * Busca mensagens não lidas de um usuário em um grupo
   * @param {number} userId - ID do usuário
   * @param {number} groupId - ID do grupo
   * @param {Date} lastSeenAt - Último acesso do usuário
   * @returns {Promise<Array>}
   */
  async findUnreadMessages(userId, groupId, lastSeenAt) {
    throw new Error('Method findUnreadMessages must be implemented');
  }

  /**
   * Conta mensagens não lidas
   * @param {number} userId - ID do usuário
   * @param {number} groupId - ID do grupo
   * @param {Date} lastSeenAt - Último acesso do usuário
   * @returns {Promise<number>}
   */
  async countUnreadMessages(userId, groupId, lastSeenAt) {
    throw new Error('Method countUnreadMessages must be implemented');
  }

  /**
   * Cria uma nova mensagem
   * @param {Object} messageData - Dados da mensagem
   * @returns {Promise<Object>}
   */
  async create(messageData) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Atualiza uma mensagem
   * @param {number} id - ID da mensagem
   * @param {Object} messageData - Novos dados da mensagem
   * @returns {Promise<Object>}
   */
  async update(id, messageData) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Deleta uma mensagem (soft delete)
   * @param {number} id - ID da mensagem
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  /**
   * Marca mensagens como lidas
   * @param {number} userId - ID do usuário
   * @param {Array<number>} messageIds - IDs das mensagens
   * @returns {Promise<boolean>}
   */
  async markAsRead(userId, messageIds) {
    throw new Error('Method markAsRead must be implemented');
  }

  /**
   * Marca mensagens como entregues
   * @param {Array<number>} messageIds - IDs das mensagens
   * @returns {Promise<boolean>}
   */
  async markAsDelivered(messageIds) {
    throw new Error('Method markAsDelivered must be implemented');
  }

  /**
   * Busca mensagens por status
   * @param {string} status - Status das mensagens
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>}
   */
  async findByStatus(status, limit = 100) {
    throw new Error('Method findByStatus must be implemented');
  }
} 