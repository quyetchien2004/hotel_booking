import { Booking } from '../models/Booking.js';
import { env } from '../config/env.js';
import { buildMockGatewayHtml, finalizePayment } from '../services/paymentService.js';

// Tạo URL để sau khi thanh toán xong người dùng được chuyển về trang kết quả ở frontend.
function buildRedirectUrl(booking) {
  // Đóng gói các thông tin cần hiển thị ở trang kết quả thành query string.
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
    // Nếu đã có hóa đơn thì đính kèm luôn để frontend truy xuất nhanh.
    params.set('invoiceNumber', booking.invoiceNumber);
  }

  // Ghép base URL của client với query string vừa tạo.
  return `${env.clientUrl}/payment-result?${params.toString()}`;
}

// Hiển thị trang thanh toán giả lập VNPay để mô phỏng luồng redirect thanh toán.
export async function showMockVnpay(request, response, next) {
  try {
    // Lấy booking theo mã truyền trên query string.
    const booking = await Booking.findById(request.query.bookingId).lean();
    if (!booking) {
      // Không có booking thì dừng luôn và trả lỗi 404.
      const error = new Error('Không tìm thấy booking để thanh toán');
      error.statusCode = 404;
      throw error;
    }

    // Trả HTML trực tiếp thay vì JSON vì đây là trang giả lập cổng thanh toán.
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.send(buildMockGatewayHtml(booking, `${env.serverUrl}/api/payments/vnpay/callback`));
  } catch (error) {
    // Chuyển lỗi cho middleware chung.
    next(error);
  }
}

// Xử lý callback từ cổng thanh toán giả lập sau khi người dùng bấm thành công/thất bại.
export async function vnpayCallback(request, response, next) {
  try {
    // Hoàn tất nghiệp vụ thanh toán dựa trên mã booking và mã phản hồi của cổng thanh toán.
    const booking = await finalizePayment({
      bookingId: request.query.bookingId || request.query.vnp_TxnRef,
      responseCode: request.query.vnp_ResponseCode,
    });

    // Sau khi cập nhật booking xong thì redirect về frontend.
    response.redirect(buildRedirectUrl(booking));
  } catch (error) {
    // Đẩy lỗi cho middleware xử lý lỗi tập trung.
    next(error);
  }
}
