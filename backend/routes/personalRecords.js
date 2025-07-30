import express from 'express';
import personalRecordController from '../controllers/personalRecordController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Todas las rutas aquí requieren autenticación
router.use(authenticateToken);

// GET /api/records -> Devuelve todos los PRs del usuario
router.get('/records', personalRecordController.getPersonalRecords);

export default router;