import { Booking } from '../models/Booking.js';
import { Room } from '../models/Room.js';
import {
  buildBookingFinancials,
  buildDateRange,
  canCancelBooking,
  canRescheduleBooking,
  findApplicableVoucher,
  generateInvoiceNumber,
  getUserBookingProfile,
  isRoomAvailable,
  validateDateRange,
} from '../services/bookingService.js';
import {
  disableElectronicLockCodeForBooking,
  issueElectronicLockCodeForBooking,
  mapElectronicLockSummary,
  syncElectronicLockCodeForBooking,
} from '../services/electronicLockService.js';
import { buildPaymentUrl } from '../services/paymentService.js';
import { ensureDemoData } from '../services/seedService.js';

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function mapBookingResponse(booking) {
  return {
    bookingId: booking._id,
    customerFullName: booking.customerFullName,
    rentalMode: booking.rentalMode,
    branchName: booking.branchId?.name || '-',
    roomNumber: booking.roomId?.roomNumber || '-',
    roomId: booking.roomId?._id || booking.roomId || null,
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
    stayStatus: booking.stayStatus,
    appliedVoucherCode: booking.appliedVoucherCode,
    invoiceNumber: booking.invoiceNumber,
    invoiceIssuedAt: booking.invoiceIssuedAt,
    cancelledAt: booking.cancelledAt,
    cancellationReason: booking.cancellationReason || '',
    rescheduledAt: booking.rescheduledAt,
    checkedInAtActual: booking.checkedInAtActual,
    checkedOutAtActual: booking.checkedOutAtActual,
    createdAt: booking.createdAt,
    canCancel: canCancelBooking(booking),
    canReschedule: canRescheduleBooking(booking),
    ...mapElectronicLockSummary(booking),
  };
}

function buildPostBookingRedirect(booking) {
  const params = new URLSearchParams({
    bookingId: String(booking._id),
    status: String(booking.paymentStatus || ''),
    paymentStatus: String(booking.paymentStatus || ''),
    workflowStatus: String(booking.workflowStatus || ''),
    totalPrice: String(booking.totalPrice || 0),
    requiredPaymentAmount: String(booking.requiredPaymentAmount || 0),
    paidAmount: String(booking.paidAmount || 0),
  });

  if (booking.invoiceNumber) {
    params.set('invoiceNumber', booking.invoiceNumber);
  }

  return `/payment-result?${params.toString()}`;
}

async function findOwnedBooking(bookingId, auth, { allowAdmin = false } = {}) {
  const isAdmin = allowAdmin && String(auth?.role || '').toLowerCase() === 'admin';
  const filter = { _id: bookingId };

  if (!isAdmin) {
    filter.userId = auth.userId;
  }

  const booking = await Booking.findOne(filter).populate('branchId', 'name address province').populate(
    'roomId',
    'roomNumber roomType capacity status dailyRate hourlyRate',
  );

  if (!booking) {
    throw createHttpError('Không tìm thấy booking', 404);
  }

  return booking;
}

