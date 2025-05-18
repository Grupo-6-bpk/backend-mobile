import bcrypt from 'bcrypt';

/**
 * Use case for updating an existing user
 */
export default class UpdateUserUseCase {
  /**
   * Constructor
   * @param {Object} userRepository - Repository to interact with user data
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {number} id - The ID of the user to update
   * @param {Object} userData - New user data
   * @return {Promise<Object>} - A promise that resolves to the updated user
   * @throws {Error} - If user not found or email is already in use
   */
  async execute(id, userData) {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Check if email is changed and already in use
    if (userData.email && userData.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(userData.email);
      if (userWithEmail && userWithEmail.id !== Number(id)) {
        throw new Error('Email já está em uso por outro usuário');
      }
    }

    // Hash new password if provided
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    userData.updatedAt = new Date();

    return this.userRepository.update(id, userData);
  }
}
