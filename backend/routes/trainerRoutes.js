import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import { registerClient, getClients, saveAnamnesis, updateClient, deleteClient, searchUsers, linkClient, unlinkClient, getClientWorkouts } from '../controllers/trainerController.js';

const router = express.Router();

// Middleware para verificar que el usuario es admin o trainer
const requireTrainer = (req, res, next) => {
    const role = req.user.role;
    if (role === 'trainer' || role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Acceso denegado. Requiere rol de entrenador.' });
    }
};

router.get('/users/search', authenticateToken, requireTrainer, searchUsers);
router.post('/clients', authenticateToken, requireTrainer, registerClient);
router.get('/clients', authenticateToken, requireTrainer, getClients);
router.put('/clients/:clientId', authenticateToken, requireTrainer, updateClient);
router.delete('/clients/:clientId', authenticateToken, requireTrainer, deleteClient);
router.put('/clients/:clientId/link', authenticateToken, requireTrainer, linkClient);
router.put('/clients/:clientId/unlink', authenticateToken, requireTrainer, unlinkClient);
router.post('/clients/:clientId/anamnesis', authenticateToken, requireTrainer, saveAnamnesis);
router.get('/clients/:clientId/workouts', authenticateToken, requireTrainer, getClientWorkouts);

export default router;
