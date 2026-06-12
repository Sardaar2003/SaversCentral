import express from 'express';
import { submitOrder, getOrders, exportOrdersCsv, getOrderStats } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All order routes are protected by authentication
router.use(protect);

router.get('/stats', getOrderStats);

router.route('/')
  .post(submitOrder)
  .get(getOrders);

router.get('/export', exportOrdersCsv);

export default router;
