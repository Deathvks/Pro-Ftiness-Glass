import express from 'express';
import personalRecordController from '../controllers/personalRecordController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Todas las rutas aquí requieren autenticación
router.use(authenticateToken);

// --- INICIO DE LA MODIFICACIÓN ---
// GET /api/records/exercises -> Devuelve los nombres de los ejercicios con PRs
router.get('/records/exercises', personalRecordController.getPersonalRecordExerciseNames);
// --- FIN DE LA MODIFICACIÓN ---

// GET /api/records -> Devuelve todos los PRs del usuario con filtros
router.get('/records', personalRecordController.getPersonalRecords);

export default router;