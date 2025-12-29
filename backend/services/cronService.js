/* backend/services/cronService.js */
import cron from 'node-cron';
import { Op, literal, fn, col } from 'sequelize';
import db from '../models/index.js';
import pushService from './pushService.js';
import { createNotification } from './notificationService.js';
import { cleanOrphanedImages } from './imageService.js';

/**
 * Envía notificaciones a un usuario específico (Push + Interna).
 * @param {string} userId - ID del usuario
 * @param {object} payload - { title, body, url }
 */
const notifyUser = async (userId, payload) => {
  try {
    // 1. Crear notificación interna (Persistencia en la App)
    await createNotification(userId, {
      type: 'info',
      title: payload.title,
      message: payload.body,
      data: { url: payload.url }
    });

    // 2. Enviar notificación Push (al móvil/navegador)
    const subscriptions = await db.PushSubscription.findAll({ where: { user_id: userId } });

    if (subscriptions.length === 0) return;

    console.log(`[Cron] Enviando Push "${payload.title}" a usuario ${userId}...`);

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
            console.log(`[Cron] Eliminando suscripción caducada: ${sub.endpoint.substring(0, 20)}...`);
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
 * TAREA 1: Recordatorio de Nutrición (Diario a las 8 PM)
 */
const checkNutritionGoals = () => {
  cron.schedule('0 20 * * *', async () => {
    console.log('[Cron] Ejecutando tarea: Recordatorio de Nutrición...');
    try {
      const today = new Date().toISOString().split('T')[0];

      const users = await db.User.findAll({
        where: {
          [Op.or]: [
            { target_calories: { [Op.gt]: 0 } },
            { target_protein: { [Op.gt]: 0 } },
          ],
        },
        include: [{
          model: db.NutritionLog,
          as: 'NutritionLogs',
          where: { log_date: today },
          attributes: [],
          required: false,
        }],
        attributes: [
          'id',
          'target_calories',
          'target_protein',
          [fn('SUM', col('NutritionLogs.calories')), 'totalCalories'],
          [fn('SUM', col('NutritionLogs.protein_g')), 'totalProtein'],
        ],
        group: ['User.id'],
      });

      const usersToNotify = users.filter(user => {
        const currentCals = parseFloat(user.dataValues.totalCalories || 0);
        const currentProt = parseFloat(user.dataValues.totalProtein || 0);

        const caloriesMet = user.target_calories > 0 && currentCals >= user.target_calories;
        const proteinMet = user.target_protein > 0 && currentProt >= user.target_protein;

        return (user.target_calories > 0 && !caloriesMet) || (user.target_protein > 0 && !proteinMet);
      });

      console.log(`[Cron] ${usersToNotify.length} usuarios no han cumplido metas nutricionales.`);

      usersToNotify.forEach(user => {
        const payload = {
          title: '¡No olvides tus metas!',
          body: 'Aún no has completado tus objetivos de calorías o proteínas del día. ¡Tú puedes!',
          url: '/nutrition',
        };
        notifyUser(user.id, payload);
      });

    } catch (error) {
      console.error('[Cron] Error en la tarea de nutrición:', error);
    }
  }, {
    timezone: "Europe/Madrid"
  });
};

/**
 * TAREA 2: Recordatorio de Entrenamiento (Diario a las 10 AM)
 */
const checkTrainingReminder = () => {
  cron.schedule('0 10 * * *', async () => {
    console.log('[Cron] Ejecutando tarea: Recordatorio de Entrenamiento...');
    try {
      const usersWithSubscriptions = await db.PushSubscription.findAll({
        // CORRECCIÓN: Usar 'user_id' (nombre de la columna en DB) en lugar de 'userId'
        attributes: [[fn('DISTINCT', col('user_id')), 'userId']],
      });

      const payload = {
        title: '¡Es hora de moverse!',
        body: '¿Listo para tu entrenamiento de hoy? ¡Vamos a por ello!',
        url: '/routines',
      };

      usersWithSubscriptions.forEach(sub => {
        notifyUser(sub.userId, payload);
      });

    } catch (error) {
      console.error('[Cron] Error en la tarea de entrenamiento:', error);
    }
  }, {
    timezone: "Europe/Madrid"
  });
};

/**
 * TAREA 3: Recordatorio de Peso (Mensual, día 1 a las 9 AM)
 */
const checkWeightLogReminder = () => {
  cron.schedule('0 9 1 * *', async () => {
    console.log('[Cron] Ejecutando tarea: Recordatorio de Peso Mensual...');
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const usersToNotify = await db.User.findAll({
        attributes: ['id'],
        include: [{
          model: db.BodyWeightLog,
          as: 'BodyWeightLogs',
          attributes: [],
          required: false,
        }],
        group: ['User.id'],
        having: literal(`COUNT(\`BodyWeightLogs\`.\`id\`) = 0 OR MAX(\`BodyWeightLogs\`.\`log_date\`) < '${thirtyDaysAgo.toISOString().split('T')[0]}'`)
      });

      console.log(`[Cron] ${usersToNotify.length} usuarios deben registrar su peso.`);

      const payload = {
        title: 'Registro de Progreso Mensual',
        body: '¡Hola! Ha pasado un tiempo. No olvides registrar tu peso para seguir tu progreso.',
        url: '/progress',
      };

      usersToNotify.forEach(user => {
        notifyUser(user.id, payload);
      });

    } catch (error) {
      console.error('[Cron] Error en la tarea de peso:', error);
    }
  }, {
    timezone: "Europe/Madrid"
  });
};

/**
 * TAREA 4: Limpieza de imágenes huérfanas (Semanal, Domingos a las 04:00 AM)
 */
const scheduleImageCleanup = () => {
  // 0 4 * * 0 = A las 04:00 AM del Domingo (0)
  cron.schedule('0 4 * * 0', async () => {
    console.log('[Cron] Ejecutando tarea: Limpieza de imágenes huérfanas...');
    try {
      await cleanOrphanedImages();
    } catch (error) {
      console.error('[Cron] Error en la limpieza de imágenes:', error);
    }
  }, {
    timezone: "Europe/Madrid"
  });
};

/**
 * Inicializa todas las tareas programadas.
 */
export const startCronJobs = () => {
  console.log('[Cron] Inicializando tareas programadas...');
  checkNutritionGoals();
  checkTrainingReminder();
  checkWeightLogReminder();
  scheduleImageCleanup();
  console.log('[Cron] Tareas programadas iniciadas.');
};