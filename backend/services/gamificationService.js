/* backend/services/gamificationService.js */
import models from '../models/index.js';
import { createNotification } from './notificationService.js';

const { User, NutritionLog, sequelize } = models;

export const DAILY_LOGIN_XP = 25;
export const WEIGHT_UPDATE_XP = 10;
export const WORKOUT_COMPLETION_XP = 50;
export const FOOD_LOG_XP = 5; // AHORA ES 5
export const WATER_LOG_XP = 5;
export const CALORIE_TARGET_XP = 50;

// Configuración de límites diarios
const LIMITS = {
    food_logs: 5,      // Máximo 5 comidas con XP
    workouts: 2,       // Máximo 2 entrenamientos con XP
    water_xp: 50       // Máximo 50 XP de agua
};

const BADGES_CONFIG = {
    'first_login': { name: 'Primer Paso', xp: 50 },
    'first_workout': { name: 'Primer Sudor', xp: 100 },
    'streak_3': { name: 'En Llamas (Racha 3)', xp: 150 },
    'streak_7': { name: 'Imparable (Racha 7)', xp: 300 },
    'streak_30': { name: 'Leyenda (Racha 30)', xp: 1000 },
    'nutrition_master': { name: 'Chef', xp: 100 }
};

const STREAK_THRESHOLDS = { 3: 'streak_3', 7: 'streak_7', 30: 'streak_30' };

const calculateLevel = (xp) => Math.max(1, Math.floor((-350 + Math.sqrt(202500 + 200 * xp)) / 100));

// --- HELPER: Normalizar fecha ---
const normalizeDate = (inputDate) => {
    try {
        const d = inputDate ? new Date(inputDate) : new Date();
        return d.toISOString().split('T')[0];
    } catch (e) {
        console.error('Error normalizando fecha:', e);
        return new Date().toISOString().split('T')[0];
    }
};

// --- HELPER PRIVADO: GESTIÓN DE ESTADO ---
const getDailyState = (user, rawDate) => {
    const dateKey = normalizeDate(rawDate);
    let state = user.daily_gamification_state || {};

    if (state.date !== dateKey) {
        state = {
            date: dateKey,
            food_logs: 0,
            workouts: 0,
            water_xp: 0
        };
    }
    return state;
};

// --- FUNCIONES PRINCIPALES ---

export const addXp = async (userId, amount, reason = 'Actividad completada', opts = {}) => {
    try {
        const { transaction, userInstance } = opts;

        let user = userInstance;
        if (!user) {
            user = await User.findByPk(userId, { transaction });
        }

        if (!user) throw new Error('Usuario no encontrado');

        if (reason === 'Login Diario') {
            const today = normalizeDate();
            if (user.last_activity_date === today) {
                return { success: true, xp: user.xp, xpAdded: 0 };
            }
            user.last_activity_date = today;
        }

        const oldLevel = user.level;
        user.xp += amount;
        const newLevel = calculateLevel(user.xp);
        let leveledUp = false;

        await user.save({ transaction });

        if (newLevel > oldLevel) {
            user.level = newLevel;
            leveledUp = true;
            createNotification(userId, {
                type: 'success',
                title: '¡Subida de Nivel!',
                message: `¡Felicidades! Has alcanzado el Nivel ${newLevel}.`,
                data: { type: 'level_up', newLevel }
            });
        }

        if (amount > 0) {
            createNotification(userId, {
                type: 'success',
                title: `+${amount} XP`,
                message: `Has ganado ${amount} XP. Motivo: ${reason}`,
                data: { type: 'xp', amount, reason }
            });
        }

        return { success: true, xp: user.xp, level: user.level, leveledUp, xpAdded: amount };
    } catch (error) {
        console.error('Error en addXp:', error);
        return { success: false, error: error.message, xpAdded: 0 };
    }
};

export const unlockBadge = async (userId, badgeId, opts = {}) => {
    try {
        const { transaction, userInstance } = opts;
        let user = userInstance;
        if (!user) user = await User.findByPk(userId, { transaction });
        if (!user) throw new Error('Usuario no encontrado');

        const badge = BADGES_CONFIG[badgeId];
        if (!badge) return { success: false, error: 'Insignia desconocida' };

        let currentBadges = [];
        try {
            currentBadges = JSON.parse(user.unlocked_badges || '[]');
        } catch { currentBadges = []; }

        if (currentBadges.includes(badgeId)) return { success: true, unlocked: false };

        currentBadges.push(badgeId);
        user.unlocked_badges = JSON.stringify(currentBadges);
        await user.save({ transaction });

        createNotification(userId, {
            type: 'success',
            title: '¡Insignia Desbloqueada!',
            message: `Has conseguido: ${badge.name} (+${badge.xp} XP)`,
            data: { type: 'badge', badgeId, badgeName: badge.name }
        });

        return await addXp(userId, badge.xp, `Insignia: ${badge.name}`, { transaction, userInstance: user });
    } catch (error) {
        console.error('Error en unlockBadge:', error);
        return { success: false, error: error.message };
    }
};

