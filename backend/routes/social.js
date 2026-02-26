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
    removeFriend,
    getFeed,
    toggleLike,
    addComment,
    deleteComment
} from '../controllers/socialController.js';

const router = express.Router();

// --- Rutas Públicas (Acceso sin login) ---
router.get('/leaderboard', getLeaderboard);
router.get('/profile/:userId', getPublicProfile);

// --- Rutas Protegidas (Requieren autenticación) ---
router.use(authenticateToken);

// Amigos y Búsqueda
router.get('/search', searchUsers);
router.post('/request', sendFriendRequest);
router.get('/requests', getFriendRequests);
router.post('/respond', respondFriendRequest);
router.get('/friends', getFriends);
router.post('/remove', removeFriend);

// Feed y Muro
router.get('/feed', getFeed);
router.post('/workout/:workoutId/like', toggleLike);
router.post('/workout/:workoutId/comment', addComment);
router.delete('/comment/:commentId', deleteComment);

export default router;