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
    const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: 'numeric' }), 10);
    const day = parseInt(now.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' }), 10);
    const date = now.toLocaleDateString('sv-SE', { timeZone: tz }); // Formato YYYY-MM-DD

    return { hour, day, date };
  } catch (error) {
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
          if (error.statusCode === 410 || error.statusCode === 404) {
            return sub.destroy();
          }
        });
    }));
  } catch (error) {
    console.error(`[Cron] Error notificando a ${userId}:`, error.message);
  }
};

/**
 * TAREA 1: Recordatorio de Nutrición
 * (Minuto 0)
 */
const checkNutritionGoals = () => {
  cron.schedule('0 * * * *', async () => {
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

      const targetUsers = users.filter(user => getLocalTime(user.timezone).hour === 20);
      if (!targetUsers.length) return;

      console.log(`[Cron] Nutrición: Procesando ${targetUsers.length} usuarios.`);

      await Promise.all(targetUsers.map(async (user) => {
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
 * (Minuto 5)
 */
const checkTrainingReminder = () => {
  cron.schedule('5 * * * *', async () => {
    try {
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
 * (Minuto 10)
 */
const checkWeightLogReminder = () => {
  cron.schedule('10 * * * *', async () => {
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
          attributes: ['log_date']
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
 * (Mantenido a las 4 AM los domingos, ya que no choca con tareas horarias)
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
 * (Minuto 15)
 */
const cleanupExpiredStories = () => {
  cron.schedule('15 * * * *', async () => {
    try {
      const now = new Date();
      const expiredStories = await db.Story.findAll({
        where: { expires_at: { [Op.lt]: now } }
      });

      if (!expiredStories.length) return;

      console.log(`[Cron] Historias: Eliminando ${expiredStories.length} expiradas.`);

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

/**
 * TAREA 6: Streak Wars (Notificar a amigos si pierdes la racha)
 * (Minuto 20)
 */
const checkStreakWars = () => {
  cron.schedule('20 * * * *', async () => {
    try {
      // 1. Obtener solo usuarios con racha activa
      const users = await db.User.findAll({
        where: { streak: { [Op.gt]: 0 } },
        attributes: ['id', 'username', 'streak', 'last_activity_date', 'timezone']
      });

      // 2. Filtrar a los que se les acaba el día (20:00h) y no han entrenado hoy
      const targetUsers = users.filter(user => {
        const { hour, date: localDate } = getLocalTime(user.timezone);
        if (hour !== 20 || !user.last_activity_date) return false;

        // Si el último registro de actividad es anterior a hoy, está en peligro
        const lastActiveDate = new Date(user.last_activity_date).toISOString().split('T')[0];
        return lastActiveDate < localDate;
      });

      if (!targetUsers.length) return;
      console.log(`[Cron] Streak Wars: ${targetUsers.length} usuarios en peligro de perder racha.`);

      // 3. Obtener redes sociales de estos usuarios y notificar en paralelo
      await Promise.all(targetUsers.map(async (dangerUser) => {
        const [friendships, squadMemberships] = await Promise.all([
          db.Friendship.findAll({
            where: {
              [Op.or]: [{ requester_id: dangerUser.id }, { addressee_id: dangerUser.id }],
              status: 'accepted'
            },
            attributes: ['requester_id', 'addressee_id']
          }),
          db.SquadMember.findAll({
            where: { user_id: dangerUser.id },
            attributes: ['squad_id']
          })
        ]);

        const friendIds = friendships.map(f => f.requester_id === dangerUser.id ? f.addressee_id : f.requester_id);
        const squadIds = squadMemberships.map(s => s.squad_id);

        let squadMateIds = [];
        if (squadIds.length > 0) {
          const mates = await db.SquadMember.findAll({
            where: { squad_id: { [Op.in]: squadIds }, user_id: { [Op.ne]: dangerUser.id } },
            attributes: ['user_id']
          });
          squadMateIds = mates.map(m => m.user_id);
        }

        // Set unifica IDs repetidos (por si son amigos y del mismo squad)
        const usersToNotify = [...new Set([...friendIds, ...squadMateIds])];

        await Promise.all(usersToNotify.map(notifyId =>
          notifyUser(notifyId, {
            title: '🔥 ¡Racha en peligro!',
            body: `Tu amigo ${dangerUser.username || 'alguien de tu equipo'} está a punto de perder su racha de ${dangerUser.streak} días. ¡Empújale a entrenar!`,
            url: `/social`,
          })
        ));
      }));
    } catch (error) {
      console.error('[Cron] Error tarea Streak Wars:', error.message);
    }
  });
};

/**
 * TAREA 7: Limpieza de Rachas Muertas (Reset a 0)
 * (Minuto 30)
 */
const resetInactiveStreaks = () => {
  cron.schedule('30 * * * *', async () => {
    try {
      // 1. Obtener solo usuarios con racha > 0
      const users = await db.User.findAll({
        where: { streak: { [Op.gt]: 0 } },
        attributes: ['id', 'streak', 'last_activity_date', 'timezone']
      });

      let resetCount = 0;

      await Promise.all(users.map(async (user) => {
        if (!user.last_activity_date) return;

        const { date: localDate } = getLocalTime(user.timezone);

        // Parseamos las fechas usando formato YYYY-MM-DD para evitar diferencias de horas
        const lastActiveDate = new Date(user.last_activity_date);
        const todayDate = new Date(localDate);

        // Calculamos la diferencia exacta en días
        const diffTime = todayDate.getTime() - lastActiveDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Si han pasado más de 1 día (2 días o más), el usuario ha perdido la racha
        if (diffDays > 1) {
          user.streak = 0;
          await user.save();
          resetCount++;

          // Opcional: podrías notificarle que ha perdido su racha
          // notifyUser(user.id, { title: 'Racha perdida 💔', body: 'Tu racha ha vuelto a 0. ¡Hoy es un buen día para empezar de nuevo!', url: '/' });
        }
      }));

      if (resetCount > 0) {
        console.log(`[Cron] Rachas Muertas: Se han reiniciado a 0 las rachas de ${resetCount} usuarios inactivos.`);
      }
    } catch (error) {
      console.error('[Cron] Error tarea reset de rachas:', error.message);
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
  checkStreakWars();
  resetInactiveStreaks(); // <-- Añadido el nuevo vigilante
};