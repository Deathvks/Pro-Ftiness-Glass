/* frontend/src/services/favoriteMealService.js */
import apiClient from './apiClient';

/**
 * Obtiene todas las comidas favoritas del usuario.
 */
export const getFavoriteMeals = () => {
  return apiClient('/meals');
};

/**
 * Guarda una nueva comida en la lista de favoritos.
 * @param {object} mealData
 */
export const createFavoriteMeal = (mealData) => {
  const bodyData = {
    name: mealData.name,
    calories: mealData.calories,
    protein_g: mealData.protein_g,
    carbs_g: mealData.carbs_g,
    fats_g: mealData.fats_g,
    sugars_g: mealData.sugars_g, // AÑADIDO
    weight_g: mealData.weight_g,
    image_url: mealData.image_url,
    micronutrients: mealData.micronutrients,
    calories_per_100g: mealData.calories_per_100g,
    protein_per_100g: mealData.protein_per_100g,
    carbs_per_100g: mealData.carbs_per_100g,
    fat_per_100g: mealData.fat_per_100g,
    sugars_per_100g: mealData.sugars_per_100g, // AÑADIDO
  };

  return apiClient('/meals', {
    method: 'POST',
    body: bodyData,
  });
};

/**
 * Actualiza una comida favorita existente.
 * @param {number} mealId
 * @param {object} mealData
 */
export const updateFavoriteMeal = (mealId, mealData) => {
  // Usamos whitelist para asegurar que solo enviamos los campos permitidos y correctos
  // ignorando timestamps o campos residuales que pueda traer mealData
  const bodyData = {
    name: mealData.name,
    calories: mealData.calories,
    protein_g: mealData.protein_g,
    carbs_g: mealData.carbs_g,
    fats_g: mealData.fats_g,
    sugars_g: mealData.sugars_g, // AÑADIDO
    weight_g: mealData.weight_g,
    image_url: mealData.image_url,
    micronutrients: mealData.micronutrients,
    calories_per_100g: mealData.calories_per_100g,
    protein_per_100g: mealData.protein_per_100g,
    carbs_per_100g: mealData.carbs_per_100g,
    fat_per_100g: mealData.fat_per_100g,
    sugars_per_100g: mealData.sugars_per_100g, // AÑADIDO
  };

  return apiClient(`/meals/${mealId}`, {
    method: 'PUT',
    body: bodyData,
  });
};

/**
 * Elimina una comida de la lista de favoritos.
 * @param {number} mealId
 */
export const deleteFavoriteMeal = (mealId) => {
  return apiClient(`/meals/${mealId}`, {
    method: 'DELETE',
  });
};