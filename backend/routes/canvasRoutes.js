import Router from 'express';
import {displayLot} from '../controllers/canvasController.js';

const router = Router();

router.post('/display/:lotId/avaliability', displayLot);

export default router;