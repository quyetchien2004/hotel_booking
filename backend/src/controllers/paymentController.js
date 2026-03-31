import { Booking } from '../models/Booking.js';
import { env } from '../config/env.js';
import { buildMockGatewayHtml, finalizePayment } from '../services/paymentService.js';

function buildRedirectUrl(booking) {
  const params = new URLSearchParams({
    bookingId: String(booking._id),
    status: booking.paymentStatus,
    paymentStatus: booking.paymentStatus,
    workflowStatus: booking.workflowStatus,
    totalPrice: String(booking.totalPrice || 0),
    requiredPaymentAmount: String(booking.requiredPaymentAmount || 0),
    paidAmount: String(booking.paidAmount || 0),
  });

  if (booking.invoiceNumber) {
    params.set('invoiceNumber', booking.invoiceNumber);
  }

  return `${env.clientUrl}/payment-result?${params.toString()}`;
}

export async function showMockVnpay(request, response, next) {
  try {
    const booking = await Booking.findById(request.query.bookingId).lean();
    if (!booking) {
      const error = new Error('Không tìm thấy booking để thanh toán');
      error.statusCode = 404;
      throw error;
    }

    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.send(buildMockGatewayHtml(booking, `${env.serverUrl}/api/payments/vnpay/callback`));
  } catch (error) {
    next(error);
  }
}

export async function vnpayCallback(request, response, next) {
  try {
    const booking = await finalizePayment({
      bookingId: request.query.bookingId || request.query.vnp_TxnRef,
      responseCode: request.query.vnp_ResponseCode,
    });

    response.redirect(buildRedirectUrl(booking));
  } catch (error) {
    next(error);
  }
}