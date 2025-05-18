/**
 * Interface for User Repository
 * This interface defines the contract that any User repository implementation must follow
 */
export default class UserRepository {
  /**
   * Find all users with pagination
   * @param {number} page - The page number to return (1-indexed)
   * @param {number} limit - The number of items per page
   * @return {Promise<{users: Array, totalPages: number}>} - A promise that resolves to an object with users and totalPages
   */
  async findAll(page, limit) {
    throw new Error('Method not implemented');
  }

  /**
   * Find a user by ID
   * @param {number} id - The ID of the user to find
   * @return {Promise<Object|null>} - A promise that resolves to a user object or null if not found
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find a user by email
   * @param {string} email - The email of the user to find
   * @return {Promise<Object|null>} - A promise that resolves to a user object or null if not found
   */
  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Create a new user
   * @param {Object} userData - The user data to create
   * @return {Promise<Object>} - A promise that resolves to the created user
   */
  async create(userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Update an existing user
   * @param {number} id - The ID of the user to update
   * @param {Object} userData - The user data to update
   * @return {Promise<Object|null>} - A promise that resolves to the updated user or null if not found
   */
  async update(id, userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete a user by ID
   * @param {number} id - The ID of the user to delete
   * @return {Promise<boolean>} - A promise that resolves to true if deleted, false otherwise
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }
}