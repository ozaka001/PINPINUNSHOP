import express from 'express';
import cartRoutes from './cart.js';
import uploadRoutes from './upload.js';

const router = express.Router();

router.use('/carts', cartRoutes);
router.use('/upload', uploadRoutes);

export default router;
