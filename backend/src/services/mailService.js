import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    const error = new Error('SMTP chua duoc cau hinh day du');
    error.statusCode = 500;
    throw error;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: false,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

export function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

export async function sendPasswordResetOtpEmail({ toEmail, otp }) {
  const mailer = getTransporter();

  await mailer.sendMail({
    from: `"CCT Hotels Company" <${env.smtpUser}>`,
    to: toEmail,
    subject: 'Ma OTP dat lai mat khau',
    text: `Ma OTP cua ban la ${otp}. Ma co hieu luc trong 10 phut.`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #dbe5ff;border-radius:16px;background:#ffffff">
        <h2 style="margin:0 0 12px;color:#1b2d57">CCT Hotels Company</h2>
        <p style="margin:0 0 16px;color:#4b5b7c">Ban vua yeu cau dat lai mat khau.</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2452c4;margin:18px 0">${otp}</div>
        <p style="margin:0;color:#5f6f8f">Ma OTP co hieu luc trong <strong>10 phut</strong>. Neu ban khong thuc hien yeu cau nay, hay bo qua email.</p>
      </div>
    `,
  });
}
