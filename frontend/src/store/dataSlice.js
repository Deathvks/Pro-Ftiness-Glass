/* frontend/src/store/dataSlice.js */
import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyWeightService from '../services/bodyweightService';
import * as nutritionService from '../services/nutritionService';
import * as favoriteMealService from '../services/favoriteMealService';
import * as templateRoutineService from '../services/templateRoutineService';
import * as creatinaService from '../services/creatinaService'; // Importamos el servicio de creatina
import * as exerciseService from '../services/exerciseService';

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
  recentMeals: [],
  templateRoutines: {},
  todaysCreatineLog: [],
  creatineStats: null,
  allExercises: [],
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

      if (profileData?.id) {
        await get().checkCookieConsent(profileData.id);
      }

      if (profileData.goal) {
        const today = get().selectedDate;

        const [
          routines,
          workouts,
          bodyweight,
          nutrition,
          favoriteMeals,
          recentMeals,
          templateRoutines,
          todaysCreatine,
          creatineStats,
          exercises
        ] = await Promise.all([
          routineService.getRoutines(),
          workoutService.getWorkouts(),
          bodyWeightService.getHistory(),
          nutritionService.getNutritionLogsByDate(today),
          favoriteMealService.getFavoriteMeals(),
          nutritionService.getRecentMeals(),
          templateRoutineService.getTemplateRoutines(),
          creatinaService.getCreatinaLogs({ startDate: today, endDate: today }),
          creatinaService.getCreatinaStats(),
          exerciseService.getExerciseList()
        ]);
        set({
          routines,
          workoutLog: workouts,
          bodyWeightLog: bodyweight,
          nutritionLog: nutrition.nutrition || [],
          waterLog: nutrition.water || { quantity_ml: 0 },
          favoriteMeals,
          recentMeals: recentMeals || [],
          templateRoutines,
          todaysCreatineLog: todaysCreatine.data || [],
          creatineStats: creatineStats.data || null,
          allExercises: exercises || []
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
  // --- INICIO DE LA MODIFICACIÓN ---
  // Ahora recargamos también favoritos y recientes para asegurar que las imágenes
  // se sincronicen si se editaron desde el modal de añadir.
  fetchDataForDate: async (date) => {
    set({ selectedDate: date, isLoading: true });
    try {
      const [nutrition, todaysCreatine, favoriteMeals, recentMeals] = await Promise.all([
        nutritionService.getNutritionLogsByDate(date),
        creatinaService.getCreatinaLogs({ startDate: date, endDate: date }),
        favoriteMealService.getFavoriteMeals(), // Recargar favoritos
        nutritionService.getRecentMeals()       // Recargar recientes
      ]);
      set({
        nutritionLog: nutrition.nutrition || [],
        waterLog: nutrition.water || { quantity_ml: 0 },
        todaysCreatineLog: todaysCreatine.data || [],
        favoriteMeals: favoriteMeals || [],
        recentMeals: recentMeals || []
      });
    } catch (error) {
      console.error("Error al cargar datos de nutrición:", error);
    } finally {
      set({ isLoading: false });
    }
  },
  // --- FIN DE LA MODIFICACIÓN ---

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

  // --- INICIO DE LA MODIFICACIÓN ---
  /**
   * Obtiene la lista maestra de ejercicios de forma segura.
   * Si no está en el estado, la va a buscar a la API.
   * Esto previene 'race conditions' si se llama antes de que fetchInitialData termine.
   * @returns {Promise<Array>} - La lista de allExercises.
   */
  getOrFetchAllExercises: async () => {
    // 1. Revisa si ya la tenemos en el estado.
    const currentExercises = get().allExercises;
    if (currentExercises && currentExercises.length > 0) {
      return Promise.resolve(currentExercises);
    }

    // 2. Si no, la vamos a buscar (fallback).
    try {
      const exercises = await exerciseService.getExerciseList();
      set({ allExercises: exercises || [] });
      return exercises || [];
    } catch (error) {
      console.error("Error crítico en getOrFetchAllExercises:", error);
      return []; // Devuelve array vacío para no crashear
    }
  },
  // --- FIN DE LA MODIFICACIÓN ---

  // --- Acciones C.R.U.D. para Rutinas ---

  /**
   * Crea una nueva rutina.
   * @param {object} routineData - Los datos de la nueva rutina.
   * @returns {object} - { success: boolean, routine: object|null, message: string }
   */
  createRoutine: async (routineData) => {
    try {
      const newRoutine = await routineService.createRoutine(routineData);

      if (!newRoutine || !newRoutine.id) {
        console.error('Error: createRoutine service did not return a valid routine with ID.', newRoutine);
        throw new Error('La respuesta del servidor no incluyó la rutina creada.');
      }

      set(state => ({
        routines: [...state.routines, newRoutine]
      }));

      return { success: true, routine: newRoutine, message: 'Rutina creada con éxito.' };
    } catch (error) {
      console.error('Error en createRoutine (dataSlice):', error);
      return { success: false, routine: null, message: `Error al crear la rutina: ${error.message}` };
    }
  },

  /**
   * Actualiza una rutina existente.
   * @param {string} routineId - El ID de la rutina a actualizar.
   * @param {object} routineData - Los nuevos datos para la rutina.
   * @returns {object} - { success: boolean, routine: object|null, message: string }
   */
  updateRoutine: async (routineId, routineData) => {
    try {
      const updatedRoutine = await routineService.updateRoutine(routineId, routineData);

      if (!updatedRoutine || !updatedRoutine.id) {
        console.error('Error: updateRoutine service did not return a valid routine with ID.', updatedRoutine);
        throw new Error('La respuesta del servidor no incluyó la rutina actualizada.');
      }

      set(state => ({
        routines: state.routines.map(r =>
          r.id === routineId ? updatedRoutine : r
        )
      }));

      return { success: true, routine: updatedRoutine, message: 'Rutina actualizada.' };
    } catch (error) {
      console.error('Error en updateRoutine (dataSlice):', error);
      return { success: false, routine: null, message: `Error al actualizar la rutina: ${error.message}` };
    }
  },

  /**
   * Elimina una rutina.
   * @param {string} routineId - El ID de la rutina a eliminar.
   * @returns {object} - { success: boolean, message: string }
   */
  deleteRoutine: async (routineId) => {
    try {
      await routineService.deleteRoutine(routineId);

      set(state => ({
        routines: state.routines.filter(r => r.id !== routineId)
      }));

      const { activeWorkout, endWorkout } = get();
      if (activeWorkout && activeWorkout.routine_id === routineId) {
        endWorkout(false); // Terminar sin guardar
      }

      return { success: true, message: 'Rutina eliminada.' };
    } catch (error) {
      console.error('Error en deleteRoutine (dataSlice):', error);
      return { success: false, message: `Error al eliminar la rutina: ${error.message}` };
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
    set({ ...initialState });
  },
});