/* backend/services/cronService.js */
import cron from 'node-cron';
import { Op } from 'sequelize';
import axios from 'axios';
import db from '../models/index.js';
import { createNotification } from './notificationService.js';
import { cleanOrphanedImages, deleteFile } from './imageService.js';
import { sendBotReminderEmail } from './emailService.js';
import { getUnprotectedWeekdays } from './gamificationService.js';
import { newsAutomationService } from './newsAutomationService.js';
import { runRetentionRescueBatch } from './retentionRescueService.js';
import { supportContact } from '../config/mailContacts.js';

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
    const dayOfWeek = new Date(date + 'T12:00:00').getDay(); // 0 = Domingo, 6 = Sábado

    return { hour, day, date, dayOfWeek };
  } catch (error) {
    const now = new Date();
    return {
      hour: now.getUTCHours(),
      day: now.getUTCDate(),
      date: now.toISOString().split('T')[0],
      dayOfWeek: now.getUTCDay()
    };
  }
};

/**
 * Envía notificaciones a un usuario (Push + Interna) delegando en notificationService.
 */
const notifyUser = async (userId, payload) => {
  try {
    await createNotification(userId, {
      type: 'info',
      title: payload.title,
      message: payload.body,
      data: { url: payload.url },
      pushPurpose: payload.pushPurpose ?? null
    });
  } catch (error) {
    console.error(`[Cron] Error notificando a ${userId}:`, error.message);
  }
};

/**
 * Notifica por push a cuentas nuevas que cumplieron 24 horas y llevan un
 * tiempo sin actividad. Si vuelven a la app, el prompt se muestra allí.
 */
const checkNewUserRatingPrompt = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = Date.now();
      const eligibleAt = now - 24 * 60 * 60 * 1000;
      const windowStart = eligibleAt - 10 * 60 * 1000;
      const inactiveBefore = new Date(now - 15 * 60 * 1000);

      const users = await db.User.findAll({
        where: {
          role: { [Op.ne]: 'admin' },
          created_at: { [Op.between]: [new Date(windowStart), new Date(eligibleAt)] },
          [Op.or]: [
            { lastSeen: { [Op.lt]: inactiveBefore } },
            { lastSeen: null }
          ]
        },
        attributes: ['id'],
        include: [{
          model: db.PushSubscription,
          as: 'PushSubscriptions',
          required: true,
          attributes: []
        }]
      });

      for (const user of users) {
        const [existingRating, existingPrompt] = await Promise.all([
          db.AppRating.findOne({ where: { user_id: user.id }, attributes: ['id'] }),
          db.Notification.findOne({
            where: { user_id: user.id, type: 'app_rating_prompt' },
            attributes: ['id']
          })
        ]);

        if (existingRating || existingPrompt) continue;

        await createNotification(user.id, {
          type: 'app_rating_prompt',
          title: '¿Qué te parece Pro Fitness Glass?',
          message: 'Ya llevas 24 horas con la app. Cuando vuelvas, cuéntanos qué te parece.',
          data: { url: '/', action: 'open_rating_prompt' },
          pushPurpose: null
        });
      }
    } catch (error) {
      console.error('[Cron] Error enviando el prompt de valoración:', error.message);
    }
  });
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
 * TAREA CREATINA: Recordatorio de Creatina
 * Se ejecuta en el minuto 8 para no saturar con las otras tareas.
 */
