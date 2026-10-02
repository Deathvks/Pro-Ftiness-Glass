import express from 'express';
import * as ratingController from '../controllers/ratingController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.post('/', authenticateToken, ratingController.createRating);
router.get('/admin', authenticateToken, ratingController.getRatings); // Actually this should be in admin routes or protected

export default router;
