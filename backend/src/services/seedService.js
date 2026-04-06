import { Booking } from '../models/Booking.js';
import { Branch } from '../models/Branch.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Voucher } from '../models/Voucher.js';

let seeded = false;

const FLOOR_COUNT = 5;
const ROOMS_PER_FLOOR = 10;

const BRANCH_SEED = [
  {
    name: 'CCT Da Nang Riverside',
    province: 'Đà Nẵng',
    address: '12 Bạch Đằng, Hải Châu, Đà Nẵng',
    latitude: 16.0678,
    longitude: 108.224,
    totalFloors: FLOOR_COUNT,
    roomsPerFloor: ROOMS_PER_FLOOR,
  },
  {
    name: 'CCT Sai Gon Center',
    province: 'TP.HCM',
    address: '88 Lê Lợi, Quận 1, TP.HCM',
    latitude: 10.7756,
    longitude: 106.7009,
    totalFloors: FLOOR_COUNT,
    roomsPerFloor: ROOMS_PER_FLOOR,
  },
  {
    name: 'CCT Hà Nội',
    province: 'Hà Nội',
    address: '25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
    latitude: 21.0245,
    longitude: 105.8572,
    totalFloors: FLOOR_COUNT,
    roomsPerFloor: ROOMS_PER_FLOOR,
  },
];

const ROOM_GALLERY_LIBRARY = {
  '2_STANDARD': [
    {
      url: '/img/rooms-details/2_nguoi.jpg',
      title: 'Góc giường 2 người standard',
      description: 'Phòng 2 người standard gọn gàng, bố cục tối giản, hợp cho công tác ngắn ngày và nghỉ dưỡng tiết kiệm.',
    },
    {
      url: '/img/rooms-details/2_nguoi(2).jpg',
      title: 'Khung nhìn tổng thể phòng standard',
      description: 'Bàn làm việc gọn, TV treo tường và cửa sổ lấy sáng tự nhiên tạo cảm giác sạch sẽ và thoáng.',
    },
  ],
  '2_DELUXE': [
    {
      url: '/img/rooms-details/2_nguoi_luxury.jpg',
      title: 'Phòng 2 người deluxe',
      description: 'Không gian deluxe rộng hơn, tông màu ấm và khu sofa nhỏ cho cặp đôi hoặc khách công tác cần sự thoải mái.',
    },
  ],
  '2_PREMIUM': [
    {
      url: '/img/rooms-details/2_nguoi_luxury_ban_cong.png',
      title: 'Phòng 2 người premium view đẹp',
      description: 'Hạng premium ưu tiên view đẹp, ban công riêng và trải nghiệm cao cấp cho kỳ nghỉ thư giãn.',
    },
  ],
  '3_STANDARD': [
    {
      url: '/img/rooms-details/4_nguoi.jpg',
      title: 'Phòng 3 người standard',
      description: 'Cấu hình 3 người sử dụng layout linh hoạt, tối ưu diện tích và vẫn giữ đủ không gian di chuyển.',
    },
  ],
  '3_DELUXE': [
    {
      url: '/img/rooms-details/4_nguoi(2).jpg',
      title: 'Phòng 3 người deluxe',
      description: 'Bản nâng cấp deluxe mang lại đèn trang trí ấm áp, thêm khu tiếp khách nhỏ và ánh sáng tốt hơn.',
    },
  ],
  '3_PREMIUM': [
    {
      url: '/img/rooms-details/4_nguoi_luxury_ban_cong.jpg',
      title: 'Phòng 3 người premium view đẹp',
      description: 'Phòng 3 người premium có view đẹp, cửa sổ lớn và trải nghiệm sang hơn cho nhóm bạn hoặc gia đình nhỏ.',
    },
  ],
  '4_STANDARD': [
    {
      url: '/img/rooms-details/4_nguoi.jpg',
      title: 'Phòng 4 người standard',
      description: 'Phòng 4 người standard phù hợp gia đình nhỏ, đầy đủ TV, tủ lạnh mini và góc làm việc.',
    },
    {
      url: '/img/rooms-details/4_nguoi(2).jpg',
      title: 'Không gian nghỉ 4 người',
      description: 'Khu giường rộng và bố trí nội thất cân đối giúp nhóm 4 người ở thoải mái trong nhiều đêm.',
    },
  ],
  '4_DELUXE': [
    {
      url: '/img/rooms-details/4_nguoi_luxury.jpg',
      title: 'Phòng 4 người deluxe',
      description: 'Phiên bản deluxe nâng tầm bằng vật liệu cao cấp hơn, sofa tiếp khách và ánh sáng nội thất ấn tượng.',
    },
    {
      url: '/img/rooms-details/4_nguoi_luxury(2).jpg',
      title: 'Phòng 4 người deluxe góc rộng',
      description: 'Khung hình rộng cho thấy khu nghỉ, TV lớn và không gian ngồi thư giãn cho gia đình.',
    },
  ],
  '4_PREMIUM': [
    {
      url: '/img/rooms-details/4_nguoi_luxury_ban_cong.jpg',
      title: 'Phòng 4 người premium view đẹp',
      description: 'Bản premium cho nhóm 4 người có view đẹp, ban công và trải nghiệm cao cấp cho kỳ nghỉ dài ngày.',
    },
  ],
  '6_STANDARD': [
    {
      url: '/img/rooms-details/6_nguoi.jpg',
      title: 'Phòng 6 người standard',
      description: 'Phòng 6 người standard tối ưu cho nhóm bạn hoặc gia đình đông thành viên, bố trí nhiều giường thoáng.',
    },
  ],
  '6_DELUXE': [
    {
      url: '/img/rooms-details/6_nguoi_luxury.jpg',
      title: 'Phòng 6 người deluxe',
      description: 'Không gian deluxe cho 6 người mở rộng khu tiếp khách, nội thất ấm và sang hơn.',
    },
  ],
  '6_PREMIUM': [
    {
      url: '/img/rooms-details/6_nguoi_luxury_ban_cong.jpg',
      title: 'Phòng 6 người premium view đẹp',
      description: 'Phiên bản premium cho nhóm 6 người có ban công riêng, view đẹp và khu lounge nhỏ bên trong phòng.',
    },
  ],
  '10_STANDARD': [
    {
      url: '/img/rooms-details/10_nguoi.jpg',
      title: 'Phòng 10 người standard',
      description: 'Không gian nhóm lớn dạng ký túc xá cao cấp, phù hợp đoàn du lịch, team building hoặc gia đình đông người.',
    },
  ],
  '10_DELUXE': [
    {
      url: '/img/rooms-details/10_nguoi_luxury.jpg',
      title: 'Phòng 10 người deluxe',
      description: 'Hạng deluxe cho 10 người bổ sung nội thất sang hơn, khu ngồi chung và trải nghiệm nghỉ tập thể thoải mái.',
    },
  ],
  '10_PREMIUM': [
    {
      url: '/img/rooms-details/10_nguoi_luxury_ban_cong.jpg',
      title: 'Phòng 10 người premium view đẹp',
      description: 'Phòng nhóm premium có view mở, không gian ban công lớn và phù hợp đoàn du lịch cao cấp.',
    },
  ],
};

