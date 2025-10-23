/* frontend/src/services/nutritionService.js */
import apiClient from './apiClient';
import useAppStore from '../store/useAppStore';

/**
 * Obtiene los registros de nutrición y agua para una fecha específica.
 * @param {string} date - La fecha en formato YYYY-MM-DD.
 */
export const getNutritionLogsByDate = (date) => {
  return apiClient(`/nutrition?date=${date}`);
};

/**
 * Obtiene las comidas registradas recientemente por el usuario.
 */
export const getRecentMeals = () => {
  return apiClient('/nutrition/recent');
};

/**
 * Obtiene el resumen de datos de nutrición para un mes y año específicos.
 * @param {number} month - El mes (1-12).
 * @param {number} year - El año (ej: 2025).
 */
export const getNutritionSummary = (month, year) => {
    return apiClient(`/nutrition/summary?month=${month}&year=${year}`);
};

/**
 * Añade un nuevo registro de comida.
 * @param {object} foodData - Datos de la comida (description, calories, macros, weight_g, image_url, *_per_100g). // <-- Modificado
 */
export const addFoodLog = (foodData) => {
  // --- INICIO DE LA MODIFICACIÓN ---
  // Aseguramos que los campos _per_100g se envíen si existen
  const bodyData = {
      description: foodData.description,
      calories: foodData.calories,
      protein_g: foodData.protein_g,
      carbs_g: foodData.carbs_g,
      fats_g: foodData.fats_g,
      weight_g: foodData.weight_g,
      meal_type: foodData.meal_type,
      log_date: foodData.log_date,
      image_url: foodData.image_url,
      calories_per_100g: foodData.calories_per_100g,
      protein_per_100g: foodData.protein_per_100g,
      carbs_per_100g: foodData.carbs_per_100g,
      fat_per_100g: foodData.fat_per_100g // Corregido: era fat_per_100g
  };
  // --- FIN DE LA MODIFICACIÓN ---
  return apiClient('/nutrition/food', {
    method: 'POST',
    body: bodyData, // Usamos bodyData modificado
  });
};

/**
 * Actualiza un registro de comida existente.
 * @param {number} logId - ID del registro a actualizar.
 * @param {object} foodData - Nuevos datos de la comida (incluyendo *_per_100g opcionalmente). // <-- Modificado
 */
export const updateFoodLog = (logId, foodData) => {
    // --- INICIO DE LA MODIFICACIÓN ---
    // Incluimos los campos _per_100g si están presentes en foodData
    const bodyData = { ...foodData }; // Copiamos para no modificar el original
    // Limpiamos campos que no deben ir en el PUT si no han cambiado o son de control
    delete bodyData.id;
    delete bodyData.log_date;
    delete bodyData.meal_type;
    delete bodyData.tempId;
    delete bodyData.base;
    delete bodyData.origin;
    delete bodyData.isFavorite; // Este campo no pertenece al log en sí
    delete bodyData.name; // Usamos description

    // Aseguramos que los campos *_per_100g se incluyan si existen en foodData
    // (Ya deberían estar en la copia si venían)

    // Si weight_g es null o 0, lo enviamos como null
    if (bodyData.weight_g === 0 || bodyData.weight_g === '') {
        bodyData.weight_g = null;
    }
    // --- FIN DE LA MODIFICACIÓN ---
    return apiClient(`/nutrition/food/${logId}`, {
        method: 'PUT',
        body: bodyData, // Usamos bodyData modificado
    });
};

/**
 * Elimina un registro de comida.
 * @param {number} logId - ID del registro a eliminar.
 */
export const deleteFoodLog = (logId) => {
  return apiClient(`/nutrition/food/${logId}`, {
    method: 'DELETE',
  });
};

/**
 * Añade o actualiza la cantidad de agua para un día.
 * @param {object} waterData - { log_date, quantity_ml }.
 */
export const upsertWaterLog = (waterData) => {
  return apiClient('/nutrition/water', {
    method: 'POST',
    body: waterData,
  });
};

/**
 * Busca un producto por su código de barras.
 * @param {string} barcode - El código de barras del producto.
 */
export const searchByBarcode = (barcode) => {
  return apiClient(`/nutrition/barcode/${barcode}`);
};

/**
 * Sube una imagen de comida al servidor.
 * @param {File} imageFile - El archivo de la imagen a subir.
 */
export const uploadFoodImage = (imageFile) => {
    const formData = new FormData();
    formData.append('foodImage', imageFile);

    const token = useAppStore.getState().token;
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    return fetch(`${API_BASE_URL}/nutrition/food/image`, {
        method: 'POST',
        body: formData,
        headers,
    }).then(async response => {
        if (!response.ok) {
            let errorMessage = 'Error al subir la imagen.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // No hay cuerpo JSON, error genérico
            }
            throw new Error(errorMessage);
        }
        return response.json();
    });
};