import express from 'express';
import { upload, uploadImage, uploadSlip } from '../controllers/uploadController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (require authentication)
router.use(auth);

// Upload general image
router.post('/', upload.single('image'), uploadImage);

// Upload payment slip
router.post('/slip', upload.single('slip'), uploadSlip);

export default router;
