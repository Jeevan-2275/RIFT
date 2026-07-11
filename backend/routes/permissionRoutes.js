import express from 'express';
import { createPermission, getPermissions, updatePermission, deletePermission } from '../controllers/permissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createPermission);
router.get('/:passportId', getPermissions);
router.put('/:id', updatePermission);
router.delete('/:id', deletePermission);

export default router;
