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

// Tạo lỗi HTTP thống nhất để middleware chung đọc được statusCode.
function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Chuẩn hóa booking trước khi trả về cho frontend.
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

// Tạo đường dẫn frontend để chuyển người dùng tới trang kết quả sau thanh toán.
function buildPostBookingRedirect(booking) {
  // Đóng gói các thông tin cần hiển thị sau thanh toán vào query string.
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
    // Nếu đã phát hành hóa đơn thì gửi kèm luôn trong URL trả về.
    params.set('invoiceNumber', booking.invoiceNumber);
  }

  return `/payment-result?${params.toString()}`;
}

// Tìm booking thuộc về người dùng hiện tại; admin có thể được phép xem nếu allowAdmin = true.
async function findOwnedBooking(bookingId, auth, { allowAdmin = false } = {}) {
  // Admin chỉ bypass quyền sở hữu khi được truyền cờ cho phép rõ ràng.
  const isAdmin = allowAdmin && String(auth?.role || '').toLowerCase() === 'admin';
  const filter = { _id: bookingId };

  if (!isAdmin) {
    // Người dùng thường chỉ được thao tác với booking của chính mình.
    filter.userId = auth.userId;
  }

  // Nạp thêm thông tin chi nhánh và phòng để response đầy đủ hơn.
  const booking = await Booking.findOne(filter).populate('branchId', 'name address province').populate(
    'roomId',
    'roomNumber roomType capacity status dailyRate hourlyRate',
  );

  if (!booking) {
    // Không thấy booking hoặc không thuộc quyền sở hữu hợp lệ.
    throw createHttpError('Không tìm thấy booking', 404);
  }

  return booking;
}

// Tính lại lịch ở, giá tiền và trạng thái thanh toán khi người dùng đổi lịch booking.
async function recalculateBooking(booking, payload, userId) {
  // Chuyển payload mới thành khoảng thời gian chuẩn.
  const range = buildDateRange(payload);
  // Kiểm tra xem khoảng ngày giờ mới có hợp lệ không.
  const rangeError = validateDateRange(range);
  if (rangeError) {
    throw createHttpError(rangeError, 400);
  }

  if (booking.stayStatus !== 'RESERVED') {
    // Chỉ cho đổi lịch khi khách chưa check-in.
    throw createHttpError('Chỉ có thể đổi lịch booking chưa check-in', 409);
  }

  // Tải lại thông tin phòng hiện đang gắn với booking.
  const room = await Room.findById(booking.roomId);
  if (!room) {
    throw createHttpError('Không tìm thấy phòng cho booking', 404);
  }

  if (room.status === 'MAINTENANCE' || room.status === 'UNAVAILABLE') {
    // Không cho đổi lịch nếu phòng đang ngừng phục vụ.
    throw createHttpError('Phòng đang tạm dừng vận hành', 409);
  }

  // Kiểm tra xem lịch mới có bị trùng với booking khác của cùng phòng hay không.
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

  // Nếu booking có voucher thì kiểm tra lại voucher còn áp dụng được không.
  const voucher = await findApplicableVoucher(booking.appliedVoucherCode, userId);
  // Tính lại toàn bộ giá dựa trên khoảng thời gian mới và hình thức thanh toán cũ.
  const financials = buildBookingFinancials({
    room,
    range,
    voucher,
    paymentOption: booking.paymentOption,
  });

  // Ghi đè các thông tin thời gian và tiền mới lên booking.
  booking.rentalMode = range.rentalMode;
  booking.checkInAt = range.checkInAt;
  booking.checkOutAt = range.checkOutAt;
  booking.originalPrice = financials.originalPrice;
  booking.discountAmount = financials.discountAmount;
  booking.totalPrice = financials.totalPrice;
  booking.requiredPaymentAmount = financials.requiredPaymentAmount;
  booking.rescheduledAt = new Date();

  if (booking.paymentOption === 'FULL_100') {
    // Với booking thanh toán đủ 100%, paidAmount luôn bằng tổng tiền mới.
    booking.paidAmount = financials.totalPrice;
    booking.paymentStatus = 'SUCCESS';
  } else {
    // Với booking cọc, chỉ giữ lại số tiền đã thanh toán nhưng không vượt mức phải trả mới.
    booking.paidAmount = Math.min(Number(booking.paidAmount || 0), financials.requiredPaymentAmount);
    booking.paymentStatus = booking.paidAmount > 0 ? 'PENDING' : 'INITIATED';
  }

  if (booking.workflowStatus !== 'PENDING_PAYMENT' && booking.workflowStatus !== 'PENDING_DEPOSIT_APPROVAL') {
    // Các booking đã duyệt xong thì giữ ở trạng thái APPROVED sau khi đổi lịch.
    booking.workflowStatus = 'APPROVED';
  }

  // Lưu thay đổi xuống database.
  await booking.save();
  if (booking.electronicLockCode) {
    // Nếu booking đã có mã khóa điện tử thì đồng bộ lại theo lịch mới.
    await syncElectronicLockCodeForBooking(booking);
  }
  return booking;
}

