import express from 'express';
import exerciseListController from '../controllers/exerciseListController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Todas las rutas aquí requieren autenticación
router.use(authenticateToken);

// GET /api/exercises -> Devuelve una lista de ejercicios (permite búsqueda)
router.get('/exercises', exerciseListController.getExercises);

export default router;