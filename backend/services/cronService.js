/* backend/services/cronService.js */
import cron from 'node-cron';
import { Op } from 'sequelize';
import db from '../models/index.js';
import pushService from './pushService.js';
import { createNotification } from './notificationService.js';
// FIX: Importamos deleteFile para borrar los archivos de las historias
import { cleanOrphanedImages, deleteFile } from './imageService.js';

/**
 * Obtiene la hora y fecha local para una zona horaria dada.
 */
const getLocalTime = (timezone) => {
  try {
    const tz = timezone || 'Europe/Madrid';
    const now = new Date();
    const hourStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: 'numeric' });
    const dayStr = now.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' });
    const dateStr = now.toLocaleDateString('sv-SE', { timeZone: tz });

    return {
      hour: parseInt(hourStr, 10),
      day: parseInt(dayStr, 10),
      date: dateStr
    };
  } catch (error) {
    console.error(`[Cron] Error zona horaria inválida (${timezone}):`, error.message);
    const now = new Date();
    return {
      hour: now.getUTCHours(),
      day: now.getUTCDate(),
      date: now.toISOString().split('T')[0]
    };
  }
};

/**
 * Envía notificaciones a un usuario específico (Push + Interna).
 */
const notifyUser = async (userId, payload) => {
  try {
    await createNotification(userId, {
      type: 'info',
      title: payload.title,
      message: payload.body,
      data: { url: payload.url }
    });

    const subscriptions = await db.PushSubscription.findAll({ where: { user_id: userId } });
    if (subscriptions.length === 0) return;

    const notifications = subscriptions.map(sub => {
      const subscriptionObject = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key || sub.keys.p256dh,
          auth: sub.auth_key || sub.keys.auth,
        },
      };

      return pushService.sendNotification(subscriptionObject, payload)
        .catch(error => {
          if (error.statusCode === 410 || error.statusCode === 404) {
            return sub.destroy();
          }
          console.error(`[Cron] Error enviando push: ${error.message}`);
        });
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error(`[Cron] Error fatal al notificar a ${userId}:`, error);
  }
};

/**
 * TAREA 1: Recordatorio de Nutrición
 */
const checkNutritionGoals = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Verificando Metas Nutricionales (Hora actual)...');
    try {
      const users = await db.User.findAll({
        where: {
          [Op.or]: [
            { target_calories: { [Op.gt]: 0 } },
            { target_protein: { [Op.gt]: 0 } },
          ],
        },
        attributes: ['id', 'target_calories', 'target_protein', 'timezone']
      });

      const targetUsers = users.filter(user => {
        const { hour } = getLocalTime(user.timezone);
        return hour === 20;
      });

      if (targetUsers.length === 0) return;

      console.log(`[Cron] Analizando nutrición para ${targetUsers.length} usuarios.`);

      for (const user of targetUsers) {
        const { date: localDate } = getLocalTime(user.timezone);

        const logs = await db.NutritionLog.findAll({
          where: { user_id: user.id, log_date: localDate },
          attributes: ['calories', 'protein_g']
        });

        const totalCals = logs.reduce((sum, log) => sum + (parseFloat(log.calories) || 0), 0);
        const totalProt = logs.reduce((sum, log) => sum + (parseFloat(log.protein_g) || 0), 0);

        const caloriesMet = user.target_calories > 0 && totalCals >= user.target_calories;
        const proteinMet = user.target_protein > 0 && totalProt >= user.target_protein;

        if ((user.target_calories > 0 && !caloriesMet) || (user.target_protein > 0 && !proteinMet)) {
          notifyUser(user.id, {
            title: '¡No olvides tus metas!',
            body: 'Aún no has completado tus objetivos de hoy. ¡Tú puedes!',
            url: '/nutrition',
          });
        }
      }
    } catch (error) {
      console.error('[Cron] Error en la tarea de nutrición:', error);
    }
  });
};

/**
 * TAREA 2: Recordatorio de Entrenamiento
 */