async function recalculateBooking(booking, payload, userId) {
  const range = buildDateRange(payload);
  const rangeError = validateDateRange(range);
  if (rangeError) {
    throw createHttpError(rangeError, 400);
  }

  if (booking.stayStatus !== 'RESERVED') {
    throw createHttpError('Chỉ có thể đổi lịch booking chưa check-in', 409);
  }

  const room = await Room.findById(booking.roomId);
  if (!room) {
    throw createHttpError('Không tìm thấy phòng cho booking', 404);
  }

  if (room.status === 'MAINTENANCE' || room.status === 'UNAVAILABLE') {
    throw createHttpError('Phòng đang tạm dừng vận hành', 409);
  }

  const conflict = await Booking.exists({
    _id: { $ne: booking._id },
    roomId: room._id,
    workflowStatus: { $nin: ['REJECTED', 'CANCELLED'] },
    stayStatus: { $ne: 'CHECKED_OUT' },
    checkInAt: { $lt: range.checkOutAt },
    checkOutAt: { $gt: range.checkInAt },
  });

  if (conflict) {
      throw createHttpError('Phòng không còn trống ở lịch mới', 409);
  }

  const voucher = await findApplicableVoucher(booking.appliedVoucherCode, userId);
  const financials = buildBookingFinancials({
    room,
    range,
    voucher,
    paymentOption: booking.paymentOption,
  });

  booking.rentalMode = range.rentalMode;
  booking.checkInAt = range.checkInAt;
  booking.checkOutAt = range.checkOutAt;
  booking.originalPrice = financials.originalPrice;
  booking.discountAmount = financials.discountAmount;
  booking.totalPrice = financials.totalPrice;
  booking.requiredPaymentAmount = financials.requiredPaymentAmount;
  booking.rescheduledAt = new Date();

  if (booking.paymentOption === 'FULL_100') {
    booking.paidAmount = financials.totalPrice;
    booking.paymentStatus = 'SUCCESS';
  } else {
    booking.paidAmount = Math.min(Number(booking.paidAmount || 0), financials.requiredPaymentAmount);
    booking.paymentStatus = booking.paidAmount > 0 ? 'PENDING' : 'INITIATED';
  }

  if (booking.workflowStatus !== 'PENDING_PAYMENT' && booking.workflowStatus !== 'PENDING_DEPOSIT_APPROVAL') {
    booking.workflowStatus = 'APPROVED';
  }

  await booking.save();
  if (booking.electronicLockCode) {
    await syncElectronicLockCodeForBooking(booking);
  }
  return booking;
}

