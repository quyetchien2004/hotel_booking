import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ['ALL', 'NEW_USER', 'LOYAL', 'FREQUENT'],
      default: 'ALL',
    },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    active: { type: Boolean, default: true },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Voucher = mongoose.model('Voucher', voucherSchema);
