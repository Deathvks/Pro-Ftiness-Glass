import express from 'express';
import { body } from 'express-validator';
import routineController from '../controllers/routineController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.use(authenticateToken);

// --- INICIO DE LA VALIDACIÓN ---
const routineValidationRules = [
    body('name').trim().notEmpty().withMessage('El nombre de la rutina es requerido.'),
    body('description').optional().trim(),
    body('exercises.*.name').trim().notEmpty().withMessage('El nombre del ejercicio es requerido.'),
    body('exercises.*.sets').isInt({ min: 1 }).withMessage('Las series deben ser un número positivo.'),
    body('exercises.*.reps').trim().notEmpty().withMessage('Las repeticiones son requeridas.')
];
// --- FIN ---

// CAMBIO: '/routines' -> '/'
router.get('/', routineController.getAllRoutines);
// CAMBIO: '/routines' -> '/'
router.post('/', routineValidationRules, routineController.createRoutine);
// CAMBIO: '/routines/:id' -> '/:id'
router.get('/:id', routineController.getRoutineById);
// CAMBIO: '/routines/:id' -> '/:id'
router.put('/:id', routineValidationRules, routineController.updateRoutine);
// CAMBIO: '/routines/:id' -> '/:id'
router.delete('/:id', routineController.deleteRoutine);

export default router;