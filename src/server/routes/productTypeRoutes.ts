import express from 'express';
import {
  getAllProductTypes,
  getProductType,
  createProductType,
  updateProductType,
  deleteProductType
} from '../controllers/productTypeController.js';

const router = express.Router();

// Product type routes
router.get('/', getAllProductTypes);
router.get('/:id', getProductType);
router.post('/', createProductType);
router.put('/:id', updateProductType);
router.delete('/:id', deleteProductType);

export default router;
