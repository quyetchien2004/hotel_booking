import { Router } from 'express';
import { getRoomDetail, listRooms } from '../controllers/roomController.js';

const router = Router();

router.get('/', listRooms);
router.get('/:roomId', getRoomDetail);

export default router;
