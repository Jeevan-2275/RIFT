import express from 'express';
import { createPassport, getPassports, getPassportById, updatePassport, deletePassport, verifyPassport } from '../controllers/passportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister } from '../validators/authValidator.js'; // reuse if needed for passport validation

const router = express.Router();

// All passport routes are protected
router.use(protect);

router.post('/', createPassport);
router.get('/', getPassports);
router.get('/verify/:passportId', verifyPassport); // public? but keep protected for now
router.get('/:id', getPassportById);
router.put('/:id', updatePassport);
router.delete('/:id', deletePassport);

export default router;
