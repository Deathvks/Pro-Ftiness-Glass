/* backend/routes/stories.js */
import express from 'express';
// CORRECCIÓN: Importación por defecto (sin llaves)
import authenticateToken from '../middleware/authenticateToken.js'; 
import { upload } from '../services/uploadService.js';
import { 
    createStory, 
    getStories, 
    deleteStory, 
    toggleLikeStory, 
    viewStory 
} from '../controllers/storyController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/stories - Obtener historias visibles (amigos/públicas/mías)
router.get('/', getStories);

// POST /api/stories - Subir una nueva historia (imagen o vídeo)
router.post('/', upload.single('file'), createStory);

// DELETE /api/stories/:id - Eliminar una historia propia
router.delete('/:id', deleteStory);

// POST /api/stories/:id/like - Dar o quitar like
router.post('/:id/like', toggleLikeStory);

// POST /api/stories/:id/view - Marcar historia como vista
router.post('/:id/view', viewStory);

export default router;