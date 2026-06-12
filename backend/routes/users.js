import express from 'express';
import {
  getUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// All routes in this file require Admin access
router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.delete('/:id', deleteUser);
router.patch('/:id/status', updateUserStatus);
router.patch('/:id/role', updateUserRole);

// Team endpoints
router.route('/teams')
  .get(getTeams)
  .post(createTeam);

router.route('/teams/:id')
  .put(updateTeam)
  .delete(deleteTeam);

export default router;
