import { Router } from 'express';
import { showMockVnpay, vnpayCallback } from '../controllers/paymentController.js';

const router = Router();

router.get('/vnpay/mock', showMockVnpay);
router.get('/vnpay/callback', vnpayCallback);

export default router;