import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Voucher } from '../models/Voucher.js';

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function roundMoney(value) {
  return Math.round(Number(value || 0));
}

export function buildDateRange(payload = {}) {
  const rentalMode = String(payload.rentalMode || 'DAILY').toUpperCase();

  if (rentalMode === 'HOURLY') {
    const checkInAt = new Date(payload.startDateTime);
    const checkOutAt = new Date(payload.endDateTime);
    return { rentalMode, checkInAt, checkOutAt };
  }

  const checkInAt = new Date(payload.startDate);
  const checkOutAt = new Date(payload.endDate);
  checkInAt.setHours(14, 0, 0, 0);
  checkOutAt.setHours(12, 0, 0, 0);
  return { rentalMode: 'DAILY', checkInAt, checkOutAt };
}

export function validateDateRange(range) {
  if (!(range.checkInAt instanceof Date) || Number.isNaN(range.checkInAt.getTime())) {
    return 'Thời gian nhận phòng không hợp lệ';
  }
  if (!(range.checkOutAt instanceof Date) || Number.isNaN(range.checkOutAt.getTime())) {
    return 'Thời gian trả phòng không hợp lệ';
  }
  if (range.checkOutAt <= range.checkInAt) {
    return 'Thời gian trả phòng phải sau thời gian nhận phòng';
  }
  return null;
}

export function calculateStayUnits(range) {
  const milliseconds = range.checkOutAt.getTime() - range.checkInAt.getTime();
  if (range.rentalMode === 'HOURLY') {
    return Math.max(1, Math.ceil(milliseconds / (60 * 60 * 1000)));
  }
  return Math.max(1, Math.ceil(milliseconds / (24 * 60 * 60 * 1000)));
}

export function calculateRoomEstimate(room, range) {
  const units = calculateStayUnits(range);
  const unitPrice = range.rentalMode === 'HOURLY' ? Number(room.hourlyRate || 0) : Number(room.dailyRate || 0);
  return roundMoney(unitPrice * units);
}

export async function findApplicableVoucher(voucherCode, userId) {
  const code = String(voucherCode || '').trim().toUpperCase();
  if (!code) {
    return null;
  }

  const voucher = await Voucher.findOne({ code, active: true }).lean();
  if (!voucher) {
    return null;
  }

  const now = new Date();
  if (voucher.validFrom && now < voucher.validFrom) {
    return null;
  }
  if (voucher.validTo && now > voucher.validTo) {
    return null;
  }

  if (!userId) {
    return voucher.audience === 'ALL' ? voucher : null;
  }

  const [user, successfulCount] = await Promise.all([
    User.findById(userId).select('_id isCccdVerified trustScore').lean(),
    Booking.countDocuments({
      userId,
      paymentStatus: { $in: ['SUCCESS', 'PENDING'] },
      workflowStatus: { $nin: ['REJECTED', 'CANCELLED'] },
    }),
  ]);

  switch (voucher.audience) {
    case 'ALL':
      return voucher;
    case 'NEW_USER':
      return successfulCount === 0 ? voucher : null;
    case 'LOYAL':
      return successfulCount >= 2 ? voucher : null;
    case 'FREQUENT':
      return user?.isCccdVerified && Number(user?.trustScore || 0) >= 80 ? voucher : null;
    default:
      return null;
  }
}

export async function isRoomAvailable(roomId, checkInAt, checkOutAt) {
  const overlap = await Booking.exists({
    roomId,
    workflowStatus: { $nin: ['REJECTED', 'CANCELLED'] },
    stayStatus: { $ne: 'CHECKED_OUT' },
    checkInAt: { $lt: checkOutAt },
    checkOutAt: { $gt: checkInAt },
  });

  return !overlap;
}

export function canManageBookingLifecycle(booking) {
  return !['CANCELLED', 'REJECTED'].includes(String(booking.workflowStatus || '').toUpperCase());
}

export function canCancelBooking(booking) {
  if (!canManageBookingLifecycle(booking)) {
    return false;
  }

  const stayStatus = String(booking.stayStatus || '').toUpperCase();
  if (['CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW'].includes(stayStatus)) {
    return false;
  }

  return new Date(booking.checkInAt).getTime() > Date.now();
}

export function canRescheduleBooking(booking) {
  return canCancelBooking(booking);
}

export async function getAvailableRooms({ province, maxPrice, range }) {
  const filter = { status: 'AVAILABLE' };
  const rooms = await Room.find(filter).populate('branchId').sort({ dailyRate: 1, roomNumber: 1 }).lean();

  const filteredByProvince = rooms.filter((room) => {
    if (!province) {
      return true;
    }
    return normalizeText(room.branchId?.province).includes(normalizeText(province));
  });

  const availabilityChecks = await Promise.all(
    filteredByProvince.map(async (room) => {
      const available = await isRoomAvailable(room._id, range.checkInAt, range.checkOutAt);
      return { room, available };
    }),
  );

  return availabilityChecks
    .filter(({ room, available }) => {
      if (!available) {
        return false;
      }
      if (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) <= 0) {
        return true;
      }
      const estimate = calculateRoomEstimate(room, range);
      return estimate <= Number(maxPrice);
    })
    .map(({ room }) => room);
}

export function buildBookingFinancials({ room, range, voucher, paymentOption }) {
  const originalPrice = calculateRoomEstimate(room, range);
  const discountAmount = voucher ? roundMoney((originalPrice * Number(voucher.discountPercent || 0)) / 100) : 0;
  const totalPrice = Math.max(0, originalPrice - discountAmount);
  const requiredPaymentAmount = paymentOption === 'FULL_100'
    ? totalPrice
    : roundMoney(totalPrice * 0.3);

  return {
    originalPrice,
    discountAmount,
    totalPrice,
    requiredPaymentAmount,
  };
}

export function generateInvoiceNumber(bookingId) {
  const seed = crypto.createHash('md5').update(String(bookingId)).digest('hex').slice(0, 8).toUpperCase();
  return `INV-${new Date().getFullYear()}-${seed}`;
}
