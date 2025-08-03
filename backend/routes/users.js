import express from 'express';
import { body } from 'express-validator';
import userController from '../controllers/userController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.use(authenticateToken);

// --- INICIO DE LA MODIFICACIÓN ---
const profileUpdateValidationRules = [
    body('gender').isIn(['male', 'female', 'other']).withMessage('Género no válido.'),
    body('age').isInt({ min: 1, max: 120 }).withMessage('Edad no válida.'),
    body('height')
        .isFloat().withMessage('La altura debe ser un número.')
        .customSanitizer(value => {
            // Convierte '1,57' a '1.57' y luego a número
            const num = parseFloat(String(value).replace(',', '.'));
            // Si es un número bajo (ej: 1.57), lo convierte a cm
            if (num < 3) {
                return num * 100;
            }
            return num;
        })
        .isInt({ min: 50, max: 300 }).withMessage('La altura debe estar entre 50 y 300 cm.'),
    body('activityLevel').isFloat({ min: 1, max: 2 }).withMessage('Nivel de actividad no válido.'),
    body('goal').isIn(['lose', 'maintain', 'gain']).withMessage('Objetivo no válido.'),
    body('weight').optional().isFloat({ min: 1 }).withMessage('Peso no válido.')
];
// --- FIN DE LA MODIFICACIÓN ---

router.get('/users/me', userController.getMyProfile);
router.put('/users/me', profileUpdateValidationRules, userController.updateMyProfile);

export default router;