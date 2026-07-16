import models from '../models/index.js';
import { addXp } from './gamificationService.js';

const { User, UserChallenge, sequelize } = models;

// Definición de retos
export const CHALLENGES = {
    // Diarios
    daily_5_meals: { type: 'daily', target: 5, xp: 50, title: 'Registra 5 comidas', desc: 'Registra al menos 5 alimentos hoy' },
    daily_calories: { type: 'daily', target: 1, xp: 50, title: 'Calorías completadas', desc: 'Alcanza tu objetivo calórico diario' },
    daily_protein: { type: 'daily', target: 1, xp: 50, title: 'Proteína completada', desc: 'Alcanza tu objetivo de proteínas diario' },
    daily_workout: { type: 'daily', target: 1, xp: 100, title: '¡A sudar!', desc: 'Realiza un entrenamiento hoy' },
    daily_water: { type: 'daily', target: 1, xp: 30, title: 'Mantente hidratado', desc: 'Registra el agua recomendada hoy' },
    
    // Generales: Sociales
    social_add_1_friend: { type: 'general', target: 1, xp: 100, title: 'Tu primer amigo', desc: 'Agrega 1 amigo a tu lista' },
    social_add_3_friends: { type: 'general', target: 3, xp: 200, title: 'Creciendo el círculo', desc: 'Agrega 3 amigos' },
    social_add_5_friends: { type: 'general', target: 5, xp: 300, title: 'Influencer de gimnasio', desc: 'Agrega 5 amigos' },
    social_share_workout: { type: 'daily', target: 1, xp: 25, title: 'Presume tu esfuerzo', desc: 'Registra un entrenamiento en el mural' },
    social_comment_post: { type: 'daily', target: 2, xp: 25, title: 'Conversador', desc: 'Comenta en publicaciones del mural' },
    social_like_post: { type: 'daily', target: 2, xp: 25, title: 'Buen rollo', desc: 'Dale like a publicaciones' },
    social_upload_story: { type: 'general', target: 1, xp: 50, title: 'Un día en mi vida', desc: 'Sube una historia' },
    
    // Generales: Nutrición
    nutri_scan_3_barcodes: { type: 'general', target: 3, xp: 150, title: 'Lector rápido', desc: 'Escanea tres códigos de barras' },
    nutri_save_favorite: { type: 'general', target: 1, xp: 50, title: 'Mi favorito', desc: 'Guarda una comida en favoritos' },
    nutri_search_meal: { type: 'general', target: 1, xp: 30, title: 'Explorador', desc: 'Busca una comida en la base de datos' },
    
    // Generales: IA
    ai_ask_query: { type: 'general', target: 1, xp: 50, title: 'Mente inquieta', desc: 'Pide una consulta a la IA' },
    ai_create_routine: { type: 'general', target: 1, xp: 100, title: 'Entrenador IA', desc: 'Crea una rutina con la IA' },
    ai_explain_exercise: { type: 'general', target: 1, xp: 50, title: 'Estudiante', desc: 'Solicita a la IA que te explique un ejercicio' },
    
    // Generales: Entrenamiento
    train_3_workouts_week: { type: 'weekly', target: 3, xp: 300, title: 'Constancia pura', desc: 'Registra 3 entrenamientos esta semana' },
    train_pr_random: { type: 'general', target: 1, xp: 500, title: 'Superando límites', desc: 'Supera el peso en tu ejercicio atascado' }
};

// Obtiene la fecha de hoy en España (YYYY-MM-DD)
export const getSpainDate = () => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" }); 
    // en-CA format is YYYY-MM-DD which is very useful for DB string comparison
};

// Comprueba si una fecha es de la semana actual en España (lunes a domingo)
export const isSameSpainWeek = (dateStr) => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
    const day = d.getDay() || 7; // Lunes = 1, Domingo = 7
    d.setHours(0, 0, 0, 0);
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1); // Lunes de esta semana
    
    const compareDate = new Date(dateStr);
    return compareDate >= monday;
};

/**
 * Procesa el progreso de un reto para un usuario.
 * @param {Number} userId - ID del usuario.
 * @param {String} challengeKey - ID del reto en el diccionario CHALLENGES.
 * @param {Number} increment - Cuánto avanza (normalmente 1).
 * @param {Object} opts - transaction, etc.
 */
