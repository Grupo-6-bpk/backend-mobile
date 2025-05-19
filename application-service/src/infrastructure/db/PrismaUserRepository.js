import { PrismaClient } from '@prisma/client';
import UserRepository from '../../domain/repositories/UserRepository.js';

/**
 * Prisma implementation of UserRepository
 * This class implements the UserRepository interface using Prisma ORM
 */
export default class PrismaUserRepository extends UserRepository {
  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  /**
   * Find all users with pagination
   * @param {number} page - The page number to return (1-indexed)
   * @param {number} limit - The number of items per page
   * @return {Promise<{users: Array, totalPages: number}>} - A promise that resolves to an object with users and totalPages
   */
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          driver: true,
          passenger: true
        }
      }),
      this.prisma.user.count()
    ]);
    
    const totalPages = Math.ceil(count / limit);
    
    return {
      users,
      totalPages
    };
  }

  /**
   * Find a user by ID
   * @param {number} id - The ID of the user to find
   * @return {Promise<Object|null>} - A promise that resolves to a user object or null if not found
   */
  async findById(id) {
    return this.prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        driver: true,
        passenger: true
      }
    });
  }

  /**
   * Find a user by email
   * @param {string} email - The email of the user to find
   * @return {Promise<Object|null>} - A promise that resolves to a user object or null if not found
   */
  async findByEmail(email) {
    return this.prisma.user.findFirst({
      where: { email }
    });
  }

  /**
   * Create a new user
   * @param {Object} userData - The user data to create
   * @return {Promise<Object>} - A promise that resolves to the created user
   */
  async create(userData) {
    return this.prisma.user.create({
      data: userData,
      include: {
        driver: true,
        passenger: true
      }
    });
  }

  /**
   * Update an existing user
   * @param {number} id - The ID of the user to update
   * @param {Object} userData - The user data to update
   * @return {Promise<Object|null>} - A promise that resolves to the updated user or null if not found
   */
  async update(id, userData) {
    return this.prisma.user.update({
      where: { id: Number(id) },
      data: userData,
      include: {
        driver: true,
        passenger: true
      }
    });
  }

  /**
   * Delete a user by ID
   * @param {number} id - The ID of the user to delete
   * @return {Promise<boolean>} - A promise that resolves to true if deleted, false otherwise
   */
  async delete(id) {
    try {
      await this.prisma.user.delete({
        where: { id: Number(id) }
      });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}