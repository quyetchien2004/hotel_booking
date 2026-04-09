import { SupportRequest } from '../models/SupportRequest.js';

// Kiểm tra email có đúng định dạng cơ bản hay không.
function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

// Tạo một yêu cầu hỗ trợ mới từ form liên hệ của người dùng.
export async function createSupportRequest(request, response, next) {
  try {
    // Chuẩn hóa dữ liệu đầu vào để tránh khoảng trắng thừa.
    const name = String(request.body?.name || '').trim();
    const email = String(request.body?.email || '').trim();
    const topic = String(request.body?.topic || '').trim();
    const message = String(request.body?.message || '').trim();

    if (!name || !email || !topic || !message) {
      // Thiếu bất kỳ trường bắt buộc nào thì trả lỗi 400.
      const error = new Error('Vui lòng điền đầy đủ thông tin hỗ trợ.');
      error.statusCode = 400;
      throw error;
    }

    if (!isEmail(email)) {
      // Chỉ chấp nhận email hợp lệ để đội hỗ trợ có thể phản hồi.
      const error = new Error('Email không hợp lệ.');
      error.statusCode = 400;
      throw error;
    }

    // Lưu yêu cầu hỗ trợ vào database.
    const created = await SupportRequest.create({
      name,
      email,
      topic,
      message,
    });

    // Trả thông tin cơ bản của yêu cầu vừa tạo cho frontend.
    response.status(201).json({
      id: created._id,
      status: created.status,
      message: 'Yêu cầu hỗ trợ đã được ghi nhận. Chúng tôi sẽ phản hồi sớm nhất.',
      createdAt: created.createdAt,
    });
  } catch (error) {
    // Đẩy lỗi sang middleware chung của Express.
    next(error);
  }
}