// Tạo booking mới cho người dùng hiện tại.
export async function createBooking(request, response, next) {
  try {
    // Seed dữ liệu mẫu nếu môi trường đang cần dữ liệu demo.
    await ensureDemoData();

    // Chuẩn hóa dữ liệu đầu vào từ body request.
    const roomId = String(request.body?.roomId || '').trim();
    const customerFullName = String(request.body?.customerFullName || '').trim();
    const paymentOption = String(request.body?.paymentOption || 'DEPOSIT_30').toUpperCase();
    const voucherCode = String(request.body?.voucherCode || '').trim().toUpperCase();
    const allowedPaymentOptions = ['DEPOSIT_30', 'FULL_100', 'LOYAL_PENDING'];

    if (!roomId || !customerFullName) {
      // roomId và tên người đặt là hai thông tin tối thiểu bắt buộc.
      throw createHttpError('Thiếu roomId hoặc họ tên người đặt', 400);
    }

    if (!allowedPaymentOptions.includes(paymentOption)) {
      // Chỉ chấp nhận các hình thức thanh toán đã định nghĩa sẵn.
      throw createHttpError('Hình thức thanh toán không hợp lệ', 400);
    }

    // Chuyển input về khoảng thời gian đặt phòng chuẩn.
    const range = buildDateRange(request.body);
    // Kiểm tra mốc check-in/check-out có hợp lệ hay không.
    const rangeError = validateDateRange(range);
    if (rangeError) {
      throw createHttpError(rangeError, 400);
    }

    // Tìm phòng người dùng muốn đặt và nạp luôn thông tin chi nhánh.
    const room = await Room.findById(roomId).populate('branchId');
    if (!room || !room.branchId) {
      throw createHttpError('Không tìm thấy phòng cần đặt', 404);
    }

    if (room.status !== 'AVAILABLE') {
      // Phòng đang bảo trì/đã có khách sẽ không cho đặt mới.
      throw createHttpError('Phòng hiện không khả dụng', 409);
    }

    // Kiểm tra trùng lịch với các booking đang tồn tại.
    const available = await isRoomAvailable(room._id, range.checkInAt, range.checkOutAt);
    if (!available) {
      throw createHttpError('Phòng đã được đặt trong khoảng thời gian này', 409);
    }

    // Lấy hồ sơ booking của user để biết có phải khách thân thiết hay không.
    const bookingProfile = await getUserBookingProfile(request.auth.userId);
    if (paymentOption === 'LOYAL_PENDING' && !bookingProfile.isLoyalGuest) {
      // Chỉ khách thân thiết mới được giữ phòng mà chưa thanh toán trước.
      throw createHttpError('Chỉ khách thân thiết mới được đặt phòng không cần thanh toán trước', 403);
    }

    // Áp voucher nếu voucher hợp lệ với user và booking này.
    const voucher = await findApplicableVoucher(voucherCode, request.auth.userId);
    // Tính tiền gốc, tiền giảm, tổng tiền và số tiền cần thanh toán trước.
    const financials = buildBookingFinancials({ room, range, voucher, paymentOption });

    // Tạo booking ở trạng thái ban đầu tương ứng với phương thức thanh toán.
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
      // Khách thân thiết có thể được duyệt ngay, phát hành hóa đơn và mã khóa luôn.
      booking.invoiceNumber = generateInvoiceNumber(booking._id);
      booking.invoiceIssuedAt = new Date();
      await booking.save();
      await issueElectronicLockCodeForBooking(booking, { sendEmail: true });
    }

    // Trả thông tin booking và URL thanh toán/redirect cho frontend xử lý bước tiếp theo.
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
    // Chuyển mọi lỗi về middleware xử lý lỗi chung.
    next(error);
  }
}

