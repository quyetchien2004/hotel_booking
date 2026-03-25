import { Router } from 'express';
import { askChatbot } from '../controllers/chatbotController.js';

const router = Router();

router.post('/ask', askChatbot);

export default router;