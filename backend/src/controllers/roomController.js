import { Room } from '../models/Room.js';

const ROOM_SEED = [
  {
    roomNumber: 'A101',
    roomType: 'SINGLE',
    capacity: 2,
    dailyRate: 900000,
    hourlyRate: 180000,
    area: 28,
    description: 'Phong don hien dai, phu hop cho cap doi hoac cong tac ngan ngay.',
    amenities: ['Wifi', 'Smart TV', 'May lanh', 'Ban lam viec'],
    imageUrls: ['/img/rooms-details/2_nguoi.jpg', '/img/rooms-details/2_nguoi(2).jpg'],
    status: 'AVAILABLE',
  },
  {
    roomNumber: 'B205',
    roomType: 'DOUBLE',
    capacity: 4,
    dailyRate: 1450000,
    hourlyRate: 260000,
    area: 42,
    description: 'Khong gian rong rai, thich hop cho gia dinh nho voi day du tien nghi.',
    amenities: ['Wifi', 'Ban cong', 'May pha cafe', 'Bon tam'],
    imageUrls: ['/img/rooms-details/4_nguoi.jpg', '/img/rooms-details/4_nguoi(2).jpg'],
    status: 'AVAILABLE',
  },
  {
    roomNumber: 'C308',
    roomType: 'SUITE',
    capacity: 6,
    dailyRate: 2150000,
    hourlyRate: 380000,
    area: 58,
    description: 'Hang suite cao cap voi phong khach rieng va tam nhin dep.',
    amenities: ['Wifi', 'Phong khach', 'Bon tam', 'Mini bar', 'Ban cong'],
    imageUrls: ['/img/rooms-details/6_nguoi_luxury.jpg', '/img/rooms-details/6_nguoi_luxury_ban_cong.jpg'],
    status: 'AVAILABLE',
  },
];

let seeded = false;

async function ensureRoomSeed() {
  if (seeded) {
    return;
  }

  const count = await Room.countDocuments();
  if (count === 0) {
    await Room.insertMany(ROOM_SEED);
  }

  seeded = true;
}

function toRoomResponse(room) {
  return {
    id: room._id,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    capacity: room.capacity,
    dailyRate: room.dailyRate,
    hourlyRate: room.hourlyRate,
    area: room.area,
    description: room.description,
    amenities: room.amenities,
    imageUrls: room.imageUrls,
    status: room.status,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

export async function listRooms(request, response, next) {
  try {
    await ensureRoomSeed();

    const roomType = String(request.query.roomType || '').trim();
    const minCapacity = Number(request.query.minCapacity || 0);

    const filter = {};

    if (roomType) {
      filter.roomType = roomType;
    }

    if (Number.isFinite(minCapacity) && minCapacity > 0) {
      filter.capacity = { $gte: minCapacity };
    }

    const rooms = await Room.find(filter).sort({ dailyRate: 1, roomNumber: 1 }).lean();

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
    await ensureRoomSeed();

    const room = await Room.findById(request.params.roomId).lean();

    if (!room) {
      const error = new Error('Khong tim thay phong');
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
