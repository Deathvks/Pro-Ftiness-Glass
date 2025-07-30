import models from '../models/index.js';
import { Op } from 'sequelize';

const { ExerciseList } = models;

// Obtener ejercicios, con opción de búsqueda
export const getExercises = async (req, res, next) => { // <-- Añadido 'next'
    try {
        const { search } = req.query;

        const options = {
            order: [['name', 'ASC']],
            limit: 20
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
        next(error); // <-- Pasar el error al middleware
    }
};

const exerciseListController = {
    getExercises
};

export default exerciseListController;