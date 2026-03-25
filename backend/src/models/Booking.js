import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    customerFullName: { type: String, required: true, trim: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date, required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    paymentOption: { type: String, default: 'DEPOSIT_30' },
    workflowStatus: {
      type: String,
      enum: ['PENDING_DEPOSIT_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'PENDING_DEPOSIT_APPROVAL',
    },
  },
  { timestamps: true },
);

export const Booking = mongoose.model('Booking', bookingSchema);
