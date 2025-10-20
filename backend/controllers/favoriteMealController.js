import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { FavoriteMeal } = models;

// --- OBTENER TODAS LAS COMIDAS FAVORITAS DE UN USUARIO ---
export const getFavoriteMeals = async (req, res, next) => {
  try {
    const meals = await FavoriteMeal.findAll({
      where: { user_id: req.user.userId },
      order: [['name', 'ASC']],
    });
    res.json(meals);
  } catch (error) {
    next(error);
  }
};

// --- CREAR UNA NUEVA COMIDA FAVORITA ---
export const createFavoriteMeal = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, calories, protein_g, carbs_g, fats_g, weight_g } = req.body;
  const { userId } = req.user;

  try {
    const newMeal = await FavoriteMeal.create({
      user_id: userId,
      name,
      calories,
      protein_g,
      carbs_g,
      fats_g,
      weight_g,
    });
    res.status(201).json(newMeal);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe una comida guardada con este nombre.' });
    }
    next(error);
  }
};

// --- INICIO DE LA MODIFICACIÓN ---
// --- ACTUALIZAR UNA COMIDA FAVORITA EXISTENTE ---
export const updateFavoriteMeal = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mealId } = req.params;
  const { userId } = req.user;
  const { name, calories, protein_g, carbs_g, fats_g, weight_g } = req.body;

  try {
    const meal = await FavoriteMeal.findOne({
      where: { id: mealId, user_id: userId },
    });

    if (!meal) {
      return res.status(404).json({ error: 'Comida favorita no encontrada.' });
    }

    // Verificar si el nuevo nombre ya existe en otra comida favorita del mismo usuario
    if (name && name !== meal.name) {
      const existingMeal = await FavoriteMeal.findOne({
        where: { name, user_id: userId },
      });
      if (existingMeal) {
        return res.status(409).json({ error: 'Ya existe otra comida guardada con este nombre.' });
      }
    }

    // Actualizar los campos
    meal.name = name;
    meal.calories = calories;
    meal.protein_g = protein_g;
    meal.carbs_g = carbs_g;
    meal.fats_g = fats_g;
    meal.weight_g = weight_g;

    await meal.save();
    res.json(meal);
  } catch (error) {
     if (error.name === 'SequelizeUniqueConstraintError') {
       return res.status(409).json({ error: 'Ya existe otra comida guardada con este nombre.' });
     }
    next(error);
  }
};
// --- FIN DE LA MODIFICACIÓN ---

// --- ELIMINAR UNA COMIDA FAVORITA ---
export const deleteFavoriteMeal = async (req, res, next) => {
  const { mealId } = req.params;
  const { userId } = req.user;

  try {
    const meal = await FavoriteMeal.findOne({
      where: { id: mealId, user_id: userId },
    });

    if (!meal) {
      return res.status(404).json({ error: 'Comida no encontrada.' });
    }

    await meal.destroy();
    res.json({ message: 'Comida eliminada de tus favoritos.' });
  } catch (error) {
    next(error);
  }
};

const favoriteMealController = {
  getFavoriteMeals,
  createFavoriteMeal,
  updateFavoriteMeal, // Exportar la nueva función
  deleteFavoriteMeal,
};

export default favoriteMealController;