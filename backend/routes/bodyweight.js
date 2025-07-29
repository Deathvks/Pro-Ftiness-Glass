import express from 'express';
import { body } from 'express-validator';
import bodyweightController from '../controllers/bodyweightController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.use(authenticateToken);

const weightValidationRule = [
    body('weight').isFloat({ gt: 0 }).withMessage('El peso debe ser un número positivo.')
];

router.get('/bodyweight', bodyweightController.getBodyWeightHistory);
// --- INICIO DE LA CORRECCIÓN ---
// Se cambia la regla de validación para que ambas rutas usen 'weight'
router.post('/bodyweight', weightValidationRule, bodyweightController.logBodyWeight);
// --- FIN DE LA CORRECCIÓN ---
router.put('/bodyweight/today', weightValidationRule, bodyweightController.updateTodayBodyWeight);

export default router;