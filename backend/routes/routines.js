/* backend/routes/routines.js */
import express from 'express';
import { body } from 'express-validator';
import routineController from '../controllers/routineController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.use(authenticateToken);

// --- VALIDACIÓN ---
const routineValidationRules = [
    body('name').trim().notEmpty().withMessage('El nombre de la rutina es requerido.'),
    body('description').optional().trim(),
    body('exercises.*.name').trim().notEmpty().withMessage('El nombre del ejercicio es requerido.'),
    body('exercises.*.sets').isInt({ min: 1 }).withMessage('Las series deben ser un número positivo.'),
    body('exercises.*.reps').trim().notEmpty().withMessage('Las repeticiones son requeridas.')
];

// --- RUTAS DE COMUNIDAD (Orden importante: antes de /:id) ---

// Obtener todas las rutinas públicas (Buscador/Feed)
router.get('/public', routineController.getPublicRoutines);

// Descargar (copiar) una rutina pública a tu colección
router.post('/:id/download', routineController.downloadRoutine);

// Alternar estado público/privado de una rutina propia
router.put('/:id/toggle-public', routineController.togglePublicStatus);


// --- RUTAS CRUD ESTÁNDAR ---

// Obtener mis rutinas
router.get('/', routineController.getAllRoutines);

// Crear rutina
router.post('/', routineValidationRules, routineController.createRoutine);

// Obtener rutina por ID
router.get('/:id', routineController.getRoutineById);

// Actualizar rutina
router.put('/:id', routineValidationRules, routineController.updateRoutine);

// Eliminar rutina
router.delete('/:id', routineController.deleteRoutine);

export default router;