export const trackChallenge = async (userId, challengeKey, increment = 1, opts = {}) => {
    const t = opts.transaction || await sequelize.transaction();
    try {
        const challengeDef = CHALLENGES[challengeKey];
        if (!challengeDef) {
            if (!opts.transaction) await t.rollback();
            return { error: 'Reto desconocido' };
        }

        const todaySpain = getSpainDate();

        // 1. Obtener o crear el UserChallenge (bloqueo para concurrencia)
        let userChallenge = await UserChallenge.findOne({
            where: { userId, challengeId: challengeKey },
            lock: true,
            transaction: t
        });

        if (!userChallenge) {
            userChallenge = await UserChallenge.create({
                userId,
                challengeId: challengeKey,
                progress: 0,
                completed: false
            }, { transaction: t });
        }

        let needsReset = false;
        if (userChallenge.last_completed_at) {
            const lastCompletedStr = new Date(userChallenge.last_completed_at).toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
            
            if (challengeDef.type === 'daily' && lastCompletedStr !== todaySpain) {
                needsReset = true;
            } else if (challengeDef.type === 'weekly' && !isSameSpainWeek(userChallenge.last_completed_at)) {
                needsReset = true;
            }
        }

        if (needsReset) {
            userChallenge.progress = 0;
            userChallenge.completed = false;
            // No reseteamos last_completed_at para mantener histórico, solo al completarlo de nuevo lo actualizamos
        }

        if (userChallenge.completed) {
            // Ya completado en este periodo (o general ya hecho)
            if (!opts.transaction) await t.commit();
            return { success: true, completedNow: false };
        }

        userChallenge.progress += increment;
        if (userChallenge.progress > challengeDef.target) userChallenge.progress = challengeDef.target;

        let completedNow = false;
        let xpResult = null;

        if (userChallenge.progress >= challengeDef.target) {
            userChallenge.completed = true;
            userChallenge.last_completed_at = new Date();
            completedNow = true;
            // Enviar Push explícito de Reto Completado
            try {
                const { createNotification } = await import('./notificationService.js');
                await createNotification(userId, {
                    type: 'success',
                    title: '¡Reto Completado!',
                    message: `Has completado el reto: ${challengeDef.title} (+${challengeDef.xp} XP)`,
                    data: { type: 'challenge', challengeId: challengeDef.id }
                });
            } catch (err) {
                console.error("Error enviando push de reto:", err);
            }

            // Otorgar XP
            xpResult = await addXp(userId, challengeDef.xp, `Reto: ${challengeDef.title}`, { transaction: t });

            // Emitir evento por WebSocket si está disponible
            try {
                const { io } = await import('../server.js');
                if (io) {
                    io.to(userId.toString()).emit('GAMIFICATION_EVENT', {
                        type: 'challenge_completed',
                        title: '¡Reto Completado!',
                        message: challengeDef.title,
                        xpAdded: challengeDef.xp,
                        leveledUp: xpResult?.leveledUp,
                        newLevel: xpResult?.level
                    });
                }
            } catch (err) {
                console.error("Error emitiendo evento gamification:", err);
            }
        }

        await userChallenge.save({ transaction: t });

        if (!opts.transaction) await t.commit();

        return { 
            success: true, 
            completedNow, 
            progress: userChallenge.progress, 
            target: challengeDef.target,
            xpResult 
        };
    } catch (error) {
        if (!opts.transaction) await t.rollback();
        console.error('Error en trackChallenge:', error);
        return { error: error.message };
    }
};

/**
 * Otorgar XP directo infinito sin barra de progreso (por ejemplo, referidos).
 */
export const grantInfiniteChallengeXp = async (userId, title, xp, opts = {}) => {
    try {
        const { createNotification } = await import('./notificationService.js');
        await createNotification(userId, {
            type: opts.notificationType || 'success',
            title: '¡Reto Completado!',
            message: `Has completado el reto: ${title} (+${xp} XP)`,
            data: { type: 'challenge', friendName: opts.friendName, xp }
        });
    } catch (err) {
        console.error("Error enviando push de reto infinito:", err);
    }

    const xpResult = await addXp(userId, xp, `Reto Infinito: ${title}`, opts);

    try {
        const { io } = await import('../server.js');
        if (io) {
            io.to(userId.toString()).emit('GAMIFICATION_EVENT', {
                type: opts.notificationType === 'referral_success' ? 'referral_success' : 'challenge_completed',
                title: '¡Reto Completado!',
                message: title,
                xpAdded: xp,
                leveledUp: xpResult?.leveledUp,
                newLevel: xpResult?.level,
                friendName: opts.friendName
            });
        }
    } catch (err) {
        console.error("Error emitiendo evento gamification infinito:", err);
    }

    return xpResult;
};

export const getChallengesForUser = async (userId) => {
    const userChallenges = await UserChallenge.findAll({ where: { userId } });
    const todaySpain = getSpainDate();
    
    // Construir el mapa de estado actualizando lógicamente (sin guardar) los reseteos diarios
    const stateMap = {};
    for (const uc of userChallenges) {
        let isCompleted = uc.completed;
        let progress = uc.progress;

        if (uc.last_completed_at) {
            const def = CHALLENGES[uc.challengeId];
            if (def) {
                const lastCompletedStr = new Date(uc.last_completed_at).toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
                if (def.type === 'daily' && lastCompletedStr !== todaySpain) {
                    isCompleted = false;
                    progress = 0;
                } else if (def.type === 'weekly' && !isSameSpainWeek(uc.last_completed_at)) {
                    isCompleted = false;
                    progress = 0;
                }
            }
        }
        
        stateMap[uc.challengeId] = {
            progress,
            completed: isCompleted
        };
    }

    // Unir la lista estática con el estado del usuario
    const result = Object.keys(CHALLENGES).map(key => {
        const def = CHALLENGES[key];
        const state = stateMap[key] || { progress: 0, completed: false };
        return {
            id: key,
            ...def,
            progress: state.progress,
            completed: state.completed
        };
    });

    return result;
};

export default {
    CHALLENGES,
    trackChallenge,
    grantInfiniteChallengeXp,
    getChallengesForUser
};
