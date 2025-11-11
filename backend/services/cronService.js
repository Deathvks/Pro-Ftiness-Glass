/* backend/services/cronService.js */
import cron from 'node-cron';
import { Op, literal, fn, col } from 'sequelize';
// --- INICIO DE LA MODIFICACIÓN ---
// Importamos el objeto 'db' principal, como en el resto de tu backend
import db from '../models/index.js';
// --- FIN DE LA MODIFICACIÓN ---
import pushService from './pushService.js';

/**
 * Envía notificaciones a un usuario específico.
 * @param {string} userId - ID del usuario
 * @param {object} payload - { title, body, url }
 */
const notifyUser = async (userId, payload) => {
  try {
    // --- MODIFICACIÓN: Usamos db.PushSubscription ---
    const subscriptions = await db.PushSubscription.findAll({ where: { user_id: userId } });
    if (subscriptions.length === 0) return;

    console.log(`[Cron] Enviando ${payload.title} a ${userId}...`);

    const notifications = subscriptions.map(sub => {
      // Convertir el modelo de Sequelize a un objeto JSON plano
      const subscriptionObject = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        },
      };
      
      return pushService.sendNotification(subscriptionObject, payload)
        .catch(error => {
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[Cron] Eliminando suscripción caducada: ${sub.endpoint.substring(0, 20)}...`);
            return sub.destroy(); // Eliminar suscripción de la BD
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

      // --- MODIFICACIÓN: Usamos db.User y db.NutritionLog ---
      const users = await db.User.findAll({
        where: {
          [Op.or]: [
            { target_calories: { [Op.gt]: 0 } },
            { target_protein: { [Op.gt]: 0 } },
          ],
        },
        include: [{
          model: db.NutritionLog, // Corregido
          as: 'nutritionLogs',
          where: { log_date: today },
          attributes: [],
          required: false,
        }],
        attributes: [
          'id',
          'target_calories',
          'target_protein',
          [fn('SUM', col('nutritionLogs.calories')), 'totalCalories'],
          [fn('SUM', col('nutritionLogs.protein')), 'totalProtein'],
        ],
        group: ['User.id'],
      });

      const usersToNotify = users.filter(user => {
        const caloriesMet = user.target_calories <= (user.dataValues.totalCalories || 0);
        const proteinMet = user.target_protein <= (user.dataValues.totalProtein || 0);
        return !caloriesMet || !proteinMet;
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
      // --- MODIFICACIÓN: Usamos db.PushSubscription ---
      const usersWithSubscriptions = await db.PushSubscription.findAll({
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

      // --- MODIFICACIÓN: Usamos db.User y db.Bodyweight ---
      const usersToNotify = await db.User.findAll({
        attributes: ['id'],
        include: [{
          model: db.Bodyweight, // Corregido
          as: 'bodyweights',
          attributes: [],
          required: false,
        }],
        where: {
          '$bodyweights.log_date$': {
            [Op.or]: {
              [Op.lt]: thirtyDaysAgo,
              [Op.is]: null,
            },
          },
        },
        group: ['User.id'],
        having: literal('COUNT(`bodyweights`.`id`) = 0 OR MAX(`bodyweights`.`log_date`) < ?', [thirtyDaysAgo.toISOString().split('T')[0]]),
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
 * Inicializa todas las tareas programadas.
 */
export const startCronJobs = () => {
  console.log('[Cron] Inicializando tareas programadas...');
  checkNutritionGoals();
  checkTrainingReminder();
  checkWeightLogReminder();
  console.log('[Cron] Tareas programadas iniciadas.');
};