import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    roomType: {
      type: String,
      required: true,
      enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'FAMILY', 'SUITE', 'DELUXE'],
      default: 'SINGLE',
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
    imageUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'],
      default: 'AVAILABLE',
    },
  },
  {
    timestamps: true,
  },
);

export const Room = mongoose.model('Room', roomSchema);
