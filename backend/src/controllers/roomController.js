import { Room } from '../models/Room.js';
import { ensureDemoData } from '../services/seedService.js';

// Chuẩn hóa dữ liệu phòng trước khi trả về cho client.
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

// Lấy danh sách phòng với một vài bộ lọc cơ bản như loại phòng, sức chứa và trạng thái.
export async function listRooms(request, response, next) {
  try {
    // Bảo đảm dữ liệu mẫu đã được seed trong môi trường demo.
    await ensureDemoData();

    // Đọc và chuẩn hóa các bộ lọc từ query string.
    const roomType = String(request.query.roomType || '').trim();
    const minCapacity = Number(request.query.minCapacity || 0);
    const status = String(request.query.status || 'AVAILABLE').trim().toUpperCase();

    // Mặc định chỉ lấy các phòng theo trạng thái đang yêu cầu.
    const filter = { status };

    if (roomType) {
      // Nếu có loại phòng thì thêm điều kiện lọc.
      filter.roomType = roomType;
    }

    if (Number.isFinite(minCapacity) && minCapacity > 0) {
      // Nếu minCapacity hợp lệ thì chỉ lấy các phòng có sức chứa từ ngưỡng đó trở lên.
      filter.capacity = { $gte: minCapacity };
    }

    // Truy vấn phòng, nạp thêm thông tin chi nhánh, rồi sắp xếp theo giá và số phòng.
    const rooms = await Room.find(filter)
      .populate('branchId', 'name province')
      .sort({ dailyRate: 1, roomNumber: 1 })
      .lean();

    // Trả về cả danh sách lẫn tổng số lượng để frontend tiện phân trang/thống kê.
    response.json({
      items: rooms.map(toRoomResponse),
      total: rooms.length,
    });
  } catch (error) {
    // Chuyển lỗi cho middleware xử lý lỗi chung.
    next(error);
  }
}

// Lấy chi tiết một phòng theo id.
export async function getRoomDetail(request, response, next) {
  try {
    // Seed dữ liệu mẫu nếu cần trước khi đọc chi tiết phòng.
    await ensureDemoData();

    // Tìm phòng và nạp thêm thông tin chi nhánh liên quan.
    const room = await Room.findById(request.params.roomId)
      .populate('branchId', 'name province address')
      .lean();

    if (!room) {
      // Nếu không có phòng tương ứng thì trả lỗi 404.
      const error = new Error('Không tìm thấy phòng');
      error.statusCode = 404;
      throw error;
    }

    // Trả về dữ liệu đã được chuẩn hóa.
    response.json({
      item: toRoomResponse(room),
    });
  } catch (error) {
    // Chuyển lỗi về middleware chung.
    next(error);
  }
}
