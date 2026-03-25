import { Router } from 'express';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import roomRoutes from './roomRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/rooms', roomRoutes);
router.use('/admin', adminRoutes);
router.use('/users', adminRoutes);

export default router;
