import apiClient from './apiClient';

/**
 * Obtiene todas las comidas favoritas del usuario.
 */
export const getFavoriteMeals = () => {
  return apiClient('/meals');
};

/**
 * Guarda una nueva comida en la lista de favoritos.
 * @param {object} mealData - Datos de la comida (name, calories, macros, weight_g, image_url). <-- MODIFICADO
 */
export const createFavoriteMeal = (mealData) => {
  return apiClient('/meals', {
    method: 'POST',
    body: mealData,
  });
};

// --- INICIO DE LA MODIFICACIÓN ---
/**
 * Actualiza una comida favorita existente.
 * @param {number} mealId - ID de la comida a actualizar.
 * @param {object} mealData - Nuevos datos de la comida (name, calories, macros, weight_g, image_url). <-- MODIFICADO
 */
export const updateFavoriteMeal = (mealId, mealData) => {
  return apiClient(`/meals/${mealId}`, {
    method: 'PUT',
    body: mealData,
  });
};
// --- FIN DE LA MODIFICACIÓN ---

/**
 * Elimina una comida de la lista de favoritos.
 * @param {number} mealId - ID de la comida a eliminar.
 */
export const deleteFavoriteMeal = (mealId) => {
  return apiClient(`/meals/${mealId}`, {
    method: 'DELETE',
  });
};