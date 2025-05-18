import bcrypt from 'bcrypt';

/**
 * Use case for creating a new user
 */
export default class CreateUserUseCase {
  /**
   * Constructor
   * @param {Object} userRepository - Repository to interact with user data
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {Object} userData - User data to create
   * @return {Promise<Object>} - A promise that resolves to the created user
   */
  async execute(userData) {
    // Check if email is already in use
    if (userData.email) {
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email já está em uso');
      }
    }

    // Hash password
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Default values
    userData.verified = userData.verified || false;

    return this.userRepository.create(userData);
  }
}