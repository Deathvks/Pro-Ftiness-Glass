import express from 'express';
import { body } from 'express-validator';
import bodyweightController from '../controllers/bodyweightController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.use(authenticateToken);

const weightValidationRule = [
    body('weight').isFloat({ gt: 0 }).withMessage('El peso debe ser un número positivo.')
];

// CAMBIO: '/bodyweight' -> '/'
router.get('/', bodyweightController.getBodyWeightHistory);
// --- INICIO DE LA CORRECCIÓN ---
// CAMBIO: '/bodyweight' -> '/'
router.post('/', weightValidationRule, bodyweightController.logBodyWeight);
// --- FIN DE LA CORRECCIÓN ---
// CAMBIO: '/bodyweight/today' -> '/today'
router.put('/today', weightValidationRule, bodyweightController.updateTodayBodyWeight);

export default router;