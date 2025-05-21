/**
 * Use case for getting a user by ID
 */
export default class GetUserUseCase {
  /**
   * Constructor
   * @param {Object} userRepository - Repository to interact with user data
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {number} id - The ID of the user to find
   * @return {Promise<Object>} - A promise that resolves to the user
   * @throws {Error} - If the user is not found
   */
  async execute(id) {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    return user;
  }
}
