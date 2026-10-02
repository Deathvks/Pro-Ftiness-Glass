/* backend/routes/workouts.js */
import express from 'express';
import { body } from 'express-validator';
import workoutController from '../controllers/workoutController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.use(authenticateToken);

// --- INICIO DE LA VALIDACIÓN ---
const workoutLogValidationRules = [
    body('routineName').trim().notEmpty().withMessage('El nombre de la rutina es requerido.'),
    body('duration_seconds').isInt({ min: 0 }).withMessage('La duración debe ser un número.'),
    body('details.*.exerciseName').trim().notEmpty().withMessage('El nombre del ejercicio es requerido.'),
    body('details.*.setsDone.*.reps').isInt({ min: 0 }).withMessage('Las repeticiones deben ser un número.'),
    body('details.*.setsDone.*.weight_kg').isFloat({ min: 0 }).withMessage('El peso debe ser un número.'),
    // AÑADIDO: Validación para is_warmup
    body('details.*.setsDone.*.is_warmup').optional().isBoolean().withMessage('El campo is_warmup debe ser verdadero o falso.')
];
// --- FIN ---

// CAMBIO: '/workouts' -> '/'
router.get('/', workoutController.getWorkoutHistory);
// CAMBIO: '/workouts' -> '/'
router.post('/', workoutLogValidationRules, workoutController.logWorkoutSession);
// CAMBIO: '/workouts/:workoutId' -> '/:workoutId'
router.put('/:workoutId', workoutController.updateWorkoutLog);
// CAMBIO: '/workouts/:workoutId' -> '/:workoutId'
router.delete('/:workoutId', workoutController.deleteWorkoutLog);

export default router;