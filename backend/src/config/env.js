import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '../../.env') });

const port = Number(process.env.PORT || 5000);

export const env = {
  port,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  smtpService: process.env.SMTP_SERVICE || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: ['true', '1', 'yes'].includes(String(process.env.SMTP_SECURE || '').toLowerCase()),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: String(process.env.SMTP_PASS || '').replace(/\s+/g, ''),
  smtpFromName: process.env.SMTP_FROM_NAME || 'CCT Hotels Company',
  smtpFromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
  serverUrl: process.env.SERVER_URL || `http://localhost:${port}`,
  vnpayTmCode: process.env.VNPAY_TM_CODE || '',
  vnpayHashSecret: process.env.VNPAY_HASH_SECRET || '',
  vnpayPayUrl: process.env.VNPAY_PAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnpayReturnUrl: process.env.VNPAY_RETURN_URL || `http://localhost:${port}/api/payments/vnpay/callback`,
  vnpayBankCode: process.env.VNPAY_BANK_CODE || 'NCB',
};
