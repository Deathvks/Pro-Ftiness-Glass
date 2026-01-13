/* frontend/src/store/dataSlice.js */
import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyWeightService from '../services/bodyweightService';
import * as bodyMeasurementService from '../services/bodyMeasurementService'; // --- NUEVO IMPORT ---
import * as nutritionService from '../services/nutritionService';
import * as favoriteMealService from '../services/favoriteMealService';
import * as templateRoutineService from '../services/templateRoutineService';
import * as creatinaService from '../services/creatinaService';
import * as exerciseService from '../services/exerciseService';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const initialState = {
  routines: [],
  workoutLog: [],
  bodyWeightLog: [],
  bodyMeasurementsLog: [], // --- NUEVO ESTADO ---
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

export const createDataSlice = (set, get) => ({
  ...initialState,

  showPRNotification: (newPRs) => {
    set({ prNotification: newPRs });
    setTimeout(() => set({ prNotification: null }), 7000);
  },

  fetchInitialData: async () => {
    if (!get().token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const profileData = await userService.getMyProfile();
      set({ userProfile: profileData, isAuthenticated: true });

      if (profileData && get().setGamificationData) {
        get().setGamificationData({
          xp: profileData.xp,
          level: profileData.level,
          streak: profileData.streak,
          last_activity_date: profileData.last_activity_date,
          unlocked_badges: profileData.unlocked_badges
        });

        const today = getTodayDateString();
        if (get().checkStreak) get().checkStreak(today);

        const hasFirstLoginBadge = profileData.unlocked_badges && profileData.unlocked_badges.includes('first_login');
        if (get().unlockBadge && !hasFirstLoginBadge) {
          get().unlockBadge('first_login');
        }
      }

      if (profileData?.id) {
        await get().checkCookieConsent(profileData.id);
      }

      if (profileData.goal) {
        const today = get().selectedDate;

        const [
          routines,
          workouts,
          bodyweight,
          measurements, // --- NUEVO DATO ---
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
          bodyMeasurementService.getHistory(), // --- CARGA DEL HISTORIAL ---
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
          bodyMeasurementsLog: measurements || [], // --- SET STATE ---
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

  fetchDataForDate: async (date) => {
    set({ selectedDate: date, isLoading: true });
    try {
      const [nutrition, todaysCreatine, favoriteMeals, recentMeals] = await Promise.all([
        nutritionService.getNutritionLogsByDate(date),
        creatinaService.getCreatinaLogs({ startDate: date, endDate: date }),
        favoriteMealService.getFavoriteMeals(),
        nutritionService.getRecentMeals()
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

  // --- RUTINAS ---

  createRoutine: async (routineData) => {
    try {
      const newRoutine = await routineService.createRoutine(routineData);

      if (!newRoutine || !newRoutine.id) throw new Error('Error al crear rutina');

      set(state => ({
        routines: [...state.routines, newRoutine]
      }));

      if (get().addXp) get().addXp(20);
      if (get().checkStreak) get().checkStreak(getTodayDateString());

      return { success: true, routine: newRoutine, message: 'Rutina creada con éxito.' };
    } catch (error) {
      return { success: false, routine: null, message: error.message };
    }
  },

  updateRoutine: async (routineId, routineData) => {
    try {
      const updatedRoutine = await routineService.updateRoutine(routineId, routineData);

      if (!updatedRoutine || !updatedRoutine.id) throw new Error('Error al actualizar rutina');

      set(state => ({
        routines: state.routines.map(r => r.id === routineId ? updatedRoutine : r)
      }));

      return { success: true, routine: updatedRoutine, message: 'Rutina actualizada.' };
    } catch (error) {
      return { success: false, routine: null, message: error.message };
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
        endWorkout(false);
      }

      return { success: true, message: 'Rutina eliminada.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // --- FAVORITOS ---

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

  // --- PESO CORPORAL ---

  logBodyWeight: async (weightData) => {
    try {
      await bodyWeightService.logWeight(weightData);
      const history = await bodyWeightService.getHistory();
      set({ bodyWeightLog: history });

      if (weightData.weight) {
        set(state => ({
          userProfile: { ...state.userProfile, weight: weightData.weight }
        }));
      }

      if (get().addXp) get().addXp(10);
      if (get().checkStreak) get().checkStreak(getTodayDateString());

      return { success: true, message: 'Peso registrado con éxito.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  updateTodayBodyWeight: async (weightData) => {
    try {
      await bodyWeightService.updateTodaysWeight(weightData);
      const history = await bodyWeightService.getHistory();
      set({ bodyWeightLog: history });

      if (weightData.weight) {
        set(state => ({
          userProfile: { ...state.userProfile, weight: weightData.weight }
        }));
      }

      return { success: true, message: 'Peso actualizado con éxito.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // --- NUEVAS ACCIONES: MEDIDAS CORPORALES ---

  logBodyMeasurement: async (data) => {
    try {
      const response = await bodyMeasurementService.logMeasurement(data);
      const history = await bodyMeasurementService.getHistory();
      set({ bodyMeasurementsLog: history });

      // Solo sumamos XP si el backend indicó que se ganó (xpAdded > 0)
      if (response && response.xpAdded > 0) {
        if (get().addXp) get().addXp(response.xpAdded);
      }

      // Mensaje condicional dependiendo de si se ganó XP o no
      const message = (response && response.xpAdded > 0)
        ? 'Medida registrada con éxito.'
        : 'Medida registrada. Límite diario de XP por músculo alcanzado.';

      return { success: true, message: message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  updateTodayBodyMeasurement: async (data) => {
    try {
      await bodyMeasurementService.updateTodayMeasurement(data);
      const history = await bodyMeasurementService.getHistory();
      set({ bodyMeasurementsLog: history });

      return { success: true, message: 'Medida actualizada con éxito.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  deleteBodyMeasurement: async (id) => {
    try {
      await bodyMeasurementService.deleteMeasurement(id);
      set(state => ({
        bodyMeasurementsLog: state.bodyMeasurementsLog.filter(log => log.id !== id)
      }));
      return { success: true, message: 'Medida eliminada.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  clearDataState: () => {
    set({ ...initialState });
  },
});