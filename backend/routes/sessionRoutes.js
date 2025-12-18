/* backend/routes/sessionRoutes.js */
import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import {
    getUserSessions,
    revokeSession,
    revokeAllOtherSessions
} from '../controllers/sessionController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener sesiones activas
router.get('/', getUserSessions);

// Cerrar todas las sesiones excepto la actual (Importante: definir antes de /:sessionId)
router.delete('/other', revokeAllOtherSessions);

// Cerrar una sesión específica
router.delete('/:sessionId', revokeSession);

export default router;