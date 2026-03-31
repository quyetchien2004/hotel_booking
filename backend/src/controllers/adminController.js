import bcrypt from 'bcryptjs';
import { Booking } from '../models/Booking.js';
import { Branch } from '../models/Branch.js';
import { Room } from '../models/Room.js';
import { SupportRequest } from '../models/SupportRequest.js';
import { User } from '../models/User.js';
import { Voucher } from '../models/Voucher.js';
import { ensureDemoData } from '../services/seedService.js';

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
    hasNiceView: Boolean(room.hasNiceView),
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
    branchName: booking.branchId?.name || '-',
    roomNumber: booking.roomId?.roomNumber || '-',
    checkInAt: booking.checkInAt,
    checkOutAt: booking.checkOutAt,
    totalPrice: booking.totalPrice,
    paidAmount: booking.paidAmount,
    workflowStatus: booking.workflowStatus,
  };
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
      const error = new Error('Thiếu thông tin chi nhánh bắt buộc');
      error.statusCode = 400;
      throw error;
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

    const filter = {};
    if (branchId) filter.branchId = branchId;

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

    const data = {
      branchId: payload.branchId || null,
      roomNumber: String(payload.roomNumber || '').trim(),
      floorNumber: toNumber(payload.floorNumber, 1),
      roomType: String(payload.roomType || 'SINGLE').toUpperCase(),
      capacity: toNumber(payload.capacity, 1),
      hourlyRate: toNumber(payload.hourlyRate, 0),
      dailyRate: toNumber(payload.dailyRate, 0),
      hasNiceView: Boolean(payload.hasNiceView),
    };

    if (!data.branchId || !data.roomNumber) {
      const error = new Error('Thiếu branchId hoặc số phòng');
      error.statusCode = 400;
      throw error;
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
      const error = new Error('Thiếu mã hoặc tên voucher');
      error.statusCode = 400;
      throw error;
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
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 })
      .lean();

    response.json(bookings.map(toBookingResponse));
  } catch (error) {
    next(error);
  }
}

export async function approveBooking(request, response, next) {
  try {
    const booking = await Booking.findByIdAndUpdate(
      request.params.bookingId,
      { workflowStatus: 'APPROVED', paymentStatus: 'SUCCESS' },
      { new: true },
    )
      .populate('userId', 'username')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber')
      .lean();

    if (!booking) {
      const error = new Error('Không tìm thấy booking');
      error.statusCode = 404;
      throw error;
    }

    response.json(toBookingResponse(booking));
  } catch (error) {
    next(error);
  }
}

export async function rejectBooking(request, response, next) {
  try {
    const booking = await Booking.findByIdAndUpdate(
      request.params.bookingId,
      { workflowStatus: 'REJECTED', paymentStatus: 'CANCELLED' },
      { new: true },
    )
      .populate('userId', 'username')
      .populate('branchId', 'name')
      .populate('roomId', 'roomNumber')
      .lean();

    if (!booking) {
      const error = new Error('Không tìm thấy booking');
      error.statusCode = 404;
      throw error;
    }

    response.json(toBookingResponse(booking));
  } catch (error) {
    next(error);
  }
}

export async function listUsers(_request, response, next) {
  try {
    const users = await User.find().select('_id username name email phone role').sort({ createdAt: -1 }).lean();
    response.json(
      users.map((u) => ({
        id: u._id,
        username: u.username || '',
        fullName: u.name,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
      })),
    );
  } catch (error) {
    next(error);
  }
}

export async function createUserByAdmin(request, response, next) {
  try {
    const username = String(request.body?.username || '').trim().toLowerCase();
    const password = String(request.body?.password || '');
    const fullName = String(request.body?.fullName || '').trim();
    const email = String(request.body?.email || '').trim().toLowerCase();
    const phone = String(request.body?.phone || '').trim();

    if (!username || !password || !fullName || !email) {
      const error = new Error('Thiếu thông tin user bắt buộc');
      error.statusCode = 400;
      throw error;
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] }).lean();
    if (exists) {
      const error = new Error('Username hoặc email đã tồn tại');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      name: fullName,
      email,
      phone,
      passwordHash,
      role: 'member',
      isCccdVerified: false,
      trustScore: 0,
    });

    response.status(201).json({
      id: user._id,
      username: user.username,
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
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
      const error = new Error('Trang thai ho tro khong hop le');
      error.statusCode = 400;
      throw error;
    }

    const updated = await SupportRequest.findByIdAndUpdate(
      request.params.supportRequestId,
      { status },
      { new: true },
    ).lean();

    if (!updated) {
      const error = new Error('Khong tim thay yeu cau ho tro');
      error.statusCode = 404;
      throw error;
    }

    response.json(toSupportRequestResponse(updated));
  } catch (error) {
    next(error);
  }
}
