/* frontend/src/services/templateDietService.js */
// IMPORTANTE: Ya no usamos apiClient para esto, sino la librería local
import { TEMPLATE_DIETS } from '../data/dietLibrary';

// Obtener todas las dietas plantilla
export const getAllTemplateDiets = async (goal) => {
    // Simulamos una llamada a API que devuelve los datos locales instantáneamente
    return new Promise((resolve) => {
        setTimeout(() => {
            let diets = TEMPLATE_DIETS;

            // Filtramos por objetivo si es necesario
            if (goal && goal !== 'all') {
                diets = diets.filter(d => d.goal === goal);
            }

            resolve(diets);
        }, 100); // Pequeño delay para suavizar la UX
    });
};

// Obtener una dieta plantilla específica por ID
export const getTemplateDietById = async (id) => {
    return new Promise((resolve, reject) => {
        const diet = TEMPLATE_DIETS.find(d => d.id === id);
        if (diet) resolve(diet);
        else reject(new Error('Dieta no encontrada'));
    });
};