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

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

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

async function setRoomOperationalStatus(roomId, nextStatus) {
  if (!roomId) return;
  await Room.findByIdAndUpdate(roomId, { status: nextStatus });
}

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

export async function getDashboardSummary(_request, response, next) {
  try {
    await ensureDemoData();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

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
    next(error);
  }
}

export async function getBranches(_request, response, next) {
  try {
    await ensureDemoData();
    const branches = await Branch.find().sort({ createdAt: -1 }).lean();
    response.json(branches.map(toBranchResponse));
  } catch (error) {
    next(error);
  }
}

export async function saveBranch(request, response, next) {
  try {
    const payload = request.body || {};
    const id = payload.id || null;

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
      throw createHttpError('Thiếu thông tin chi nhánh bắt buộc', 400);
    }

    let branch;
    if (id) {
      branch = await Branch.findByIdAndUpdate(id, data, { new: true });
    } else {
      branch = await Branch.create(data);
    }

    response.json(toBranchResponse(branch));
  } catch (error) {
    next(error);
  }
}

export async function deleteBranch(request, response, next) {
  try {
    await Branch.findByIdAndDelete(request.params.branchId);
    await Room.deleteMany({ branchId: request.params.branchId });
    response.json({ message: 'Đã xóa chi nhánh' });
  } catch (error) {
    next(error);
  }
}

export async function getRooms(request, response, next) {
  try {
    await ensureDemoData();
    const branchId = String(request.query.branchId || '').trim();
    const status = String(request.query.status || '').trim().toUpperCase();

    const filter = {};
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    const rooms = await Room.find(filter).populate('branchId', 'name').sort({ roomNumber: 1 }).lean();
    response.json(rooms.map(toRoomResponse));
  } catch (error) {
    next(error);
  }
}

export async function saveRoom(request, response, next) {
  try {
    const payload = request.body || {};
    const id = payload.id || null;
    const data = buildRoomPayload(payload);

    if (!data.branchId || !data.roomNumber) {
      throw createHttpError('Thiếu branchId hoặc số phòng', 400);
    }

    let room;
    if (id) {
      room = await Room.findByIdAndUpdate(id, data, { new: true }).populate('branchId', 'name');
    } else {
      room = await Room.create(data);
      room = await Room.findById(room._id).populate('branchId', 'name');
    }

    response.json(toRoomResponse(room));
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(request, response, next) {
  try {
    await Room.findByIdAndDelete(request.params.roomId);
    response.json({ message: 'Đã xóa phòng' });
  } catch (error) {
    next(error);
  }
}

export async function getVouchers(_request, response, next) {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 }).lean();
    response.json(vouchers.map(toVoucherResponse));
  } catch (error) {
    next(error);
  }
}

export async function saveVoucher(request, response, next) {
  try {
    const payload = request.body || {};
    const id = payload.id || null;

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
      throw createHttpError('Thiếu mã hoặc tên voucher', 400);
    }

    let voucher;
    if (id) {
      voucher = await Voucher.findByIdAndUpdate(id, data, { new: true });
    } else {
      voucher = await Voucher.create(data);
    }

    response.json(toVoucherResponse(voucher));
  } catch (error) {
    next(error);
  }
}

export async function deleteVoucher(request, response, next) {
  try {
    await Voucher.findByIdAndDelete(request.params.voucherId);
    response.json({ message: 'Đã xóa voucher' });
  } catch (error) {
    next(error);
  }
}

export async function getPendingBookings(_request, response, next) {
  try {
    await ensureDemoData();
    const bookings = await Booking.find({ workflowStatus: 'PENDING_DEPOSIT_APPROVAL' })
      .populate('userId', 'username')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber status')
      .sort({ createdAt: -1 });

    await Promise.all(bookings.map((booking) => syncElectronicLockCodeForBooking(booking)));

    response.json(bookings.map(toBookingResponse));
  } catch (error) {
    next(error);
  }
}

