import { Request, Response } from 'express';
import { userModel } from '../models/userModel.js';
import type { User, UserCreate } from '../../types.js';
import { realm, ensureInitialized } from '../database/db.js';
import { UserSchemaType } from '../database/realmSchema.js';

export async function createUser(req: Request, res: Response) {
  try {
    const userData: UserCreate = req.body;
    const user = await userModel.createUser(userData);
    if (user) {
      res.json(user);
    } else {
      res.status(400).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const user = await userModel.getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    
    const result = await userModel.getAllUsers();
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = result.users.slice(startIndex, startIndex + pageSize).map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      imageProfile: user.imageProfile,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
    
    res.json({
      users: paginatedUsers,
      total: result.users.length,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await userModel.login(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const userData = req.body;
    const user = await userModel.updateUser(id, userData);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const success = await userModel.deleteUser(id);
    if (success) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserByUsername(req: Request, res: Response) {
  try {
    const username = req.params.username;
    const user = await userModel.getUserByUsername(username);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error getting user by username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const realm = await ensureInitialized();
    realm.write(() => {
      const user = realm.objectForPrimaryKey<UserSchemaType>('User', userId);
      if (user) {
        user.imageProfile = imageBase64;
      } else {
        throw new Error('User not found');
      }
    });

    res.json({ 
      message: 'Profile picture updated successfully',
      imageProfile: imageBase64
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

export async function getUserByEmail(req: Request, res: Response) {
  try {
    const { email } = req.params;
    const user = await userModel.getUserByEmail(email);
    res.json({ exists: !!user });
  } catch (error) {
    console.error('Error getting user by email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserPassword(req: Request, res: Response) {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updated = await userModel.updatePassword(userId, currentPassword, newPassword);
    
    if (updated) {
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(400).json({ error: 'Failed to update password' });
    }
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
