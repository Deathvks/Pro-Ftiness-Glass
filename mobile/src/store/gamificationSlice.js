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
        xpBoost: null,
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

    // --- CORRECCIÓN: Eliminada lógica optimista ---
    // Esta función actualiza estado visual/local de XP + emite el toast inmediato.
    // La XP real consolidada viene del backend y se sincroniza al recibir respuesta/perfil.
    addXp: async (amount, reason = 'Actividad completada') => {
        console.log(`[Gamification Slice] Evento visual de XP: ${amount} por ${reason}`);

        if (amount > 0) {
            set((state) => {
                const prevXp = state.gamification.xp || 0;
                const prevLevel = state.gamification.level || calculateLevel(prevXp);
                const nextXp = prevXp + amount;
                const nextLevel = Math.max(prevLevel, calculateLevel(nextXp));
                const nextEvents = [
                    ...(state.gamification.gamificationEvents || []),
                    { id: Date.now() + Math.random(), type: 'xp', amount, reason },
                ];
                if (nextLevel > prevLevel) {
                    nextEvents.push({
                        id: Date.now() + Math.random(),
                        type: 'level_up',
                        newLevel: nextLevel,
                    });
                }

                return {
                    gamification: {
                        ...state.gamification,
                        xp: nextXp,
                        level: nextLevel,
                        gamificationEvents: nextEvents,
                    },
                };
            });
        }
    },

    addGamificationEvents: (events) => {
        if (!events || events.length === 0) return;
        set((state) => {
            let nextXp = state.gamification.xp || 0;
            let nextLevel = state.gamification.level || calculateLevel(nextXp);
            let nextStreak = state.gamification.streak || 0;

            for (const ev of events) {
                if (!ev) continue;
                const delta = Number(ev.amount ?? ev.xpAdded ?? 0);
                if (delta > 0) {
                    nextXp += delta;
                    nextLevel = Math.max(nextLevel, calculateLevel(nextXp));
                }
                const evLevel = Number(ev.newLevel ?? ev.level ?? 0);
                if (evLevel > nextLevel) {
                    nextLevel = evLevel;
                }
                if (typeof ev.streak === 'number' && ev.streak >= 0) {
                    nextStreak = ev.streak;
                }
            }

            return {
                gamification: {
                    ...state.gamification,
                    xp: nextXp,
                    level: nextLevel,
                    streak: nextStreak,
                    gamificationEvents: [
                        ...(state.gamification.gamificationEvents || []),
                        ...events.map(ev => ({ ...ev, id: Date.now() + Math.random() })),
                    ],
                },
            };
        });
    },

    unlockBadge: async (badgeId) => {
        const state = get();
        const unlockedBadges = state.gamification.unlockedBadges || [];
        if (unlockedBadges.includes(badgeId)) return;

        const badge = state.badgesList.find(b => b.id === badgeId);
        if (!badge) return;

        const newBadges = [...unlockedBadges, badgeId];

        // Actualizamos estado local de insignias (esto es seguro porque las insignias son únicas)
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

    unlockMilestone: async (level) => {
        const state = get();
        const unlockedBadges = state.gamification.unlockedBadges || [];
        const MILESTONE_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        
        let newBadges = [...unlockedBadges];
        let hasChanges = false;

        MILESTONE_LEVELS.forEach(lvl => {
            if (lvl <= level) {
                const milestoneId = `milestone_${lvl}`;
                if (!newBadges.includes(milestoneId)) {
                    newBadges.push(milestoneId);
                    hasChanges = true;
                }
            }
        });

        if (!hasChanges) return;

        // Actualizamos estado local
        set((state) => ({
            gamification: {
                ...state.gamification,
                unlockedBadges: newBadges
            }
        }));

        try {
            await apiClient('/users/me/gamification', {
                body: { unlocked_badges: newBadges }
            });
        } catch (error) {
            console.error("Error guardando milestone:", error);
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
            // Notificamos actividad. El backend decidirá si suma racha o XP.
            const response = await apiClient('/users/me/gamification', {
                body: {
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

                    // Si el servidor dice que tenemos más XP que antes, generamos evento
                    if (serverData.xp > previousXp) {
                        newEvents.push({
                            id: Date.now() + Math.random(),
                            type: 'xp',
                            amount: serverData.xp - previousXp,
                            reason: 'Login Diario'
                        });
                    }

                    const nextXpBoost = serverData.xpBoost !== undefined
                        ? serverData.xpBoost
                        : (response.xpBoost !== undefined ? response.xpBoost : state.gamification.xpBoost);

                    return {
                        gamification: {
                            ...state.gamification,
                            xp: serverData.xp,
                            level: serverData.level,
                            streak: serverData.streak,
                            workoutsCount: serverData.workouts_count ?? state.gamification.workoutsCount,
                            lastActivityDate: normalizeDate(serverData.last_activity_date),
                            unlockedBadges: serverData.unlocked_badges || [],
                            xpBoost: nextXpBoost,
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

    setGamificationData: (data) => set((state) => {
        const unlockedBadges = data.unlocked_badges || data.unlockedBadges || state.gamification.unlockedBadges || [];
        const newLevel = data.level !== undefined ? data.level : state.gamification.level;

        const nextXpBoost = data.xpBoost !== undefined
            ? data.xpBoost
            : (data.xp_boost !== undefined ? data.xp_boost : state.gamification.xpBoost);

        return {
            gamification: {
                ...state.gamification,
                xp: data.xp !== undefined ? data.xp : state.gamification.xp,
                level: newLevel,
                streak: data.streak !== undefined ? data.streak : state.gamification.streak,
                workoutsCount: data.workouts_count !== undefined ? data.workouts_count : (data.workoutsCount !== undefined ? data.workoutsCount : state.gamification.workoutsCount),
                lastActivityDate: data.last_activity_date || data.lastActivityDate ? normalizeDate(data.last_activity_date || data.lastActivityDate) : state.gamification.lastActivityDate,
                unlockedBadges: unlockedBadges,
                xpBoost: nextXpBoost,
                gamificationEvents: state.gamification.gamificationEvents || []
            }
        };
    })
});