const checkCreatineReminder = () => {
  cron.schedule('8 * * * *', async () => {
    try {
      // 1. Obtener usuarios distintos que tienen registros de creatina (usuarios que toman creatina)
      const creatineUsers = await db.CreatinaLog.findAll({
        attributes: ['user_id'],
        group: ['user_id']
      });
      
      const userIds = creatineUsers.map(u => u.user_id);
      if (!userIds.length) return;

      const users = await db.User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'timezone'],
        include: [{
          model: db.PushSubscription,
          as: 'PushSubscriptions',
          required: true,
          attributes: []
        }]
      });

      // 2. Filtrar a los que son las 10:00 AM localmente (buena hora para recordatorio de creatina)
      const targetUsers = users.filter(user => getLocalTime(user.timezone).hour === 10);
      if (!targetUsers.length) return;

      console.log(`[Cron] Creatina: Procesando ${targetUsers.length} usuarios.`);

      await Promise.all(targetUsers.map(async (user) => {
        const { date: localDate } = getLocalTime(user.timezone);

        // 3. Verificar si ya registró hoy
        const loggedToday = await db.CreatinaLog.findOne({
          where: { user_id: user.id, log_date: localDate }
        });

        // 4. Si no ha registrado hoy, notificar
        if (!loggedToday) {
          const payload = {
            title: "💊 Tu creatina",
            body: "No olvides registrar tu dosis diaria para no perder el progreso.",
            url: "/hub/progress?tab=creatina"
          };
          await notifyUser(user.id, payload);
        }
      }));
    } catch (error) {
      console.error('[Cron] Error tarea creatina:', error.message);
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
      const uniqueUserIds = [...new Set(targetUsers.map(u => u.id))];

      if (uniqueUserIds.length > 0) {
        console.log(`[Cron] Entrenamiento: Notificando a ${uniqueUserIds.length} usuarios.`);
        await Promise.all(uniqueUserIds.map(userId =>
          notifyUser(userId, {
            title: '¡Es hora de moverse!',
            body: '¿Listo para tu entrenamiento de hoy? ¡Vamos a por ello!',
            url: '/routines',
            pushPurpose: 'training'
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
        attributes: ['id', 'username', 'streak', 'last_activity_date', 'timezone', 'activity_level']
      });

      // 2. Filtrar a los que se les acaba el día (20:00h) y no han entrenado hoy
      const targetUsers = (await Promise.all(users.map(async user => {
        const { hour, date: localDate, dayOfWeek } = getLocalTime(user.timezone);
        // Sábados y domingos son días de descanso protegidos: no se envía alerta de peligro en fin de semana
        if (dayOfWeek === 0 || dayOfWeek === 6) return false;
        if (hour !== 20 || !user.last_activity_date) return false;

        // Si el último registro de actividad es anterior a hoy, está en peligro
        const lastActiveDate = new Date(user.last_activity_date).toISOString().split('T')[0];
        const missed = await getUnprotectedWeekdays(user, lastActiveDate, localDate, { threshold: 2 });
        return missed >= 2 ? user : null;
      }))).filter(Boolean);

      if (!targetUsers.length) return;
      console.log(`[Cron] Streak Wars: ${targetUsers.length} usuarios en peligro de perder racha.`);

      // 3. Obtener redes sociales de estos usuarios y notificar en paralelo
      await Promise.all(targetUsers.map(async (dangerUser) => {
        // 1. Notificar primero y directamente al propio usuario cuya racha peligra
        await notifyUser(dangerUser.id, {
          title: '🔥 ¡Tu racha está en peligro!',
          body: `Llevas una racha de ${dangerUser.streak} ${dangerUser.streak === 1 ? 'día' : 'días'} y aún no has entrenado hoy. ¡Completa tu entrenamiento antes de que acabe el día para no perderla!`,
          url: '/routines',
          pushPurpose: 'training'
        });

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

        // Set unifica IDs repetidos (por si son amigos y del mismo squad) y EXCLUYE al propio usuario
        const usersToNotify = [...new Set([...friendIds, ...squadMateIds])].filter(id => id !== dangerUser.id);

        await Promise.all(usersToNotify.map(notifyId =>
          notifyUser(notifyId, {
            title: '🔥 ¡Racha en peligro!',
            body: `Tu amigo ${dangerUser.username || 'alguien de tu equipo'} está a punto de perder su racha de ${dangerUser.streak} ${dangerUser.streak === 1 ? 'día' : 'días'}. ¡Empújale a entrenar!`,
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
        attributes: ['id', 'streak', 'last_activity_date', 'timezone', 'activity_level']
      });

      let resetCount = 0;

      await Promise.all(users.map(async (user) => {
        if (!user.last_activity_date) {
          user.streak = 0;
          await user.save();
          resetCount++;
          return;
        }

        const { date: localDate } = getLocalTime(user.timezone);

        // Parseamos las fechas usando formato YYYY-MM-DD para evitar diferencias de horas
        const lastActiveDate = new Date(user.last_activity_date).toISOString().split('T')[0];

        // Calculamos cuántos días laborables (lunes a viernes) se han perdido
        // Sábados y domingos son días de descanso protegidos y no cuentan como días perdidos
        const missedWeekdays = await getUnprotectedWeekdays(user, lastActiveDate, localDate);

        // Si ha transcurrido al menos 1 día laborable requerido sin entrenar, el usuario ha perdido la racha
        if (missedWeekdays > 2) {
          const oldStreak = user.streak;
          user.streak = 0;
          await user.save();
          resetCount++;

          // Notificar al usuario que ha perdido su racha
          notifyUser(user.id, {
            title: '💔 Racha perdida',
            body: `Has perdido tu racha de ${oldStreak} ${oldStreak === 1 ? 'día' : 'días'} por no haber entrenado. ¡Hoy es un buen día para empezar de nuevo!`,
            url: '/routines',
            pushPurpose: 'training'
          }).catch(err => console.error(`[Cron] Error notificando pérdida de racha a ${user.id}:`, err.message));
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


/**
 * Bot de chats de asesoría para prospectos
 */
const checkChatBotReminders = () => {
  cron.schedule('0 9-21 * * *', async () => {
    try {
      console.log('[Cron] Iniciando revisión de bot de chats de asesoría...');
      const { User, Message } = db;
      
      const prospects = await User.findAll({ where: { role: 'user' } });
      const trainers = await User.findAll({ where: { role: { [Op.in]: ['admin', 'trainer'] } } });
      const trainerIds = trainers.map(t => t.id);
      if (trainerIds.length === 0) return;

      const primaryTrainer = trainers.find(t => t.role === 'trainer') || trainers[0];

      for (const prospect of prospects) {
        // Unificamos el hilo de asesoría del prospecto con todo el staff (admin/trainer)
        // para evitar que se ejecuten ciclos paralelos por cada ID de staff.
        const threadWhere = {
          [Op.or]: [
            { sender_id: prospect.id, receiver_id: { [Op.in]: trainerIds } },
            { sender_id: { [Op.in]: trainerIds }, receiver_id: prospect.id }
          ]
        };

        const lastMsg = await Message.findOne({
          where: threadWhere,
          order: [['created_at', 'DESC'], ['id', 'DESC']]
        });

        if (!lastMsg || lastMsg.is_closed) continue;

        // Último mensaje escrito por alguien que NO sea el bot (prospecto o respuesta humana del entrenador)
        // Esto define el inicio del ciclo actual de inactividad.
        const lastNonBotMsg = await Message.findOne({
          where: {
            [Op.and]: [threadWhere],
            is_closed: { [Op.not]: true },
            [Op.or]: [
              { attachment_type: null },
              { attachment_type: { [Op.ne]: 'bot_reply' } }
            ],
            bot_reminder_level: { [Op.or]: [null, 0] }
          },
          order: [['created_at', 'DESC'], ['id', 'DESC']]
        });

        // Mensajes del bot enviados en el ciclo actual (desde el último mensaje no-bot)
        const cycleRemindersWhere = {
          ...threadWhere,
          is_closed: { [Op.not]: true },
          bot_reminder_level: { [Op.gt]: 0 }
        };
        if (lastNonBotMsg) {
          cycleRemindersWhere.created_at = { [Op.gte]: lastNonBotMsg.created_at };
        }

        const cycleReminders = await Message.findAll({
          where: cycleRemindersWhere,
          order: [['bot_reminder_level', 'DESC'], ['created_at', 'ASC'], ['id', 'ASC']]
        });

        // Nivel actual real del ciclo (máximo nivel ya enviado en este ciclo)
        const maxCycleLevel = cycleReminders.length > 0
          ? Math.max(...cycleReminders.map(r => r.bot_reminder_level || 0))
          : 0;
        const level = Math.max(lastMsg.bot_reminder_level || 0, maxCycleLevel);

        // Fecha de referencia para calcular las horas hacia el siguiente nivel:
        // Si ya hay un recordatorio del nivel actual, usamos el primer mensaje de ese nivel
        // (así un duplicado accidental nunca reinicia ni desfasa el contador de horas).
        const currentLevelMsg = level > 0
          ? cycleReminders.find(r => (r.bot_reminder_level || 0) === level)
          : null;
        const referenceDate = new Date((currentLevelMsg || lastMsg).created_at);

        const now = new Date();
        const diffHours = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60);

        // Determinar el entrenador remitente del hilo
        const targetTrainerId = (prospect.trainer_id && trainerIds.includes(prospect.trainer_id))
          ? prospect.trainer_id
          : (trainerIds.includes(lastMsg.sender_id)
              ? lastMsg.sender_id
              : (trainerIds.includes(lastMsg.receiver_id) ? lastMsg.receiver_id : primaryTrainer.id));

        let nextLevel = null;
        let title = '';
        let text = '';

        if (level === 0 && diffHours >= 72) {
          nextLevel = 1;
          title = '¿Continuamos con tu cambio?';
          text = 'Hola, he visto que dejaste el chat abierto. Si tienes cualquier duda sobre la asesoría o quieres empezar, ¡escríbeme por aquí y nos ponemos a ello!';
        } else if (level === 1 && diffHours >= 48) {
          nextLevel = 2;
          title = 'Aún estás a tiempo de empezar 💪';
          text = 'Solo te escribo para recordarte que sigo por aquí si necesitas ayuda para dar el primer paso. Si no estás interesado, no te preocupes.';
        } else if (level === 2 && diffHours >= 24) {
          nextLevel = 3;
          title = 'Último aviso antes de cerrar el chat ⏳';
          text = 'Si no recibo respuesta en 1 día, cerraré esta conversación para mantener el buzón limpio. Siempre podrás volver a solicitar asesoría más adelante.';
        } else if (level === 3 && diffHours >= 24) {
          nextLevel = 4;
        }

        if (nextLevel === 4) {
          console.log(`[Cron] Cerrando chat unificado de prospecto ${prospect.id}`);
          
          await Message.update(
            { is_closed: true },
            { where: threadWhere }
          );

          // Ensure trainer_id is null
          prospect.trainer_id = null;
          await prospect.save();

          createNotification(prospect.id, {
            type: 'chat_closed',
            title: 'Conversación cerrada por inactividad',
            message: 'Tu chat de asesoría ha sido cerrado. Puedes volver a solicitarla cuando quieras.',
            data: { url: '/asesoria' }
          });

        } else if (nextLevel !== null) {
          // Doble verificación de idempotencia: nunca enviar el mismo nivel dos veces en el mismo ciclo
          const alreadySentInCycle = cycleReminders.some(r => (r.bot_reminder_level || 0) >= nextLevel);
          if (alreadySentInCycle) continue;

          console.log(`[Cron] Enviando aviso nivel ${nextLevel} a prospecto ${prospect.id} (trainer ${targetTrainerId})`);
          
          const newMsg = await Message.create({
            sender_id: targetTrainerId,
            receiver_id: prospect.id,
            content: text,
            bot_reminder_level: nextLevel, attachment_type: 'bot_reply', created_at: new Date(),
            bot_push_status: 'pending', bot_email_status: 'pending'
          });

          let pushStat = 'error';
          let emailStat = 'error';

          try {
            const delivery = await createNotification(prospect.id, {
              type: 'chat_message', title: title, message: text,
              data: { url: '/asesoria', reminderLevel: nextLevel }, pushPurpose: 'coaching'
            });
            pushStat = delivery.pushStatus === 'success' ? 'ok' : delivery.pushStatus;
          } catch(e) {}

          try {
            const delivery = await sendBotReminderEmail(prospect.email, prospect.name || prospect.username, nextLevel);
            emailStat = delivery?.skipped ? 'skipped' : 'ok';
          } catch(e) { console.error('[Cron] Error email bot', e); }

          newMsg.bot_push_status = pushStat;
          newMsg.bot_email_status = emailStat;
          await newMsg.save();
        }
      }
      console.log('[Cron] Revisión de bot finalizada.');
    } catch(err) {
      console.error('[Cron] Error bot de chats:', err.message);
    }
  }, {
      timezone: 'Europe/Madrid'
    });
};

export const autoHealPendingWelcomeMessages = async () => {
  try {
    const { User, Message } = db;
    const trainersAndAdmins = await User.findAll({
      where: { role: { [Op.in]: ['admin', 'trainer'] } },
      attributes: ['id', 'role']
    });
    const trainerAdminIds = trainersAndAdmins.map(u => u.id);
    if (trainerAdminIds.length === 0) return;

    const primaryTrainer = trainersAndAdmins.find(u => u.role === 'trainer') || trainersAndAdmins[0];

    const prospects = await User.findAll({
      where: { role: 'user' },
      attributes: ['id']
    });

    for (const prospect of prospects) {
      const threadWhere = {
        [Op.or]: [
          { sender_id: prospect.id, receiver_id: { [Op.in]: trainerAdminIds } },
          { sender_id: { [Op.in]: trainerAdminIds }, receiver_id: prospect.id }
        ]
      };

      const lastMsg = await Message.findOne({
        where: threadWhere,
        order: [['created_at', 'DESC'], ['id', 'DESC']]
      });

      if (!lastMsg || lastMsg.is_closed) continue;

      // 1. Auto-limpieza de recordatorios duplicados del mismo nivel en el ciclo activo
      const lastNonBotMsg = await Message.findOne({
        where: {
          ...threadWhere,
          is_closed: { [Op.not]: true },
          [Op.or]: [
            { attachment_type: null },
            { attachment_type: { [Op.ne]: 'bot_reply' } }
          ],
          bot_reminder_level: { [Op.or]: [null, 0] }
        },
        order: [['created_at', 'DESC'], ['id', 'DESC']]
      });

      const cycleRemindersWhere = {
        ...threadWhere,
        is_closed: { [Op.not]: true },
        bot_reminder_level: { [Op.gt]: 0 }
      };
      if (lastNonBotMsg) {
        cycleRemindersWhere.created_at = { [Op.gte]: lastNonBotMsg.created_at };
      }

      const cycleReminders = await Message.findAll({
        where: cycleRemindersWhere,
        order: [['created_at', 'ASC'], ['id', 'ASC']]
      });

      const seenLevels = new Set();
      for (const rem of cycleReminders) {
        const lvl = rem.bot_reminder_level || 0;
        if (lvl > 0) {
          if (seenLevels.has(lvl)) {
            console.log(`[BOT-AUTOHEAL] Eliminando recordatorio duplicado nivel ${lvl} (msg ${rem.id}) para prospecto ${prospect.id}`);
            await rem.destroy();
          } else {
            seenLevels.add(lvl);
          }
        }
      }

      // 2. Si el último mensaje del hilo unificado es del prospecto y no hay respuesta posterior, crear bienvenida única
      if (lastMsg.sender_id === prospect.id) {
        const hasReplyAfter = await Message.count({
          where: {
            receiver_id: prospect.id,
            created_at: { [Op.gt]: lastMsg.created_at },
            [Op.or]: [
              { attachment_type: 'bot_reply' },
              { sender_id: { [Op.in]: trainerAdminIds } }
            ]
          }
        });

        if (hasReplyAfter === 0) {
          const targetTrainerId = trainerAdminIds.includes(lastMsg.receiver_id)
            ? lastMsg.receiver_id
            : primaryTrainer.id;
          console.log(`[BOT-AUTOHEAL] Creando respuesta de bienvenida pendiente para prospecto ${prospect.id}`);
          const botContent = "Hola, tus mensajes son totalmente privados. Recibirás respuesta de tu entrenador en un máximo de 2 horas por lo general. Se te avisará por correo o [notificaciones push] cuando esto suceda.";
          await Message.create({
            sender_id: targetTrainerId,
            receiver_id: prospect.id,
            content: botContent,
            attachment_type: 'bot_reply',
            created_at: new Date(new Date(lastMsg.created_at).getTime() + 1000)
          });
        }
      }
    }
  } catch (err) {
    console.error('[BOT-AUTOHEAL] Error:', err);
  }
};

export const startCronJobs = () => {
  console.log('[Cron] Iniciando tareas (Optimizado)...');
  checkNewUserRatingPrompt();
  checkNutritionGoals();
  checkCreatineReminder();
  checkTrainingReminder();
  checkWeightLogReminder();
  scheduleImageCleanup();
  cleanupExpiredStories();
  checkStreakWars();
  resetInactiveStreaks();
  checkChatBotReminders(); // <-- Añadido el nuevo vigilante
  checkInactivityRescue(); // <-- Detector de abandono temprano y rescate +72h
  scheduleDailyNewsAutomation();
  syncStaleLocalFoods();
  cron.schedule('40 3 * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await db.PushDeliveryLog.destroy({ where: { created_at: { [Op.lt]: cutoff } } });
    } catch (error) {
      console.error('[Push] Error limpiando los registros de entrega:', error.name);
    }
  });

  // Ejecución inmediata en arranque tras 3 segundos para reparar chats pendientes
  setTimeout(() => {
    autoHealPendingWelcomeMessages().catch(e => console.error('[BOT] Error en auto-heal de inicio:', e));
  }, 3000);
};

/**
 * TAREA 8: Detector de abandono temprano / Rescate Día 3 (+72h sin actividad)
 * Corre en el minuto 25 de cada hora y envía notificaciones Push, In-App y Email
 * ultra-personalizados según lo que el usuario sí hizo (rutina creada o mejor marca en ejercicio).
 */
const checkInactivityRescue = () => {
  cron.schedule('25 * * * *', async () => {
    try {
      const result = await runRetentionRescueBatch({ isManual: false, limit: 15 });
      if (result.processedCount > 0) {
        console.log(
          `[Cron] Rescate 72h: Enviados ${result.processedCount} rescates personalizados (${result.remainingEligibleCount} pendientes en cola).`
        );
      }
    } catch (error) {
      console.error('[Cron] Error en detector de rescate 72h:', error.message);
    }
  });
};

/**
 * Smart Sync: Sincronización nocturna de alimentos cacheados con más de 30 días.
 * Corre a las 04:00 AM hora de Madrid con rate-limiting cuidadoso (1.5s entre peticiones).
 */
const syncStaleLocalFoods = () => {
  cron.schedule('0 4 * * *', async () => {
    try {
      const { LocalFood } = db;
      if (!LocalFood) return;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const staleFoods = await LocalFood.findAll({
        where: {
          barcode: { [Op.ne]: null },
          [Op.or]: [
            { last_synced_at: null },
            { last_synced_at: { [Op.lt]: thirtyDaysAgo } }
          ]
        },
        order: [['last_synced_at', 'ASC']],
        limit: 50
      });

      if (staleFoods.length === 0) return;

      console.log(`[Cron] Smart Sync: Iniciando actualización de ${staleFoods.length} alimentos antiguos de OpenFoodFacts...`);
      let updatedCount = 0;

      for (const food of staleFoods) {
        try {
          const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${food.barcode}.json?fields=product_name,product_name_es,generic_name,brands,nutriments,serving_quantity`;
          const response = await axios.get(apiUrl, {
            timeout: 8000,
            headers: { 'User-Agent': `ProFitnessGlass - Android - Version 7.12.0 - https://profitnessglass.es - ${supportContact}` }
          });

          if (response.data && response.data.status === 1 && response.data.product) {
            const p = response.data.product;
            const nutriments = p.nutriments || {};

            const calories = Math.round(parseFloat(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0));
            const protein_g = Math.round(parseFloat(nutriments.proteins_100g ?? nutriments.proteins ?? 0) * 10) / 10;
            const carbs_g = Math.round(parseFloat(nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? 0) * 10) / 10;
            const fats_g = Math.round(parseFloat(nutriments.fat_100g ?? nutriments.fat ?? 0) * 10) / 10;
            const sugars_g = Math.round(parseFloat(nutriments.sugars_100g ?? nutriments.sugars ?? 0) * 10) / 10;
            const brand = p.brands ? p.brands.split(',')[0].trim() : food.brand;
            const serving_quantity = parseFloat(p.serving_quantity) || food.serving_quantity;

            await food.update({
              calories: calories || food.calories,
              protein_g: protein_g || food.protein_g,
              carbs_g: carbs_g || food.carbs_g,
              fats_g: fats_g || food.fats_g,
              sugars_g: sugars_g || food.sugars_g,
              brand,
              serving_quantity,
              last_synced_at: new Date()
            });
            updatedCount++;
          } else {
            // Si el producto ya no existe en OFF o no tiene status 1, renovamos last_synced_at para no reintentar continuamente
            await food.update({ last_synced_at: new Date() });
          }
        } catch (itemErr) {
          console.error(`[Cron] Smart Sync: Error actualizando barcode ${food.barcode}:`, itemErr.message);
          if (itemErr.response && itemErr.response.status === 404) {
            await food.update({ last_synced_at: new Date() }).catch(() => {});
          }
        }

        // Delay de 1500ms entre productos para respetar la API de OpenFoodFacts
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      console.log(`[Cron] Smart Sync: Finalizada actualización. ${updatedCount}/${staleFoods.length} alimentos actualizados.`);
    } catch (error) {
      console.error('[Cron] Smart Sync: Error en tarea nocturna:', error.message);
    }
  }, { timezone: 'Europe/Madrid' });
};

/**
 * Automatización diaria de noticias con Gemini
 * Verifica cada minuto si ha llegado la hora de generación programada
 */
const scheduleDailyNewsAutomation = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = Date.now();
      const status = newsAutomationService.getStatus();
      if (!status.isGenerating && status.nextRunAt && now >= new Date(status.nextRunAt).getTime()) {
        console.log('[Cron] Hora programada de creación diaria de noticias alcanzada. Iniciando Gemini...');
        await newsAutomationService.executeDailyNewsGeneration({ isManual: false });
      }
    } catch (e) {
      console.error('[Cron] Error en el cron de automatización de noticias:', e.message);
    }
  });
};



