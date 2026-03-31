import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  getInvoiceDetail,
  getMyBookings,
  rescheduleBooking,
} from '../controllers/bookingController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', requireAuth, createBooking);
router.get('/my', requireAuth, getMyBookings);
router.post('/:bookingId/cancel', requireAuth, cancelBooking);
router.patch('/:bookingId/reschedule', requireAuth, rescheduleBooking);
router.get('/invoice/:invoiceRef', requireAuth, getInvoiceDetail);

export default router;
