/* backend/routes/squads.js */
import express from 'express';
import {
  createSquad,
  joinSquad,
  getMySquads,
  getSquadLeaderboard,
  leaveSquad,
  deleteSquad // Añadido: Controlador para eliminar tribu
} from '../controllers/squadController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Todas las rutas de squads requieren estar autenticado
router.use(authenticateToken);

// Crear un nuevo squad
router.post('/', createSquad);

// Unirse a un squad existente mediante código de invitación
router.post('/join', joinSquad);

// Obtener la lista de squads del usuario actual
router.get('/my-squads', getMySquads);

// Obtener el ranking/leaderboard de un squad específico
router.get('/:id/leaderboard', getSquadLeaderboard);

// Abandonar un squad (para miembros)
router.delete('/:id/leave', leaveSquad);

// Eliminar un squad (solo para el admin)
router.delete('/:id', deleteSquad);

export default router;