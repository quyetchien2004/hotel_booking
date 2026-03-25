import { Booking } from '../models/Booking.js';
import { Room } from '../models/Room.js';
import {
  buildBookingFinancials,
  buildDateRange,
  findApplicableVoucher,
  isRoomAvailable,
  validateDateRange,
} from '../services/bookingService.js';
import { buildPaymentUrl } from '../services/paymentService.js';
import { ensureDemoData } from '../services/seedService.js';

function mapBookingResponse(booking) {
  return {
    bookingId: booking._id,
    customerFullName: booking.customerFullName,
    rentalMode: booking.rentalMode,
    branchName: booking.branchId?.name || '-',
    roomNumber: booking.roomId?.roomNumber || '-',
    checkInAt: booking.checkInAt,
    checkOutAt: booking.checkOutAt,
    originalPrice: booking.originalPrice,
    discountAmount: booking.discountAmount,
    totalPrice: booking.totalPrice,
    requiredPaymentAmount: booking.requiredPaymentAmount,
    paidAmount: booking.paidAmount,
    paymentOption: booking.paymentOption,
    paymentStatus: booking.paymentStatus,
    workflowStatus: booking.workflowStatus,
    appliedVoucherCode: booking.appliedVoucherCode,
    invoiceNumber: booking.invoiceNumber,
    invoiceIssuedAt: booking.invoiceIssuedAt,
    createdAt: booking.createdAt,
  };
}

export async function createBooking(request, response, next) {
  try {
    await ensureDemoData();

    const roomId = String(request.body?.roomId || '').trim();
    const customerFullName = String(request.body?.customerFullName || '').trim();
    const paymentOption = String(request.body?.paymentOption || 'DEPOSIT_30').toUpperCase();
    const voucherCode = String(request.body?.voucherCode || '').trim().toUpperCase();

    if (!roomId || !customerFullName) {
      const error = new Error('Thiếu roomId hoặc họ tên người đặt');
      error.statusCode = 400;
      throw error;
    }

    const range = buildDateRange(request.body);
    const rangeError = validateDateRange(range);
    if (rangeError) {
      const error = new Error(rangeError);
      error.statusCode = 400;
      throw error;
    }

    const room = await Room.findById(roomId).populate('branchId');
    if (!room || !room.branchId) {
      const error = new Error('Không tìm thấy phòng cần đặt');
      error.statusCode = 404;
      throw error;
    }

    if (room.status !== 'AVAILABLE') {
      const error = new Error('Phòng hiện không khả dụng');
      error.statusCode = 409;
      throw error;
    }

    const available = await isRoomAvailable(room._id, range.checkInAt, range.checkOutAt);
    if (!available) {
      const error = new Error('Phòng đã được đặt trong khoảng thời gian này');
      error.statusCode = 409;
      throw error;
    }

    const voucher = await findApplicableVoucher(voucherCode, request.auth.userId);
    const financials = buildBookingFinancials({ room, range, voucher, paymentOption });

    const booking = await Booking.create({
      userId: request.auth.userId,
      branchId: room.branchId._id,
      roomId: room._id,
      customerFullName,
      rentalMode: range.rentalMode,
      checkInAt: range.checkInAt,
      checkOutAt: range.checkOutAt,
      originalPrice: financials.originalPrice,
      discountAmount: financials.discountAmount,
      totalPrice: financials.totalPrice,
      requiredPaymentAmount: financials.requiredPaymentAmount,
      paidAmount: 0,
      paymentOption,
      paymentStatus: 'INITIATED',
      workflowStatus: 'PENDING_PAYMENT',
      appliedVoucherCode: voucher?.code || null,
    });

    response.status(201).json({
      bookingId: booking._id,
      totalPrice: booking.totalPrice,
      requiredPaymentAmount: booking.requiredPaymentAmount,
      paymentStatus: booking.paymentStatus,
      paymentUrl: buildPaymentUrl(booking),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyBookings(request, response, next) {
  try {
    const bookings = await Booking.find({ userId: request.auth.userId })
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 });

    response.json(bookings.map(mapBookingResponse));
  } catch (error) {
    next(error);
  }
}