export const checkStreak = async (userId, rawDate, opts = {}) => {
    try {
        const { transaction, userInstance } = opts;
        let user = userInstance;
        if (!user) user = await User.findByPk(userId, { transaction });

        const todayDateStr = normalizeDate(rawDate);
        const lastActivityStr = user.last_activity_date;

        if (lastActivityStr === todayDateStr) {
            return { success: true, streak: user.streak };
        }

        if (!lastActivityStr) {
            user.streak = 1;
        } else {
            const diffDays = Math.ceil(Math.abs(new Date(todayDateStr) - new Date(lastActivityStr)) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                user.streak += 1;
                const badgeId = STREAK_THRESHOLDS[user.streak];
                if (badgeId) await unlockBadge(userId, badgeId, { transaction, userInstance: user });
            } else {
                user.streak = 1;
            }
        }

        user.last_activity_date = todayDateStr;
        await user.save({ transaction });

        await addXp(userId, DAILY_LOGIN_XP, 'Login Diario', { transaction, userInstance: user });

        return { success: true, streak: user.streak };
    } catch (error) {
        console.error('Error en checkStreak:', error);
        return { success: false, error: error.message };
    }
};

export const processWorkoutGamification = async (userId, workoutDate) => {
    const t = await sequelize.transaction();
    try {
        const user = await User.findByPk(userId, { transaction: t, lock: true });
        if (!user) throw new Error('Usuario no encontrado');

        const state = getDailyState(user, workoutDate);

        if (state.workouts < LIMITS.workouts) {
            state.workouts++;
            user.daily_gamification_state = state;
            user.changed('daily_gamification_state', true);
            await user.save({ transaction: t });

            const result = await addXp(userId, WORKOUT_COMPLETION_XP, 'Entrenamiento completado', { transaction: t, userInstance: user });

            await checkStreak(userId, workoutDate, { transaction: t, userInstance: user });
            await unlockBadge(userId, 'first_workout', { transaction: t, userInstance: user });

            await t.commit();
            return result;
        }

        await t.commit();
        return { xpAdded: 0, reason: 'daily_limit_reached' };

    } catch (error) {
        await t.rollback();
        console.error('Error procesando workout gamification:', error);
        return { xpAdded: 0 };
    }
};

export const processFoodGamification = async (userId, logDate) => {
    const t = await sequelize.transaction();
    try {
        const user = await User.findByPk(userId, { transaction: t, lock: true });
        if (!user) throw new Error('Usuario no encontrado');

        const state = getDailyState(user, logDate);

        console.log(`[XP STATE] Comidas hoy: ${state.food_logs}/${LIMITS.food_logs}. Fecha State: ${state.date}`);

        if (state.food_logs < LIMITS.food_logs) {
            state.food_logs++;
            user.daily_gamification_state = state;
            user.changed('daily_gamification_state', true);

            await user.save({ transaction: t });

            const result = await addXp(userId, FOOD_LOG_XP, 'Comida registrada', { transaction: t, userInstance: user });

            const totalCount = await NutritionLog.count({ where: { user_id: userId }, transaction: t });
            if (totalCount >= 5) {
                await unlockBadge(userId, 'nutrition_master', { transaction: t, userInstance: user });
            }

            await checkStreak(userId, logDate, { transaction: t, userInstance: user });

            await t.commit();
            return result;
        }

        console.log('[XP STATE] Límite alcanzado, no se da XP.');
        await t.commit();
        return { xpAdded: 0, reason: 'daily_limit_reached' };

    } catch (error) {
        await t.rollback();
        console.error('Error procesando food gamification:', error);
        return { xpAdded: 0 };
    }
};

export default {
    addXp,
    unlockBadge,
    checkStreak,
    processWorkoutGamification,
    processFoodGamification,
    DAILY_LOGIN_XP,
    WEIGHT_UPDATE_XP,
    WORKOUT_COMPLETION_XP,
    FOOD_LOG_XP,
    WATER_LOG_XP,
    CALORIE_TARGET_XP
};