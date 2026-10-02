/* backend/routes/personalRecords.js */
import express from 'express';
import personalRecordController from '../controllers/personalRecordController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Todas las rutas aquí requieren autenticación
router.use(authenticateToken);

// --- INICIO DE LA MODIFICACIÓN ---
// GET /api/records/exercises -> Devuelve los nombres de los ejercicios con PRs
// (Se quita '/records' del prefijo, ya está definido en server.js)
router.get('/exercises', personalRecordController.getPersonalRecordExerciseNames);

// GET /api/records -> Devuelve todos los PRs del usuario con filtros
// (Se quita '/records' y se usa '/' para la raíz de /api/records)
router.get('/', personalRecordController.getPersonalRecords);
// --- FIN DE LA MODIFICACIÓN ---

export default router;