const ROOM_BLUEPRINTS = [
  { capacity: 2, qualityTier: 'STANDARD', roomType: 'DOUBLE', baseDailyRate: 920000, area: 24, hasNiceView: false },
  { capacity: 2, qualityTier: 'DELUXE', roomType: 'DOUBLE', baseDailyRate: 1180000, area: 27, hasNiceView: false },
  { capacity: 2, qualityTier: 'PREMIUM', roomType: 'DOUBLE', baseDailyRate: 1480000, area: 31, hasNiceView: true },
  { capacity: 3, qualityTier: 'STANDARD', roomType: 'TRIPLE', baseDailyRate: 1320000, area: 30, hasNiceView: false },
  { capacity: 3, qualityTier: 'DELUXE', roomType: 'TRIPLE', baseDailyRate: 1560000, area: 34, hasNiceView: false },
  { capacity: 3, qualityTier: 'PREMIUM', roomType: 'TRIPLE', baseDailyRate: 1840000, area: 37, hasNiceView: true },
  { capacity: 4, qualityTier: 'STANDARD', roomType: 'FAMILY', baseDailyRate: 1680000, area: 36, hasNiceView: false },
  { capacity: 4, qualityTier: 'DELUXE', roomType: 'FAMILY', baseDailyRate: 1980000, area: 40, hasNiceView: false },
  { capacity: 4, qualityTier: 'PREMIUM', roomType: 'FAMILY', baseDailyRate: 2320000, area: 44, hasNiceView: true },
  { capacity: 6, qualityTier: 'STANDARD', roomType: 'SUITE', baseDailyRate: 2480000, area: 52, hasNiceView: false },
  { capacity: 6, qualityTier: 'DELUXE', roomType: 'SUITE', baseDailyRate: 2880000, area: 58, hasNiceView: false },
  { capacity: 6, qualityTier: 'PREMIUM', roomType: 'SUITE', baseDailyRate: 3360000, area: 64, hasNiceView: true },
  { capacity: 10, qualityTier: 'STANDARD', roomType: 'DORM', baseDailyRate: 3820000, area: 78, hasNiceView: false },
  { capacity: 10, qualityTier: 'DELUXE', roomType: 'DORM', baseDailyRate: 4480000, area: 86, hasNiceView: false },
  { capacity: 10, qualityTier: 'PREMIUM', roomType: 'DORM', baseDailyRate: 5280000, area: 96, hasNiceView: true },
];

