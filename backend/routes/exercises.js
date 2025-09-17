import express from 'express';
import { body } from 'express-validator'; // Importar 'body' para las reglas
import exerciseController from '../controllers/exerciseController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.use(authenticateToken);

// --- INICIO DE LA VALIDACIÓN ---
const exerciseValidationRules = [
    body('name').trim().notEmpty().withMessage('El nombre del ejercicio es requerido.'),
    body('sets').isInt({ min: 1 }).withMessage('Las series deben ser un número positivo.'),
    body('reps').trim().notEmpty().withMessage('Las repeticiones son requeridas.'),
    body('muscle_group').optional().trim()
];
// --- FIN ---

router.get('/routines/:routineId/exercises', exerciseController.getExercisesFromRoutine);
// Aplicar las reglas de validación a las rutas POST y PUT
router.post('/routines/:routineId/exercises', exerciseValidationRules, exerciseController.addExerciseToRoutine);
router.put('/exercises/:exerciseId', exerciseValidationRules, exerciseController.updateExercise);
router.delete('/exercises/:exerciseId', exerciseController.deleteExercise);

export default router;