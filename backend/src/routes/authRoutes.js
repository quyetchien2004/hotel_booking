import { Router } from 'express';
import {
	changePasswordByCccd,
	getProfile,
	login,
	register,
	verifyCccd,
} from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getProfile);
router.post('/verify-cccd', requireAuth, verifyCccd);
router.post('/change-password-cccd', changePasswordByCccd);

export default router;
