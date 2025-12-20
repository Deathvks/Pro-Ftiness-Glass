/* backend/routes/social.js */
import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js'; // <-- Corregido: Sin llaves { }
import {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    respondFriendRequest,
    getFriends,
    getPublicProfile,
    getLeaderboard,
    removeFriend
} from '../controllers/socialController.js';

const router = express.Router();

// Todas las rutas sociales requieren autenticación
router.use(authenticateToken);

router.get('/search', searchUsers); // ?query=nombre
router.post('/request', sendFriendRequest); // { targetUserId }
router.get('/requests', getFriendRequests);
router.post('/respond', respondFriendRequest); // { requestId, action: 'accept'|'reject' }
router.get('/friends', getFriends);
router.get('/leaderboard', getLeaderboard);
router.post('/remove', removeFriend); // { friendId }
router.get('/profile/:userId', getPublicProfile);

export default router;