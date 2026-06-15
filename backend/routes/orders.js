import express from 'express';
import { submitOrder, getOrders, exportOrdersCsv, getOrderStats, getTrackingStats } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// All order routes are protected by authentication
router.use(protect);

router.get('/stats', getOrderStats);
router.get('/tracking-stats', authorize('admin'), getTrackingStats);

router.route('/')
  .post(submitOrder)
  .get(getOrders);

router.get('/export', exportOrdersCsv);

export default router;
