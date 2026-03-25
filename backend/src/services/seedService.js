import { Booking } from '../models/Booking.js';
import { Branch } from '../models/Branch.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Voucher } from '../models/Voucher.js';

let seeded = false;

const BRANCH_SEED = [
  {
    name: 'CCT Da Nang Riverside',
    province: 'Da Nang',
    address: '12 Bach Dang, Hai Chau, Da Nang',
    latitude: 16.0678,
    longitude: 108.224,
    totalFloors: 12,
    roomsPerFloor: 10,
  },
  {
    name: 'CCT Sai Gon Center',
    province: 'TP.HCM',
    address: '88 Le Loi, Quan 1, TP.HCM',
    latitude: 10.7756,
    longitude: 106.7009,
    totalFloors: 15,
    roomsPerFloor: 12,
  },
];

const ROOM_SEED = [
  {
    branchName: 'CCT Da Nang Riverside',
    roomNumber: '101',
    floorNumber: 1,
    roomType: 'SINGLE',
    capacity: 2,
    hourlyRate: 180000,
    dailyRate: 900000,
    area: 28,
    description: 'Phong don hien dai, phu hop cho cap doi hoac cong tac ngan ngay.',
    amenities: ['Wifi', 'Smart TV', 'May lanh', 'Ban lam viec'],
    hasNiceView: true,
    imageUrls: ['/img/rooms-details/2_nguoi.jpg', '/img/rooms-details/2_nguoi(2).jpg'],
    status: 'AVAILABLE',
  },
  {
    branchName: 'CCT Da Nang Riverside',
    roomNumber: '305',
    floorNumber: 3,
    roomType: 'DOUBLE',
    capacity: 4,
    hourlyRate: 260000,
    dailyRate: 1450000,
    area: 42,
    description: 'Khong gian rong rai, co cua so lon va ban cong nho.',
    amenities: ['Wifi', 'Ban cong', 'May pha cafe', 'Bon tam'],
    hasNiceView: true,
    imageUrls: ['/img/rooms-details/4_nguoi.jpg', '/img/rooms-details/4_nguoi(2).jpg'],
    status: 'AVAILABLE',
  },
  {
    branchName: 'CCT Sai Gon Center',
    roomNumber: '805',
    floorNumber: 8,
    roomType: 'DOUBLE',
    capacity: 4,
    hourlyRate: 250000,
    dailyRate: 1390000,
    area: 40,
    description: 'Phong doi tieu chuan cao cap ngay trung tam quan 1.',
    amenities: ['Wifi', 'Smart TV', 'Mini bar'],
    hasNiceView: false,
    imageUrls: ['/img/rooms-details/4_nguoi.jpg'],
    status: 'AVAILABLE',
  },
  {
    branchName: 'CCT Sai Gon Center',
    roomNumber: '1202',
    floorNumber: 12,
    roomType: 'SUITE',
    capacity: 6,
    hourlyRate: 380000,
    dailyRate: 2150000,
    area: 58,
    description: 'Hang suite cao cap voi phong khach rieng va tam nhin dep.',
    amenities: ['Wifi', 'Phong khach', 'Bon tam', 'Mini bar', 'Ban cong'],
    hasNiceView: true,
    imageUrls: ['/img/rooms-details/6_nguoi_luxury.jpg', '/img/rooms-details/6_nguoi_luxury_ban_cong.jpg'],
    status: 'AVAILABLE',
  },
];

const VOUCHER_SEED = [
  {
    code: 'WELCOME10',
    name: 'Giam 10% cho khach moi',
    audience: 'NEW_USER',
    discountPercent: 10,
    active: true,
  },
  {
    code: 'LOYAL10',
    name: 'Giam 10% cho khach hang than thiet',
    audience: 'LOYAL',
    discountPercent: 10,
    active: true,
  },
  {
    code: 'FREQUENT25',
    name: 'Giam 25% cho khach verified',
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

export async function ensureDemoData() {
  if (seeded) {
    return;
  }

  let branches = await Branch.find().lean();
  if (branches.length === 0) {
    branches = await Branch.insertMany(BRANCH_SEED);
  }

  const branchMap = new Map(branches.map((branch) => [branch.name, branch]));

  const roomCount = await Room.countDocuments();
  if (roomCount === 0) {
    await Room.insertMany(
      ROOM_SEED.map((room) => ({
        ...room,
        branchId: branchMap.get(room.branchName)?._id || null,
      })),
    );
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