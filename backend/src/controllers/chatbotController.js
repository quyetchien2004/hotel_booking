import { askInternalChatbot } from '../services/chatbotService.js';

export function askChatbot(request, response, next) {
  try {
    response.json(askInternalChatbot(request.body?.message));
  } catch (error) {
    next(error);
  }
}