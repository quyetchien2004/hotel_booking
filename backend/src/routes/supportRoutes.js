import { Router } from 'express';
import { createSupportRequest } from '../controllers/supportController.js';

const router = Router();

router.post('/', createSupportRequest);

export default router;
