import { Router } from 'express';
import {
  approveBooking,
  createUserByAdmin,
  deleteBranch,
  deleteRoom,
  deleteVoucher,
  getBranches,
  getPendingBookings,
  getSupportRequests,
  getRooms,
  getVouchers,
  listUsers,
  rejectBooking,
  saveBranch,
  saveRoom,
  saveVoucher,
  updateSupportRequestStatus,
} from '../controllers/adminController.js';
import { requireAdmin, requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', listUsers);
router.post('/', createUserByAdmin);

router.get('/branches', getBranches);
router.post('/branches/save', saveBranch);
router.post('/branches/:branchId/delete', deleteBranch);

router.get('/rooms', getRooms);
router.post('/rooms/save', saveRoom);
router.post('/rooms/:roomId/delete', deleteRoom);

router.get('/vouchers', getVouchers);
router.post('/vouchers/save', saveVoucher);
router.post('/vouchers/:voucherId/delete', deleteVoucher);

router.get('/bookings/pending', getPendingBookings);
router.post('/bookings/:bookingId/approve', approveBooking);
router.post('/bookings/:bookingId/reject', rejectBooking);

router.get('/support-requests', getSupportRequests);
router.patch('/support-requests/:supportRequestId/status', updateSupportRequestStatus);

router.get('/users', listUsers);
router.post('/users', createUserByAdmin);

export default router;