export async function getAllBookings(request, response, next) {
  try {
    await ensureDemoData();
    const workflowStatus = String(request.query.workflowStatus || '').trim().toUpperCase();
    const stayStatus = String(request.query.stayStatus || '').trim().toUpperCase();

    const filter = {};
    if (workflowStatus) filter.workflowStatus = workflowStatus;
    if (stayStatus) filter.stayStatus = stayStatus;

    const bookings = await Booking.find(filter)
      .populate('userId', 'username')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber status')
      .sort({ createdAt: -1 });

    await Promise.all(bookings.map((booking) => syncElectronicLockCodeForBooking(booking)));

    response.json(bookings.map(toBookingResponse));
  } catch (error) {
    next(error);
  }
}

export async function approveBooking(request, response, next) {
  try {
    const booking = await Booking.findById(request.params.bookingId)
      .populate('userId', 'username email')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber status');

    if (!booking) {
      throw createHttpError('Không tìm thấy booking', 404);
    }

    booking.workflowStatus = 'APPROVED';
    booking.paymentStatus = 'SUCCESS';
    await booking.save();

    await promoteUserTrustAfterSuccessfulBooking(booking.userId?._id || booking.userId);
    await issueElectronicLockCodeForBooking(booking, { sendEmail: true });

    response.json(toBookingResponse(booking));
  } catch (error) {
    next(error);
  }
}

export async function rejectBooking(request, response, next) {
  try {
    const booking = await Booking.findById(request.params.bookingId)
      .populate('userId', 'username')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber status');

    if (!booking) {
      throw createHttpError('Không tìm thấy booking', 404);
    }

    booking.workflowStatus = 'REJECTED';
    booking.paymentStatus = 'CANCELLED';
    booking.cancelledAt = new Date();
    await booking.save();
    await disableElectronicLockCodeForBooking(booking, {
      status: 'DISABLED',
      reason: 'Admin từ chối booking',
      adminUserId: request.auth.userId,
    });

    response.json(toBookingResponse(booking));
  } catch (error) {
    next(error);
  }
}

export async function adminCancelBooking(request, response, next) {
  try {
    const booking = await findBookingForAdmin(request.params.bookingId);

    if (!canCancelBooking(booking)) {
      throw createHttpError('Booking này không thể hủy', 409);
    }

    booking.workflowStatus = 'CANCELLED';
    booking.paymentStatus = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancellationReason = String(request.body?.reason || 'Admin hủy booking').trim();
    await booking.save();
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
    next(error);
  }
}

export async function checkInBooking(request, response, next) {
  try {
    const booking = await findBookingForAdmin(request.params.bookingId);

    if (booking.workflowStatus !== 'APPROVED') {
      throw createHttpError('Chỉ booking đã được phê duyệt mới được check-in', 409);
    }

    if (booking.stayStatus !== 'RESERVED') {
      throw createHttpError('Booking này không ở trạng thái chờ check-in', 409);
    }

    booking.stayStatus = 'CHECKED_IN';
    booking.checkedInAtActual = new Date();
    await booking.save();
    await setRoomOperationalStatus(booking.roomId?._id || booking.roomId, 'OCCUPIED');
    await booking.populate('roomId', 'roomNumber status');

    response.json({
      message: 'Đã check-in thành công',
      booking: toBookingResponse(booking),
    });
  } catch (error) {
    next(error);
  }
}

export async function checkOutBooking(request, response, next) {
  try {
    const booking = await findBookingForAdmin(request.params.bookingId);

    if (booking.stayStatus !== 'CHECKED_IN') {
      throw createHttpError('Chỉ booking đang check-in mới được check-out', 409);
    }

    booking.stayStatus = 'CHECKED_OUT';
    booking.checkedOutAtActual = new Date();
    await booking.save();
    await disableElectronicLockCodeForBooking(booking, {
      status: 'EXPIRED',
      reason: 'Booking đã check-out',
      adminUserId: request.auth.userId,
    });
    await setRoomOperationalStatus(booking.roomId?._id || booking.roomId, 'AVAILABLE');
    await booking.populate('roomId', 'roomNumber status');

    response.json({
      message: 'Đã check-out thành công',
      booking: toBookingResponse(booking),
    });
  } catch (error) {
    next(error);
  }
}

