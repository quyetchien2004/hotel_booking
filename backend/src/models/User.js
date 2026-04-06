import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'member',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    cccdNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    cccdImageDataUrl: {
      type: String,
      default: '',
    },
    faceImageDataUrl: {
      type: String,
      default: '',
    },
    isCccdVerified: {
      type: Boolean,
      default: false,
    },
    cccdNameMatched: {
      type: Boolean,
      default: false,
    },
    cccdNameVerifiedAt: {
      type: Date,
      default: null,
    },
    faceMatched: {
      type: Boolean,
      default: false,
    },
    faceMatchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    faceVerifiedAt: {
      type: Date,
      default: null,
    },
    idCardVerifiedAt: {
      type: Date,
      default: null,
    },
    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    passwordResetOtpHash: {
      type: String,
      default: '',
    },
    passwordResetOtpExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model('User', userSchema);
