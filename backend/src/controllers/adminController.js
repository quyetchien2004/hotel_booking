import bcrypt from 'bcryptjs';
import { Booking } from '../models/Booking.js';
import { Branch } from '../models/Branch.js';
import { Room } from '../models/Room.js';
import { SupportRequest } from '../models/SupportRequest.js';
import { User } from '../models/User.js';
import { Voucher } from '../models/Voucher.js';
import { canCancelBooking } from '../services/bookingService.js';
import {
  disableElectronicLockCodeForBooking,
  issueElectronicLockCodeForBooking,
  mapElectronicLockSummary,
  syncElectronicLockCodeForBooking,
} from '../services/electronicLockService.js';
import { ensureDemoData } from '../services/seedService.js';
import { promoteUserTrustAfterSuccessfulBooking } from '../services/trustService.js';

// Tạo lỗi HTTP thống nhất để middleware có thể đọc statusCode.
function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Chuyển dữ liệu sang số; nếu không hợp lệ thì dùng giá trị mặc định.
function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

// Chuẩn hóa dữ liệu chi nhánh trước khi trả về cho frontend quản trị.
function toBranchResponse(branch) {
  return {
    id: branch._id,
    name: branch.name,
    province: branch.province,
    address: branch.address,
    latitude: branch.latitude,
    longitude: branch.longitude,
    totalFloors: branch.totalFloors,
    roomsPerFloor: branch.roomsPerFloor,
  };
}

// Chuẩn hóa dữ liệu phòng để frontend admin dùng thống nhất.
function toRoomResponse(room) {
  return {
    id: room._id,
    branchId: room.branchId?._id || room.branchId || null,
    roomNumber: room.roomNumber,
    floorNumber: room.floorNumber,
    roomType: room.roomType,
    capacity: room.capacity,
    hourlyRate: room.hourlyRate,
    dailyRate: room.dailyRate,
    area: room.area,
    description: room.description || '',
    amenities: room.amenities || [],
    imageUrls: room.imageUrls || [],
    hasNiceView: Boolean(room.hasNiceView),
    status: room.status,
    branch: room.branchId
      ? {
          id: room.branchId._id || room.branchId,
          name: room.branchId.name,
        }
      : null,
  };
}

// Chuẩn hóa dữ liệu voucher.
function toVoucherResponse(voucher) {
  return {
    id: voucher._id,
    code: voucher.code,
    name: voucher.name,
    audience: voucher.audience,
    discountPercent: voucher.discountPercent,
    active: voucher.active,
    validFrom: voucher.validFrom,
    validTo: voucher.validTo,
  };
}

