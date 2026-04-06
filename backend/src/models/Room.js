import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    floorNumber: {
      type: Number,
      min: 1,
      default: 1,
    },
    roomType: {
      type: String,
      required: true,
      enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'FAMILY', 'SUITE', 'DELUXE', 'DORM'],
      default: 'SINGLE',
    },
    qualityTier: {
      type: String,
      enum: ['STANDARD', 'DELUXE', 'PREMIUM'],
      default: 'STANDARD',
    },
    roomLabel: {
      type: String,
      default: '',
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },
    dailyRate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    area: {
      type: Number,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    hasNiceView: {
      type: Boolean,
      default: false,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    imageGallery: {
      type: [
        {
          url: { type: String, required: true, trim: true },
          title: { type: String, default: '', trim: true },
          description: { type: String, default: '', trim: true },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'UNAVAILABLE', 'MAINTENANCE'],
      default: 'AVAILABLE',
    },
  },
  {
    timestamps: true,
  },
);

export const Room = mongoose.model('Room', roomSchema);
