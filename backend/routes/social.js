/* backend/routes/social.js */
import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
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

// --- Rutas Públicas (Acceso sin login) ---
// Necesarias para la Landing Page y vistas públicas
router.get('/leaderboard', getLeaderboard);
router.get('/profile/:userId', getPublicProfile);

// --- Rutas Protegidas (Requieren autenticación) ---
router.use(authenticateToken);

router.get('/search', searchUsers); // ?query=nombre
router.post('/request', sendFriendRequest); // { targetUserId }
router.get('/requests', getFriendRequests);
router.post('/respond', respondFriendRequest); // { requestId, action: 'accept'|'reject' }
router.get('/friends', getFriends);
router.post('/remove', removeFriend); // { friendId }

export default router;