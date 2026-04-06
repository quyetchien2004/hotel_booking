import { Router } from 'express';
import {
  adminCancelBooking,
  approveBooking,
  checkInBooking,
  checkOutBooking,
  createUserByAdmin,
  deleteBranch,
  deleteRoom,
  deleteUserByAdmin,
  deleteVoucher,
  getElectronicLockCodes,
  getAllBookings,
  getBranches,
  getDashboardSummary,
  getPendingBookings,
  getReportsOverview,
  getSupportRequests,
  getRooms,
  getVouchers,
  listUsers,
  lockElectronicLockCode,
  rejectBooking,
  saveBranch,
  saveRoom,
  saveVoucher,
  updateUserByAdmin,
  updateSupportRequestStatus,
} from '../controllers/adminController.js';
import { requireAdmin, requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', listUsers);
router.post('/', createUserByAdmin);
router.get('/dashboard', getDashboardSummary);
router.get('/reports/overview', getReportsOverview);

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
router.get('/bookings', getAllBookings);
router.get('/lock-codes', getElectronicLockCodes);
router.post('/bookings/:bookingId/approve', approveBooking);
router.post('/bookings/:bookingId/reject', rejectBooking);
router.post('/bookings/:bookingId/cancel', adminCancelBooking);
router.post('/bookings/:bookingId/check-in', checkInBooking);
router.post('/bookings/:bookingId/check-out', checkOutBooking);
router.post('/lock-codes/:bookingId/lock', lockElectronicLockCode);

router.get('/support-requests', getSupportRequests);
router.patch('/support-requests/:supportRequestId/status', updateSupportRequestStatus);

router.get('/users', listUsers);
router.post('/users', createUserByAdmin);
router.patch('/users/:userId', updateUserByAdmin);
router.post('/users/:userId/delete', deleteUserByAdmin);

export default router;
