import { Router } from 'express';
import { searchHotels } from '../controllers/hotelController.js';

const router = Router();

router.get('/search', searchHotels);

export default router;