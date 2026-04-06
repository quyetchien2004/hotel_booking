import { Room } from '../models/Room.js';
import { ensureDemoData } from '../services/seedService.js';

function toRoomResponse(room) {
  return {
    id: room._id,
    branchId: room.branchId?._id || room.branchId || null,
    branchName: room.branchId?.name || '',
    province: room.branchId?.province || '',
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    qualityTier: room.qualityTier,
    roomLabel: room.roomLabel,
    capacity: room.capacity,
    dailyRate: room.dailyRate,
    hourlyRate: room.hourlyRate,
    area: room.area,
    description: room.description,
    amenities: room.amenities,
    imageUrls: room.imageUrls,
    imageGallery: room.imageGallery,
    hasNiceView: Boolean(room.hasNiceView),
    status: room.status,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

export async function listRooms(request, response, next) {
  try {
    await ensureDemoData();

    const roomType = String(request.query.roomType || '').trim();
    const minCapacity = Number(request.query.minCapacity || 0);
    const status = String(request.query.status || 'AVAILABLE').trim().toUpperCase();

    const filter = { status };

    if (roomType) {
      filter.roomType = roomType;
    }

    if (Number.isFinite(minCapacity) && minCapacity > 0) {
      filter.capacity = { $gte: minCapacity };
    }

    const rooms = await Room.find(filter)
      .populate('branchId', 'name province')
      .sort({ dailyRate: 1, roomNumber: 1 })
      .lean();

    response.json({
      items: rooms.map(toRoomResponse),
      total: rooms.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomDetail(request, response, next) {
  try {
    await ensureDemoData();

    const room = await Room.findById(request.params.roomId)
      .populate('branchId', 'name province address')
      .lean();

    if (!room) {
      const error = new Error('Không tìm thấy phòng');
      error.statusCode = 404;
      throw error;
    }

    response.json({
      item: toRoomResponse(room),
    });
  } catch (error) {
    next(error);
  }
}
