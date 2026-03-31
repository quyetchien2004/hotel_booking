import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    customerFullName: { type: String, required: true, trim: true },
    rentalMode: {
      type: String,
      enum: ['DAILY', 'HOURLY'],
      default: 'DAILY',
    },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date, required: true },
    originalPrice: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    requiredPaymentAmount: { type: Number, required: true, min: 0, default: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    paymentOption: {
      type: String,
      enum: ['DEPOSIT_30', 'FULL_100'],
      default: 'DEPOSIT_30',
    },
    paymentStatus: {
      type: String,
      enum: ['INITIATED', 'PENDING', 'SUCCESS', 'CANCELLED'],
      default: 'INITIATED',
    },
    appliedVoucherCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    invoiceNumber: {
      type: String,
      default: null,
      trim: true,
    },
    invoiceIssuedAt: {
      type: Date,
      default: null,
    },
    workflowStatus: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PENDING_DEPOSIT_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING_PAYMENT',
    },
  },
  { timestamps: true },
);

export const Booking = mongoose.model('Booking', bookingSchema);
