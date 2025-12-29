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
// Fórmula cuadrática: hace que cada nivel cueste más que el anterior.
const calculateLevel = (xp) => {
    // Inversa de la fórmula de getXpRequiredForLevel
    const level = Math.floor((-350 + Math.sqrt(202500 + 200 * xp)) / 100);
    return Math.max(1, level);
};

export const getXpRequiredForLevel = (level) => {
    if (level <= 1) return 0;
    // Fórmula: 50x² + 350x - 400
    // L1=0, L2=500, L3=1100, L4=1800... (Gaps: 500, 600, 700...)
    return 50 * Math.pow(level, 2) + 350 * level - 400;
};

// --- NUEVO HELPER PARA LA UI (TOTAL XP) ---
// Usar esto en los componentes para mostrar "1500 / 2000" en lugar de "0 / 500"
export const getLevelProgress = (currentXp, currentLevel) => {
    const nextLevelTotalXp = getXpRequiredForLevel(currentLevel + 1);

    // Si queremos que la barra represente el total absoluto (nunca baja a 0 visualmente, solo retrocede un poco al subir de nivel)
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

    badgesList: [
        { id: 'first_login', name: 'Primer Paso', description: 'Inicia sesión por primera vez', icon: '🚀', xp: 50 },
        { id: 'first_workout', name: 'Primer Sudor', description: 'Completa tu primera rutina', icon: '💪', xp: 100 },
        { id: 'streak_3', name: 'En Llamas', description: 'Racha de 3 días seguidos', icon: '🔥', xp: 150 },
        { id: 'streak_7', name: 'Imparable', description: 'Racha de 7 días seguidos', icon: '⚡', xp: 300 },
        { id: 'streak_30', name: 'Leyenda', description: 'Racha de 30 días seguidos', icon: '👑', xp: 1000 },
        { id: 'nutrition_master', name: 'Chef', description: 'Registra 5 comidas', icon: '🥗', xp: 100 },
    ],

    clearGamificationEvents: () => {
        set(state => ({
            gamification: { ...state.gamification, gamificationEvents: [] }
        }));
    },

    addXp: async (amount, reason = 'Actividad completada') => {
        console.log(`[Gamification] Añadiendo XP: ${amount} por ${reason}`);
        set((state) => {
            const currentXp = (state.gamification.xp || 0) + amount;
            const newLevel = calculateLevel(currentXp);
            const currentEvents = state.gamification.gamificationEvents || [];

            return {
                gamification: {
                    ...state.gamification,
                    xp: currentXp,
                    level: newLevel,
                    gamificationEvents: [
                        ...currentEvents,
                        { id: Date.now() + Math.random(), type: 'xp', amount, reason }
                    ]
                },
            };
        });

        try {
            const { xp, level } = get().gamification;
            await apiClient('/users/me/gamification', {
                body: { xp, level, reason }
            });
        } catch (error) {
            console.error("Error guardando XP:", error);
        }
    },

    unlockBadge: async (badgeId) => {
        const state = get();
        const unlockedBadges = state.gamification.unlockedBadges || [];
        if (unlockedBadges.includes(badgeId)) return;

        const badge = state.badgesList.find(b => b.id === badgeId);
        if (!badge) return;

        const newBadges = [...unlockedBadges, badgeId];
        const currentEvents = state.gamification.gamificationEvents || [];

        set((state) => ({
            gamification: {
                ...state.gamification,
                unlockedBadges: newBadges,
                gamificationEvents: [
                    ...currentEvents,
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

        get().addXp(badge.xp, `Insignia: ${badge.name}`);
        return badge;
    },

    checkStreak: async (todayDateString) => {
        const state = get();
        if (state.gamification.isCheckingStreak) return;

        const last = normalizeDate(state.gamification.lastActivityDate);
        const today = normalizeDate(todayDateString);

        if (last === today) return;

        set(s => ({ gamification: { ...s.gamification, isCheckingStreak: true } }));

        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const isConsecutive = last === yesterday.toISOString().split('T')[0];
            const newStreak = isConsecutive ? (state.gamification.streak || 0) + 1 : 1;

            const response = await apiClient('/users/me/gamification', {
                body: {
                    streak: newStreak,
                    last_activity_date: today,
                    reason: 'Login Diario'
                }
            });

            if (response && response.data) {
                const serverData = response.data;
                const previousXp = get().gamification.xp || 0;

                set((state) => {
                    const currentEvents = state.gamification.gamificationEvents || [];
                    const newEvents = [...currentEvents];

                    if (serverData.xp > previousXp) {
                        newEvents.push({
                            id: Date.now() + Math.random(),
                            type: 'xp',
                            amount: serverData.xp - previousXp,
                            reason: 'Login Diario'
                        });
                    }

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

        const currentStreak = get().gamification.streak;
        if (currentStreak >= 3) get().unlockBadge('streak_3');
        if (currentStreak >= 7) get().unlockBadge('streak_7');
        if (currentStreak >= 30) get().unlockBadge('streak_30');
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