const checkTrainingReminder = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Verificando Recordatorio Entrenamiento...');
    try {
      // Optimización: Obtener directamente usuarios que tienen suscripciones activas
      const users = await db.User.findAll({
        attributes: ['id', 'timezone'],
        include: [{
          model: db.PushSubscription,
          as: 'PushSubscriptions',
          required: true, // INNER JOIN: Solo usuarios con suscripciones
          attributes: []
        }]
      });

      const targetUsers = users.filter(user => {
        const { hour } = getLocalTime(user.timezone);
        return hour === 10;
      });

      if (targetUsers.length > 0) {
        console.log(`[Cron] Enviando recordatorio entrenamiento a ${targetUsers.length} usuarios.`);
        targetUsers.forEach(user => {
          notifyUser(user.id, {
            title: '¡Es hora de moverse!',
            body: '¿Listo para tu entrenamiento de hoy? ¡Vamos a por ello!',
            url: '/routines',
          });
        });
      }

    } catch (error) {
      console.error('[Cron] Error en la tarea de entrenamiento:', error);
    }
  });
};

/**
 * TAREA 3: Recordatorio de Peso
 */
const checkWeightLogReminder = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Verificando Recordatorio Peso...');
    try {
      const allUsers = await db.User.findAll({ attributes: ['id', 'timezone'] });

      const targetUsers = allUsers.filter(user => {
        const { hour, day } = getLocalTime(user.timezone);
        return day === 1 && hour === 9;
      });

      if (targetUsers.length === 0) return;

      console.log(`[Cron] Analizando peso para ${targetUsers.length} usuarios.`);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      for (const user of targetUsers) {
        const lastLog = await db.BodyWeightLog.findOne({
          where: { user_id: user.id },
          order: [['log_date', 'DESC']],
        });

        const needsLog = !lastLog || new Date(lastLog.log_date) < thirtyDaysAgo;

        if (needsLog) {
          notifyUser(user.id, {
            title: 'Registro de Progreso Mensual',
            body: '¡Hola! Ha pasado un tiempo. No olvides registrar tu peso.',
            url: '/progress',
          });
        }
      }

    } catch (error) {
      console.error('[Cron] Error en la tarea de peso:', error);
    }
  });
};

/**
 * TAREA 4: Limpieza de imágenes huérfanas
 */
const scheduleImageCleanup = () => {
  cron.schedule('0 4 * * 0', async () => {
    console.log('[Cron] Ejecutando tarea: Limpieza de imágenes huérfanas...');
    try {
      await cleanOrphanedImages();
    } catch (error) {
      console.error('[Cron] Error en la limpieza de imágenes:', error);
    }
  });
};

/**
 * TAREA 5: Limpieza de Historias Expiradas (NUEVO)
 * Se ejecuta cada hora en punto.
 */
const cleanupExpiredStories = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Buscando historias expiradas para eliminar...');
    try {
      const now = new Date();
      // Buscar historias cuya fecha de expiración sea anterior a ahora
      const expiredStories = await db.Story.findAll({
        where: {
          expires_at: { [Op.lt]: now }
        }
      });

      if (expiredStories.length === 0) return;

      console.log(`[Cron] Eliminando ${expiredStories.length} historias expiradas.`);

      for (const story of expiredStories) {
        // 1. Eliminar archivo físico (Imagen/Video)
        if (story.url) {
            try {
                await deleteFile(story.url);
            } catch (e) {
                console.error(`[Cron] Error eliminando archivo de historia ${story.id}:`, e.message);
            }
        }
        // 2. Eliminar registro de BD (Cascada borrará likes y views)
        await story.destroy();
      }
    } catch (error) {
      console.error('[Cron] Error en la limpieza de historias:', error);
    }
  });
};

export const startCronJobs = () => {
  console.log('[Cron] Inicializando tareas programadas (Multizona)...');
  checkNutritionGoals();
  checkTrainingReminder();
  checkWeightLogReminder();
  scheduleImageCleanup();
  cleanupExpiredStories(); // Iniciar limpieza de historias
  console.log('[Cron] Tareas iniciadas.');
};