const VOUCHER_SEED = [
  {
    code: 'WELCOME10',
    name: 'Giảm 10% cho khách mới',
    audience: 'NEW_USER',
    discountPercent: 10,
    active: true,
  },
  {
    code: 'LOYAL10',
    name: 'Giảm 10% cho khách hàng thân thiết',
    audience: 'LOYAL',
    discountPercent: 10,
    active: true,
  },
  {
    code: 'FREQUENT25',
    name: 'Giảm 25% cho khách verified',
    audience: 'FREQUENT',
    discountPercent: 25,
    active: true,
  },
];

function startOfTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(14, 0, 0, 0);
  return date;
}

function endOfDayAfterTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(12, 0, 0, 0);
  return date;
}

function getQualityText(qualityTier) {
  switch (qualityTier) {
    case 'DELUXE':
      return 'deluxe';
    case 'PREMIUM':
      return 'premium view đẹp';
    default:
      return 'standard';
  }
}

function getRoomLabel(capacity, qualityTier) {
  return `Phòng ${capacity} người ${getQualityText(qualityTier)}`;
}

function getAmenitySet(capacity, qualityTier) {
  const base = ['Wifi tốc độ cao', 'Smart TV', 'Máy lạnh', 'Tủ lạnh mini'];

  if (capacity >= 3) {
    base.push('Bàn ăn nhỏ');
  }
  if (capacity >= 4) {
    base.push('Góc tiếp khách');
  }
  if (capacity >= 6) {
    base.push('Ấm siêu tốc');
  }
  if (capacity >= 10) {
    base.push('Khu sinh hoạt nhóm');
  }
  if (qualityTier !== 'STANDARD') {
    base.push('Máy pha cafe');
  }
  if (qualityTier === 'PREMIUM') {
    base.push('Ban công view đẹp', 'Bồn tắm cao cấp');
  }

  return base;
}

function buildRoomDescription(capacity, qualityTier, floorNumber, branchName) {
  const qualityText = getQualityText(qualityTier);
  const overview = `Phòng ${capacity} người hạng ${qualityText} tại ${branchName}, bố trí ở tầng ${floorNumber} để dễ dàng di chuyển và nghỉ dưỡng thoải mái.`;

  if (qualityTier === 'PREMIUM') {
    return `${overview} Không gian ưu tiên view đẹp, nội thất cao cấp và phù hợp cho nhóm khách cần trải nghiệm nổi bật hơn.`;
  }
  if (qualityTier === 'DELUXE') {
    return `${overview} Phòng được nâng cấp về diện tích, ánh sáng và khu tiếp khách so với hạng standard.`;
  }
  return `${overview} Đây là lựa chọn cân bằng giữa công năng, giá hợp lý và sự sạch sẽ, gọn gàng.`;
}

function buildGallery(capacity, qualityTier) {
  const key = `${capacity}_${qualityTier}`;
  const gallery = ROOM_GALLERY_LIBRARY[key] || [];
  return gallery.map((item) => ({ ...item }));
}

