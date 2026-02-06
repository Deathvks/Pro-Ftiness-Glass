/* backend/services/cronService.js */
import cron from 'node-cron';
import { Op } from 'sequelize';
import db from '../models/index.js';
import pushService from './pushService.js';
import { createNotification } from './notificationService.js';
import { cleanOrphanedImages, deleteFile } from './imageService.js';

/**
 * Obtiene la hora y fecha local para una zona horaria dada.
 */
const getLocalTime = (timezone) => {
  try {
    const tz = timezone || 'Europe/Madrid';
    const now = new Date();
    // Usamos formateadores pre-calculados para eficiencia
    const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: 'numeric' }), 10);
    const day = parseInt(now.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' }), 10);
    const date = now.toLocaleDateString('sv-SE', { timeZone: tz }); // Formato YYYY-MM-DD

    return { hour, day, date };
  } catch (error) {
    // Fallback silencioso a UTC si la zona horaria falla
    const now = new Date();
    return {
      hour: now.getUTCHours(),
      day: now.getUTCDate(),
      date: now.toISOString().split('T')[0]
    };
  }
};

/**
 * Envía notificaciones a un usuario (Push + Interna) de forma optimizada.
 */
const notifyUser = async (userId, payload) => {
  try {
    // Ejecutamos la creación de notificación interna y la búsqueda de suscripciones en paralelo
    const [subscriptions] = await Promise.all([
      db.PushSubscription.findAll({ where: { user_id: userId } }),
      createNotification(userId, {
        type: 'info',
        title: payload.title,
        message: payload.body,
        data: { url: payload.url }
      })
    ]);

    if (!subscriptions.length) return;

    // Enviamos todas las push en paralelo
    await Promise.all(subscriptions.map(sub => {
      const subscriptionObject = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key || sub.keys.p256dh,
          auth: sub.auth_key || sub.keys.auth,
        },
      };

      return pushService.sendNotification(subscriptionObject, payload)
        .catch(error => {
          // Si el endpoint ya no existe (410/404), borramos la suscripción para limpiar DB
          if (error.statusCode === 410 || error.statusCode === 404) {
            return sub.destroy();
          }
          // Ignoramos otros errores para no saturar logs
        });
    }));

  } catch (error) {
    console.error(`[Cron] Error notificando a ${userId}:`, error.message);
  }
};

/**
 * TAREA 1: Recordatorio de Nutrición
 */
const checkNutritionGoals = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      // 1. Obtener usuarios candidatos (Solo ID y campos necesarios)
      const users = await db.User.findAll({
        where: {
          [Op.or]: [
            { target_calories: { [Op.gt]: 0 } },
            { target_protein: { [Op.gt]: 0 } },
          ],
        },
        attributes: ['id', 'target_calories', 'target_protein', 'timezone']
      });

      // 2. Filtrar en memoria (rápido) quiénes están en su hora 20:00
      const targetUsers = users.filter(user => getLocalTime(user.timezone).hour === 20);
      if (!targetUsers.length) return;

      console.log(`[Cron] Nutrición: Procesando ${targetUsers.length} usuarios.`);

      // 3. Procesar en paralelo (Promise.all)
      await Promise.all(targetUsers.map(async (user) => {
        const { date: localDate } = getLocalTime(user.timezone);

        // Sumar logs del día
        const logs = await db.NutritionLog.findAll({
          where: { user_id: user.id, log_date: localDate },
          attributes: ['calories', 'protein_g']
        });

        const totalCals = logs.reduce((sum, log) => sum + (parseFloat(log.calories) || 0), 0);
        const totalProt = logs.reduce((sum, log) => sum + (parseFloat(log.protein_g) || 0), 0);

        const caloriesMet = user.target_calories > 0 && totalCals >= user.target_calories;
        const proteinMet = user.target_protein > 0 && totalProt >= user.target_protein;

        if ((user.target_calories > 0 && !caloriesMet) || (user.target_protein > 0 && !proteinMet)) {
          return notifyUser(user.id, {
            title: '¡No olvides tus metas!',
            body: 'Aún no has completado tus objetivos de hoy. ¡Tú puedes!',
            url: '/nutrition',
          });
        }
      }));

    } catch (error) {
      console.error('[Cron] Error tarea nutrición:', error.message);
    }
  });
};

