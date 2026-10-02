import db from '../models/index.js';

const { AppRating, User } = db;

export const createRating = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.user.userId;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'La valoración debe estar entre 1 y 5.' });
        }

        // Check if user already rated
        const existing = await AppRating.findOne({ where: { user_id: userId } });
        if (existing) {
            await existing.update({ rating, comment });
            return res.status(200).json({ message: 'Valoración actualizada correctamente.' });
        }

        await AppRating.create({
            user_id: userId,
            rating,
            comment
        });

        res.status(201).json({ message: 'Valoración guardada correctamente.' });
    } catch (error) {
        console.error("Error saving rating:", error);
        res.status(500).json({ error: 'Error al guardar la valoración.' });
    }
};

export const getRatings = async (req, res) => {
    try {
        const ratings = await AppRating.findAll({
            include: [{ model: User, attributes: ['username', 'name', 'profile_image_url'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(ratings);
    } catch (error) {
        console.error("Error fetching ratings:", error);
        res.status(500).json({ error: 'Error al obtener valoraciones.' });
    }
};

export const getMyRating = async (req, res) => {
    try {
        const userId = req.user.userId;
        const rating = await AppRating.findOne({ where: { user_id: userId } });
        res.json(rating || { rating: 0, comment: '' });
    } catch (error) {
        console.error('Error fetching my rating:', error);
        res.status(500).json({ error: 'Error al obtener tu valoración.' });
    }
};
