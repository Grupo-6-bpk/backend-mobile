/**
 * Use case for deleting a user
 */
export default class DeleteUserUseCase {
  /**
   * Constructor
   * @param {Object} userRepository - Repository to interact with user data
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {number} id - The ID of the user to delete
   * @return {Promise<boolean>} - A promise that resolves to true if deleted successfully
   * @throws {Error} - If user not found or could not be deleted
   */
  async execute(id) {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    const result = await this.userRepository.delete(id);
    if (!result) {
      throw new Error('Falha ao excluir usuário');
    }

    return true;
  }
}
