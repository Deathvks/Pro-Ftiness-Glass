/* backend/controllers/favoriteMealController.js */
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { deleteFile } from '../services/imageService.js';

const { FavoriteMeal, NutritionLog } = models;

/**
 * Helper para verificar si una imagen está siendo usada por otros registros.
 * Retorna true si la imagen está en uso por alguien más.
 */
const isImageInUse = async (imageUrl) => {
  if (!imageUrl) return false;

  // 1. Verificar en NutritionLogs
  const logsCount = await NutritionLog.count({
    where: { image_url: imageUrl }
  });
  if (logsCount > 0) return true;

  // 2. Verificar en FavoriteMeals
  const favsCount = await FavoriteMeal.count({
    where: { image_url: imageUrl }
  });
  return favsCount > 0;
};

// --- OBTENER TODAS LAS COMIDAS FAVORITAS ---
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

  // AÑADIDO: sugars_g y campos per_100g
  let { 
    name, calories, protein_g, carbs_g, fats_g, sugars_g, weight_g, image_url, micronutrients,
    calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugars_per_100g 
  } = req.body;

  if (image_url === 'null' || image_url === 'undefined' || image_url === '') {
    image_url = null;
  }

  const { userId } = req.user;

  try {
    const newMeal = await FavoriteMeal.create({
      user_id: userId,
      name,
      calories,
      protein_g,
      carbs_g,
      fats_g,
      sugars_g: sugars_g || null,
      weight_g,
      image_url: image_url || null,
      micronutrients: micronutrients || null,
      calories_per_100g: calories_per_100g || null,
      protein_per_100g: protein_per_100g || null,
      carbs_per_100g: carbs_per_100g || null,
      fat_per_100g: fat_per_100g || null,
      sugars_per_100g: sugars_per_100g || null,
    });
    res.status(201).json(newMeal);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe una comida guardada con este nombre.' });
    }
    next(error);
  }
};

// --- ACTUALIZAR UNA COMIDA FAVORITA ---
export const updateFavoriteMeal = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mealId } = req.params;
  const { userId } = req.user;

  // AÑADIDO: sugars_g y campos per_100g
  let { 
    name, calories, protein_g, carbs_g, fats_g, sugars_g, weight_g, image_url, micronutrients,
    calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugars_per_100g 
  } = req.body;

  if (image_url === 'null' || image_url === 'undefined' || image_url === '') {
    image_url = null;
  }

  try {
    const meal = await FavoriteMeal.findOne({
      where: { id: mealId, user_id: userId },
    });

    if (!meal) {
      return res.status(404).json({ error: 'Comida favorita no encontrada.' });
    }

    if (name && name !== meal.name) {
      const existingMeal = await FavoriteMeal.findOne({
        where: { name, user_id: userId },
      });
      if (existingMeal) {
        return res.status(409).json({ error: 'Ya existe otra comida guardada con este nombre.' });
      }
    }

    const oldImageUrl = meal.image_url;

    // Actualizamos campos
    if (image_url !== undefined) meal.image_url = image_url;
    meal.name = name;
    meal.calories = calories;
    meal.protein_g = protein_g;
    meal.carbs_g = carbs_g;
    meal.fats_g = fats_g;
    meal.sugars_g = sugars_g;
    meal.weight_g = weight_g;
    meal.micronutrients = micronutrients;
    meal.calories_per_100g = calories_per_100g;
    meal.protein_per_100g = protein_per_100g;
    meal.carbs_per_100g = carbs_per_100g;
    meal.fat_per_100g = fat_per_100g;
    meal.sugars_per_100g = sugars_per_100g;

    // 1. Guardamos en BD (La imagen antigua desaparece de este registro aquí)
    await meal.save();

    // 2. Comprobamos si la imagen antigua ha quedado huérfana
    if (image_url !== undefined && oldImageUrl && oldImageUrl !== image_url) {
      const inUse = await isImageInUse(oldImageUrl);
      if (!inUse) {
        deleteFile(oldImageUrl);
      }
    }

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

    const imageUrl = meal.image_url;

    // 1. Borramos de BD
    await meal.destroy();

    // 2. Comprobamos si la imagen ha quedado huérfana
    if (imageUrl) {
      const inUse = await isImageInUse(imageUrl);
      if (!inUse) {
        deleteFile(imageUrl);
      }
    }

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