/**
 * Use case for listing all users with pagination
 */
export default class GetAllUsersUseCase {
  /**
   * Constructor
   * @param {Object} userRepository - Repository to interact with user data
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Number of items per page
   * @return {Promise<{users: Array, totalPages: number}>} - Users and pagination info
   */
  async execute(page = 1, limit = 10) {
    return this.userRepository.findAll(page, limit);
  }
}
