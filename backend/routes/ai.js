/* backend/routes/ai.js */
import express from 'express';
import rateLimit from 'express-rate-limit';
import authenticateToken from '../middleware/authenticateToken.js';
import { askAI, scanFood } from '../controllers/aiController.js';

const router = express.Router();

// Limitar llamadas de IA para evitar abusos de cuota o ataques de denegación de servicio
const aiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 30, // máximo 30 peticiones por ventana de 10 min por IP
  message: { error: 'Has alcanzado el límite temporal de consultas de IA. Inténtalo de nuevo en unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/ask', authenticateToken, aiRateLimiter, askAI);
router.post('/scan-food', authenticateToken, aiRateLimiter, scanFood);

export default router;