// Chuẩn hóa dữ liệu yêu cầu hỗ trợ.
function toSupportRequestResponse(item) {
  return {
    id: item._id,
    name: item.name,
    email: item.email,
    topic: item.topic,
    message: item.message,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// Chuẩn hóa booking cho các màn quản trị và thêm tóm tắt trạng thái khóa điện tử.
function toBookingResponse(booking) {
  return {
    id: booking._id,
    bookingId: booking._id,
    customerFullName: booking.customerFullName,
    username: booking.userId?.username || null,
    userId: booking.userId?._id || booking.userId || null,
    branchName: booking.branchId?.name || '-',
    branchId: booking.branchId?._id || booking.branchId || null,
    roomNumber: booking.roomId?.roomNumber || '-',
    roomId: booking.roomId?._id || booking.roomId || null,
    roomStatus: booking.roomId?.status || null,
    checkInAt: booking.checkInAt,
    checkOutAt: booking.checkOutAt,
    checkedInAtActual: booking.checkedInAtActual,
    checkedOutAtActual: booking.checkedOutAtActual,
    totalPrice: booking.totalPrice,
    requiredPaymentAmount: booking.requiredPaymentAmount,
    paidAmount: booking.paidAmount,
    paymentStatus: booking.paymentStatus,
    workflowStatus: booking.workflowStatus,
    stayStatus: booking.stayStatus,
    createdAt: booking.createdAt,
    ...mapElectronicLockSummary(booking),
  };
}

// Chuẩn hóa dữ liệu người dùng để trả về giao diện admin.
function toUserResponse(user) {
  return {
    id: user._id,
    username: user.username || '',
    fullName: user.name,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    isActive: Boolean(user.isActive !== false),
    isCccdVerified: Boolean(user.isCccdVerified),
    trustScore: Number(user.trustScore || 0),
    createdAt: user.createdAt,
  };
}

// Chuẩn hóa payload phòng từ request body trước khi create/update.
function buildRoomPayload(payload = {}) {
  return {
    branchId: payload.branchId || null,
    roomNumber: String(payload.roomNumber || '').trim(),
    floorNumber: toNumber(payload.floorNumber, 1),
    roomType: String(payload.roomType || 'SINGLE').toUpperCase(),
    capacity: toNumber(payload.capacity, 1),
    hourlyRate: toNumber(payload.hourlyRate, 0),
    dailyRate: toNumber(payload.dailyRate, 0),
    area: toNumber(payload.area, 0),
    description: String(payload.description || '').trim(),
    amenities: Array.isArray(payload.amenities)
      ? payload.amenities.map((item) => String(item || '').trim()).filter(Boolean)
      : String(payload.amenities || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
    imageUrls: Array.isArray(payload.imageUrls)
      ? payload.imageUrls.map((item) => String(item || '').trim()).filter(Boolean)
      : String(payload.imageUrls || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
    hasNiceView: Boolean(payload.hasNiceView),
    status: String(payload.status || 'AVAILABLE').toUpperCase(),
  };
}

// Chuẩn hóa payload user từ request body.
function buildUserPayload(payload = {}) {
  return {
    username: String(payload.username || '').trim().toLowerCase(),
    fullName: String(payload.fullName || payload.name || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    phone: String(payload.phone || '').trim(),
    role: String(payload.role || 'member').trim().toLowerCase(),
    isActive: payload.isActive !== false && payload.isActive !== 'false',
  };
}

// Cập nhật nhanh trạng thái vận hành của phòng khi admin check-in/check-out.
async function setRoomOperationalStatus(roomId, nextStatus) {
  if (!roomId) return;
  await Room.findByIdAndUpdate(roomId, { status: nextStatus });
}

// Tải booking kèm các quan hệ cần thiết cho tác vụ quản trị.
async function findBookingForAdmin(bookingId) {
  const booking = await Booking.findById(bookingId)
    .populate('userId', 'username name email')
    .populate('branchId', 'name')
    .populate('roomId', 'roomNumber status');

  if (!booking) {
    throw createHttpError('Không tìm thấy booking', 404);
  }

  return booking;
}

// Tổng hợp số liệu dashboard cho trang quản trị.
export async function getDashboardSummary(_request, response, next) {
  try {
    // Seed dữ liệu demo trước nếu cần.
    await ensureDemoData();

    // Xác định mốc đầu tháng hiện tại và đầu tháng kế tiếp để tính doanh thu tháng.
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Chạy song song nhiều truy vấn để tối ưu thời gian tải dashboard.
    const [
      totalUsers,
      activeUsers,
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      totalBookings,
      pendingApprovalBookings,
      checkedInBookings,
      revenueAgg,
      monthlyRevenueAgg,
      branchRevenueAgg,
      statusBreakdownAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      Room.countDocuments(),
      Room.countDocuments({ status: 'AVAILABLE' }),
      Room.countDocuments({ status: 'OCCUPIED' }),
      Room.countDocuments({ status: 'MAINTENANCE' }),
      Booking.countDocuments(),
      Booking.countDocuments({ workflowStatus: 'PENDING_DEPOSIT_APPROVAL' }),
      Booking.countDocuments({ stayStatus: 'CHECKED_IN' }),
      Booking.aggregate([
        { $match: { paymentStatus: { $in: ['SUCCESS', 'PENDING'] } } },
        { $group: { _id: null, revenue: { $sum: '$paidAmount' } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            paymentStatus: { $in: ['SUCCESS', 'PENDING'] },
            createdAt: { $gte: monthStart, $lt: nextMonthStart },
          },
        },
        { $group: { _id: null, revenue: { $sum: '$paidAmount' } } },
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: { $in: ['SUCCESS', 'PENDING'] } } },
        {
          $lookup: {
            from: 'branches',
            localField: 'branchId',
            foreignField: '_id',
            as: 'branch',
          },
        },
        { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$branchId',
            branchName: { $first: '$branch.name' },
            revenue: { $sum: '$paidAmount' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: '$workflowStatus',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Trả các thống kê tổng quan, top chi nhánh và breakdown trạng thái booking.
    response.json({
      stats: {
        totalUsers,
        activeUsers,
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        totalBookings,
        pendingApprovalBookings,
        checkedInBookings,
        totalRevenue: revenueAgg[0]?.revenue || 0,
        monthlyRevenue: monthlyRevenueAgg[0]?.revenue || 0,
      },
      topBranches: branchRevenueAgg.map((item) => ({
        branchId: item._id,
        branchName: item.branchName || '-',
        revenue: item.revenue,
        bookings: item.bookings,
      })),
      bookingStatusBreakdown: statusBreakdownAgg.map((item) => ({
        status: item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    // Chuyển lỗi cho middleware xử lý chung.
    next(error);
  }
}

// Lấy danh sách chi nhánh cho màn quản trị.
export async function getBranches(_request, response, next) {
  try {
    // Đảm bảo dữ liệu mẫu có sẵn trong môi trường demo.
    await ensureDemoData();
    const branches = await Branch.find().sort({ createdAt: -1 }).lean();
    response.json(branches.map(toBranchResponse));
  } catch (error) {
    // Đẩy lỗi sang middleware chung.
    next(error);
  }
}

// Tạo mới hoặc cập nhật chi nhánh.
export async function saveBranch(request, response, next) {
  try {
    // Đọc payload từ request; nếu có id thì hiểu là cập nhật.
    const payload = request.body || {};
    const id = payload.id || null;

    // Chuẩn hóa dữ liệu đầu vào của chi nhánh.
    const data = {
      name: String(payload.name || '').trim(),
      province: String(payload.province || '').trim(),
      address: String(payload.address || '').trim(),
      latitude: toNumber(payload.latitude),
      longitude: toNumber(payload.longitude),
      totalFloors: toNumber(payload.totalFloors, 1),
      roomsPerFloor: toNumber(payload.roomsPerFloor, 1),
    };

    if (!data.name || !data.province || !data.address) {
      // Thiếu thông tin tối thiểu thì không cho lưu.
      throw createHttpError('Thiếu thông tin chi nhánh bắt buộc', 400);
    }

    let branch;
    if (id) {
      // Nếu có id thì cập nhật chi nhánh hiện có.
      branch = await Branch.findByIdAndUpdate(id, data, { new: true });
    } else {
      // Nếu không có id thì tạo mới chi nhánh.
      branch = await Branch.create(data);
    }

    // Trả về chi nhánh sau khi lưu.
    response.json(toBranchResponse(branch));
  } catch (error) {
    // Chuyển lỗi cho middleware chung.
    next(error);
  }
}

// Xóa chi nhánh và toàn bộ phòng thuộc chi nhánh đó.
export async function deleteBranch(request, response, next) {
  try {
    // Xóa document chi nhánh.
    await Branch.findByIdAndDelete(request.params.branchId);
    // Dọn các phòng gắn với chi nhánh vừa xóa để tránh dữ liệu mồ côi.
    await Room.deleteMany({ branchId: request.params.branchId });
    response.json({ message: 'Đã xóa chi nhánh' });
  } catch (error) {
    // Đẩy lỗi cho middleware xử lý lỗi.
    next(error);
  }
}

// Lấy danh sách phòng, có thể lọc theo chi nhánh và trạng thái.
export async function getRooms(request, response, next) {
  try {
    // Seed dữ liệu mẫu trước khi đọc danh sách phòng.
    await ensureDemoData();
    const branchId = String(request.query.branchId || '').trim();
    const status = String(request.query.status || '').trim().toUpperCase();

    // Xây dựng filter động tùy theo query string.
    const filter = {};
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    // Tải danh sách phòng kèm tên chi nhánh và sắp xếp theo số phòng.
    const rooms = await Room.find(filter).populate('branchId', 'name').sort({ roomNumber: 1 }).lean();
    response.json(rooms.map(toRoomResponse));
  } catch (error) {
    // Chuyển lỗi lên middleware chung.
    next(error);
  }
}

// Tạo mới hoặc cập nhật phòng.
export async function saveRoom(request, response, next) {
  try {
    // Chuẩn hóa payload phòng từ request body.
    const payload = request.body || {};
    const id = payload.id || null;
    const data = buildRoomPayload(payload);

    if (!data.branchId || !data.roomNumber) {
      // branchId và roomNumber là 2 trường bắt buộc tối thiểu.
      throw createHttpError('Thiếu branchId hoặc số phòng', 400);
    }

    let room;
    if (id) {
      // Nếu có id thì cập nhật phòng và nạp lại tên chi nhánh.
      room = await Room.findByIdAndUpdate(id, data, { new: true }).populate('branchId', 'name');
    } else {
      // Nếu không có id thì tạo phòng mới rồi truy vấn lại để populate.
      room = await Room.create(data);
      room = await Room.findById(room._id).populate('branchId', 'name');
    }

    // Trả về phòng sau khi lưu thành công.
    response.json(toRoomResponse(room));
  } catch (error) {
    // Chuyển lỗi cho middleware chung.
    next(error);
  }
}

// Xóa một phòng theo id.
export async function deleteRoom(request, response, next) {
  try {
    await Room.findByIdAndDelete(request.params.roomId);
    response.json({ message: 'Đã xóa phòng' });
  } catch (error) {
    next(error);
  }
}

// Lấy danh sách voucher cho trang quản trị.
export async function getVouchers(_request, response, next) {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 }).lean();
    response.json(vouchers.map(toVoucherResponse));
  } catch (error) {
    next(error);
  }
}

// Tạo mới hoặc cập nhật voucher.
export async function saveVoucher(request, response, next) {
  try {
    // Nếu payload có id thì xem như cập nhật voucher cũ.
    const payload = request.body || {};
    const id = payload.id || null;

    // Chuẩn hóa dữ liệu voucher trước khi lưu.
    const data = {
      code: String(payload.code || '').trim().toUpperCase(),
      name: String(payload.name || '').trim(),
      audience: String(payload.audience || 'ALL').toUpperCase(),
      discountPercent: toNumber(payload.discountPercent, 0),
      active: Boolean(payload.active),
      validFrom: payload.validFrom ? new Date(payload.validFrom) : null,
      validTo: payload.validTo ? new Date(payload.validTo) : null,
    };

    if (!data.code || !data.name) {
      // Mã voucher và tên voucher là các trường bắt buộc.
      throw createHttpError('Thiếu mã hoặc tên voucher', 400);
    }

    let voucher;
    if (id) {
      // Cập nhật voucher nếu đã có id.
      voucher = await Voucher.findByIdAndUpdate(id, data, { new: true });
    } else {
      // Ngược lại tạo voucher mới.
      voucher = await Voucher.create(data);
    }

    // Trả voucher sau khi lưu để frontend cập nhật state.
    response.json(toVoucherResponse(voucher));
  } catch (error) {
    // Chuyển lỗi cho middleware chung.
    next(error);
  }
}

// Xóa voucher theo id.
export async function deleteVoucher(request, response, next) {
  try {
    await Voucher.findByIdAndDelete(request.params.voucherId);
    response.json({ message: 'Đã xóa voucher' });
  } catch (error) {
    // Chuyển lỗi về middleware xử lý lỗi chung.
    next(error);
  }
}

// Lấy danh sách booking đang chờ admin duyệt tiền cọc.
export async function getPendingBookings(_request, response, next) {
  try {
    // Seed dữ liệu mẫu nếu hệ thống đang ở môi trường demo.
    await ensureDemoData();
    // Lấy các booking có workflow đang chờ duyệt cọc.
    const bookings = await Booking.find({ workflowStatus: 'PENDING_DEPOSIT_APPROVAL' })
      .populate('userId', 'username')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber status')
      .sort({ createdAt: -1 });

    // Đồng bộ trạng thái khóa điện tử trước khi trả về giao diện admin.
    await Promise.all(bookings.map((booking) => syncElectronicLockCodeForBooking(booking)));

    response.json(bookings.map(toBookingResponse));
  } catch (error) {
    // Đẩy lỗi sang middleware chung.
    next(error);
  }
}

// Lấy toàn bộ booking, có thể lọc theo workflowStatus và stayStatus.
export async function getAllBookings(request, response, next) {
  try {
    // Seed dữ liệu demo nếu cần.
    await ensureDemoData();
    const workflowStatus = String(request.query.workflowStatus || '').trim().toUpperCase();
    const stayStatus = String(request.query.stayStatus || '').trim().toUpperCase();

    // Xây dựng bộ lọc động từ query string.
    const filter = {};
    if (workflowStatus) filter.workflowStatus = workflowStatus;
    if (stayStatus) filter.stayStatus = stayStatus;

    // Nạp booking kèm user, chi nhánh và phòng để admin dễ quan sát.
    const bookings = await Booking.find(filter)
      .populate('userId', 'username')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber status')
      .sort({ createdAt: -1 });

    // Cập nhật trạng thái khóa điện tử trước khi trả response.
    await Promise.all(bookings.map((booking) => syncElectronicLockCodeForBooking(booking)));

    response.json(bookings.map(toBookingResponse));
  } catch (error) {
    // Chuyển lỗi cho middleware chung.
    next(error);
  }
}

// Duyệt booking sau khi admin xác nhận thanh toán.
export async function approveBooking(request, response, next) {
  try {
    // Tải booking cần duyệt kèm thông tin liên quan.
    const booking = await Booking.findById(request.params.bookingId)
      .populate('userId', 'username email')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber status');

    if (!booking) {
      throw createHttpError('Không tìm thấy booking', 404);
    }

    // Đánh dấu booking đã được duyệt và thanh toán thành công.
    booking.workflowStatus = 'APPROVED';
    booking.paymentStatus = 'SUCCESS';
    await booking.save();

    // Tăng trust score cho user và cấp mã khóa điện tử cho booking.
    await promoteUserTrustAfterSuccessfulBooking(booking.userId?._id || booking.userId);
    await issueElectronicLockCodeForBooking(booking, { sendEmail: true });

    response.json(toBookingResponse(booking));
  } catch (error) {
    // Chuyển lỗi lên middleware xử lý chung.
    next(error);
  }
}

// Từ chối booking đang chờ duyệt.
export async function rejectBooking(request, response, next) {
  try {
    // Tìm booking admin muốn từ chối.
    const booking = await Booking.findById(request.params.bookingId)
      .populate('userId', 'username')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber status');

    if (!booking) {
      throw createHttpError('Không tìm thấy booking', 404);
    }

    // Booking bị từ chối thì xem như hủy, không còn hiệu lực thanh toán.
    booking.workflowStatus = 'REJECTED';
    booking.paymentStatus = 'CANCELLED';
    booking.cancelledAt = new Date();
    await booking.save();
    // Đồng thời vô hiệu hóa khóa điện tử nếu trước đó đã được cấp.
    await disableElectronicLockCodeForBooking(booking, {
      status: 'DISABLED',
      reason: 'Admin từ chối booking',
      adminUserId: request.auth.userId,
    });

    response.json(toBookingResponse(booking));
  } catch (error) {
    // Đẩy lỗi sang middleware chung.
    next(error);
  }
}

// Admin chủ động hủy một booking.
export async function adminCancelBooking(request, response, next) {
  try {
    // Tải booking cần hủy cùng các quan hệ liên quan.
    const booking = await findBookingForAdmin(request.params.bookingId);

    if (!canCancelBooking(booking)) {
      // Không cho hủy nếu booking đã ở trạng thái không còn hợp lệ để hủy.
      throw createHttpError('Booking này không thể hủy', 409);
    }

    // Cập nhật trạng thái hủy và lưu lý do admin cung cấp.
    booking.workflowStatus = 'CANCELLED';
    booking.paymentStatus = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancellationReason = String(request.body?.reason || 'Admin hủy booking').trim();
    await booking.save();
    // Khóa hoặc vô hiệu hóa mã khóa điện tử đi kèm booking.
    await disableElectronicLockCodeForBooking(booking, {
      status: 'DISABLED',
      reason: booking.cancellationReason,
      adminUserId: request.auth.userId,
    });

    response.json({
      message: 'Admin đã hủy booking',
      booking: toBookingResponse(booking),
    });
  } catch (error) {
    // Chuyển lỗi lên middleware xử lý lỗi.
    next(error);
  }
}

// Thực hiện check-in thủ công cho khách.
export async function checkInBooking(request, response, next) {
  try {
    // Lấy booking cần check-in.
    const booking = await findBookingForAdmin(request.params.bookingId);

    if (booking.workflowStatus !== 'APPROVED') {
      // Chỉ booking đã duyệt mới được check-in.
      throw createHttpError('Chỉ booking đã được phê duyệt mới được check-in', 409);
    }

    if (booking.stayStatus !== 'RESERVED') {
      // Booking phải đang ở trạng thái chờ check-in.
      throw createHttpError('Booking này không ở trạng thái chờ check-in', 409);
    }

    // Đánh dấu thời điểm khách check-in thực tế.
    booking.stayStatus = 'CHECKED_IN';
    booking.checkedInAtActual = new Date();
    await booking.save();
    // Đồng bộ trạng thái phòng sang OCCUPIED.
    await setRoomOperationalStatus(booking.roomId?._id || booking.roomId, 'OCCUPIED');
    await booking.populate('roomId', 'roomNumber status');

    response.json({
      message: 'Đã check-in thành công',
      booking: toBookingResponse(booking),
    });
  } catch (error) {
    // Chuyển lỗi cho middleware chung.
    next(error);
  }
}

// Thực hiện check-out và giải phóng phòng.
export async function checkOutBooking(request, response, next) {
  try {
    // Tải booking cần check-out.
    const booking = await findBookingForAdmin(request.params.bookingId);

    if (booking.stayStatus !== 'CHECKED_IN') {
      // Chỉ khách đang lưu trú mới được check-out.
      throw createHttpError('Chỉ booking đang check-in mới được check-out', 409);
    }

    // Lưu lại trạng thái và thời điểm check-out thực tế.
    booking.stayStatus = 'CHECKED_OUT';
    booking.checkedOutAtActual = new Date();
    await booking.save();
    // Sau khi trả phòng, mã khóa điện tử sẽ hết hạn.
    await disableElectronicLockCodeForBooking(booking, {
      status: 'EXPIRED',
      reason: 'Booking đã check-out',
      adminUserId: request.auth.userId,
    });
    // Trả phòng về trạng thái AVAILABLE để có thể đặt tiếp.
    await setRoomOperationalStatus(booking.roomId?._id || booking.roomId, 'AVAILABLE');
    await booking.populate('roomId', 'roomNumber status');

    response.json({
      message: 'Đã check-out thành công',
      booking: toBookingResponse(booking),
    });
  } catch (error) {
    // Đẩy lỗi sang middleware xử lý lỗi.
    next(error);
  }
}

// Liệt kê các booking có mã khóa điện tử để admin theo dõi.
export async function getElectronicLockCodes(request, response, next) {
  try {
    // Có thể lọc theo trạng thái mã khóa điện tử qua query string.
    const status = String(request.query.status || '').trim().toUpperCase();
    const filter = { electronicLockCode: { $ne: null } };

    // Tải các booking đã được cấp mã khóa.
    const bookings = await Booking.find(filter)
      .populate('userId', 'username name email')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 });

    // Đồng bộ trạng thái mã khóa trước khi chuẩn hóa response.
    await Promise.all(bookings.map((booking) => syncElectronicLockCodeForBooking(booking)));

    // Biến đổi dữ liệu booking thành danh sách mã khóa gọn hơn cho màn quản trị.
    const normalized = bookings
      .map((booking) => ({
        id: booking._id,
        bookingId: booking._id,
        customerFullName: booking.customerFullName,
        username: booking.userId?.username || null,
        email: booking.userId?.email || null,
        branchName: booking.branchId?.name || '-',
        roomNumber: booking.roomId?.roomNumber || '-',
        paymentStatus: booking.paymentStatus,
        workflowStatus: booking.workflowStatus,
        createdAt: booking.createdAt,
        ...mapElectronicLockSummary(booking),
      }))
      // Nếu admin truyền status thì chỉ giữ lại các mã khóa đúng trạng thái đó.
      .filter((item) => !status || item.electronicLockStatus === status);

    response.json(normalized);
  } catch (error) {
    // Chuyển lỗi về middleware chung.
    next(error);
  }
}

// Khóa thủ công một mã khóa điện tử đang active.
export async function lockElectronicLockCode(request, response, next) {
  try {
    // Tìm booking chứa mã khóa cần khóa.
    const booking = await Booking.findById(request.params.bookingId)
      .populate('userId', 'username name email')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber');

    if (!booking) {
      throw createHttpError('Không tìm thấy booking cho mã mở khóa', 404);
    }

    if (!booking.electronicLockCode) {
      // Booking chưa được cấp mã khóa thì không có gì để khóa.
      throw createHttpError('Booking này chưa có mã mở khóa điện tử', 409);
    }

    // Chỉ cho khóa khi mã hiện đang active.
    const resolvedStatus = mapElectronicLockSummary(booking).electronicLockStatus;
    if (resolvedStatus !== 'ACTIVE') {
      throw createHttpError('Chỉ mã mở khóa đang active mới có thể khóa', 409);
    }

    // Thực hiện khóa mã với lý do do admin cung cấp.
    await disableElectronicLockCodeForBooking(booking, {
      status: 'LOCKED',
      reason: String(request.body?.reason || 'Admin khóa mã mở khóa').trim(),
      adminUserId: request.auth.userId,
    });

    response.json({
      message: 'Đã khóa mã mở khóa điện tử',
      booking: {
        id: booking._id,
        bookingId: booking._id,
        customerFullName: booking.customerFullName,
        roomNumber: booking.roomId?.roomNumber || '-',
        ...mapElectronicLockSummary(booking),
      },
    });
  } catch (error) {
    // Chuyển lỗi cho middleware xử lý tập trung.
    next(error);
  }
}

// Lấy danh sách người dùng cho trang quản trị.
export async function listUsers(_request, response, next) {
  try {
    const users = await User.find()
      .select('_id username name email phone role isActive isCccdVerified trustScore createdAt')
      .sort({ createdAt: -1 })
      .lean();
    response.json(users.map(toUserResponse));
  } catch (error) {
    // Đẩy lỗi sang middleware chung.
    next(error);
  }
}

// Admin tạo một tài khoản mới.
export async function createUserByAdmin(request, response, next) {
  try {
    // Lấy mật khẩu raw để băm riêng; các field còn lại đi qua hàm chuẩn hóa.
    const password = String(request.body?.password || '');
    const data = buildUserPayload(request.body);

    if (!data.username || !password || !data.fullName || !data.email) {
      // Thiếu các field bắt buộc thì không cho tạo user.
      throw createHttpError('Thiếu thông tin user bắt buộc', 400);
    }

    // Chặn trùng username hoặc email.
    const exists = await User.findOne({ $or: [{ username: data.username }, { email: data.email }] }).lean();
    if (exists) {
      throw createHttpError('Username hoặc email đã tồn tại', 409);
    }

    // Băm mật khẩu trước khi lưu.
    const passwordHash = await bcrypt.hash(password, 10);
    // Tạo tài khoản với các giá trị xác minh/trust mặc định.
    const user = await User.create({
      username: data.username,
      name: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      isActive: data.isActive,
      isCccdVerified: false,
      trustScore: 0,
    });

    response.status(201).json(toUserResponse(user));
  } catch (error) {
    // Chuyển lỗi cho middleware chung.
    next(error);
  }
}

// Admin cập nhật thông tin một người dùng.
export async function updateUserByAdmin(request, response, next) {
  try {
    // Chuẩn hóa userId và dữ liệu cập nhật.
    const userId = String(request.params.userId || '').trim();
    const data = buildUserPayload(request.body);
    const password = String(request.body?.password || '');

    // Tìm user cần cập nhật.
    const user = await User.findById(userId);
    if (!user) {
      throw createHttpError('Không tìm thấy user', 404);
    }

    // Kiểm tra username/email mới có bị trùng với user khác không.
    const duplicate = await User.findOne({
      _id: { $ne: userId },
      $or: [{ username: data.username }, { email: data.email }],
    }).lean();
    if (duplicate) {
      throw createHttpError('Username hoặc email đã tồn tại', 409);
    }

    // Chỉ cập nhật các field được phép chỉnh sửa.
    user.username = data.username || user.username;
    user.name = data.fullName || user.name;
    user.email = data.email || user.email;
    user.phone = data.phone;
    user.role = data.role || user.role;
    user.isActive = data.isActive;

    if (password) {
      // Nếu admin nhập mật khẩu mới thì băm lại trước khi lưu.
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();
    response.json(toUserResponse(user));
  } catch (error) {
    // Chuyển lỗi cho middleware xử lý lỗi chung.
    next(error);
  }
}

// Admin xóa một tài khoản người dùng.
export async function deleteUserByAdmin(request, response, next) {
  try {
    if (String(request.params.userId) === String(request.auth.userId)) {
      // Ngăn admin tự xóa tài khoản đang đăng nhập để tránh tự khóa mình.
      throw createHttpError('Không thể xóa tài khoản admin đang đăng nhập', 409);
    }

    await User.findByIdAndDelete(request.params.userId);
    response.json({ message: 'Đã xóa user thành công' });
  } catch (error) {
    // Đẩy lỗi sang middleware chung.
    next(error);
  }
}

// Lấy danh sách yêu cầu hỗ trợ khách hàng.
export async function getSupportRequests(_request, response, next) {
  try {
    const requests = await SupportRequest.find().sort({ createdAt: -1 }).lean();
    response.json(requests.map(toSupportRequestResponse));
  } catch (error) {
    // Chuyển lỗi cho middleware xử lý lỗi.
    next(error);
  }
}

// Cập nhật trạng thái xử lý của một yêu cầu hỗ trợ.
export async function updateSupportRequestStatus(request, response, next) {
  try {
    // Chuẩn hóa trạng thái gửi lên từ client.
    const status = String(request.body?.status || '').trim().toUpperCase();
    const allowed = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

    if (!allowed.includes(status)) {
      // Chỉ chấp nhận các trạng thái đã định nghĩa sẵn.
      throw createHttpError('Trạng thái hỗ trợ không hợp lệ', 400);
    }

    // Cập nhật trạng thái và trả document mới nhất.
    const updated = await SupportRequest.findByIdAndUpdate(
      request.params.supportRequestId,
      { status },
      { new: true },
    ).lean();

    if (!updated) {
      throw createHttpError('Không tìm thấy yêu cầu hỗ trợ', 404);
    }

    response.json(toSupportRequestResponse(updated));
  } catch (error) {
    // Chuyển lỗi lên middleware tập trung.
    next(error);
  }
}

// Tổng hợp dữ liệu báo cáo cho trang quản trị.
export async function getReportsOverview(_request, response, next) {
  try {
    // Chuẩn bị mảng 6 tháng gần nhất để build series doanh thu/booking.
    const last6Months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      // start là đầu tháng, end là đầu tháng kế tiếp.
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      last6Months.push({ start, end, label: `${String(start.getMonth() + 1).padStart(2, '0')}/${start.getFullYear()}` });
    }

    // Với mỗi tháng, tính tổng doanh thu và số lượng booking.
    const monthlySeries = await Promise.all(
      last6Months.map(async ({ start, end, label }) => {
        const [revenueAgg, bookingCount] = await Promise.all([
          Booking.aggregate([
            {
              $match: {
                createdAt: { $gte: start, $lt: end },
                paymentStatus: { $in: ['SUCCESS', 'PENDING'] },
              },
            },
            { $group: { _id: null, revenue: { $sum: '$paidAmount' } } },
          ]),
          Booking.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        ]);

        return {
          label,
          revenue: revenueAgg[0]?.revenue || 0,
          bookings: bookingCount,
        };
      }),
    );

    // Thống kê số lượng phòng theo trạng thái hiện tại.
    const roomStatusBreakdown = await Room.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Lấy 10 booking sắp check-in gần nhất để admin theo dõi vận hành.
    const upcomingCheckins = await Booking.find({
      workflowStatus: 'APPROVED',
      stayStatus: 'RESERVED',
      checkInAt: { $gte: new Date() },
    })
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber')
      .sort({ checkInAt: 1 })
      .limit(10)
      .lean();

    // Trả toàn bộ dữ liệu báo cáo cho dashboard/biểu đồ.
    response.json({
      monthlySeries,
      roomStatusBreakdown: roomStatusBreakdown.map((item) => ({ status: item._id, count: item.count })),
      upcomingCheckins: upcomingCheckins.map((item) => ({
        bookingId: item._id,
        customerFullName: item.customerFullName,
        branchName: item.branchId?.name || '-',
        roomNumber: item.roomId?.roomNumber || '-',
        checkInAt: item.checkInAt,
      })),
    });
  } catch (error) {
    // Đẩy lỗi sang middleware xử lý chung.
    next(error);
  }
}
