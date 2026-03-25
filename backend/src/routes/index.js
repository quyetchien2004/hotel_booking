import { Router } from 'express';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import chatbotRoutes from './chatbotRoutes.js';
import healthRoutes from './healthRoutes.js';
import hotelRoutes from './hotelRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import roomRoutes from './roomRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/health', healthRoutes);
router.use('/hotels', hotelRoutes);
router.use('/payments', paymentRoutes);
router.use('/rooms', roomRoutes);
router.use('/admin', adminRoutes);
router.use('/users', adminRoutes);

export default router;
