import { getAvailableRooms, buildDateRange, calculateRoomEstimate, findApplicableVoucher, validateDateRange } from '../services/bookingService.js';
import { ensureDemoData } from '../services/seedService.js';

// Chuẩn hóa dữ liệu một chi nhánh cùng danh sách phòng trống để frontend hiển thị dễ hơn.
function toBranchAvailabilityResponse(branch, rooms, voucher) {
  return {
    branchId: branch._id,
    branchName: branch.name,
    province: branch.province,
    address: branch.address,
    latitude: branch.latitude,
    longitude: branch.longitude,
    availableRooms: rooms.map((room) => ({
      roomId: room._id,
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber,
      roomType: room.roomType,
      roomLabel: room.roomLabel,
      qualityTier: room.qualityTier,
      capacity: room.capacity,
      hourlyRate: room.hourlyRate,
      dailyRate: room.dailyRate,
      description: room.description,
      amenities: room.amenities,
      imageUrls: room.imageUrls,
      imageGallery: room.imageGallery,
      hasNiceView: Boolean(room.hasNiceView),
      estimatedPrice: calculateRoomEstimate(room, branch.searchRange),
      suggestedVoucherCode: voucher?.code || null,
    })),
  };
}

// Tìm khách sạn/phòng còn trống theo địa điểm, thời gian và ngân sách.
export async function searchHotels(request, response, next) {
  try {
    // Đảm bảo dữ liệu mẫu tồn tại trước khi truy vấn trong môi trường demo/dev.
    await ensureDemoData();

    // Chuyển query string thành khoảng thời gian check-in/check-out chuẩn.
    const range = buildDateRange(request.query);
    // Kiểm tra khoảng thời gian có hợp lệ hay không.
    const rangeError = validateDateRange(range);
    if (rangeError) {
      // Nếu ngày giờ không hợp lệ thì tạo lỗi 400 để trả về cho client.
      const error = new Error(rangeError);
      error.statusCode = 400;
      throw error;
    }

    // Lấy các bộ lọc tìm kiếm tùy chọn từ query string.
    const province = String(request.query.province || '').trim();
    const maxPrice = Number(request.query.maxPrice || 0);
    // Nếu người dùng nhập voucher thì thử tìm voucher hợp lệ để gợi ý giá sau giảm.
    const voucher = await findApplicableVoucher(request.query.voucherCode, request.auth?.userId || null);
    // Tìm toàn bộ phòng thỏa điều kiện hiện còn trống trong khoảng thời gian đã chọn.
    const availableRooms = await getAvailableRooms({ province, maxPrice, range });

    // Gom các phòng theo chi nhánh để response gọn và dễ render hơn.
    const grouped = new Map();
    availableRooms.forEach((room) => {
      // Bỏ qua bản ghi lỗi dữ liệu nếu phòng chưa gắn chi nhánh.
      if (!room.branchId) {
        return;
      }

      // Dùng id chi nhánh làm key để nhóm nhiều phòng vào cùng một khách sạn.
      const key = String(room.branchId._id || room.branchId);
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...room.branchId,
          searchRange: range,
          rooms: [],
        });
      }
      // Đẩy phòng hiện tại vào danh sách phòng trống của chi nhánh tương ứng.
      grouped.get(key).rooms.push(room);
    });

    // Chuyển Map thành mảng response và sắp xếp theo tên chi nhánh tăng dần.
    const payload = Array.from(grouped.values())
      .map((entry) => toBranchAvailabilityResponse(entry, entry.rooms, voucher))
      .sort((left, right) => left.branchName.localeCompare(right.branchName));

    // Trả danh sách khách sạn kèm các phòng còn trống cho frontend.
    response.json(payload);
  } catch (error) {
    // Mọi lỗi sẽ được đẩy cho middleware chung xử lý.
    next(error);
  }
}
