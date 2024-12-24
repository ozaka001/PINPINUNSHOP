import express from 'express';
import { 
  getAllUsers, 
  getUserByEmail, 
  getUserById, 
  createUser, 
  updateUser, 
  updateUserPassword,
  uploadProfilePicture
} from '../controllers/userController.js';
import upload from '../middleware/upload.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { ensureInitialized } from '../database/db.js';

const router = express.Router();

// Public routes
router.post('/', createUser);
router.get('/check-email/:email', (req, res) => getUserByEmail(req, res));

// Protected routes
router.use(auth);
router.get('/:id', getUserById);
router.put('/:id', async (req, res) => {
  try {
    const realm = await ensureInitialized();
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      address,
      city,
      postalCode,
      imageProfile 
    } = req.body;

    const user = realm.objectForPrimaryKey('User', id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    realm.write(() => {
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      if (city !== undefined) user.city = city;
      if (postalCode !== undefined) user.postalCode = postalCode;
      if (imageProfile !== undefined) user.imageProfile = imageProfile;
      user.updated_at = new Date().toISOString();
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.put('/:id/password', updateUserPassword);
router.post('/:id/profile-picture', upload.single('profilePicture'), uploadProfilePicture);

// Admin only routes
router.use(adminAuth);
router.get('/', getAllUsers);

export default router;
