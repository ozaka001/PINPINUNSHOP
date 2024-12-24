import express from 'express';
import { 
  getProductTypes, 
  getBrands, 
  getCategories, 
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts
} from '../controllers/productController.js';

const router = express.Router();

// Product metadata operations (more specific routes first)
router.get('/types', getProductTypes);
router.get('/brands', getBrands);
router.get('/categories', getCategories);

// Product CRUD operations
router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/:id', getProductById);

export default router;
