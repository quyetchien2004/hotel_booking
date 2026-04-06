import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';

export async function promoteUserTrustAfterSuccessfulBooking(userId) {
  if (!userId) {
    return null;
  }

  const successfulBookingCount = await Booking.countDocuments({
    userId,
    paymentStatus: 'SUCCESS',
    workflowStatus: 'APPROVED',
  });

  if (successfulBookingCount < 1) {
    return null;
  }

  const user = await User.findById(userId);
  if (!user || Number(user.trustScore || 0) >= 100) {
    return user;
  }

  const currentTrustScore = Number(user.trustScore || 0);
  const qualifiesForBookingBonus = Boolean(user.isCccdVerified) && currentTrustScore >= 80;

  if (!qualifiesForBookingBonus) {
    return user;
  }

  user.trustScore = Math.min(100, currentTrustScore + 20);
  await user.save();
  return user;
}