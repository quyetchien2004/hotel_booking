import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { env } from '../config/env.js';
import { generateInvoiceNumber } from './bookingService.js';
import { promoteUserTrustAfterSuccessfulBooking } from './trustService.js';

function formatDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

function buildSignedVnpayUrl(booking) {
  if (!env.vnpayTmCode || !env.vnpayHashSecret) {
    return null;
  }

  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: env.vnpayTmCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(booking._id),
    vnp_OrderInfo: `Thanh toan booking ${booking._id}`,
    vnp_OrderType: '250000',
    vnp_Amount: Number(booking.requiredPaymentAmount || 0) * 100,
    vnp_ReturnUrl: env.vnpayReturnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: formatDate(),
  };

  const sortedParams = sortObject(params);
  const searchParams = new URLSearchParams(sortedParams);
  const signData = searchParams.toString();
  const secureHash = crypto.createHmac('sha512', env.vnpayHashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex');
  searchParams.append('vnp_SecureHash', secureHash);
  return `${env.vnpayPayUrl}?${searchParams.toString()}`;
}

export function buildPaymentUrl(booking) {
  return buildSignedVnpayUrl(booking)
    || `${env.serverUrl}/api/payments/vnpay/mock?bookingId=${booking._id}`;
}

export function buildMockGatewayHtml(booking, callbackBase) {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VNPAY Sandbox Mock</title>
    <style>
      body{font-family:Segoe UI,Arial,sans-serif;background:linear-gradient(135deg,#0f1f4b,#17387d);color:#12203a;min-height:100vh;margin:0;display:grid;place-items:center;padding:20px}
      .card{width:min(560px,100%);background:#fff;border-radius:24px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,.22)}
      .badge{display:inline-block;padding:7px 12px;border-radius:999px;background:#e8f0ff;color:#234a99;font-weight:700;font-size:12px}
      h1{margin:14px 0 6px;font-size:28px;color:#132243}
      p{color:#5d6784;line-height:1.6}
      .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0}
      .box{border:1px solid #dce5ff;border-radius:16px;padding:14px;background:#f8faff}
      .label{font-size:12px;color:#6a748d;text-transform:uppercase;letter-spacing:.4px}
      .value{font-weight:700;color:#1a2b54;margin-top:4px}
      .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}
      .btn{flex:1 1 220px;text-align:center;text-decoration:none;padding:14px 18px;border-radius:14px;font-weight:700}
      .btn-success{background:#1c8f53;color:#fff}
      .btn-cancel{background:#eff3fb;color:#243657}
    </style>
  </head>
  <body>
    <div class="card">
      <span class="badge">Mock VNPAY Gateway</span>
      <h1>Thanh toán booking #${booking._id}</h1>
      <p>Môi trường hiện tại chưa cấu hình khóa thật của VNPay. Trang này mô phỏng bước xác nhận thanh toán để bạn kiểm tra end-to-end luồng đặt phòng và xuất hóa đơn.</p>
      <div class="grid">
        <div class="box"><div class="label">Khách hàng</div><div class="value">${booking.customerFullName}</div></div>
        <div class="box"><div class="label">Số tiền</div><div class="value">${Number(booking.requiredPaymentAmount || 0).toLocaleString('vi-VN')} VND</div></div>
      </div>
      <div class="actions">
        <a class="btn btn-success" href="${callbackBase}?bookingId=${booking._id}&vnp_ResponseCode=00">Thanh toán thành công</a>
        <a class="btn btn-cancel" href="${callbackBase}?bookingId=${booking._id}&vnp_ResponseCode=24">Hủy giao dịch</a>
      </div>
    </div>
  </body>
</html>`;
}

export async function finalizePayment({ bookingId, responseCode }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Không tìm thấy booking cần thanh toán');
    error.statusCode = 404;
    throw error;
  }

  if (String(responseCode) === '00') {
    booking.paidAmount = Number(booking.requiredPaymentAmount || 0);
    booking.paymentStatus = booking.paymentOption === 'FULL_100' ? 'SUCCESS' : 'PENDING';
    booking.workflowStatus = booking.paymentOption === 'FULL_100' ? 'APPROVED' : 'PENDING_DEPOSIT_APPROVAL';
    booking.invoiceNumber = booking.invoiceNumber || generateInvoiceNumber(booking._id);
    booking.invoiceIssuedAt = booking.invoiceIssuedAt || new Date();
  } else {
    booking.paidAmount = 0;
    booking.paymentStatus = 'CANCELLED';
    booking.workflowStatus = 'CANCELLED';
  }

  await booking.save();

  if (booking.paymentStatus === 'SUCCESS' && booking.workflowStatus === 'APPROVED') {
    await promoteUserTrustAfterSuccessfulBooking(booking.userId);
  }

  return booking;
}