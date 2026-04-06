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
      const error = new Error('Vui lòng điền đầy đủ thông tin hỗ trợ.');
      error.statusCode = 400;
      throw error;
    }

    if (!isEmail(email)) {
      const error = new Error('Email không hợp lệ.');
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
      message: 'Yêu cầu hỗ trợ đã được ghi nhận. Chúng tôi sẽ phản hồi sớm nhất.',
      createdAt: created.createdAt,
    });
  } catch (error) {
    next(error);
  }
}
