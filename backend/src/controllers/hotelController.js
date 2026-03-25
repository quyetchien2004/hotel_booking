import { getAvailableRooms, buildDateRange, calculateRoomEstimate, findApplicableVoucher, validateDateRange } from '../services/bookingService.js';
import { ensureDemoData } from '../services/seedService.js';

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
      capacity: room.capacity,
      hourlyRate: room.hourlyRate,
      dailyRate: room.dailyRate,
      hasNiceView: Boolean(room.hasNiceView),
      estimatedPrice: calculateRoomEstimate(room, branch.searchRange),
      suggestedVoucherCode: voucher?.code || null,
    })),
  };
}

export async function searchHotels(request, response, next) {
  try {
    await ensureDemoData();

    const range = buildDateRange(request.query);
    const rangeError = validateDateRange(range);
    if (rangeError) {
      const error = new Error(rangeError);
      error.statusCode = 400;
      throw error;
    }

    const province = String(request.query.province || '').trim();
    const maxPrice = Number(request.query.maxPrice || 0);
    const voucher = await findApplicableVoucher(request.query.voucherCode, request.auth?.userId || null);
    const availableRooms = await getAvailableRooms({ province, maxPrice, range });

    const grouped = new Map();
    availableRooms.forEach((room) => {
      if (!room.branchId) {
        return;
      }

      const key = String(room.branchId._id || room.branchId);
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...room.branchId,
          searchRange: range,
          rooms: [],
        });
      }
      grouped.get(key).rooms.push(room);
    });

    const payload = Array.from(grouped.values())
      .map((entry) => toBranchAvailabilityResponse(entry, entry.rooms, voucher))
      .sort((left, right) => left.branchName.localeCompare(right.branchName));

    response.json(payload);
  } catch (error) {
    next(error);
  }
}