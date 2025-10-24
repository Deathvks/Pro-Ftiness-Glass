import apiClient from './apiClient';

/**
 * Obtiene todas las comidas favoritas del usuario.
 */
export const getFavoriteMeals = () => {
  return apiClient('/meals');
};

/**
 * Guarda una nueva comida en la lista de favoritos.
 * @param {object} mealData - Datos de la comida (name, calories, macros, weight_g, image_url, micronutrients, *_per_100g). <-- MODIFICADO
 */
export const createFavoriteMeal = (mealData) => {
  // --- INICIO DE LA MODIFICACIÓN ---
  // Aseguramos que todos los campos relevantes se envíen
  const bodyData = {
      name: mealData.name,
      calories: mealData.calories,
      protein_g: mealData.protein_g,
      carbs_g: mealData.carbs_g,
      fats_g: mealData.fats_g,
      weight_g: mealData.weight_g,
      image_url: mealData.image_url,
      micronutrients: mealData.micronutrients,
      // Añadir los campos _per_100g si existen en mealData
      calories_per_100g: mealData.calories_per_100g,
      protein_per_100g: mealData.protein_per_100g,
      carbs_per_100g: mealData.carbs_per_100g,
      fat_per_100g: mealData.fat_per_100g, // Asegurarse del nombre correcto
  };
  return apiClient('/meals', {
    method: 'POST',
    body: bodyData, // Usamos bodyData modificado
  });
  // --- FIN DE LA MODIFICACIÓN ---
};

/**
 * Actualiza una comida favorita existente.
 * @param {number} mealId - ID de la comida a actualizar.
 * @param {object} mealData - Nuevos datos de la comida (name, calories, macros, weight_g, image_url, micronutrients, *_per_100g). <-- MODIFICADO
 */
export const updateFavoriteMeal = (mealId, mealData) => {
  // --- INICIO DE LA MODIFICACIÓN ---
  // Aseguramos que todos los campos relevantes se envíen para la actualización
  // Copiamos para no modificar el original y limpiamos campos innecesarios para PUT
  const bodyData = { ...mealData };
  delete bodyData.id; // No enviar id en el cuerpo
  delete bodyData.created_at; // No enviar timestamps
  delete bodyData.updated_at;
  delete bodyData.user_id; // No enviar user_id

  // Asegurar que los campos *_per_100g se incluyan si existen en mealData
  // (ya están en la copia si venían)

  return apiClient(`/meals/${mealId}`, {
    method: 'PUT',
    body: bodyData, // Usamos bodyData modificado
  });
  // --- FIN DE LA MODIFICACIÓN ---
};

/**
 * Elimina una comida de la lista de favoritos.
 * @param {number} mealId - ID de la comida a eliminar.
 */
export const deleteFavoriteMeal = (mealId) => {
  return apiClient(`/meals/${mealId}`, {
    method: 'DELETE',
  });
};