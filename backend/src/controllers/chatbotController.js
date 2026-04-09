import { askInternalChatbot } from '../services/chatbotService.js';

// Nhận câu hỏi từ client rồi chuyển qua service chatbot nội bộ để lấy câu trả lời.
export function askChatbot(request, response, next) {
  try {
    // request.body?.message là nội dung người dùng gửi lên; service sẽ tự xử lý trường hợp rỗng.
    response.json(askInternalChatbot(request.body?.message));
  } catch (error) {
    // Chuyển lỗi cho middleware xử lý lỗi tập trung của Express.
    next(error);
  }
}
