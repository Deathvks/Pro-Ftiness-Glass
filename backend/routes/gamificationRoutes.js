import express from 'express';
import { getChallengesForUser } from '../services/challengeService.js';
import authenticateToken from '../middleware/authenticateToken.js';
import models from '../models/index.js';

const { XpLog } = models;

const router = express.Router();

router.get('/challenges', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const challenges = await getChallengesForUser(userId);
        res.json(challenges);
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/xp-history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const limit = parseInt(req.query.limit, 10) || 50;
        
        const logs = await XpLog.findAll({
            where: { user_id: userId },
            order: [
                ['created_at', 'DESC'],
                ['id', 'DESC']
            ],
            limit: limit
        });
        
        res.json(logs);
    } catch (error) {
        console.error('Error fetching XP history:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener historial de XP' });
    }
});

export default router;
