/* frontend/src/store/gamificationSlice.js */
import apiClient from '../services/apiClient';

// --- HELPER PARA FECHAS ---
const normalizeDate = (dateInput) => {
    if (!dateInput) return null;
    try {
        if (typeof dateInput === 'string' && dateInput.length === 10) return dateInput;
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
    } catch (e) {
        console.error("Error normalizando fecha:", e);
        return null;
    }
};

// --- LÓGICA DE NIVELES PROGRESIVA ---
const calculateLevel = (xp) => {
    const level = Math.floor((-350 + Math.sqrt(202500 + 200 * xp)) / 100);
    return Math.max(1, level);
};

export const getXpRequiredForLevel = (level) => {
    if (level <= 1) return 0;
    return 50 * Math.pow(level, 2) + 350 * level - 400;
};

// --- NUEVO HELPER PARA LA UI (TOTAL XP) ---
export const getLevelProgress = (currentXp, currentLevel) => {
    const nextLevelTotalXp = getXpRequiredForLevel(currentLevel + 1);
    const progressPercent = Math.min(100, Math.max(0, (currentXp / nextLevelTotalXp) * 100));

    return {
        currentXp: currentXp,
        nextLevelXp: nextLevelTotalXp,
        progressPercent: progressPercent
    };
};

export const createGamificationSlice = (set, get) => ({
    gamification: {
        xp: 0,
        level: 1,
        streak: 0,
        workoutsCount: 0,
        lastActivityDate: null,
        unlockedBadges: [],
        gamificationEvents: [],
        isCheckingStreak: false,
    },

    // --- INICIO MODIFICACIÓN: Se añadieron las nuevas rachas con sus iconos ---
    badgesList: [
        { id: 'first_login', name: 'Primer Paso', description: 'Inicia sesión por primera vez', icon: '🚀', xp: 50 },
        { id: 'first_workout', name: 'Primer Sudor', description: 'Completa tu primera rutina', icon: '💪', xp: 100 },
        { id: 'streak_3', name: 'En Llamas', description: 'Racha de 3 días seguidos', icon: '🔥', xp: 150 },
        { id: 'streak_7', name: 'Imparable', description: 'Racha de 7 días seguidos', icon: '⚡', xp: 300 },
        { id: 'streak_14', name: 'Muro de Acero', description: 'Racha de 14 días seguidos', icon: '🛡️', xp: 500 },
        { id: 'streak_30', name: 'Leyenda', description: 'Racha de 30 días seguidos', icon: '👑', xp: 1000 },
        { id: 'streak_60', name: 'Dios del Gym', description: 'Racha de 60 días seguidos', icon: '🔱', xp: 2000 },
        { id: 'streak_100', name: 'Titán', description: 'Racha de 100 días seguidos', icon: '☄️', xp: 5000 },
        { id: 'streak_365', name: 'Inmortal', description: 'Racha de 365 días seguidos', icon: '♾️', xp: 10000 },
        { id: 'nutrition_master', name: 'Chef', description: 'Registra 5 comidas', icon: '🥗', xp: 100 },
    ],
    // --- FIN MODIFICACIÓN ---

    clearGamificationEvents: () => {
        set(state => ({
            gamification: { ...state.gamification, gamificationEvents: [] }
        }));
    },

    addXp: async (amount, reason = 'Actividad completada') => {
        console.log(`[Gamification Slice] Evento visual de XP: ${amount} por ${reason}`);

        if (amount > 0) {
            set((state) => ({
                gamification: {
                    ...state.gamification,
                    gamificationEvents: [
                        ...(state.gamification.gamificationEvents || []),
                        { id: Date.now() + Math.random(), type: 'xp', amount, reason }
                    ]
                }
            }));
        }
    },

    unlockBadge: async (badgeId) => {
        const state = get();
        const unlockedBadges = state.gamification.unlockedBadges || [];
        if (unlockedBadges.includes(badgeId)) return;

        const badge = state.badgesList.find(b => b.id === badgeId);
        if (!badge) return;

        const newBadges = [...unlockedBadges, badgeId];

        set((state) => ({
            gamification: {
                ...state.gamification,
                unlockedBadges: newBadges,
                gamificationEvents: [
                    ...(state.gamification.gamificationEvents || []),
                    { id: Date.now() + Math.random(), type: 'badge', badge }
                ]
            }
        }));

        try {
            await apiClient('/users/me/gamification', {
                body: { unlocked_badges: newBadges }
            });
        } catch (error) {
            console.error("Error guardando insignia:", error);
        }
    },

    checkStreak: async (todayDateString) => {
        const state = get();
        if (state.gamification.isCheckingStreak) return;

        const last = normalizeDate(state.gamification.lastActivityDate);
        const today = normalizeDate(todayDateString);

        if (last === today) return;

        set(s => ({ gamification: { ...s.gamification, isCheckingStreak: true } }));

        try {
            const response = await apiClient('/users/me/gamification', {
                body: {
                    last_activity_date: today,
                    reason: 'Login Diario'
                }
            });

            if (response && response.data) {
                const serverData = response.data;
                const previousXp = get().gamification.xp || 0;
                
                // --- INICIO MODIFICACIÓN: Comprobar si hay nuevas insignias desde el servidor ---
                const currentBadges = get().gamification.unlockedBadges || [];
                const serverBadges = serverData.unlocked_badges || [];
                
                const newlyUnlocked = serverBadges.filter(b => !currentBadges.includes(b));
                // --- FIN MODIFICACIÓN ---

                set((state) => {
                    const currentEvents = state.gamification.gamificationEvents || [];
                    const newEvents = [...currentEvents];

                    if (serverData.xp > previousXp) {
                        newEvents.push({
                            id: Date.now() + Math.random(),
                            type: 'xp',
                            amount: serverData.xp - previousXp,
                            reason: 'Login / Racha Diaria'
                        });
                    }

                    // --- INICIO MODIFICACIÓN: Disparar evento de Toast si hay insignia nueva ---
                    newlyUnlocked.forEach(badgeId => {
                        const badgeDef = get().badgesList.find(b => b.id === badgeId) || { name: badgeId, icon: '🏅' };
                        newEvents.push({
                            id: Date.now() + Math.random(),
                            type: 'badge',
                            badge: badgeDef
                        });
                    });
                    // --- FIN MODIFICACIÓN ---

                    return {
                        gamification: {
                            ...state.gamification,
                            xp: serverData.xp,
                            level: serverData.level,
                            streak: serverData.streak,
                            workoutsCount: serverData.workouts_count ?? state.gamification.workoutsCount,
                            lastActivityDate: normalizeDate(serverData.last_activity_date),
                            unlockedBadges: serverData.unlocked_badges || [],
                            gamificationEvents: newEvents,
                            isCheckingStreak: false
                        }
                    };
                });
            } else {
                set(s => ({ gamification: { ...s.gamification, isCheckingStreak: false } }));
            }

        } catch (error) {
            console.error("Error sincronizando Login Diario:", error);
            set((state) => ({
                gamification: {
                    ...state.gamification,
                    lastActivityDate: today,
                    isCheckingStreak: false
                }
            }));
        }
    },

    setGamificationData: (data) => {
        if (!data) return;
        set((state) => ({
            gamification: {
                ...state.gamification,
                xp: data.xp || 0,
                level: data.level || 1,
                streak: data.streak || 0,
                workoutsCount: data.workouts_count || data.workoutsCount || state.gamification.workoutsCount || 0,
                lastActivityDate: normalizeDate(data.last_activity_date || data.lastActivityDate),
                unlockedBadges: data.unlocked_badges || data.unlockedBadges || [],
                gamificationEvents: state.gamification.gamificationEvents || []
            }
        }));
    }
});