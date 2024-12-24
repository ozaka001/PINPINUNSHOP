import type { User, UserCreate, DBUser } from '../../types.js';
import { 
  createUser as dbCreateUser, 
  getUser, 
  getAllUsers as dbGetAllUsers, 
  getUserByUsername as dbGetUserByUsername, 
  getUserByEmail as dbGetUserByEmail,
  updateUser as dbUpdateUser, 
  deleteUser as dbDeleteUser, 
  login as dbLogin 
} from '../database/db.js';
import bcrypt from 'bcrypt';

export const userModel = {
  async getAllUsers(): Promise<{ users: User[]; total: number }> {
    try {
      return await dbGetAllUsers();
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  async getUserById(id: string): Promise<DBUser | null> {
    try {
      return await getUser(id);
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  },

  async getUserByUsername(username: string): Promise<DBUser | null> {
    try {
      return await dbGetUserByUsername(username);
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  },

  async getUserByEmail(email: string): Promise<DBUser | null> {
    try {
      return await dbGetUserByEmail(email);
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  async createUser(user: UserCreate): Promise<DBUser | null> {
    try {
      return await dbCreateUser(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id: string, updates: Partial<DBUser>): Promise<DBUser> {
    try {
      const updatedUser = await dbUpdateUser(id, updates);
      if (!updatedUser) {
        throw new Error(`User with id ${id} not found`);
      }
      return updatedUser;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update user: ${errorMessage}`);
    }
  },

  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get user to verify current password
      const user = await getUser(id) as DBUser | null;
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return false;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const success = await dbUpdateUser(id, { password: hashedPassword });
      return !!success;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update password: ${errorMessage}`);
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      return await dbDeleteUser(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async login(email: string, password: string): Promise<DBUser | null> {
    try {
      // Get user by email first
      const user = await dbGetUserByEmail(email);
      if (!user) {
        return null;
      }

      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }
};
