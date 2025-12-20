/* backend/services/gamificationService.js */
import models from '../models/index.js';
import { createNotification } from './notificationService.js';

const { User } = models;

// --- CONFIGURACIÓN DE XP ---
export const DAILY_LOGIN_XP = 25; // XP por iniciar sesión cada día (excepto el primero)
export const WEIGHT_UPDATE_XP = 10; // XP por registrar peso
export const WORKOUT_COMPLETION_XP = 50; // XP por completar un entrenamiento
export const FOOD_LOG_XP = 5; // XP por registrar comida
export const WATER_LOG_XP = 5; // XP por registrar agua

// Configuración centralizada de Insignias
const BADGES_CONFIG = {
    'first_login': { name: 'Primer Paso', xp: 50 },
    'first_workout': { name: 'Primer Sudor', xp: 100 },
    'streak_3': { name: 'En Llamas (Racha 3)', xp: 150 },
    'streak_7': { name: 'Imparable (Racha 7)', xp: 300 },
    'streak_30': { name: 'Leyenda (Racha 30)', xp: 1000 },
    'nutrition_master': { name: 'Chef', xp: 100 }
};

const STREAK_THRESHOLDS = {
    3: 'streak_3',
    7: 'streak_7',
    30: 'streak_30'
};

// --- LÓGICA DE NIVELES PROGRESIVA ---
const calculateLevel = (xp) => {
    // Fórmula: 50*L^2 + 350*L - 400 = XP_Total
    const level = Math.floor((-350 + Math.sqrt(202500 + 200 * xp)) / 100);
    return Math.max(1, level);
};

export const addXp = async (userId, amount, reason = 'Actividad completada') => {
    try {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuario no encontrado');

        // --- FIX XP INFINITA ---
        // Si el motivo es Login Diario, verificamos estrictamente si ya se otorgó hoy.
        if (reason && reason.toLowerCase() === 'login diario') {
            const todayStr = new Date().toISOString().split('T')[0];

            let lastActivityStr = null;
            if (user.last_activity_date) {
                lastActivityStr = typeof user.last_activity_date === 'string'
                    ? user.last_activity_date
                    : new Date(user.last_activity_date).toISOString().split('T')[0];
            }

            if (lastActivityStr === todayStr) {
                // Ya tiene actividad hoy: NO SUMAR XP
                return {
                    success: true,
                    xp: user.xp,
                    level: user.level,
                    leveledUp: false,
                    ignored: true // Indicador de que se ignoró
                };
            }

            // Si es un nuevo día, actualizamos la fecha AQUÍ para bloquear futuras llamadas
            user.last_activity_date = todayStr;
        }

        const oldLevel = user.level;
        user.xp += amount;

        // Calcular nuevo nivel
        const newLevel = calculateLevel(user.xp);

        let leveledUp = false;
        if (newLevel > oldLevel) {
            user.level = newLevel;
            leveledUp = true;

            await createNotification(userId, {
                type: 'success',
                title: '¡Subida de Nivel!',
                message: `¡Felicidades! Has alcanzado el Nivel ${newLevel}.`
            });
        }

        if (amount > 0) {
            // Notificación silenciosa en backend, el frontend mostrará el Toast
            await createNotification(userId, {
                type: 'info',
                title: `+${amount} XP`,
                message: `Has ganado ${amount} XP. Motivo: ${reason}`
            });
        }

        await user.save();

        return {
            success: true,
            xp: user.xp,
            level: user.level,
            leveledUp
        };
    } catch (error) {
        console.error('Error en addXp:', error);
        return { success: false, error: error.message };
    }
};

export const unlockBadge = async (userId, badgeId) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuario no encontrado');

        const badgeConfig = BADGES_CONFIG[badgeId];
        if (!badgeConfig) return { success: false, error: 'Insignia desconocida' };

        // Parsing seguro de insignias
        let badges = [];
        if (Array.isArray(user.unlocked_badges)) {
            badges = user.unlocked_badges;
        } else if (typeof user.unlocked_badges === 'string') {
            try {
                badges = JSON.parse(user.unlocked_badges);
            } catch (e) {
                badges = [];
            }
        } else {
            badges = [];
        }

        // Si ya tiene la insignia, NO hacemos nada
        if (badges.includes(badgeId)) {
            return { success: true, unlocked: false };
        }

        // Si es nueva, la añadimos
        badges.push(badgeId);

        // Guardamos explícitamente como string JSON
        user.unlocked_badges = JSON.stringify(badges);
        await user.save();

        // Notificación e incremento de XP
        await createNotification(userId, {
            type: 'success',
            title: '¡Insignia Desbloqueada!',
            message: `Has conseguido la insignia: ${badgeConfig.name} (+${badgeConfig.xp} XP)`
        });

        await addXp(userId, badgeConfig.xp, `Insignia: ${badgeConfig.name}`);

        return { success: true, unlocked: true, badge: badgeConfig };

    } catch (error) {
        console.error('Error en unlockBadge:', error);
        return { success: false, error: error.message };
    }
};

export const checkStreak = async (userId, todayDateStr) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuario no encontrado');

        const lastActivity = user.last_activity_date;
        let xpAwarded = 0;
        let loginReason = null;

        // Si es el primer día de actividad registrado (NUNCA antes usó la app)
        if (!lastActivity) {
            user.streak = 1;
            user.last_activity_date = todayDateStr;
            await user.save();
            // NO damos los 25 XP aquí porque es el 'first_login' que tiene su propia insignia (50XP)
            return { success: true, streak: 1, updated: true, xpAwarded: 0 };
        }

        // Normalizar fechas para comparar solo días
        const lastActivityStr = typeof lastActivity === 'string' ? lastActivity : new Date(lastActivity).toISOString().split('T')[0];

        // Si la fecha enviada es IGUAL a la última registrada, NO HACEMOS NADA
        if (lastActivityStr === todayDateStr) {
            return { success: true, streak: user.streak, updated: false, xpAwarded: 0 };
        }

        // Si son diferentes, calculamos diferencia de días
        const todayDate = new Date(todayDateStr);
        const lastDate = new Date(lastActivityStr);
        const diffTime = Math.abs(todayDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 1) {
            // ES UN NUEVO DÍA DE ACTIVIDAD -> DAR XP DIARIA

            if (diffDays === 1) {
                // Consecutivo -> Aumenta Racha
                user.streak += 1;

                // Chequear insignias de racha
                const badgeId = STREAK_THRESHOLDS[user.streak];
                if (badgeId) {
                    await unlockBadge(userId, badgeId);
                }
            } else {
                // No consecutivo -> Reinicia Racha
                user.streak = 1;
            }

            // Llamamos a addXp con 'Login Diario'. 
            // addXp se encargará de validar la fecha de nuevo (safety check) y guardarla.
            await addXp(userId, DAILY_LOGIN_XP, 'Login Diario');

            xpAwarded = DAILY_LOGIN_XP;
            loginReason = 'Login Diario';

            return {
                success: true,
                streak: user.streak,
                updated: true,
                xpAwarded,
                reason: loginReason
            };
        }

        return { success: true, streak: user.streak, updated: false, xpAwarded: 0 };

    } catch (error) {
        console.error('Error en checkStreak:', error);
        return { success: false, error: error.message };
    }
};

export default {
    addXp,
    unlockBadge,
    checkStreak,
    DAILY_LOGIN_XP,
    WEIGHT_UPDATE_XP,
    WORKOUT_COMPLETION_XP,
    FOOD_LOG_XP,
    WATER_LOG_XP
};