export async function getElectronicLockCodes(request, response, next) {
  try {
    const status = String(request.query.status || '').trim().toUpperCase();
    const filter = { electronicLockCode: { $ne: null } };

    const bookings = await Booking.find(filter)
      .populate('userId', 'username name email')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 });

    await Promise.all(bookings.map((booking) => syncElectronicLockCodeForBooking(booking)));

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
      .filter((item) => !status || item.electronicLockStatus === status);

    response.json(normalized);
  } catch (error) {
    next(error);
  }
}

export async function lockElectronicLockCode(request, response, next) {
  try {
    const booking = await Booking.findById(request.params.bookingId)
      .populate('userId', 'username name email')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber');

    if (!booking) {
      throw createHttpError('Không tìm thấy booking cho mã mở khóa', 404);
    }

    if (!booking.electronicLockCode) {
      throw createHttpError('Booking này chưa có mã mở khóa điện tử', 409);
    }

    const resolvedStatus = mapElectronicLockSummary(booking).electronicLockStatus;
    if (resolvedStatus !== 'ACTIVE') {
      throw createHttpError('Chỉ mã mở khóa đang active mới có thể khóa', 409);
    }

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
    next(error);
  }
}

export async function listUsers(_request, response, next) {
  try {
    const users = await User.find()
      .select('_id username name email phone role isActive isCccdVerified trustScore createdAt')
      .sort({ createdAt: -1 })
      .lean();
    response.json(users.map(toUserResponse));
  } catch (error) {
    next(error);
  }
}

export async function createUserByAdmin(request, response, next) {
  try {
    const password = String(request.body?.password || '');
    const data = buildUserPayload(request.body);

    if (!data.username || !password || !data.fullName || !data.email) {
      throw createHttpError('Thiếu thông tin user bắt buộc', 400);
    }

    const exists = await User.findOne({ $or: [{ username: data.username }, { email: data.email }] }).lean();
    if (exists) {
      throw createHttpError('Username hoặc email đã tồn tại', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
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
    next(error);
  }
}

export async function updateUserByAdmin(request, response, next) {
  try {
    const userId = String(request.params.userId || '').trim();
    const data = buildUserPayload(request.body);
    const password = String(request.body?.password || '');

    const user = await User.findById(userId);
    if (!user) {
      throw createHttpError('Không tìm thấy user', 404);
    }

    const duplicate = await User.findOne({
      _id: { $ne: userId },
      $or: [{ username: data.username }, { email: data.email }],
    }).lean();
    if (duplicate) {
      throw createHttpError('Username hoặc email đã tồn tại', 409);
    }

    user.username = data.username || user.username;
    user.name = data.fullName || user.name;
    user.email = data.email || user.email;
    user.phone = data.phone;
    user.role = data.role || user.role;
    user.isActive = data.isActive;

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();
    response.json(toUserResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function deleteUserByAdmin(request, response, next) {
  try {
    if (String(request.params.userId) === String(request.auth.userId)) {
      throw createHttpError('Không thể xóa tài khoản admin đang đăng nhập', 409);
    }

    await User.findByIdAndDelete(request.params.userId);
    response.json({ message: 'Đã xóa user thành công' });
  } catch (error) {
    next(error);
  }
}

export async function getSupportRequests(_request, response, next) {
  try {
    const requests = await SupportRequest.find().sort({ createdAt: -1 }).lean();
    response.json(requests.map(toSupportRequestResponse));
  } catch (error) {
    next(error);
  }
}

export async function updateSupportRequestStatus(request, response, next) {
  try {
    const status = String(request.body?.status || '').trim().toUpperCase();
    const allowed = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

    if (!allowed.includes(status)) {
      throw createHttpError('Trạng thái hỗ trợ không hợp lệ', 400);
    }

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
    next(error);
  }
}

export async function getReportsOverview(_request, response, next) {
  try {
    const last6Months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      last6Months.push({ start, end, label: `${String(start.getMonth() + 1).padStart(2, '0')}/${start.getFullYear()}` });
    }

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

    const roomStatusBreakdown = await Room.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

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
    next(error);
  }
}
