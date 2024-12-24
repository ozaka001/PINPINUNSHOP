import type { User, UserCreate } from '../types.js';

const API_BASE_URL = process.env.VITE_API_BASE_URL;

export async function createUser(user: UserCreate): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to get user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error('Failed to get users');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

export async function updateUser(id: number, updates: Partial<User>): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

export async function login(email: string, password: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    return await response.json();
  } catch (error) {
    console.error('Error logging in:', error);
    return null;
  }
}
