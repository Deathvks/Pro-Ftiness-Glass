import express from 'express';
import exerciseListController from '../controllers/exerciseListController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import { upload } from '../services/uploadService.js';

const router = express.Router();

// Todas las rutas aquí requieren autenticación
router.use(authenticateToken);

// GET /api/exercises -> Devuelve una lista de ejercicios (permite búsqueda)
router.get('/exercises', exerciseListController.getExercises);

// Funciones de administrador
router.post('/exercises/import-youtube', exerciseListController.importYouTubePlaylist);
router.put('/exercises/:id', upload.array('images', 10), exerciseListController.updateExercise);
router.delete('/exercises/:id', exerciseListController.deleteExercise);

export default router;