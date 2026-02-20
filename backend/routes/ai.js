/* backend/routes/ai.js */
import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import { askAI } from '../controllers/aiController.js';

const router = express.Router();

router.post('/ask', authenticateToken, askAI);

export default router;