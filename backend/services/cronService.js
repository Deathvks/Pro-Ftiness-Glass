/* backend/services/cronService.js */
import cron from 'node-cron';
import { Op, literal, fn, col } from 'sequelize';
import db from '../models/index.js';
import pushService from './pushService.js';
import { createNotification } from './notificationService.js';
import { cleanOrphanedImages } from './imageService.js';

/**
 * Obtiene la hora y fecha local para una zona horaria dada.
 * @param {string} timezone - Ejemplo: 'Europe/Madrid', 'Atlantic/Canary'
 */
const getLocalTime = (timezone) => {
  try {
    // Validar timezone o usar default
    const tz = timezone || 'Europe/Madrid';
    const now = new Date();

    // Hora (0-23)
    const hourStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: 'numeric' });

    // Día del mes (1-31)
    const dayStr = now.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' });

    // Fecha completa YYYY-MM-DD (Formato sueco es ISO-friendly)
    const dateStr = now.toLocaleDateString('sv-SE', { timeZone: tz });

    return {
      hour: parseInt(hourStr, 10),
      day: parseInt(dayStr, 10),
      date: dateStr
    };
  } catch (error) {
    console.error(`[Cron] Error zona horaria inválida (${timezone}):`, error.message);
    // Fallback seguro a UTC si falla
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
    // 1. Crear notificación interna
    await createNotification(userId, {
      type: 'info',
      title: payload.title,
      message: payload.body,
      data: { url: payload.url }
    });

    // 2. Enviar Push
    const subscriptions = await db.PushSubscription.findAll({ where: { user_id: userId } });
    if (subscriptions.length === 0) return;

    // console.log(`[Cron] Enviando Push a usuario ${userId}...`);

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
            // console.log(`[Cron] Eliminando suscripción caducada.`);
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
 * Se ejecuta CADA HORA, pero solo notifica si en la zona horaria del usuario son las 20:00 (8 PM).
 */
const checkNutritionGoals = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Verificando Metas Nutricionales (Hora actual)...');
    try {
      // 1. Buscar usuarios con metas definidas
      const users = await db.User.findAll({
        where: {
          [Op.or]: [
            { target_calories: { [Op.gt]: 0 } },
            { target_protein: { [Op.gt]: 0 } },
          ],
        },
        attributes: ['id', 'target_calories', 'target_protein', 'timezone']
      });

      // 2. Filtrar usuarios donde sean las 20:00
      const targetUsers = users.filter(user => {
        const { hour } = getLocalTime(user.timezone);
        return hour === 20;
      });

      if (targetUsers.length === 0) return;

      console.log(`[Cron] Analizando nutrición para ${targetUsers.length} usuarios (son las 20:00 local).`);

      // 3. Verificar progreso individualmente
      for (const user of targetUsers) {
        const { date: localDate } = getLocalTime(user.timezone);

        // Sumar logs de ESE día local
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
  }); // Sin timezone global, usa la hora del sistema para dispararse cada hora
};

/**
 * TAREA 2: Recordatorio de Entrenamiento
 * Se ejecuta CADA HORA, notifica si son las 10:00 (10 AM).
 */
const checkTrainingReminder = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Verificando Recordatorio Entrenamiento...');
    try {
      // Obtener usuarios con suscripciones y hacer join con User para sacar timezone
      const subscriptions = await db.PushSubscription.findAll({
        include: [{
          model: db.User,
          as: 'user', // Asegúrate de que la relación existe en tus modelos, si no, usa el método siguiente
          attributes: ['id', 'timezone']
        }]
      });

      // Si la relación no está definida directamente en el modelo PushSubscription,
      // iteramos IDs únicos y buscamos los usuarios.
      const userIds = [...new Set(subscriptions.map(s => s.user_id))];
      const users = await db.User.findAll({
        where: { id: userIds },
        attributes: ['id', 'timezone']
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
 * TAREA 3: Recordatorio de Peso (Día 1 del mes, 09:00 AM)
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

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Aprox

      for (const user of targetUsers) {
        // Verificar último log
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
 * (Semanal, Domingos 04:00 AM hora del servidor - Mantenimiento del sistema)
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
 * Inicializa todas las tareas programadas.
 */
export const startCronJobs = () => {
  console.log('[Cron] Inicializando tareas programadas (Multizona)...');
  checkNutritionGoals();
  checkTrainingReminder();
  checkWeightLogReminder();
  scheduleImageCleanup();
  console.log('[Cron] Tareas iniciadas.');
};