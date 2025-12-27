/* backend/services/gamificationService.js */
import { Op } from 'sequelize';
import models from '../models/index.js';
import { createNotification } from './notificationService.js';

// Importamos Notification directamente para consultar el historial de pagos
const { User, Notification } = models;

export const DAILY_LOGIN_XP = 25;
export const WEIGHT_UPDATE_XP = 10;
export const WORKOUT_COMPLETION_XP = 50;
export const FOOD_LOG_XP = 5;
export const WATER_LOG_XP = 5;

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

export const addXp = async (userId, amount, reason = 'Actividad completada') => {
    try {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuario no encontrado');

        if (reason === 'Login Diario') {
            const today = new Date().toISOString().split('T')[0];
            const lastActivity = user.last_activity_date ? new Date(user.last_activity_date).toISOString().split('T')[0] : null;

            if (lastActivity === today) {
                return { success: true, xp: user.xp, level: user.level, leveledUp: false, ignored: true, xpAdded: 0 };
            }
            user.last_activity_date = today;
        }

        const oldLevel = user.level;
        user.xp += amount;
        const newLevel = calculateLevel(user.xp);
        let leveledUp = false;

        if (newLevel > oldLevel) {
            user.level = newLevel;
            leveledUp = true;
            await createNotification(userId, {
                type: 'success',
                title: '¡Subida de Nivel!',
                message: `¡Felicidades! Has alcanzado el Nivel ${newLevel}.`,
                data: { type: 'level_up', newLevel }
            });
        }

        if (amount > 0) {
            await createNotification(userId, {
                type: 'success',
                title: `+${amount} XP`,
                message: `Has ganado ${amount} XP. Motivo: ${reason}`,
                data: { type: 'xp', amount, reason }
            });
        }

        await user.save();
        return { success: true, xp: user.xp, level: user.level, leveledUp, xpAdded: amount };
    } catch (error) {
        console.error('Error en addXp:', error);
        return { success: false, error: error.message, xpAdded: 0 };
    }
};

export const unlockBadge = async (userId, badgeId) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuario no encontrado');

        const badge = BADGES_CONFIG[badgeId];
        if (!badge) return { success: false, error: 'Insignia desconocida' };

        let currentBadges = [];
        try {
            currentBadges = typeof user.unlocked_badges === 'string' ? JSON.parse(user.unlocked_badges) : (user.unlocked_badges || []);
        } catch { currentBadges = []; }

        if (currentBadges.includes(badgeId)) return { success: true, unlocked: false };

        currentBadges.push(badgeId);
        user.unlocked_badges = JSON.stringify(currentBadges);
        await user.save();

        await createNotification(userId, {
            type: 'success',
            title: '¡Insignia Desbloqueada!',
            message: `Has conseguido: ${badge.name} (+${badge.xp} XP)`,
            data: { type: 'badge', badgeId, badgeName: badge.name }
        });

        await addXp(userId, badge.xp, `Insignia: ${badge.name}`);
        return { success: true, unlocked: true, badge };
    } catch (error) {
        console.error('Error en unlockBadge:', error);
        return { success: false, error: error.message };
    }
};

export const checkStreak = async (userId, todayDateStr) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuario no encontrado');

        const lastActivityStr = user.last_activity_date ? new Date(user.last_activity_date).toISOString().split('T')[0] : null;

        if (!lastActivityStr) {
            user.streak = 1;
            user.last_activity_date = todayDateStr;
            await user.save();
            return { success: true, streak: 1, updated: true, xpAwarded: 0 };
        }

        if (lastActivityStr === todayDateStr) {
            return { success: true, streak: user.streak, updated: false, xpAwarded: 0 };
        }

        const diffDays = Math.ceil(Math.abs(new Date(todayDateStr) - new Date(lastActivityStr)) / (1000 * 60 * 60 * 24));

        if (diffDays >= 1) {
            if (diffDays === 1) {
                user.streak += 1;
                const badgeId = STREAK_THRESHOLDS[user.streak];
                if (badgeId) await unlockBadge(userId, badgeId);
            } else {
                user.streak = 1;
            }

            await user.save();
            await addXp(userId, DAILY_LOGIN_XP, 'Login Diario');

            return { success: true, streak: user.streak, updated: true, xpAwarded: DAILY_LOGIN_XP, reason: 'Login Diario' };
        }

        return { success: true, streak: user.streak, updated: false, xpAwarded: 0 };
    } catch (error) {
        console.error('Error en checkStreak:', error);
        return { success: false, error: error.message };
    }
};

export const processWorkoutGamification = async (userId, workoutDate) => {
    let xpResult = { xpAdded: 0 };
    try {
        const startOfDay = new Date(workoutDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(workoutDate);
        endOfDay.setHours(23, 59, 59, 999);

        // CAMBIO IMPORTANTE: Contamos NOTIFICACIONES DE XP de hoy en lugar de entrenamientos activos.
        // Esto evita el truco de borrar y re-subir entrenamientos para ganar XP infinita.
        const notificationsToday = await Notification.findAll({
            where: {
                user_id: userId,
                created_at: {
                    [Op.gte]: startOfDay,
                    [Op.lte]: endOfDay
                }
            },
            attributes: ['data'] // Solo traemos la data para filtrar en memoria (más seguro entre bases de datos)
        });

        // Filtramos las notificaciones que sean de tipo XP y motivo 'Entrenamiento completado'
        const workoutsPaidTodayCount = notificationsToday.filter(n => {
            let data = n.data;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch { return false; }
            }
            return data && data.type === 'xp' && data.reason === 'Entrenamiento completado';
        }).length;

        if (workoutsPaidTodayCount < 2) {
            xpResult = await addXp(userId, WORKOUT_COMPLETION_XP, 'Entrenamiento completado');
        } else {
            // Si ya pagamos 2 veces o más, avisamos del límite
            await createNotification(userId, {
                type: 'warning',
                title: 'Límite de XP alcanzado',
                message: 'Has alcanzado el límite diario de XP por entrenamiento (2/2).',
                data: { type: 'xp_limit', reason: 'daily_workout_limit' }
            });
        }

        const todayStr = new Date().toISOString().split('T')[0];
        await checkStreak(userId, todayStr);
        await unlockBadge(userId, 'first_workout');

        return xpResult;
    } catch (error) {
        console.error('Error procesando gamificación de workout:', error);
        return { xpAdded: 0, error: error.message };
    }
};

export default {
    addXp,
    unlockBadge,
    checkStreak,
    processWorkoutGamification,
    DAILY_LOGIN_XP,
    WEIGHT_UPDATE_XP,
    WORKOUT_COMPLETION_XP,
    FOOD_LOG_XP,
    WATER_LOG_XP
};