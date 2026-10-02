/* backend/routes/ai.js */
import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import { askAI, scanFood } from '../controllers/aiController.js';

const router = express.Router();

router.post('/ask', authenticateToken, askAI);
router.post('/scan-food', authenticateToken, scanFood);

export default router;