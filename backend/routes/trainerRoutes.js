import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import { authorizeTrainer } from '../middleware/authorizeAdmin.js';
import { registerClient, getClients, saveAnamnesis, updateClient, deleteClient, searchUsers, linkClient, unlinkClient, getClientWorkouts, getTrainerRoutines, assignTrainerRoutine, unassignTrainerRoutine } from '../controllers/trainerController.js';

const router = express.Router();

router.use(authenticateToken, authorizeTrainer);
router.get('/users/search', searchUsers);
router.post('/clients', registerClient);
router.get('/clients', getClients);
router.put('/clients/:clientId', updateClient);
router.delete('/clients/:clientId', deleteClient);
router.put('/clients/:clientId/link', linkClient);
router.put('/clients/:clientId/unlink', unlinkClient);
router.post('/clients/:clientId/anamnesis', saveAnamnesis);
router.get('/clients/:clientId/workouts', getClientWorkouts);
router.get('/routines', getTrainerRoutines);
router.put('/routines/:routineId/assign', assignTrainerRoutine);
router.delete('/routines/:routineId/assign/:clientId', unassignTrainerRoutine);

export default router;
