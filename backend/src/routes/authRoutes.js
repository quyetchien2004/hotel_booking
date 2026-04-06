import { Router } from 'express';
import {
	getProfile,
	login,
	register,
	resetPasswordWithOtp,
	sendPasswordResetOtp,
	verifyCccd,
} from '../controllers/authController.js';
import { uploadCccdVerificationImages } from '../middlewares/uploadMiddleware.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getProfile);
router.post('/verify-cccd', requireAuth, uploadCccdVerificationImages, verifyCccd);
router.post('/send-password-reset-otp', sendPasswordResetOtp);
router.post('/reset-password-otp', resetPasswordWithOtp);

export default router;
