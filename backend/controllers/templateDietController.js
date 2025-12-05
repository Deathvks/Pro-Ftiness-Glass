/* backend/controllers/templateDietController.js */
import models from '../models/index.js';

const { TemplateDiet, TemplateDietMeal } = models;

// --- OBTENER DIETAS PREDEFINIDAS ---
// Permite filtrar por query param ?goal=lose|maintain|gain
export const getAllTemplateDiets = async (req, res, next) => {
    try {
        const { goal } = req.query;
        const whereClause = {};

        // Si se envía un objetivo válido, filtramos por él
        if (goal && ['lose', 'maintain', 'gain'].includes(goal)) {
            whereClause.goal = goal;
        }

        const diets = await TemplateDiet.findAll({
            where: whereClause,
            include: [
                {
                    model: TemplateDietMeal,
                    as: 'TemplateDietMeals',
                }
            ],
            order: [
                ['name', 'ASC'], // Ordenar dietas alfabéticamente
                ['TemplateDietMeals', 'meal_order', 'ASC'], // Ordenar comidas cronológicamente (1, 2, 3...)
            ],
        });

        res.json(diets);
    } catch (error) {
        next(error);
    }
};

// --- OBTENER UNA DIETA POR ID ---
export const getTemplateDietById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const diet = await TemplateDiet.findByPk(id, {
            include: [
                {
                    model: TemplateDietMeal,
                    as: 'TemplateDietMeals',
                }
            ],
            order: [
                ['TemplateDietMeals', 'meal_order', 'ASC'],
            ],
        });

        if (!diet) {
            return res.status(404).json({ error: 'Dieta predefinida no encontrada.' });
        }

        res.json(diet);
    } catch (error) {
        next(error);
    }
};

const templateDietController = {
    getAllTemplateDiets,
    getTemplateDietById,
};

export default templateDietController;