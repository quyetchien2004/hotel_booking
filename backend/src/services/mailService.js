import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;
let transporterVerified = false;

function createTransportOptions() {
  const isGmailHost = /gmail/i.test(env.smtpHost);
  const useGmailService = env.smtpService || isGmailHost;

  if (useGmailService) {
    return {
      service: env.smtpService || 'gmail',
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    };
  }

  return {
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure || env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };
}

async function getTransporter() {
  if (transporter) {
    if (!transporterVerified) {
      await transporter.verify();
      transporterVerified = true;
    }

    return transporter;
  }

  if ((!env.smtpHost && !env.smtpService) || !env.smtpUser || !env.smtpPass) {
    const error = new Error('Chưa cấu hình Gmail SMTP đầy đủ. Hãy kiểm tra SMTP_SERVICE/SMTP_HOST, SMTP_USER và SMTP_PASS');
    error.statusCode = 500;
    throw error;
  }

  transporter = nodemailer.createTransport(createTransportOptions());
  await transporter.verify();
  transporterVerified = true;

  return transporter;
}

export function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function fmtDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapMailerError(error) {
  const message = String(error?.message || '');
  const code = String(error?.code || '');

  if (code === 'EAUTH' || /Invalid login|Username and Password not accepted|Application-specific password required/i.test(message)) {
    const friendlyError = new Error('Đăng nhập Gmail thất bại. Nếu dùng Gmail, hãy bật xác minh 2 bước và tạo App Password để gán vào SMTP_PASS');
    friendlyError.statusCode = 500;
    return friendlyError;
  }

  if (code === 'ECONNECTION' || code === 'ETIMEDOUT') {
    const friendlyError = new Error('Không kết nối được tới máy chủ Gmail SMTP. Hãy kiểm tra mạng, cổng SMTP và cấu hình Gmail');
    friendlyError.statusCode = 502;
    return friendlyError;
  }

  const fallbackError = new Error(message || 'Gửi OTP qua email thất bại');
  fallbackError.statusCode = error?.statusCode || 500;
  return fallbackError;
}

export async function sendPasswordResetOtpEmail({ toEmail, otp }) {
  try {
    const mailer = await getTransporter();

    await mailer.sendMail({
      from: `"${env.smtpFromName}" <${env.smtpFromEmail}>`,
      to: toEmail,
      subject: 'Mã OTP đặt lại mật khẩu',
      text: `Mã OTP của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #dbe5ff;border-radius:16px;background:#ffffff">
          <h2 style="margin:0 0 12px;color:#1b2d57">${env.smtpFromName}</h2>
          <p style="margin:0 0 16px;color:#4b5b7c">Bạn vừa yêu cầu đặt lại mật khẩu.</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2452c4;margin:18px 0">${otp}</div>
          <p style="margin:0;color:#5f6f8f">Mã OTP có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
        </div>
      `,
    });
  } catch (error) {
    throw mapMailerError(error);
  }
}

export async function sendElectronicLockCodeEmail({
  toEmail,
  customerName,
  roomNumber,
  branchName,
  electronicLockCode,
  validFrom,
  validUntil,
  instructions,
  paymentStatus,
  invoiceNumber,
}) {
  try {
    const mailer = await getTransporter();

    await mailer.sendMail({
      from: `"${env.smtpFromName}" <${env.smtpFromEmail}>`,
      to: toEmail,
      subject: 'Mã mở khóa phòng điện tử của bạn',
      text: [
        `Xin chào ${customerName || 'quý khách'},`,
        `Mã mở khóa phòng điện tử của bạn là: ${electronicLockCode}`,
        `Phòng áp dụng: ${roomNumber} - ${branchName}`,
        `Hóa đơn: ${invoiceNumber || 'Chưa phát hành'}`,
        `Trạng thái thanh toán: ${paymentStatus}`,
        `Thời gian hiệu lực: ${fmtDateTime(validFrom)} đến ${fmtDateTime(validUntil)}`,
        `Hướng dẫn: ${instructions}`,
      ].join('\n'),
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;border:1px solid #dbe5ff;border-radius:20px;background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)">
          <div style="font-size:12px;font-weight:700;letter-spacing:1.4px;color:#486089;text-transform:uppercase;margin-bottom:10px">Electronic Room Access</div>
          <h2 style="margin:0 0 12px;color:#14264d">Mã mở khóa phòng điện tử đã sẵn sàng</h2>
          <p style="margin:0 0 18px;color:#4d5d7d">Xin chào <strong>${customerName || 'quý khách'}</strong>, hệ thống đã phát hành mã mở khóa cho đơn đặt phòng của bạn.</p>
          <div style="border-radius:18px;background:#102851;color:#ffffff;padding:18px 20px;margin-bottom:16px">
            <div style="font-size:12px;opacity:.8;text-transform:uppercase;letter-spacing:1px">Mã mở khóa</div>
            <div style="font-size:34px;font-weight:800;letter-spacing:8px;margin-top:8px">${electronicLockCode}</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:16px">
            <div style="border:1px solid #dde6fb;border-radius:16px;padding:14px;background:#fff">
              <div style="font-size:12px;color:#6b7894;text-transform:uppercase">Phòng hợp lệ</div>
              <div style="font-size:18px;font-weight:700;color:#15284a;margin-top:4px">${roomNumber}</div>
              <div style="font-size:13px;color:#62708d;margin-top:4px">${branchName}</div>
            </div>
            <div style="border:1px solid #dde6fb;border-radius:16px;padding:14px;background:#fff">
              <div style="font-size:12px;color:#6b7894;text-transform:uppercase">Trạng thái hóa đơn</div>
              <div style="font-size:18px;font-weight:700;color:#15284a;margin-top:4px">${paymentStatus}</div>
              <div style="font-size:13px;color:#62708d;margin-top:4px">${invoiceNumber || 'Chưa phát hành'}</div>
            </div>
          </div>
          <div style="border:1px solid #dde6fb;border-radius:16px;padding:14px;background:#fff;margin-bottom:16px">
            <div style="font-size:12px;color:#6b7894;text-transform:uppercase">Thời gian hiệu lực</div>
            <div style="font-size:15px;font-weight:600;color:#15284a;margin-top:4px">${fmtDateTime(validFrom)} đến ${fmtDateTime(validUntil)}</div>
          </div>
          <div style="border-radius:16px;background:#eef5ff;padding:16px;color:#294164;line-height:1.7">
            <strong>Hướng dẫn sử dụng:</strong>
            <div style="margin-top:8px">${instructions}</div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    throw mapMailerError(error);
  }
}
