import express from 'express';
import { getActivities, submitActionRequest, resolveActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/:passportId', getActivities);
router.post('/request', submitActionRequest);
router.put('/:id/resolve', resolveActivity);

export default router;
