/* frontend/src/store/dataSlice.js */
import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyWeightService from '../services/bodyweightService';
import * as bodyMeasurementService from '../services/bodyMeasurementService';
import * as nutritionService from '../services/nutritionService';
import * as favoriteMealService from '../services/favoriteMealService';
import * as templateRoutineService from '../services/templateRoutineService';
import * as creatinaService from '../services/creatinaService';
import * as exerciseService from '../services/exerciseService';
import * as personalRecordService from '../services/personalRecordService';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const INITIAL_CACHE_KEY = 'pfg_cached_initial_state_v1';
let lastDateFetchInfo = { date: null, timestamp: 0 };

const readInitialCache = () => {
  try {
    if (typeof window === 'undefined' || !localStorage.getItem('pro_fitness_token')) return null;
    const raw = localStorage.getItem(INITIAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeInitialCache = (partial) => {
  try {
    if (typeof window === 'undefined' || !localStorage.getItem('pro_fitness_token')) return;
    const existing = readInitialCache() || {};
    const merged = {
      ...existing,
      ...partial,
      updatedAt: Date.now(),
    };
    if (Array.isArray(merged.workoutLog) && merged.workoutLog.length > 40) {
      merged.workoutLog = merged.workoutLog.slice(0, 40);
    }
    if (Array.isArray(merged.personalRecords) && merged.personalRecords.length > 60) {
      merged.personalRecords = merged.personalRecords.slice(0, 60);
    }
    localStorage.setItem(INITIAL_CACHE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage quota errors silently
  }
};

const cachedData = readInitialCache();
const todayStr = getTodayDateString();
const isCachedToday = cachedData?.cachedDate === todayStr;

const initialState = {
  routines: Array.isArray(cachedData?.routines) ? cachedData.routines : [],
  workoutLog: Array.isArray(cachedData?.workoutLog) ? cachedData.workoutLog : [],
  bodyWeightLog: Array.isArray(cachedData?.bodyWeightLog) ? cachedData.bodyWeightLog : [],
  bodyMeasurementsLog: Array.isArray(cachedData?.bodyMeasurementsLog) ? cachedData.bodyMeasurementsLog : [],
  prNotification: null,
  nutritionLog: isCachedToday && Array.isArray(cachedData?.nutritionLog) ? cachedData.nutritionLog : [],
  waterLog: isCachedToday && cachedData?.waterLog ? cachedData.waterLog : { quantity_ml: 0 },
  selectedDate: todayStr,
  nutritionSummary: { nutrition: [], water: [] },
  favoriteMeals: Array.isArray(cachedData?.favoriteMeals) ? cachedData.favoriteMeals : [],
  recentMeals: Array.isArray(cachedData?.recentMeals) ? cachedData.recentMeals : [],
  templateRoutines: {},
  todaysCreatineLog: isCachedToday && Array.isArray(cachedData?.todaysCreatineLog) ? cachedData.todaysCreatineLog : [],
  creatineStats: cachedData?.creatineStats || null,
  allExercises: [],
  personalRecords: Array.isArray(cachedData?.personalRecords) ? cachedData.personalRecords : [], // Estado inicial array vacío
};

export const createDataSlice = (set, get) => ({
  ...initialState,

  showPRNotification: (newPRs) => {
    set({ prNotification: newPRs });
    setTimeout(() => set({ prNotification: null }), 7000);
  },

  // --- NUEVA ACCIÓN: Inyectar PRs localmente (Instantáneo) ---
  addLocalPersonalRecords: (newRecords) => {
      if (!newRecords || newRecords.length === 0) return;
      
      set(state => {
          // Aseguramos que state.personalRecords sea un array
          const currentRecords = Array.isArray(state.personalRecords) ? state.personalRecords : [];
          
          // Combinamos los nuevos con los existentes, evitando duplicados si fuera necesario
          // (Aunque para la UI de "Último Récord", simplemente añadirlo al principio o final basta, 
          //  ya que el Dashboard los ordena por fecha).
          return {
              personalRecords: [...newRecords, ...currentRecords]
          };
      });
  },

  fetchPersonalRecords: async () => {
      try {
          const response = await personalRecordService.getPersonalRecords(1, 'all');
          // BLINDAJE: La respuesta viene paginada { records: [], totalPages: ... }
          // Buscamos response.records, o fallback a array directo si la API cambiara
          const records = response?.records || (Array.isArray(response) ? response : []);
          
          set({ personalRecords: records });
      } catch (error) {
          console.error("Error actualizando récords personales:", error);
          // No sobrescribimos con vacío si falla, para mantener lo que ya tengamos localmente
          if (!get().personalRecords) set({ personalRecords: [] });
      }
  },

  fetchInitialData: async () => {
    if (!get().token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    const existingProfile = get().userProfile;
    const hasHydratedProfile = Boolean(existingProfile && 'role' in existingProfile);
    if (!hasHydratedProfile) {
      set({ isLoading: true });
    }

    try {
      const profileData = await userService.getMyProfile();

      // Actualizar silenciosamente la zona horaria sin bloquear el arranque
      try {
        const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (profileData.timezone !== currentTimezone) {
            profileData.timezone = currentTimezone;
            userService.updateUserProfile({ timezone: currentTimezone }).catch(console.error);
        }
      } catch (e) {
        console.warn('Could not detect timezone', e);
      }

      get().checkWelcomeModal();

      // Desbloqueamos inmediatamente la interfaz con el perfil cargado
      set({ userProfile: profileData, isAuthenticated: true, isLoading: false });
      writeInitialCache({ userProfile: profileData });

      // Obtener el conteo de chats no leídos en segundo plano
      if (get().fetchUnreadChats) {
        get().fetchUnreadChats();
      }

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
        Promise.resolve(get().checkCookieConsent(profileData.id)).catch(() => {});
      }

      if (profileData.goal) {
        const today = get().selectedDate || getTodayDateString();
        lastDateFetchInfo = { date: today, timestamp: Date.now() };

        // Fase 1 (Rápida, en paralelo sin bloquear el render): Rutinas y datos del día actual
        Promise.all([
          routineService.getRoutines().catch(() => null),
          nutritionService.getNutritionLogsByDate(today).catch(() => null),
          creatinaService.getCreatinaLogs({ startDate: today, endDate: today }).catch(() => null),
          favoriteMealService.getFavoriteMeals().catch(() => null),
          nutritionService.getRecentMeals().catch(() => null),
        ]).then(([routines, nutrition, todaysCreatine, favoriteMeals, recentMeals]) => {
          const fastUpdate = {};
          if (routines) fastUpdate.routines = routines;
          if (nutrition) {
            fastUpdate.nutritionLog = nutrition.nutrition || [];
            fastUpdate.waterLog = nutrition.water || { quantity_ml: 0 };
          }
          if (todaysCreatine) fastUpdate.todaysCreatineLog = todaysCreatine.data || [];
          if (favoriteMeals) fastUpdate.favoriteMeals = favoriteMeals;
          if (recentMeals) fastUpdate.recentMeals = recentMeals;

          if (Object.keys(fastUpdate).length > 0) {
            set(fastUpdate);
            writeInitialCache({ ...fastUpdate, cachedDate: today });
          }
        }).catch((err) => console.error('Error en carga rápida inicial:', err));

        // Fase 2 (Históricos pesados en segundo plano): Entrenamientos, peso, medidas y récords
        Promise.all([
          workoutService.getWorkouts().catch(() => null),
          bodyWeightService.getHistory().catch(() => null),
          bodyMeasurementService.getHistory().catch(() => null),
          creatinaService.getCreatinaStats().catch(() => null),
          personalRecordService.getPersonalRecords(1, 'all').catch(() => null),
        ]).then(([workouts, bodyweight, measurements, creatineStats, prsResponse]) => {
          const heavyUpdate = {};
          if (workouts) heavyUpdate.workoutLog = workouts;
          if (bodyweight) heavyUpdate.bodyWeightLog = bodyweight;
          if (measurements) heavyUpdate.bodyMeasurementsLog = measurements;
          if (creatineStats) heavyUpdate.creatineStats = creatineStats.data || null;
          if (prsResponse) {
            heavyUpdate.personalRecords = prsResponse?.records || (Array.isArray(prsResponse) ? prsResponse : []);
          }

          if (Object.keys(heavyUpdate).length > 0) {
            set(heavyUpdate);
            writeInitialCache(heavyUpdate);
          }
        }).catch((err) => console.error('Error en carga de historial inicial:', err));
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales (posiblemente de red):", error);
      if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.name === 'TypeError' || error?.isMaintenance) {
        console.log('[fetchInitialData] Error de red detectado, reintentando en 3s...');
        setTimeout(() => { get().fetchInitialData(); }, 3000);
      } else {
        console.error('[fetchInitialData] Error de API al cargar el perfil; se mantiene la sesión.');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDataForDate: async (date, options = {}) => {
    const isSameDate = get().selectedDate === date;
    const now = Date.now();
    // Evitar peticiones duplicadas si acabamos de cargar esta misma fecha hace menos de 45s
    if (!options.force && isSameDate && lastDateFetchInfo.date === date && (now - lastDateFetchInfo.timestamp) < 45000) {
      return;
    }
    lastDateFetchInfo = { date, timestamp: now };

    const shouldShowBlockingLoader = !isSameDate;
    if (shouldShowBlockingLoader) {
      set({ selectedDate: date, isLoading: true });
    } else {
      set({ selectedDate: date });
    }

    try {
      const [nutrition, todaysCreatine, favoriteMeals, recentMeals] = await Promise.all([
        nutritionService.getNutritionLogsByDate(date),
        creatinaService.getCreatinaLogs({ startDate: date, endDate: date }),
        favoriteMealService.getFavoriteMeals(),
        nutritionService.getRecentMeals()
      ]);
      const nextState = {
        nutritionLog: nutrition.nutrition || [],
        waterLog: nutrition.water || { quantity_ml: 0 },
        todaysCreatineLog: todaysCreatine.data || [],
        favoriteMeals: favoriteMeals || [],
        recentMeals: recentMeals || []
      };
      set(nextState);
      if (date === getTodayDateString()) {
        writeInitialCache({ ...nextState, cachedDate: date });
      }
    } catch (error) {
      console.error("Error al cargar datos de nutrición:", error);
    } finally {
      if (shouldShowBlockingLoader) {
        set({ isLoading: false });
      }
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

  getOrFetchTemplateRoutines: async () => {
    const currentTemplates = get().templateRoutines;
    if (currentTemplates && Object.keys(currentTemplates).length > 0) {
      return Promise.resolve(currentTemplates);
    }

    try {
      const templates = await templateRoutineService.getTemplateRoutines();
      set({ templateRoutines: templates || {} });
      return templates || {};
    } catch (error) {
      console.error("Error al obtener rutinas plantilla:", error);
      return {};
    }
  },

  // --- RECARGAR RUTINAS SILENCIOSAMENTE ---
  refreshRoutines: async () => {
    try {
      const routines = await routineService.getRoutines();
      set({ routines });
    } catch (error) {
      console.error("Error al actualizar la lista de rutinas:", error);
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

      if (get().addXp) get().addXp(20, 'Rutina creada');

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

      if (get().addXp) get().addXp(10, 'Peso registrado');

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

      if (response && response.xpAdded > 0) {
        if (get().addXp) get().addXp(response.xpAdded, 'Medida corporal registrada');
      }

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
