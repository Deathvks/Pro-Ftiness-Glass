/* backend/routes/news.js */
import express from 'express';
import { body } from 'express-validator';
import * as newsController from '../controllers/newsController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import authorizeAdmin from '../middleware/authorizeAdmin.js';

const router = express.Router();

// --- RUTAS PÚBLICAS (Accesibles para Googlebot, SEO y visitantes sin login) ---
router.get('/', newsController.getPublicNews);
router.get('/article/:slug', newsController.getNewsBySlug);

// --- RUTAS ADMINISTRADOR (Gestión de noticias y generación con IA) ---
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
