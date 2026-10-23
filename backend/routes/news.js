/* backend/routes/news.js */
import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as newsController from '../controllers/newsController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import authorizeAdmin from '../middleware/authorizeAdmin.js';

const router = express.Router();

// Limitador para evitar spam de visitas o likes automatizados
const newsInteractionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máximo 60 interacciones por minuto por IP
  message: { error: 'Demasiadas solicitudes. Por favor, espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- RUTAS PÚBLICAS (Accesibles para Googlebot, SEO y visitantes sin login) ---
router.get('/', newsController.getPublicNews);
router.get('/article/:slug', newsController.getNewsBySlug);
router.post('/article/:slug/view', newsInteractionLimiter, newsController.trackNewsView);
router.post('/article/:slug/like', newsInteractionLimiter, newsController.toggleLikeNews);

// --- RUTAS ADMINISTRADOR (Gestión de noticias y generación con IA) ---
router.get(
  '/admin/automation/status',
  authenticateToken,
  authorizeAdmin,
  newsController.getAutomationStatus
);

router.post(
  '/admin/automation/trigger',
  authenticateToken,
  authorizeAdmin,
  newsController.triggerAutomationNow
);

router.post(
  '/admin/automation/schedule',
  authenticateToken,
  authorizeAdmin,
  newsController.updateAutomationConfig
);

router.post(
  '/admin/fix-duplicate-covers',
  authenticateToken,
  authorizeAdmin,
  newsController.fixDuplicateCovers
);
router.post(
  '/generate-ai',
  authenticateToken,
  authorizeAdmin,
  [
    body('topic').notEmpty().withMessage('El tema es obligatorio.')
  ],
  newsController.generateAINews
);

router.post(
  '/',
  authenticateToken,
  authorizeAdmin,
  [
    body('title').notEmpty().withMessage('El título es obligatorio.'),
    body('summary').notEmpty().withMessage('El resumen es obligatorio.'),
    body('content').notEmpty().withMessage('El contenido es obligatorio.')
  ],
  newsController.createNews
);

router.put(
  '/:id',
  authenticateToken,
  authorizeAdmin,
  newsController.updateNews
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeAdmin,
  newsController.deleteNews
);

export default router;
