import { SupportRequest } from '../models/SupportRequest.js';

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export async function createSupportRequest(request, response, next) {
  try {
    const name = String(request.body?.name || '').trim();
    const email = String(request.body?.email || '').trim();
    const topic = String(request.body?.topic || '').trim();
    const message = String(request.body?.message || '').trim();

    if (!name || !email || !topic || !message) {
      const error = new Error('Vui long dien day du thong tin ho tro.');
      error.statusCode = 400;
      throw error;
    }

    if (!isEmail(email)) {
      const error = new Error('Email khong hop le.');
      error.statusCode = 400;
      throw error;
    }

    const created = await SupportRequest.create({
      name,
      email,
      topic,
      message,
    });

    response.status(201).json({
      id: created._id,
      status: created.status,
      message: 'Yeu cau ho tro da duoc ghi nhan. Chung toi se phan hoi som nhat.',
      createdAt: created.createdAt,
    });
  } catch (error) {
    next(error);
  }
}