export async function createBooking(request, response, next) {
  try {
    await ensureDemoData();

    const roomId = String(request.body?.roomId || '').trim();
    const customerFullName = String(request.body?.customerFullName || '').trim();
    const paymentOption = String(request.body?.paymentOption || 'DEPOSIT_30').toUpperCase();
    const voucherCode = String(request.body?.voucherCode || '').trim().toUpperCase();
    const allowedPaymentOptions = ['DEPOSIT_30', 'FULL_100', 'LOYAL_PENDING'];

    if (!roomId || !customerFullName) {
      throw createHttpError('Thiếu roomId hoặc họ tên người đặt', 400);
    }

    if (!allowedPaymentOptions.includes(paymentOption)) {
      throw createHttpError('Hình thức thanh toán không hợp lệ', 400);
    }

    const range = buildDateRange(request.body);
    const rangeError = validateDateRange(range);
    if (rangeError) {
      throw createHttpError(rangeError, 400);
    }

    const room = await Room.findById(roomId).populate('branchId');
    if (!room || !room.branchId) {
      throw createHttpError('Không tìm thấy phòng cần đặt', 404);
    }

    if (room.status !== 'AVAILABLE') {
      throw createHttpError('Phòng hiện không khả dụng', 409);
    }

    const available = await isRoomAvailable(room._id, range.checkInAt, range.checkOutAt);
    if (!available) {
      throw createHttpError('Phòng đã được đặt trong khoảng thời gian này', 409);
    }

    const bookingProfile = await getUserBookingProfile(request.auth.userId);
    if (paymentOption === 'LOYAL_PENDING' && !bookingProfile.isLoyalGuest) {
      throw createHttpError('Chỉ khách thân thiết mới được đặt phòng không cần thanh toán trước', 403);
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
      paymentStatus: paymentOption === 'LOYAL_PENDING' ? 'PENDING' : 'INITIATED',
      workflowStatus: paymentOption === 'LOYAL_PENDING' ? 'APPROVED' : 'PENDING_PAYMENT',
      stayStatus: 'RESERVED',
      appliedVoucherCode: voucher?.code || null,
    });

    if (paymentOption === 'LOYAL_PENDING') {
      booking.invoiceNumber = generateInvoiceNumber(booking._id);
      booking.invoiceIssuedAt = new Date();
      await booking.save();
      await issueElectronicLockCodeForBooking(booking, { sendEmail: true });
    }

    response.status(201).json({
      bookingId: booking._id,
      totalPrice: booking.totalPrice,
      requiredPaymentAmount: booking.requiredPaymentAmount,
      paymentStatus: booking.paymentStatus,
      workflowStatus: booking.workflowStatus,
      invoiceNumber: booking.invoiceNumber,
      loyalGuestBooking: paymentOption === 'LOYAL_PENDING',
      paymentUrl: paymentOption === 'LOYAL_PENDING' ? null : buildPaymentUrl(booking),
      redirectUrl: paymentOption === 'LOYAL_PENDING' ? buildPostBookingRedirect(booking) : '',
      ...mapElectronicLockSummary(booking),
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

    await Promise.all(bookings.map((booking) => syncElectronicLockCodeForBooking(booking)));

    response.json(bookings.map(mapBookingResponse));
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(request, response, next) {
  try {
    const booking = await findOwnedBooking(request.params.bookingId, request.auth);

    if (!canCancelBooking(booking)) {
      throw createHttpError('Booking này không thể hủy', 409);
    }

    booking.workflowStatus = 'CANCELLED';
    booking.paymentStatus = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelledByUserId = request.auth.userId;
    booking.cancellationReason = String(request.body?.reason || 'Khách hàng hủy lịch').trim();
    await booking.save();
    await disableElectronicLockCodeForBooking(booking, {
      status: 'DISABLED',
      reason: booking.cancellationReason,
      adminUserId: request.auth.userId,
    });

    response.json({
      message: 'Đã hủy booking thành công',
      booking: mapBookingResponse(booking),
    });
  } catch (error) {
    next(error);
  }
}

export async function rescheduleBooking(request, response, next) {
  try {
    const booking = await findOwnedBooking(request.params.bookingId, request.auth);

    if (!canRescheduleBooking(booking)) {
      throw createHttpError('Booking này không thể đổi lịch', 409);
    }

    await recalculateBooking(booking, request.body, request.auth.userId);

    response.json({
      message: 'Đã đổi lịch booking thành công',
      booking: mapBookingResponse(booking),
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceDetail(request, response, next) {
  try {
    const invoiceRef = String(request.params.invoiceRef || '').trim();

    if (!invoiceRef) {
      throw createHttpError('Thiếu mã hóa đơn hoặc mã đơn', 400);
    }

    const isAdmin = String(request.auth?.role || '').toLowerCase() === 'admin';
    const ownerFilter = isAdmin ? {} : { userId: request.auth.userId };

    const booking = await Booking.findOne({
      ...ownerFilter,
      $or: [{ invoiceNumber: invoiceRef }, { _id: invoiceRef }],
    })
      .populate('branchId', 'name address province')
      .populate('roomId', 'roomNumber roomType capacity')
      .populate('userId', 'name username email phone');

    if (!booking) {
      throw createHttpError('Không tìm thấy hóa đơn tương ứng', 404);
    }

    response.json({
      bookingId: booking._id,
      invoiceNumber: booking.invoiceNumber,
      invoiceIssuedAt: booking.invoiceIssuedAt,
      paymentStatus: booking.paymentStatus,
      workflowStatus: booking.workflowStatus,
      stayStatus: booking.stayStatus,
      customer: {
        fullName: booking.customerFullName,
        username: booking.userId?.username || null,
        email: booking.userId?.email || null,
        phone: booking.userId?.phone || null,
      },
      branch: {
        name: booking.branchId?.name || '-',
        address: booking.branchId?.address || '-',
        province: booking.branchId?.province || '-',
      },
      room: {
        roomNumber: booking.roomId?.roomNumber || '-',
        roomType: booking.roomId?.roomType || '-',
        capacity: booking.roomId?.capacity || 0,
      },
      stay: {
        rentalMode: booking.rentalMode,
        checkInAt: booking.checkInAt,
        checkOutAt: booking.checkOutAt,
        checkedInAtActual: booking.checkedInAtActual,
        checkedOutAtActual: booking.checkedOutAtActual,
      },
      payment: {
        paymentOption: booking.paymentOption,
        originalPrice: booking.originalPrice,
        discountAmount: booking.discountAmount,
        totalPrice: booking.totalPrice,
        requiredPaymentAmount: booking.requiredPaymentAmount,
        paidAmount: booking.paidAmount,
        appliedVoucherCode: booking.appliedVoucherCode,
      },
      electronicLock: mapElectronicLockSummary(booking),
      createdAt: booking.createdAt,
    });
  } catch (error) {
    next(error);
  }
}
