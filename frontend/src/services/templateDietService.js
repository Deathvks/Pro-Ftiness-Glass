/* frontend/src/services/templateDietService.js */
import apiClient from './apiClient';

// Obtener todas las dietas plantilla
export const getAllTemplateDiets = async (goal) => {
    // Construimos la query string manualmente ya que nuestro apiClient básico no procesa 'params'
    const queryString = goal && goal !== 'all' ? `?goal=${goal}` : '';

    // Llamamos a apiClient como función, pasando la URL completa
    return await apiClient(`/template-diets${queryString}`);
};

// Obtener una dieta plantilla específica por ID con sus comidas
export const getTemplateDietById = async (id) => {
    return await apiClient(`/template-diets/${id}`);
};