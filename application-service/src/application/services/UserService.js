import { UserRepository } from '../../infrastructure/database/repositories/UserRepository.js';

export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async searchByPhone(phone, limit = 10) {
    if (!phone || phone.trim().length === 0) {
      throw new Error('Termo de busca é obrigatório');
    }

    return await this.userRepository.searchByPhone(phone.trim(), limit);
  }

  async getUserById(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }

  async getUsersByIds(userIds) {
    return await this.userRepository.findMany(userIds);
  }
} 