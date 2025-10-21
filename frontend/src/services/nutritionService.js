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
 * Obtiene el resumen de datos de nutrición para un mes y año específicos.
 * @param {number} month - El mes (1-12).
 * @param {number} year - El año (ej: 2025).
 */
export const getNutritionSummary = (month, year) => {
    return apiClient(`/nutrition/summary?month=${month}&year=${year}`);
};

/**
 * Añade un nuevo registro de comida.
 * @param {object} foodData - Datos de la comida (description, calories, macros, etc.).
 */
export const addFoodLog = (foodData) => {
  return apiClient('/nutrition/food', {
    method: 'POST',
    body: foodData,
  });
};

/**
 * Actualiza un registro de comida existente.
 * @param {number} logId - ID del registro a actualizar.
 * @param {object} foodData - Nuevos datos de la comida.
 */
export const updateFoodLog = (logId, foodData) => {
    return apiClient(`/nutrition/food/${logId}`, {
        method: 'PUT',
        body: foodData,
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

// --- INICIO DE LA CORRECCIÓN ---
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

    // Se construye la URL base correctamente desde las variables de entorno
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Se elimina el '/api' duplicado. La variable API_BASE_URL ya lo incluye.
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
// --- FIN DE LA CORRECCIÓN ---