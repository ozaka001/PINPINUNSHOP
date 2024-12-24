import express from "express";
import { getAllUsers, createUser, updateUser, deleteUser } from "../database/db.js";
import { auth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// GET /api/admin/users
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const users = await getAllUsers(page, pageSize);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/admin/users
router.post("/", async (req, res) => {
  try {
    const userData = req.body;
    const user = await createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /api/admin/users/:id
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const userData = req.body;
    const success = await updateUser(id, userData);
    if (success) {
      res.json({ message: "User updated successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const success = await deleteUser(id);
    if (success) {
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Profile picture upload route
router.post('/:id/profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is updating their own profile
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file path relative to the public directory
    const imageUrl = `/uploads/${req.file.filename}`;

    // Update user's profile picture in database
    const success = await updateUser(id, { imageProfile: imageUrl });
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Profile picture updated successfully',
      imageUrl 
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

export default router;