/**
 * TAREA 2: Recordatorio de Entrenamiento
 */
const checkTrainingReminder = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      // Optimización: JOIN interno para traer solo usuarios que YA tienen push activas
      const users = await db.User.findAll({
        attributes: ['id', 'timezone'],
        include: [{
          model: db.PushSubscription,
          as: 'PushSubscriptions',
          required: true,
          attributes: []
        }]
      });

      const targetUsers = users.filter(user => getLocalTime(user.timezone).hour === 10);

      if (targetUsers.length > 0) {
        console.log(`[Cron] Entrenamiento: Notificando a ${targetUsers.length} usuarios.`);
        // Envío en paralelo
        await Promise.all(targetUsers.map(user => 
          notifyUser(user.id, {
            title: '¡Es hora de moverse!',
            body: '¿Listo para tu entrenamiento de hoy? ¡Vamos a por ello!',
            url: '/routines',
          })
        ));
      }

    } catch (error) {
      console.error('[Cron] Error tarea entrenamiento:', error.message);
    }
  });
};

/**
 * TAREA 3: Recordatorio de Peso
 */
const checkWeightLogReminder = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const allUsers = await db.User.findAll({ attributes: ['id', 'timezone'] });

      const targetUsers = allUsers.filter(user => {
        const { hour, day } = getLocalTime(user.timezone);
        return day === 1 && hour === 9;
      });

      if (!targetUsers.length) return;

      console.log(`[Cron] Peso: Verificando ${targetUsers.length} usuarios.`);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      await Promise.all(targetUsers.map(async (user) => {
        const lastLog = await db.BodyWeightLog.findOne({
          where: { user_id: user.id },
          order: [['log_date', 'DESC']],
          attributes: ['log_date'] // Solo necesitamos la fecha
        });

        if (!lastLog || new Date(lastLog.log_date) < thirtyDaysAgo) {
          return notifyUser(user.id, {
            title: 'Registro de Progreso Mensual',
            body: '¡Hola! Ha pasado un tiempo. No olvides registrar tu peso.',
            url: '/progress',
          });
        }
      }));

    } catch (error) {
      console.error('[Cron] Error tarea peso:', error.message);
    }
  });
};

/**
 * TAREA 4: Limpieza de imágenes huérfanas
 * (Bajo impacto, se mantiene semanal)
 */
const scheduleImageCleanup = () => {
  cron.schedule('0 4 * * 0', async () => {
    try {
      await cleanOrphanedImages();
    } catch (error) {
      console.error('[Cron] Error limpieza imágenes:', error.message);
    }
  });
};

/**
 * TAREA 5: Limpieza de Historias Expiradas
 */
const cleanupExpiredStories = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const expiredStories = await db.Story.findAll({
        where: { expires_at: { [Op.lt]: now } }
      });

      if (!expiredStories.length) return;

      console.log(`[Cron] Historias: Eliminando ${expiredStories.length} expiradas.`);

      // Paralelizamos la eliminación de archivos y registros
      await Promise.all(expiredStories.map(async (story) => {
        if (story.url) {
          await deleteFile(story.url).catch(e => console.error(`[Cron] Error fichero historia:`, e.message));
        }
        return story.destroy();
      }));

    } catch (error) {
      console.error('[Cron] Error limpieza historias:', error.message);
    }
  });
};

export const startCronJobs = () => {
  console.log('[Cron] Iniciando tareas (Optimizado)...');
  checkNutritionGoals();
  checkTrainingReminder();
  checkWeightLogReminder();
  scheduleImageCleanup();
  cleanupExpiredStories();
};