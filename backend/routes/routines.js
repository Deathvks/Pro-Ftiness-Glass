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

router.get('/routines', routineController.getAllRoutines);
router.post('/routines', routineValidationRules, routineController.createRoutine);
router.get('/routines/:id', routineController.getRoutineById);
router.put('/routines/:id', routineValidationRules, routineController.updateRoutine);
router.delete('/routines/:id', routineController.deleteRoutine);

export default router;