// Lấy toàn bộ booking của người dùng hiện tại.
export async function getMyBookings(request, response, next) {
  try {
    // Truy vấn danh sách booking theo user đang đăng nhập.
    const bookings = await Booking.find({ userId: request.auth.userId })
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 });

    // Đồng bộ trạng thái mã khóa điện tử cho từng booking trước khi trả về.
    await Promise.all(bookings.map((booking) => syncElectronicLockCodeForBooking(booking)));

    // Trả danh sách booking đã chuẩn hóa.
    response.json(bookings.map(mapBookingResponse));
  } catch (error) {
    // Chuyển lỗi lên middleware tập trung.
    next(error);
  }
}

// Hủy booking của chính người dùng.
export async function cancelBooking(request, response, next) {
  try {
    // Chỉ lấy booking thuộc quyền của user hiện tại.
    const booking = await findOwnedBooking(request.params.bookingId, request.auth);

    if (!canCancelBooking(booking)) {
      // Một số trạng thái như đã check-in sẽ không cho hủy.
      throw createHttpError('Booking này không thể hủy', 409);
    }

    // Cập nhật trạng thái booking sang đã hủy.
    booking.workflowStatus = 'CANCELLED';
    booking.paymentStatus = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelledByUserId = request.auth.userId;
    booking.cancellationReason = String(request.body?.reason || 'Khách hàng hủy lịch').trim();
    await booking.save();
    // Nếu booking đã có mã khóa thì vô hiệu hóa luôn để đảm bảo an toàn.
    await disableElectronicLockCodeForBooking(booking, {
      status: 'DISABLED',
      reason: booking.cancellationReason,
      adminUserId: request.auth.userId,
    });

    // Trả lại booking mới nhất sau khi hủy.
    response.json({
      message: 'Đã hủy booking thành công',
      booking: mapBookingResponse(booking),
    });
  } catch (error) {
    // Chuyển lỗi cho middleware chung.
    next(error);
  }
}

// Đổi lịch cho một booking hiện có của người dùng.
export async function rescheduleBooking(request, response, next) {
  try {
    // Tìm booking thuộc user hiện tại.
    const booking = await findOwnedBooking(request.params.bookingId, request.auth);

    if (!canRescheduleBooking(booking)) {
      // Chỉ một số trạng thái nhất định mới được đổi lịch.
      throw createHttpError('Booking này không thể đổi lịch', 409);
    }

    // Tính lại lịch, tiền và trạng thái liên quan cho booking.
    await recalculateBooking(booking, request.body, request.auth.userId);

    // Trả booking sau khi đổi lịch thành công.
    response.json({
      message: 'Đã đổi lịch booking thành công',
      booking: mapBookingResponse(booking),
    });
  } catch (error) {
    // Đẩy lỗi sang middleware xử lý lỗi.
    next(error);
  }
}

// Lấy chi tiết hóa đơn từ mã hóa đơn hoặc booking id.
export async function getInvoiceDetail(request, response, next) {
  try {
    // invoiceRef có thể là invoiceNumber hoặc trực tiếp là booking id.
    const invoiceRef = String(request.params.invoiceRef || '').trim();

    if (!invoiceRef) {
      throw createHttpError('Thiếu mã hóa đơn hoặc mã đơn', 400);
    }

    // Admin xem được mọi hóa đơn; user thường chỉ xem được hóa đơn của mình.
    const isAdmin = String(request.auth?.role || '').toLowerCase() === 'admin';
    const ownerFilter = isAdmin ? {} : { userId: request.auth.userId };

    // Tìm booking theo invoiceNumber hoặc theo _id.
    const booking = await Booking.findOne({
      ...ownerFilter,
      $or: [{ invoiceNumber: invoiceRef }, { _id: invoiceRef }],
    })
      .populate('branchId', 'name address province')
      .populate('roomId', 'roomNumber roomType capacity')
      .populate('userId', 'name username email phone');

    if (!booking) {
      // Không tìm thấy hóa đơn phù hợp hoặc user không có quyền xem.
      throw createHttpError('Không tìm thấy hóa đơn tương ứng', 404);
    }

    // Trả toàn bộ chi tiết cần thiết để render trang hóa đơn.
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
    // Chuyển lỗi cho middleware xử lý chung.
    next(error);
  }
}
