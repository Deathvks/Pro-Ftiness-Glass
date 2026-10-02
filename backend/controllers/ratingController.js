import db from '../models/index.js';

const { AppRating, User } = db;

export const createRating = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'La valoración debe estar entre 1 y 5.' });
        }

        // Check if user already rated
        const existing = await AppRating.findOne({ where: { user_id: userId } });
        if (existing) {
            return res.status(400).json({ error: 'Ya has enviado una valoración.' });
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
