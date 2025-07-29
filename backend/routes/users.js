import express from 'express';
import { body } from 'express-validator';
import userController from '../controllers/userController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.use(authenticateToken);

// --- INICIO DE LA VALIDACIÓN ---
const profileUpdateValidationRules = [
    body('gender').isIn(['male', 'female', 'other']).withMessage('Género no válido.'),
    body('age').isInt({ min: 1, max: 120 }).withMessage('Edad no válida.'),
    body('height').isInt({ min: 50, max: 300 }).withMessage('Altura no válida.'),
    body('activityLevel').isFloat({ min: 1, max: 2 }).withMessage('Nivel de actividad no válido.'),
    body('goal').isIn(['lose', 'maintain', 'gain']).withMessage('Objetivo no válido.'),
    body('weight').optional().isFloat({ min: 1 }).withMessage('Peso no válido.')
];
// --- FIN ---

router.get('/users/me', userController.getMyProfile);
router.put('/users/me', profileUpdateValidationRules, userController.updateMyProfile);

export default router;