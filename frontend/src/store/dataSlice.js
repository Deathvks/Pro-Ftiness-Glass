/* frontend/src/store/dataSlice.js */
import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyWeightService from '../services/bodyweightService';
import * as nutritionService from '../services/nutritionService';
import * as favoriteMealService from '../services/favoriteMealService';
import * as templateRoutineService from '../services/templateRoutineService';
import * as creatinaService from '../services/creatinaService';
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

      // --- INICIO MODIFICACIÓN: Cargar datos de Gamificación ---
      if (profileData && get().setGamificationData) {
        // CORRECCIÓN: Usar las claves exactas que espera gamificationSlice (snake_case)
        get().setGamificationData({
          xp: profileData.xp,
          level: profileData.level,
          streak: profileData.streak,
          last_activity_date: profileData.last_activity_date, // Clave corregida
          unlocked_badges: profileData.unlocked_badges        // Clave corregida
        });

        // Comprobar racha al iniciar
        const today = getTodayDateString();
        if (get().checkStreak) get().checkStreak(today);

        // Otorgar insignia de primer login solo si NO la tiene ya (evita duplicados en reload)
        const hasFirstLoginBadge = profileData.unlocked_badges && profileData.unlocked_badges.includes('first_login');
        if (get().unlockBadge && !hasFirstLoginBadge) {
          get().unlockBadge('first_login');
        }
      }
      // --- FIN MODIFICACIÓN ---

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
      get().handleLogout();
    } finally {
      set({ isLoading: false });
    }
  },

  // Obtiene los datos de nutrición para una fecha específica.
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

  /**
   * Obtiene la lista maestra de ejercicios de forma segura.
   * Si no está en el estado, la va a buscar a la API.
   */
  getOrFetchAllExercises: async () => {
    const currentExercises = get().allExercises;
    if (currentExercises && currentExercises.length > 0) {
      return Promise.resolve(currentExercises);
    }

    try {
      const exercises = await exerciseService.getExerciseList();
      set({ allExercises: exercises || [] });
      return exercises || [];
    } catch (error) {
      console.error("Error crítico en getOrFetchAllExercises:", error);
      return [];
    }
  },

  // --- Acciones C.R.U.D. para Rutinas ---

  createRoutine: async (routineData) => {
    try {
      const newRoutine = await routineService.createRoutine(routineData);

      if (!newRoutine || !newRoutine.id) {
        throw new Error('La respuesta del servidor no incluyó la rutina creada.');
      }

      set(state => ({
        routines: [...state.routines, newRoutine]
      }));

      // --- GAMIFICACIÓN: XP por crear rutina y mantener racha ---
      if (get().addXp) get().addXp(20);
      if (get().checkStreak) get().checkStreak(getTodayDateString());

      return { success: true, routine: newRoutine, message: 'Rutina creada con éxito.' };
    } catch (error) {
      console.error('Error en createRoutine (dataSlice):', error);
      return { success: false, routine: null, message: `Error al crear la rutina: ${error.message}` };
    }
  },

  updateRoutine: async (routineId, routineData) => {
    try {
      const updatedRoutine = await routineService.updateRoutine(routineId, routineData);

      if (!updatedRoutine || !updatedRoutine.id) {
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

      // OPTIMIZACIÓN: Actualizar solo el historial de peso en lugar de recargar toda la app
      const history = await bodyWeightService.getHistory();
      set({ bodyWeightLog: history });

      // Actualizar peso en perfil localmente si es más reciente
      if (weightData.weight) {
        set(state => ({
          userProfile: { ...state.userProfile, weight: weightData.weight }
        }));
      }

      // --- GAMIFICACIÓN: XP por peso y racha ---
      if (get().addXp) get().addXp(10);
      if (get().checkStreak) get().checkStreak(getTodayDateString());

      return { success: true, message: 'Peso registrado con éxito.' };
    } catch (error) {
      return { success: false, message: `Error al guardar: ${error.message}` };
    }
  },

  // Actualiza el peso corporal del día actual.
  updateTodayBodyWeight: async (weightData) => {
    try {
      await bodyWeightService.updateTodaysWeight(weightData);

      // OPTIMIZACIÓN: Actualizar solo el historial de peso
      const history = await bodyWeightService.getHistory();
      set({ bodyWeightLog: history });

      // Actualizar peso en perfil localmente
      if (weightData.weight) {
        set(state => ({
          userProfile: { ...state.userProfile, weight: weightData.weight }
        }));
      }

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