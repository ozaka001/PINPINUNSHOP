import express from 'express';
import auth from '../middleware/auth.js';
import {
  getAllProductTypes,
  getProductType,
  createProductType,
  updateProductType,
  deleteProductType
} from '../controllers/productTypeController.js';

const router = express.Router();

// Public routes
router.get('/', getAllProductTypes);
router.get('/:id', getProductType);

// Protected admin routes
router.post('/', auth.protect, auth.adminAuth, createProductType);
router.put('/:id', auth.protect, auth.adminAuth, updateProductType);
router.delete('/:id', auth.protect, auth.adminAuth, deleteProductType);

export default router;
