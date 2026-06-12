import express from 'express';
import { getProjects, createProject, toggleProject } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getProjects)
  .post(protect, authorize('admin'), createProject);

router.patch('/:id/toggle', protect, authorize('admin'), toggleProject);

export default router;
