import models from '../models/index.js';
import { Op } from 'sequelize';

const { ExerciseList } = models;

// Obtener ejercicios, con opción de búsqueda
export const getExercises = async (req, res) => {
    try {
        const { search } = req.query; // Permite buscar por ej: /api/exercises?search=press

        const options = {
            order: [['name', 'ASC']],
            limit: 20 // Limitamos para no sobrecargar el frontend en el autocompletado
        };

        if (search) {
            options.where = {
                name: {
                    [Op.like]: `%${search}%`
                }
            };
        }

        const exercises = await ExerciseList.findAll(options);
        res.json(exercises);
    } catch (error) {
        console.error("Error al obtener la lista de ejercicios:", error);
        res.status(500).json({ error: 'Error al obtener la lista de ejercicios' });
    }
};

const exerciseListController = {
    getExercises
};

export default exerciseListController;