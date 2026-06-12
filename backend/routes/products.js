import express from 'express';
import { getProducts, createProduct, toggleProduct } from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('admin'), createProduct);

router.patch('/:id/toggle', protect, authorize('admin'), toggleProduct);

export default router;
