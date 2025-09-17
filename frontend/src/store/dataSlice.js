import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyWeightService from '../services/bodyweightService';
import * as nutritionService from '../services/nutritionService';
import * as favoriteMealService from '../services/favoriteMealService';
import * as templateRoutineService from '../services/templateRoutineService';

// Función para obtener la fecha actual en formato YYYY-MM-DD
const getTodayDateString = () => new Date().toISOString().split('T')[0];

// Estado inicial para esta porción del store
const initialState = {
    routines: [],
    workoutLog: [],
    bodyWeightLog: [],
    prNotification: null,
    nutritionLog: [],
    waterLog: { quantity_ml: 0 },
    selectedDate: getTodayDateString(),
    nutritionSummary: { nutrition: [], water: [] },
    favoriteMeals: [],
    templateRoutines: {},
};

// Definimos el "slice" que gestiona los datos de la aplicación.
export const createDataSlice = (set, get) => ({
    ...initialState,

    // --- ACCIONES ---

    // Muestra una notificación de nuevo récord personal durante 7 segundos.
    showPRNotification: (newPRs) => {
        set({ prNotification: newPRs });
        setTimeout(() => set({ prNotification: null }), 7000);
    },

    // Carga todos los datos iniciales necesarios para la aplicación.
    fetchInitialData: async () => {
        if (!get().token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
        }

        set({ isLoading: true });
        try {
            const profileData = await userService.getMyProfile();
            set({ userProfile: profileData, isAuthenticated: true });

            if (profileData.goal) {
                const [
                    routines,
                    workouts,
                    bodyweight,
                    nutrition,
                    favoriteMeals,
                    templateRoutines,
                ] = await Promise.all([
                    routineService.getRoutines(),
                    workoutService.getWorkouts(),
                    bodyWeightService.getHistory(),
                    nutritionService.getNutritionLogsByDate(get().selectedDate),
                    favoriteMealService.getFavoriteMeals(),
                    templateRoutineService.getTemplateRoutines(),
                ]);
                set({
                    routines,
                    workoutLog: workouts,
                    bodyWeightLog: bodyweight,
                    nutritionLog: nutrition.nutrition,
                    waterLog: nutrition.water,
                    favoriteMeals,
                    templateRoutines,
                });
            }
        } catch (error) {
            console.error("Error de autenticación o carga de datos:", error);
            get().handleLogout(); // Llama a la acción del authSlice
        } finally {
            set({ isLoading: false });
        }
    },

    // Obtiene los datos de nutrición para una fecha específica.
    fetchDataForDate: async (date) => {
        set({ selectedDate: date, isLoading: true });
        try {
            const nutrition = await nutritionService.getNutritionLogsByDate(date);
            set({
                nutritionLog: nutrition.nutrition,
                waterLog: nutrition.water,
            });
        } catch (error) {
            console.error("Error al cargar datos de nutrición:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    // Obtiene el resumen de nutrición para un mes y año.
    fetchNutritionSummary: async (month, year) => {
        try {
            const summaryData = await nutritionService.getNutritionSummary(month, year);
            set({
                nutritionSummary: {
                    nutrition: summaryData.nutritionSummary,
                    water: summaryData.waterSummary,
                },
            });
        } catch (error) {
            console.error("Error al cargar el resumen de nutrición:", error);
        }
    },
    
    // Añade una comida a la lista de favoritos.
    addFavoriteMeal: async (mealData) => {
        try {
            const newMeal = await favoriteMealService.createFavoriteMeal(mealData);
            set(state => ({
                favoriteMeals: [...state.favoriteMeals, newMeal].sort((a, b) => a.name.localeCompare(b.name))
            }));
            return { success: true, message: 'Comida guardada en favoritos.' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Elimina una comida de la lista de favoritos.
    deleteFavoriteMeal: async (mealId) => {
        try {
            await favoriteMealService.deleteFavoriteMeal(mealId);
            set(state => ({
                favoriteMeals: state.favoriteMeals.filter(meal => meal.id !== mealId)
            }));
            return { success: true, message: 'Comida eliminada de favoritos.' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Registra un nuevo peso corporal.
    logBodyWeight: async (weightData) => {
        try {
            await bodyWeightService.logWeight(weightData);
            await get().fetchInitialData();
            return { success: true, message: 'Peso registrado con éxito.' };
        } catch (error) {
            return { success: false, message: `Error al guardar: ${error.message}` };
        }
    },

    // Actualiza el peso corporal del día actual.
    updateTodayBodyWeight: async (weightData) => {
        try {
            await bodyWeightService.updateTodaysWeight(weightData);
            await get().fetchInitialData();
            return { success: true, message: 'Peso actualizado con éxito.' };
        } catch (error) {
            return { success: false, message: `Error al actualizar: ${error.message}` };
        }
    },

    // Resetea el estado de los datos al cerrar sesión.
    clearDataState: () => {
        set(initialState);
    },
});