import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    totalFloors: { type: Number, required: true, min: 1 },
    roomsPerFloor: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

export const Branch = mongoose.model('Branch', branchSchema);
