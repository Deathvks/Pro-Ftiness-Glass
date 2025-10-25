/* frontend/src/store/dataSlice.js */
import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyWeightService from '../services/bodyweightService';
import * as nutritionService from '../services/nutritionService';
import * as favoriteMealService from '../services/favoriteMealService';
import * as templateRoutineService from '../services/templateRoutineService';
import * as creatinaService from '../services/creatinaService'; // Importamos el servicio de creatina

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
    // --- INICIO DE LA MODIFICACIÓN (EXISTENTE) ---
    recentMeals: [], // Añadir estado para comidas recientes
    // --- FIN DE LA MODIFICACIÓN (EXISTENTE) ---
    templateRoutines: {},
    todaysCreatineLog: [],
    creatineStats: null,
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

            // --- INICIO DE LA MODIFICACIÓN ---
            // 1. Comprobamos el consentimiento de cookies INMEDIATAMENTE después de tener el ID de usuario.
            //    Usamos 'get()' para llamar a la función definida en 'authSlice'.
            //    Esperamos (await) a que termine antes de continuar.
            if (profileData?.id) {
                await get().checkCookieConsent(profileData.id);
            }
            // --- FIN DE LA MODIFICACIÓN ---

            if (profileData.goal) {
                const today = get().selectedDate;

                // --- INICIO DE LA MODIFICACIÓN (EXISTENTE) ---
                // Añadimos 'nutritionService.getRecentMeals()' a la carga inicial
                const [
                    routines,
                    workouts,
                    bodyweight,
                    nutrition,
                    favoriteMeals,
                    recentMeals, // Nueva variable
                    templateRoutines,
                    todaysCreatine,
                    creatineStats,
                ] = await Promise.all([
                    routineService.getRoutines(),
                    workoutService.getWorkouts(),
                    bodyWeightService.getHistory(),
                    nutritionService.getNutritionLogsByDate(today),
                    favoriteMealService.getFavoriteMeals(),
                    nutritionService.getRecentMeals(), // Asumimos que esta función existe
                    templateRoutineService.getTemplateRoutines(),
                    creatinaService.getCreatinaLogs({ startDate: today, endDate: today }),
                    creatinaService.getCreatinaStats(),
                ]);
                set({
                    routines,
                    workoutLog: workouts,
                    bodyWeightLog: bodyweight,
                    nutritionLog: nutrition.nutrition || [],
                    waterLog: nutrition.water || { quantity_ml: 0 },
                    favoriteMeals,
                    recentMeals: recentMeals || [], // Guardar comidas recientes en el estado
                    templateRoutines,
                    todaysCreatineLog: todaysCreatine.data || [],
                    creatineStats: creatineStats.data || null,
                });
                // --- FIN DE LA MODIFICACIÓN (EXISTENTE) ---
            }
        } catch (error) {
            console.error("Error de autenticación o carga de datos:", error);
            get().handleLogout(); // Llama a la acción del authSlice
        } finally {
            // Esto ahora solo se ejecuta DESPUÉS de que el checkCookieConsent haya terminado.
            set({ isLoading: false });
        }
    },

    // Obtiene los datos de nutrición para una fecha específica.
    fetchDataForDate: async (date) => {
        set({ selectedDate: date, isLoading: true });
        try {
            const [nutrition, todaysCreatine] = await Promise.all([
                nutritionService.getNutritionLogsByDate(date),
                creatinaService.getCreatinaLogs({ startDate: date, endDate: date })
            ]);
            set({
                nutritionLog: nutrition.nutrition || [],
                waterLog: nutrition.water || { quantity_ml: 0 },
                todaysCreatineLog: todaysCreatine.data || [],
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

    // Actualiza una comida favorita existente.
    updateFavoriteMeal: async (mealId, mealData) => {
        try {
            const updatedMeal = await favoriteMealService.updateFavoriteMeal(mealId, mealData);
            set(state => ({
                favoriteMeals: state.favoriteMeals.map(meal =>
                    meal.id === mealId ? updatedMeal : meal
                ).sort((a, b) => a.name.localeCompare(b.name))
            }));
            return { success: true, message: 'Comida favorita actualizada.' };
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
        // --- INICIO DE LA MODIFICACIÓN (EXISTENTE) ---
        // Limpiar 'recentMeals' al cerrar sesión
        set({...initialState});
        // --- FIN DE LA MODIFICACIÓN (EXISTENTE) ---
    },
});