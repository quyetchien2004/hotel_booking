import { Router } from 'express';
import { createBooking, getInvoiceDetail, getMyBookings } from '../controllers/bookingController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', requireAuth, createBooking);
router.get('/my', requireAuth, getMyBookings);
router.get('/invoice/:invoiceRef', requireAuth, getInvoiceDetail);

export default router;