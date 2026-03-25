import { Router } from 'express';
import { createBooking, getMyBookings } from '../controllers/bookingController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', requireAuth, createBooking);
router.get('/my', requireAuth, getMyBookings);

export default router;