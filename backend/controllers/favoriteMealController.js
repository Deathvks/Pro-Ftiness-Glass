/* backend/controllers/favoriteMealController.js */
import { validationResult } from 'express-validator';
import models from '../models/index.js';
// --- INICIO MODIFICACIÓN: Imports para manejo de archivos ---
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- FIN MODIFICACIÓN ---

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

  // --- INICIO DE LA MODIFICACIÓN ---
  let { name, calories, protein_g, carbs_g, fats_g, weight_g, image_url, micronutrients } = req.body;

  // Sanitizar image_url por si llega como string "null" o vacío
  if (image_url === 'null' || image_url === '') {
    image_url = null;
  }
  // --- FIN DE LA MODIFICACIÓN ---

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
      image_url: image_url || null,
      micronutrients: micronutrients || null,
    });
    res.status(201).json(newMeal);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe una comida guardada con este nombre.' });
    }
    next(error);
  }
};

// --- ACTUALIZAR UNA COMIDA FAVORITA EXISTENTE ---
export const updateFavoriteMeal = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mealId } = req.params;
  const { userId } = req.user;

  // --- INICIO DE LA MODIFICACIÓN ---
  let { name, calories, protein_g, carbs_g, fats_g, weight_g, image_url, micronutrients } = req.body;

  // Sanitizar image_url
  if (image_url === 'null' || image_url === '') {
    image_url = null;
  }
  // --- FIN DE LA MODIFICACIÓN ---

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

    // --- INICIO MODIFICACIÓN: Borrar imagen antigua si cambia ---
    const oldImageUrl = meal.image_url;
    // Si había imagen antes y ahora es diferente (nueva o null), borrar la vieja del disco
    if (oldImageUrl && oldImageUrl !== image_url) {
      const oldImagePath = path.join(__dirname, '..', 'public', oldImageUrl);
      fs.unlink(oldImagePath).catch(err => {
        // Ignoramos error si no existe el archivo
        if (err.code !== 'ENOENT') console.error(`Error borrando imagen antigua de favorito: ${err.message}`);
      });
    }
    // --- FIN MODIFICACIÓN ---

    // Actualizar los campos
    meal.name = name;
    meal.calories = calories;
    meal.protein_g = protein_g;
    meal.carbs_g = carbs_g;
    meal.fats_g = fats_g;
    meal.weight_g = weight_g;
    meal.image_url = image_url;
    meal.micronutrients = micronutrients;

    await meal.save();
    res.json(meal);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe otra comida guardada con este nombre.' });
    }
    next(error);
  }
};

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

    // --- INICIO MODIFICACIÓN: Borrar imagen al eliminar ---
    if (meal.image_url) {
      const imagePath = path.join(__dirname, '..', 'public', meal.image_url);
      fs.unlink(imagePath).catch(err => {
        if (err.code !== 'ENOENT') console.error(`Error borrando imagen de favorito eliminado: ${err.message}`);
      });
    }
    // --- FIN MODIFICACIÓN ---

    await meal.destroy();
    res.json({ message: 'Comida eliminada de tus favoritos.' });
  } catch (error) {
    next(error);
  }
};

const favoriteMealController = {
  getFavoriteMeals,
  createFavoriteMeal,
  updateFavoriteMeal,
  deleteFavoriteMeal,
};

export default favoriteMealController;