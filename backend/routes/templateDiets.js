/* backend/routes/templateDiets.js */
import express from 'express';
import templateDietController from '../controllers/templateDietController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Todas las rutas de este fichero requieren que el usuario esté autenticado
router.use(authenticateToken);

// --- Definición de Rutas ---

// GET /api/template-diets -> Obtener todas las dietas predefinidas
// Admite el parámetro query ?goal=lose|maintain|gain
router.get('/', templateDietController.getAllTemplateDiets);

// GET /api/template-diets/:id -> Obtener una dieta específica con sus comidas
router.get('/:id', templateDietController.getTemplateDietById);

export default router;