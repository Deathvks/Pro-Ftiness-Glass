/* backend/routes/bodyMeasurements.js */
import express from 'express';
import { body } from 'express-validator';
import bodyMeasurementController from '../controllers/bodyMeasurementController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.use(authenticateToken);

// Validaciones
const measurementValidationRules = [
    body('measure_type')
        .trim()
        .notEmpty()
        .withMessage('El tipo de medida es requerido (ej: biceps, cintura).'),
    body('value')
        .isFloat({ min: 0.1 })
        .withMessage('El valor de la medida debe ser un número positivo.'),
    body('unit')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('La unidad no debe exceder 10 caracteres.')
];

// Rutas
router.get('/', bodyMeasurementController.getMeasurementHistory);
router.post('/', measurementValidationRules, bodyMeasurementController.logMeasurement);
router.put('/today', measurementValidationRules, bodyMeasurementController.updateTodayMeasurement);
router.delete('/:id', bodyMeasurementController.deleteMeasurement);

export default router;