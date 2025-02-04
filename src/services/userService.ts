import { User, UserCreate } from '../types.js';
import api from './api.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const userService = {
  async login(email: string, password: string): Promise<(User & { token: string }) | null> {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  async getAllUsers(page?: string, pageSize?: string): Promise<{ users: User[], total: number }> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (pageSize) params.append('pageSize', pageSize);
      
      const response = await api.get(`/users${params.toString() ? `?${params.toString()}` : ''}`);
      // Ensure we have the correct response format
      if (Array.isArray(response.data)) {
        // If the response is an array, transform it to the expected format
        return {
          users: response.data,
          total: response.data.length
        };
      }
      // If it's already in the correct format, return as is
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await api.get(`/users/check-email/${encodeURIComponent(email)}`);
      return response.data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      throw error;
    }
  },

  async createUser(userData: UserCreate): Promise<User> {
    // First check if email exists
    try {
      const emailExists = await this.checkEmailExists(userData.email);
      if (emailExists) {
        throw new Error('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น');
      }
      
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id: string, userData: Partial<User>): Promise<boolean> {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  },

  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const response = await api.put(`/users/${id}/password`, {
        currentPassword,
        newPassword
      });
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    const response = await api.delete(`/users/${id}`);
    return response.status >= 200 && response.status < 300;
  },

  async uploadProfilePicture(id: string, file: File): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64String = reader.result as string;
            const response = await api.post(`/users/${id}/profile-picture`, {
              imageBase64: base64String
            });
            resolve(response.data.imageProfile);
          } catch (error) {
            console.error('Error uploading profile picture:', error);
            reject(error);
          }
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  },
};
