import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { sendElectronicLockCodeEmail } from './mailService.js';
import { logger } from '../utils/logger.js';

const ACTIVE_LOCK_STATUSES = new Set(['ACTIVE', 'PENDING']);
const TERMINAL_LOCK_STATUSES = new Set(['LOCKED', 'DISABLED', 'EXPIRED']);

function isApprovedBooking(booking) {
  return String(booking?.workflowStatus || '').toUpperCase() === 'APPROVED';
}

function isCancelledBooking(booking) {
  return ['CANCELLED', 'REJECTED'].includes(String(booking?.workflowStatus || '').toUpperCase())
    || String(booking?.paymentStatus || '').toUpperCase() === 'CANCELLED';
}

function normalizeLockStatus(value) {
  return String(value || '').trim().toUpperCase();
}

export function isElectronicLockUsable(booking, now = new Date()) {
  if (!booking?.electronicLockCode) {
    return false;
  }

  const status = normalizeLockStatus(booking.electronicLockStatus);
  if (status !== 'ACTIVE') {
    return false;
  }

  const validFrom = booking.electronicLockValidFrom ? new Date(booking.electronicLockValidFrom) : null;
  const validUntil = booking.electronicLockValidUntil ? new Date(booking.electronicLockValidUntil) : null;

  if (!(validFrom instanceof Date) || Number.isNaN(validFrom?.getTime?.()) || !(validUntil instanceof Date) || Number.isNaN(validUntil?.getTime?.())) {
    return false;
  }

  return now.getTime() >= validFrom.getTime()
    && now.getTime() <= validUntil.getTime()
    && isApprovedBooking(booking)
    && !isCancelledBooking(booking);
}

export function buildElectronicLockInstructions(booking) {
  const roomNumber = booking?.roomId?.roomNumber || booking?.roomNumber || 'phòng được chỉ định';
  return `Dùng mã mở khóa trên bàn phím điện tử tại phòng ${roomNumber}. Nhập đúng số phòng, sau đó nhập mã mở khóa và nhấn phím xác nhận.`;
}

export function resolveElectronicLockStatus(booking, now = new Date()) {
  if (!booking?.electronicLockCode) {
    return 'UNAVAILABLE';
  }

  const status = normalizeLockStatus(booking.electronicLockStatus) || 'PENDING';
  if (TERMINAL_LOCK_STATUSES.has(status)) {
    return status;
  }

  if (isCancelledBooking(booking)) {
    return 'DISABLED';
  }

  const validUntil = booking.electronicLockValidUntil ? new Date(booking.electronicLockValidUntil) : null;
  if (validUntil instanceof Date && !Number.isNaN(validUntil.getTime()) && now.getTime() > validUntil.getTime()) {
    return 'EXPIRED';
  }

  if (isApprovedBooking(booking)) {
    return 'ACTIVE';
  }

  return status;
}

async function generateUniqueElectronicLockCode(bookingId) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = String(crypto.randomInt(0, 100_000_000)).padStart(8, '0');
    const conflict = await Booking.exists({
      _id: { $ne: bookingId },
      electronicLockCode: code,
      electronicLockStatus: { $in: ['ACTIVE', 'PENDING'] },
      electronicLockValidUntil: { $gte: new Date() },
    });

    if (!conflict) {
      return code;
    }
  }

  return String(crypto.randomInt(0, 100_000_000)).padStart(8, '0');
}

async function deliverElectronicLockCodeEmail(booking) {
  try {
    if (!booking?.userId?.email) {
      return false;
    }

    await sendElectronicLockCodeEmail({
      toEmail: booking.userId.email,
      customerName: booking.customerFullName,
      roomNumber: booking.roomId?.roomNumber || '-',
      branchName: booking.branchId?.name || '-',
      electronicLockCode: booking.electronicLockCode,
      validFrom: booking.electronicLockValidFrom,
      validUntil: booking.electronicLockValidUntil,
      instructions: buildElectronicLockInstructions(booking),
      paymentStatus: booking.paymentStatus,
      invoiceNumber: booking.invoiceNumber,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send electronic lock email', error);
    return false;
  }
}

export async function issueElectronicLockCodeForBooking(booking, { sendEmail = false, regenerate = false } = {}) {
  if (!booking) {
    return null;
  }

  if (!booking.electronicLockCode || regenerate) {
    booking.electronicLockCode = await generateUniqueElectronicLockCode(booking._id);
    booking.electronicLockIssuedAt = new Date();
  }

  booking.electronicLockValidFrom = booking.checkInAt;
  booking.electronicLockValidUntil = booking.checkOutAt;
  booking.electronicLockStatus = 'ACTIVE';
  booking.electronicLockLockedAt = null;
  booking.electronicLockLockedByUserId = null;
  booking.electronicLockDisabledReason = '';

  await booking.save();

  if (sendEmail) {
    await booking.populate([
      { path: 'userId', select: 'email name username' },
      { path: 'branchId', select: 'name' },
      { path: 'roomId', select: 'roomNumber' },
    ]);

    const delivered = await deliverElectronicLockCodeEmail(booking);
    if (delivered) {
      booking.electronicLockDeliveredAt = new Date();
      await booking.save();
    }
  }

  return booking;
}

export async function disableElectronicLockCodeForBooking(
  booking,
  { status = 'DISABLED', reason = '', adminUserId = null } = {},
) {
  if (!booking?.electronicLockCode) {
    return booking;
  }

  booking.electronicLockStatus = normalizeLockStatus(status) || 'DISABLED';
  booking.electronicLockLockedAt = new Date();
  booking.electronicLockLockedByUserId = adminUserId || null;
  booking.electronicLockDisabledReason = String(reason || '').trim();
  await booking.save();
  return booking;
}

export async function syncElectronicLockCodeForBooking(booking, { persist = true } = {}) {
  if (!booking?.electronicLockCode) {
    return booking;
  }

  const nextStatus = resolveElectronicLockStatus(booking);
  if (nextStatus === normalizeLockStatus(booking.electronicLockStatus)) {
    return booking;
  }

  booking.electronicLockStatus = nextStatus;
  if (nextStatus !== 'ACTIVE' && !booking.electronicLockLockedAt) {
    booking.electronicLockLockedAt = new Date();
  }

  if (persist) {
    await booking.save();
  }

  return booking;
}

export function mapElectronicLockSummary(booking) {
  const status = resolveElectronicLockStatus(booking);
  return {
    electronicLockCode: booking?.electronicLockCode || '',
    electronicLockStatus: status,
    electronicLockValidFrom: booking?.electronicLockValidFrom || null,
    electronicLockValidUntil: booking?.electronicLockValidUntil || null,
    electronicLockIssuedAt: booking?.electronicLockIssuedAt || null,
    electronicLockDeliveredAt: booking?.electronicLockDeliveredAt || null,
    electronicLockLockedAt: booking?.electronicLockLockedAt || null,
    electronicLockDisabledReason: booking?.electronicLockDisabledReason || '',
    electronicLockInstructions: buildElectronicLockInstructions(booking),
    electronicLockUsable: isElectronicLockUsable({ ...booking, electronicLockStatus: status }),
  };
}