function buildRoomPayload(branch, blueprint, roomNumber, floorNumber) {
  const gallery = buildGallery(blueprint.capacity, blueprint.qualityTier);
  const imageUrls = gallery.map((item) => item.url);
  const dailyRate = blueprint.baseDailyRate + floorNumber * 15000;
  const hourlyRate = Math.round(dailyRate * 0.23);

  return {
    branchId: branch._id,
    roomNumber,
    floorNumber,
    roomType: blueprint.roomType,
    qualityTier: blueprint.qualityTier,
    roomLabel: getRoomLabel(blueprint.capacity, blueprint.qualityTier),
    capacity: blueprint.capacity,
    hourlyRate,
    dailyRate,
    area: blueprint.area,
    description: buildRoomDescription(blueprint.capacity, blueprint.qualityTier, floorNumber, branch.name),
    amenities: getAmenitySet(blueprint.capacity, blueprint.qualityTier),
    hasNiceView: blueprint.hasNiceView,
    imageUrls,
    imageGallery: gallery,
    status: 'AVAILABLE',
  };
}

async function upsertBranches() {
  for (const seedBranch of BRANCH_SEED) {
    await Branch.updateOne(
      { name: seedBranch.name },
      { $set: seedBranch },
      { upsert: true },
    );
  }

  await Branch.updateMany(
    {},
    {
      $set: {
        totalFloors: FLOOR_COUNT,
        roomsPerFloor: ROOMS_PER_FLOOR,
      },
    },
  );

  return Branch.find().lean();
}

async function syncBranchRooms(branch) {
  const desiredRoomNumbers = [];
  const operations = [];

  for (let floorNumber = 1; floorNumber <= FLOOR_COUNT; floorNumber += 1) {
    for (let index = 0; index < ROOMS_PER_FLOOR; index += 1) {
      const globalIndex = (floorNumber - 1) * ROOMS_PER_FLOOR + index;
      const blueprint = ROOM_BLUEPRINTS[globalIndex % ROOM_BLUEPRINTS.length];
      const roomNumber = `${floorNumber}${String(index + 1).padStart(2, '0')}`;
      desiredRoomNumbers.push(roomNumber);
      operations.push({
        updateOne: {
          filter: { branchId: branch._id, roomNumber },
          update: {
            $set: buildRoomPayload(branch, blueprint, roomNumber, floorNumber),
          },
          upsert: true,
        },
      });
    }
  }

  if (operations.length > 0) {
    await Room.bulkWrite(operations);
  }

  const staleRooms = await Room.find({
    branchId: branch._id,
    roomNumber: { $nin: desiredRoomNumbers },
  })
    .select('_id')
    .lean();

  if (staleRooms.length === 0) {
    return;
  }

  const staleRoomIds = staleRooms.map((room) => room._id);
  const bookedRoomRefs = await Booking.find({ roomId: { $in: staleRoomIds } }).select('roomId').lean();
  const bookedSet = new Set(bookedRoomRefs.map((item) => String(item.roomId)));
  const removableIds = staleRoomIds.filter((roomId) => !bookedSet.has(String(roomId)));

  if (removableIds.length > 0) {
    await Room.deleteMany({ _id: { $in: removableIds } });
  }
}

export async function ensureDemoData() {
  if (seeded) {
    return;
  }

  const branches = await upsertBranches();

  for (const branch of branches) {
    await syncBranchRooms(branch);
  }

  const voucherCount = await Voucher.countDocuments();
  if (voucherCount === 0) {
    await Voucher.insertMany(VOUCHER_SEED);
  }

  const bookingCount = await Booking.countDocuments();
  if (bookingCount === 0) {
    const adminUser = await User.findOne({ role: { $in: ['admin', 'ADMIN'] } }).lean();
    const firstRoom = await Room.findOne().lean();

    if (firstRoom?.branchId) {
      await Booking.create({
        userId: adminUser?._id || null,
        branchId: firstRoom.branchId,
        roomId: firstRoom._id,
        customerFullName: adminUser?.name || 'Nguyen Van A',
        rentalMode: 'DAILY',
        checkInAt: startOfTomorrow(),
        checkOutAt: endOfDayAfterTomorrow(),
        originalPrice: 1800000,
        discountAmount: 0,
        totalPrice: 1800000,
        requiredPaymentAmount: 540000,
        paidAmount: 540000,
        paymentOption: 'DEPOSIT_30',
        paymentStatus: 'PENDING',
        workflowStatus: 'PENDING_DEPOSIT_APPROVAL',
        invoiceNumber: 'INV-SEED-0001',
        invoiceIssuedAt: new Date(),
      });
    }
  }

  seeded = true;
}