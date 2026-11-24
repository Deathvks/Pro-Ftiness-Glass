/* backend/services/retentionRescueService.js */
import { Op } from 'sequelize';
import db from '../models/index.js';
import { createNotification } from './notificationService.js';
import { getOptionalEmailEligibility, sendRetentionRescueEmail } from './emailService.js';

const formatWeightKg = (val) => {
  const num = parseFloat(val);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Number.isInteger(num) ? String(num) : String(Math.round(num * 10) / 10);
};

// El cron corre cada hora en el minuto :25. El rescate automático solo se
// procesa en los pases de :25 cuya hora local está entre las 11 y las 20.
const getNextAutomaticSendAt = (eligibleAt, timezone = 'Europe/Madrid') => {
  const candidate = new Date(eligibleAt);
  if (Number.isNaN(candidate.getTime())) return null;
  candidate.setSeconds(0, 0);
  if (candidate.getMinutes() < 25) {
    candidate.setMinutes(25);
  } else {
    candidate.setHours(candidate.getHours() + 1, 25, 0, 0);
  }

  // Busca el siguiente :25 dentro de la franja local permitida. El límite
  // evita un bucle infinito ante una zona horaria inválida.
  for (let i = 0; i < 48; i += 1) {
    try {
      const localHour = Number(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone || 'Europe/Madrid',
        hour: 'numeric',
        hour12: false,
      }).format(candidate));
      if (localHour >= 11 && localHour <= 20) return candidate.toISOString();
    } catch {
      timezone = 'Europe/Madrid';
    }
    candidate.setHours(candidate.getHours() + 1, 25, 0, 0);
  }

  return null;
};

/**
 * Construye el mensaje ultra-personalizado de rescate según lo que el usuario sí hizo.
 */
export const buildPersonalizedRescuePayload = ({
  routineCount = 0,
  latestRoutineName = null,
  workoutCount = 0,
  lastWorkoutRoutineName = null,
  bestExerciseName = null,
  bestWeightKg = null,
  nutritionCount = 0,
}) => {
  const cleanWeight = formatWeightKg(bestWeightKg);

  // Caso 1: Ya hizo al menos 1 entrenamiento
  if (workoutCount >= 1) {
    if (bestExerciseName && cleanWeight) {
      return {
        segment: 'has_workout_pr',
        title: `¡Supera tu marca en ${bestExerciseName}!`,
        message: `Ya tienes tu marca base en ${bestExerciseName}. En tu próxima sesión veremos si superas esos ${cleanWeight} kg 💪.`,
        contextLabel: `Marca base: ${bestExerciseName} (${cleanWeight} kg)`,
        ctaUrl: '/routines',
        ctaText: 'Superar mi marca hoy',
      };
    }

    const fallbackName = bestExerciseName || lastWorkoutRoutineName || 'tu último entrenamiento';
    return {
      segment: 'has_workout_pr',
      title: `¡Tu siguiente sesión te espera!`,
      message: `Ya tienes tu marca base en ${fallbackName}. En tu próxima sesión veremos si superas tu registro anterior 💪.`,
      contextLabel: `Entreno previo: ${fallbackName}`,
      ctaUrl: '/routines',
      ctaText: 'Registrar mi siguiente sesión',
    };
  }

  // Caso 2: Creó rutina pero aún no entrenó
  if (routineCount >= 1) {
    const rName = latestRoutineName || 'personalizada';
    return {
      segment: 'routine_ready',
      title: `¡Tu rutina ${rName} está lista!`,
      message: `¡Tu rutina ${rName} está lista! ¿La estrenamos hoy para registrar tus primeras marcas? 💪`,
      contextLabel: `Rutina lista: ${rName}`,
      ctaUrl: '/routines',
      ctaText: 'Entrenar ahora',
    };
  }

  // Caso 3: Registró nutrición pero aún no tiene rutina ni entreno
  if (nutritionCount >= 1) {
    return {
      segment: 'nutrition_only',
      title: '¡Acompaña tu nutrición con tu primer entreno!',
      message: 'Ya empezaste controlando tu comida. ¿Hacemos hoy tu primer entreno para registrar tus series y pesos? 💪',
      contextLabel: `Nutrición activa (${nutritionCount} reg.)`,
      ctaUrl: '/routines',
      ctaText: 'Ir a entrenar',
    };
  }

  // Caso 4: Registrado sin rutina ni entrenamiento todavía
  return {
    segment: 'no_setup',
    title: '¡Tu diario de entrenamiento te espera!',
    message: '¿Empezamos hoy tu progreso? Entra y registra tu primer entrenamiento para apuntar tus marcas de fuerza 💪.',
    contextLabel: 'Pendiente de primera rutina',
    ctaUrl: '/routines',
    ctaText: 'Empezar a entrenar',
  };
};

// Solo se invoca después de verificar el consentimiento para personalizar el correo.
const loadEmailRescuePayload = async (userId) => {
  const workout = await db.WorkoutLog.findOne({
    attributes: ['routine_name'],
    where: { user_id: userId },
    order: [['workout_date', 'DESC'], ['id', 'DESC']],
    raw: true
  });
  if (workout) {
    const bestLift = await db.PersonalRecord.findOne({
      attributes: ['exercise_name', 'weight_kg'],
      where: { user_id: userId, weight_kg: { [Op.gt]: 0 }, exercise_name: { [Op.ne]: '' } },
      order: [['weight_kg', 'DESC'], ['id', 'DESC']],
      raw: true
    });
    return buildPersonalizedRescuePayload({
      workoutCount: 1,
      lastWorkoutRoutineName: workout.routine_name,
      bestExerciseName: bestLift?.exercise_name,
      bestWeightKg: bestLift?.weight_kg
    });
  }

  const routine = await db.Routine.findOne({
    attributes: ['name'],
    where: { user_id: userId },
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    raw: true
  });
  if (routine) {
    return buildPersonalizedRescuePayload({ routineCount: 1, latestRoutineName: routine.name });
  }

  const nutritionLog = await db.NutritionLog.findOne({
    attributes: ['id'],
    where: { user_id: userId },
    raw: true
  });
  if (nutritionLog) {
    return {
      ...buildPersonalizedRescuePayload({ nutritionCount: 1 }),
      contextLabel: 'Nutrición registrada'
    };
  }

  return buildPersonalizedRescuePayload({});
};

/**
 * Analiza todos los usuarios y devuelve:
 * - eligibleInactiveUsers: usuarios con >= 72h de inactividad (tanto nuevos <14d como veteranos >72h)
 * - upcomingUsers: usuarios entre 12h y 72h de inactividad que están próximos a cumplir el margen
 * - historyLogs: historial detallado de envíos realizados (hora, mensaje, estado push/email, errores y si se recuperó)
 * - summary: métricas globales
 */
export const getRetentionRescueOverview = async () => {
  const now = new Date();
  const nowMs = now.getTime();
  const thirtyDaysAgo = new Date(nowMs - 30 * 24 * 60 * 60 * 1000);

  // 1. Consultas agregadas ultrarrápidas con GROUP BY (evita N*8 subconsultas correlacionadas y bloqueos de CPU en MySQL)
  const [
    users,
    routineStats,
    workoutStats,
    nutritionStats,
    pushStats,
    personalRecords,
    rescueLogs,
    channelNotifications,
    botMessages,
    botReplyMessages,
    retentionClientEvents,
  ] = await Promise.all([
    db.User.findAll({
      where: {
        role: { [Op.ne]: 'admin' },
      },
      attributes: [
        'id',
        'username',
        'name',
        'email',
        'is_verified',
        'profile_image_url',
        'role',
        'timezone',
        'email_marketing_consent',
        'lastSeen',
        'last_activity_date',
        ['created_at', 'createdAt'],
      ],
      order: [['created_at', 'DESC']],
      raw: true,
    }),
    db.sequelize
      .query(
        `SELECT user_id, COUNT(*) AS routineCount, MAX(name) AS latestRoutineName
         FROM routines
         GROUP BY user_id`,
        { type: db.sequelize.QueryTypes.SELECT }
      )
      .catch(() => []),
    db.sequelize
      .query(
        `SELECT user_id, COUNT(*) AS workoutCount, MAX(workout_date) AS lastWorkoutDate, MAX(routine_name) AS lastWorkoutRoutineName
         FROM workout_logs
         GROUP BY user_id`,
        { type: db.sequelize.QueryTypes.SELECT }
      )
      .catch(() => []),
    db.sequelize
      .query(
        `SELECT user_id, COUNT(*) AS nutritionCount, MAX(log_date) AS lastNutritionDate
         FROM nutrition_logs
         GROUP BY user_id`,
        { type: db.sequelize.QueryTypes.SELECT }
      )
      .catch(() => []),
    db.sequelize
      .query(
        `SELECT user_id, COUNT(*) AS pushSubCount
         FROM push_subscriptions
         GROUP BY user_id`,
        { type: db.sequelize.QueryTypes.SELECT }
      )
      .catch(() => []),
    db.PersonalRecord.findAll({
      attributes: ['user_id', 'exercise_name', 'weight_kg'],
      where: { weight_kg: { [Op.gt]: 0 } },
      raw: true,
    }).catch(() => []),
    db.RetentionRescueLog
      ? db.RetentionRescueLog.findAll({
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['id', 'username', 'name', 'email', 'profile_image_url', 'lastSeen'],
            },
          ],
          order: [['sent_at', 'DESC']],
          limit: 250,
        }).catch(() => [])
      : Promise.resolve([]),
    db.Notification
      ? db.Notification.findAll({
          attributes: ['user_id', 'type', 'title', 'created_at'],
          where: {
            created_at: { [Op.gte]: thirtyDaysAgo },
            [Op.or]: [
              { type: { [Op.in]: ['early_nudge_24h', 'weekly_email_recap', 'training_reminder'] } },
              {
                title: {
                  [Op.in]: [
                    '🔥 ¡Tu racha está en peligro!',
                    '💔 Racha perdida',
                    '¡No olvides tus metas!',
                    '💊 Tu creatina',
                    'Registro de Progreso Mensual',
                  ],
                },
              },
            ],
          },
          order: [['created_at', 'DESC']],
          raw: true,
        }).catch(() => [])
      : Promise.resolve([]),
    db.Message
      ? db.Message.findAll({
          attributes: ['id', 'sender_id', 'receiver_id', 'bot_reminder_level', 'bot_push_status', 'bot_email_status', 'created_at'],
          where: {
            created_at: { [Op.gte]: thirtyDaysAgo },
            bot_reminder_level: { [Op.gt]: 0 },
          },
          order: [['created_at', 'DESC']],
          raw: true,
        }).catch(() => [])
      : Promise.resolve([]),
    db.Message
      ? db.Message.findAll({
          attributes: ['sender_id', 'created_at'],
          where: {
            created_at: { [Op.gte]: thirtyDaysAgo },
            [Op.or]: [
              { attachment_type: null },
              { attachment_type: { [Op.ne]: 'bot_reply' } },
            ],
            bot_reminder_level: { [Op.or]: [null, 0] },
          },
          order: [['created_at', 'DESC']],
          raw: true,
        }).catch(() => [])
      : Promise.resolve([]),
    db.PushDeliveryLog
      ? db.PushDeliveryLog.findAll({
          attributes: ['user_id', 'title', 'status', 'body', 'error_message', 'created_at'],
          where: {
            type: 'retention_event',
            created_at: { [Op.gte]: thirtyDaysAgo },
          },
          order: [['created_at', 'DESC']],
          raw: true,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const routineMap = new Map(routineStats.map(r => [Number(r.user_id), r]));
  const workoutMap = new Map(workoutStats.map(w => [Number(w.user_id), w]));
  const nutritionMap = new Map(nutritionStats.map(n => [Number(n.user_id), n]));
  const pushMap = new Map(pushStats.map(p => [Number(p.user_id), parseInt(p.pushSubCount, 10) || 0]));

  const bestLiftByUser = new Map();
  for (const pr of personalRecords) {
    const uid = Number(pr.user_id);
    const existing = bestLiftByUser.get(uid);
    const w = parseFloat(pr.weight_kg);
    if (pr.exercise_name && w > 0 && (!existing || w >= existing.weightKg)) {
      bestLiftByUser.set(uid, {
        exerciseName: pr.exercise_name,
        weightKg: w,
      });
    }
  }

  // Mapa del último rescate enviado por usuario
  const latestRescueByUser = new Map();
  for (const log of rescueLogs) {
    const uid = Number(log.user_id);
    if (!latestRescueByUser.has(uid)) {
      latestRescueByUser.set(uid, log);
    }
  }

  const eligibleInactiveUsers = [];
  const upcomingUsers = [];
  const userLastActivityMap = new Map();
  const userLastLoggedMap = new Map();
  const userLastWorkoutMap = new Map();

  for (const plain of users) {
    const uid = Number(plain.id);
    const rStat = routineMap.get(uid);
    const wStat = workoutMap.get(uid);
    const nStat = nutritionMap.get(uid);

    const createdAt = plain.createdAt ? new Date(plain.createdAt) : new Date(nowMs - 7 * 86400000);
    const lastSeenDate = plain.lastSeen ? new Date(plain.lastSeen) : null;
    const lastWorkoutDate = wStat?.lastWorkoutDate ? new Date(wStat.lastWorkoutDate) : null;
    const lastNutritionDate = nStat?.lastNutritionDate ? new Date(`${nStat.lastNutritionDate}T20:00:00Z`) : null;

    // Última actividad registrada de entrenamiento o comida (o fecha de registro si nunca registró)
    const logDates = [lastWorkoutDate, lastNutritionDate].filter(d => d && !Number.isNaN(d.getTime()));
    const lastLoggedActionAt = logDates.length > 0
      ? new Date(Math.max(...logDates.map(d => d.getTime())))
      : createdAt;

    // Última presencia general (entreno, comida, lastSeen o registro)
    const allActivityDates = [lastWorkoutDate, lastNutritionDate, lastSeenDate, createdAt].filter(
      d => d && !Number.isNaN(d.getTime())
    );
    const lastOverallActivityAt = new Date(Math.max(...allActivityDates.map(d => d.getTime())));
    userLastActivityMap.set(uid, lastOverallActivityAt);
    if (logDates.length > 0) {
      userLastLoggedMap.set(uid, lastLoggedActionAt);
    }
    if (lastWorkoutDate && !Number.isNaN(lastWorkoutDate.getTime())) {
      userLastWorkoutMap.set(uid, lastWorkoutDate);
    }

    const accountAgeHours = Math.max(0, (nowMs - createdAt.getTime()) / 3600000);
    const accountAgeDays = Math.floor(accountAgeHours / 24);
    const isEarlyCohort = accountAgeDays <= 14;

    const hoursSinceLastLog = Math.max(0, (nowMs - lastLoggedActionAt.getTime()) / 3600000);
    const hoursSinceOverallActivity = Math.max(0, (nowMs - lastOverallActivityAt.getTime()) / 3600000);

    // Si es usuario temprano (<14 días) y lleva >=72h sin registrar entreno ni comida (y al menos 24h sin entrar),
    // o si cualquier usuario (nuevo o veterano) lleva >=72h sin entrar ni registrar actividad:
    const effectiveInactiveHours =
      isEarlyCohort && hoursSinceOverallActivity >= 24
        ? Math.max(hoursSinceOverallActivity, hoursSinceLastLog)
        : hoursSinceOverallActivity;

    const routineCount = parseInt(rStat?.routineCount, 10) || 0;
    const workoutCount = parseInt(wStat?.workoutCount, 10) || 0;
    const nutritionCount = parseInt(nStat?.nutritionCount, 10) || 0;
    const pushSubCount = pushMap.get(uid) || 0;
    const bestLift = bestLiftByUser.get(uid) || null;

    const rescuePreview = buildPersonalizedRescuePayload({
      routineCount,
      latestRoutineName: rStat?.latestRoutineName || null,
      workoutCount,
      lastWorkoutRoutineName: wStat?.lastWorkoutRoutineName || null,
      bestExerciseName: bestLift?.exerciseName || null,
      bestWeightKg: bestLift?.weightKg || null,
      nutritionCount,
    });

    const lastRescue = latestRescueByUser.get(uid) || null;
    const lastRescueSentAt = lastRescue?.sent_at ? new Date(lastRescue.sent_at) : null;
    const returnedAfterLastRescue =
      lastRescueSentAt && lastOverallActivityAt.getTime() > lastRescueSentAt.getTime() + 5 * 60 * 1000;
    const hoursSinceLastRescue = lastRescueSentAt
      ? (nowMs - lastRescueSentAt.getTime()) / 3600000
      : Infinity;

    // Ya fue rescatado en este mismo ciclo de inactividad si tiene un envío posterior a su última actividad
    const alreadyRescuedInCurrentCycle =
      !!lastRescueSentAt && !returnedAfterLastRescue;

    const userItem = {
      id: plain.id,
      username: plain.username || plain.name || 'Atleta',
      name: plain.name || plain.username || 'Atleta',
      email: plain.email,
      emailMarketingConsent: [true, 1, '1'].includes(plain.email_marketing_consent),
      emailVerified: Boolean(plain.is_verified),
      profile_image_url: plain.profile_image_url,
      timezone: plain.timezone || 'Europe/Madrid',
      createdAt: createdAt.toISOString(),
      accountAgeDays,
      isEarlyCohort,
      lastSeen: lastSeenDate ? lastSeenDate.toISOString() : null,
      lastWorkoutDate: lastWorkoutDate ? lastWorkoutDate.toISOString() : null,
      lastNutritionDate: nStat?.lastNutritionDate || null,
      lastActivityAt: lastOverallActivityAt.toISOString(),
      inactiveHours: Math.round(effectiveInactiveHours),
      inactiveDays: Math.floor(effectiveInactiveHours / 24),
      routineCount,
      latestRoutineName: rStat?.latestRoutineName || null,
      workoutCount,
      lastWorkoutRoutineName: wStat?.lastWorkoutRoutineName || null,
      nutritionCount,
      hasPushSubscription: pushSubCount > 0,
      pushSubCount,
      bestExerciseName: bestLift?.exerciseName || null,
      bestWeightKg: bestLift?.weightKg || null,
      segment: rescuePreview.segment,
      previewTitle: rescuePreview.title,
      previewMessage: rescuePreview.message,
      contextLabel: rescuePreview.contextLabel,
      ctaUrl: rescuePreview.ctaUrl,
      ctaText: rescuePreview.ctaText,
      alreadyRescuedInCurrentCycle,
      lastRescueSentAt: lastRescueSentAt ? lastRescueSentAt.toISOString() : null,
      lastRescueStatus: lastRescue?.overall_status || null,
      returnedAfterLastRescue: !!returnedAfterLastRescue,
      canAutoSend: !alreadyRescuedInCurrentCycle && hoursSinceLastRescue >= 168,
    };

    if (effectiveInactiveHours >= 72) {
      eligibleInactiveUsers.push({
        ...userItem,
        estimatedAutoSendAt: getNextAutomaticSendAt(now, userItem.timezone),
      });
    } else if (effectiveInactiveHours >= 12 && effectiveInactiveHours < 72 && !alreadyRescuedInCurrentCycle) {
      const hoursRemaining = Math.max(1, Math.ceil(72 - effectiveInactiveHours));
      const eligibleAtDate = new Date(nowMs + Math.max(0, 72 - effectiveInactiveHours) * 3600000);
      upcomingUsers.push({
        ...userItem,
        hoursRemaining,
        progressPercent: Math.min(99, Math.max(5, Math.round((effectiveInactiveHours / 72) * 100))),
        eligibleAt: eligibleAtDate.toISOString(),
        estimatedAutoSendAt: getNextAutomaticSendAt(eligibleAtDate, userItem.timezone),
      });
    }
  }

  const eligibleEmailStatuses = await getOptionalEmailEligibility(users, 'training');
  const applyEmailEligibility = list => list.map(user => {
    const status = eligibleEmailStatuses.get(Number(user.id));
    return {
      ...user,
      emailWillSend: status?.allowed === true,
      emailSkipReason: status?.reason || 'consent_missing_or_invalid',
    };
  });
  eligibleInactiveUsers.splice(0, eligibleInactiveUsers.length, ...applyEmailEligibility(eligibleInactiveUsers));
  upcomingUsers.splice(0, upcomingUsers.length, ...applyEmailEligibility(upcomingUsers));

  // Ordenar inactivos >=72h: primero los pendientes de envío (y dentro de ellos, los más recientes a 72h primero)
  eligibleInactiveUsers.sort((a, b) => {
    if (a.alreadyRescuedInCurrentCycle !== b.alreadyRescuedInCurrentCycle) {
      return a.alreadyRescuedInCurrentCycle ? 1 : -1;
    }
    if (a.isEarlyCohort !== b.isEarlyCohort) {
      return a.isEarlyCohort ? -1 : 1;
    }
    return a.inactiveHours - b.inactiveHours;
  });

  // Ordenar próximos (<72h): los que están más cerca de cumplir las 72h primero
  upcomingUsers.sort((a, b) => a.hoursRemaining - b.hoursRemaining);

  // Formatear historial de envíos con estado de recuperación
  const formattedLogs = rescueLogs.map((log) => {
    const plain = log.get({ plain: true });
    const sentAt = plain.sent_at ? new Date(plain.sent_at) : null;
    const latestAct = userLastActivityMap.get(plain.user_id);
    const recovered =
      sentAt && latestAct && latestAct.getTime() > sentAt.getTime() + 5 * 60 * 1000;
    return {
      ...plain,
      recovered: !!recovered,
      latestUserActivityAt: latestAct ? latestAct.toISOString() : null,
    };
  });

  const pendingToRescueCount = eligibleInactiveUsers.filter(u => !u.alreadyRescuedInCurrentCycle).length;
  const emailEligibleInactiveCount = eligibleInactiveUsers.filter(u => u.emailWillSend).length;
  const emailIneligibleInactiveCount = eligibleInactiveUsers.length - emailEligibleInactiveCount;
  const pendingEmailSendCount = eligibleInactiveUsers.filter(
    u => !u.alreadyRescuedInCurrentCycle && u.emailWillSend
  ).length;
  const pendingEmailSkipCount = pendingToRescueCount - pendingEmailSendCount;
  const upcomingEmailSendCount = upcomingUsers.filter(u => u.emailWillSend).length;
  const emailAuthorizedTotal = users.filter(
    u => u.role !== 'admin' && u.role !== 'trainer' && u.role !== 'entrenador' && eligibleEmailStatuses.get(Number(u.id))?.allowed === true
  ).length;
  const earlyCohortPendingCount = eligibleInactiveUsers.filter(
    u => !u.alreadyRescuedInCurrentCycle && u.isEarlyCohort
  ).length;
  const totalSentCount = formattedLogs.length;
  const successSentCount = formattedLogs.filter(l => l.overall_status === 'success').length;
  const errorSentCount = formattedLogs.filter(
    l => l.overall_status === 'error' || l.email_status === 'error' || l.push_status === 'error'
  ).length;
  const emailSentCount = formattedLogs.filter(l => l.email_status === 'success').length;
  const emailSkippedCount = formattedLogs.filter(l => l.email_status === 'skipped').length;
  const emailErrorCount = formattedLogs.filter(l => l.email_status === 'error').length;
  const recoveredCount = formattedLogs.filter(l => l.recovered).length;

  // Analítica unificada de todos los canales de retención (Web, Capacitor y App Nativa)
  const summarizeUserChannel = (rows, {
    getUserId = row => Number(row.user_id),
    getTimestamp = row => row.created_at || row.sent_at,
    recoveryGraceMs = 5 * 60 * 1000,
    activityMap = userLastActivityMap,
  } = {}) => {
    const latestTouchByUser = new Map();
    let totalEvents = 0;

    for (const row of rows) {
      const uid = getUserId(row);
      const ts = getTimestamp(row) ? new Date(getTimestamp(row)).getTime() : NaN;
      if (!uid || Number.isNaN(ts)) continue;
      totalEvents += 1;
      const prev = latestTouchByUser.get(uid);
      if (!prev || ts > prev) {
        latestTouchByUser.set(uid, ts);
      }
    }

    let recoveredUsers = 0;
    for (const [uid, touchMs] of latestTouchByUser.entries()) {
      const act = activityMap.get(uid);
      if (act && act.getTime() > touchMs + recoveryGraceMs) {
        recoveredUsers += 1;
      }
    }

    const uniqueUsers = latestTouchByUser.size;
    return {
      totalEvents,
      uniqueUsers,
      recoveredUsers,
      recoveryRate: uniqueUsers > 0 ? Math.round((recoveredUsers / uniqueUsers) * 100) : 0,
      latestTouchByUser,
    };
  };

  const countConvertedAfter = (latestTouchByUser, activityMap, graceMs = 5 * 60 * 1000) => {
    let count = 0;
    for (const [uid, touchMs] of latestTouchByUser.entries()) {
      const act = activityMap.get(uid);
      if (act && act.getTime() > touchMs + graceMs) count += 1;
    }
    return count;
  };

  const rescueChannelStats = summarizeUserChannel(formattedLogs, {
    getTimestamp: l => l.sent_at,
  });
  const earlyNudgeRows = channelNotifications.filter(n => n.type === 'early_nudge_24h');
  const earlyNudgeStats = summarizeUserChannel(earlyNudgeRows);
  const earlyNudgeConverted = countConvertedAfter(earlyNudgeStats.latestTouchByUser, userLastLoggedMap);

  const weeklyRecapRows = channelNotifications.filter(n => n.type === 'weekly_email_recap');
  const weeklyRecapStats = summarizeUserChannel(weeklyRecapRows);

  const trainingReminderRows = channelNotifications.filter(n => n.type === 'training_reminder');
  const trainingReminderStats = summarizeUserChannel(trainingReminderRows);
  const trainingReminderWorkouts = countConvertedAfter(trainingReminderStats.latestTouchByUser, userLastWorkoutMap);

  const streakDangerRows = channelNotifications.filter(n => n.title === '🔥 ¡Tu racha está en peligro!');
  const streakLostRows = channelNotifications.filter(n => n.title === '💔 Racha perdida');
  const streakAlertStats = summarizeUserChannel([...streakDangerRows, ...streakLostRows]);

  const habitMacrosRows = channelNotifications.filter(n => n.title === '¡No olvides tus metas!');
  const habitCreatineRows = channelNotifications.filter(n => n.title === '💊 Tu creatina');
  const habitWeightRows = channelNotifications.filter(n => n.title === 'Registro de Progreso Mensual');
  const habitReminderStats = summarizeUserChannel([
    ...habitMacrosRows,
    ...habitCreatineRows,
    ...habitWeightRows,
  ]);

  // Bot de asesoría: considera recuperado si el prospecto respondió o tuvo actividad tras el aviso
  const latestReplyByUser = new Map();
  for (const msg of botReplyMessages) {
    const uid = Number(msg.sender_id);
    const ts = msg.created_at ? new Date(msg.created_at).getTime() : NaN;
    if (!uid || Number.isNaN(ts)) continue;
    const prev = latestReplyByUser.get(uid);
    if (!prev || ts > prev) latestReplyByUser.set(uid, ts);
  }
  const botTouchMap = new Map();
  let botEmailSent = 0;
  let botPushSent = 0;
  for (const msg of botMessages) {
    const uid = Number(msg.receiver_id);
    const ts = msg.created_at ? new Date(msg.created_at).getTime() : NaN;
    if (!uid || Number.isNaN(ts)) continue;
    if (msg.bot_email_status === 'ok') botEmailSent += 1;
    if (msg.bot_push_status === 'ok') botPushSent += 1;
    const prev = botTouchMap.get(uid);
    if (!prev || ts > prev) botTouchMap.set(uid, ts);
  }
  let botRepliedUsers = 0;
  let botRecoveredUsers = 0;
  for (const [uid, touchMs] of botTouchMap.entries()) {
    const replyMs = latestReplyByUser.get(uid);
    const appAct = userLastActivityMap.get(uid)?.getTime();
    const didReply = Boolean(replyMs && replyMs > touchMs);
    const didAppReturn = Boolean(appAct && appAct > touchMs + 5 * 60 * 1000);
    if (didReply) botRepliedUsers += 1;
    if (didReply || didAppReturn) botRecoveredUsers += 1;
  }

  // Telemetría móvil local (Capacitor / Nativa) + Ganchos Día 2 / Semana 2
  const localCapEvents = retentionClientEvents.filter(
    e => e.title === 'local_capacitor_engagement' || e.title === 'local_capacitor_daily'
  );
  const localCapOpened = localCapEvents.filter(e => e.status === 'opened');
  const localCapScheduled = localCapEvents.filter(e => e.status === 'scheduled');
  const localCapStats = summarizeUserChannel(localCapOpened.length > 0 ? localCapOpened : localCapScheduled);

  const localNativeEvents = retentionClientEvents.filter(
    e => e.title === 'local_native_engagement' || e.title === 'local_native_daily'
  );
  const localNativeOpened = localNativeEvents.filter(e => e.status === 'opened');
  const localNativeScheduled = localNativeEvents.filter(e => e.status === 'scheduled');
  const localNativeStats = summarizeUserChannel(localNativeOpened.length > 0 ? localNativeOpened : localNativeScheduled);

  const hookEvents = retentionClientEvents.filter(e =>
    e.title === 'hook_micro_challenge' ||
    e.title === 'hook_repeat_yesterday' ||
    e.title === 'hook_next_session_target'
  );
  const hookStats = summarizeUserChannel(hookEvents, {
    activityMap: userLastLoggedMap,
    recoveryGraceMs: 0,
  });
  const countPlatforms = (rows) => ({
    web: rows.filter(r => r.error_message === 'web').length,
    capacitor: rows.filter(r => r.error_message === 'capacitor').length,
    native: rows.filter(r => r.error_message === 'native').length,
  });

  const recoveryChannels = [
    {
      key: 'rescue_72h',
      label: 'Rescate +72h personalizado',
      category: 'automated',
      platforms: ['web', 'capacitor', 'native'],
      scheduleLabel: 'Cada hora :25 (≥72h)',
      windowLabel: `Últimos ${formattedLogs.length} envíos`,
      sentCount: rescueChannelStats.totalEvents,
      uniqueUsers: rescueChannelStats.uniqueUsers,
      recoveredUsers: rescueChannelStats.recoveredUsers,
      recoveryRate: rescueChannelStats.recoveryRate,
      detailText: `${emailSentCount} emails · ${formattedLogs.filter(l => l.push_status === 'success').length} push`,
    },
    {
      key: 'early_nudge_24h',
      label: 'Nudge temprano 24h',
      category: 'automated',
      platforms: ['web', 'capacitor', 'native'],
      scheduleLabel: 'Cada hora :35 (24–36h)',
      windowLabel: 'Últimos 30 días',
      sentCount: earlyNudgeStats.totalEvents,
      uniqueUsers: earlyNudgeStats.uniqueUsers,
      recoveredUsers: earlyNudgeStats.recoveredUsers,
      recoveryRate: earlyNudgeStats.recoveryRate,
      detailText: `${earlyNudgeConverted} registraron entreno o comida tras aviso`,
    },
    {
      key: 'weekly_email_recap',
      label: 'Resumen semanal por correo',
      category: 'automated',
      platforms: ['web', 'capacitor', 'native'],
      scheduleLabel: 'Domingos 19:00 locales',
      windowLabel: 'Últimos 30 días',
      sentCount: weeklyRecapStats.totalEvents,
      uniqueUsers: weeklyRecapStats.uniqueUsers,
      recoveredUsers: weeklyRecapStats.recoveredUsers,
      recoveryRate: weeklyRecapStats.recoveryRate,
      detailText: `${weeklyRecapStats.uniqueUsers} usuarios con consentimiento verificado`,
    },
    {
      key: 'training_reminder',
      label: 'Recordatorio de entreno',
      category: 'automated',
      platforms: ['web', 'capacitor', 'native'],
      scheduleLabel: 'Hora preferida (:05)',
      windowLabel: 'Últimos 30 días',
      sentCount: trainingReminderStats.totalEvents,
      uniqueUsers: trainingReminderStats.uniqueUsers,
      recoveredUsers: trainingReminderStats.recoveredUsers,
      recoveryRate: trainingReminderStats.recoveryRate,
      detailText: `${trainingReminderWorkouts} completaron entreno tras aviso`,
    },
    {
      key: 'streak_alerts',
      label: 'Streak Wars y racha perdida',
      category: 'automated',
      platforms: ['web', 'capacitor', 'native'],
      scheduleLabel: '20:00 riesgo · :30 pérdida',
      windowLabel: 'Últimos 30 días',
      sentCount: streakAlertStats.totalEvents,
      uniqueUsers: streakAlertStats.uniqueUsers,
      recoveredUsers: streakAlertStats.recoveredUsers,
      recoveryRate: streakAlertStats.recoveryRate,
      detailText: `${streakDangerRows.length} en peligro · ${streakLostRows.length} rachas perdidas`,
    },
    {
      key: 'habit_reminders',
      label: 'Hábitos (Macros, Creatina, Peso)',
      category: 'automated',
      platforms: ['web', 'capacitor', 'native'],
      scheduleLabel: '10:00 / 20:00 / Día 1 mes',
      windowLabel: 'Últimos 30 días',
      sentCount: habitReminderStats.totalEvents,
      uniqueUsers: habitReminderStats.uniqueUsers,
      recoveredUsers: habitReminderStats.recoveredUsers,
      recoveryRate: habitReminderStats.recoveryRate,
      detailText: `${habitMacrosRows.length} macros · ${habitCreatineRows.length} creatina · ${habitWeightRows.length} peso`,
    },
    {
      key: 'advisor_bot',
      label: 'Bot de chats de asesoría',
      category: 'messaging',
      platforms: ['web', 'capacitor', 'native'],
      scheduleLabel: '9:00–21:00 (N1 72h · N2 48h · N3 24h)',
      windowLabel: 'Últimos 30 días',
      sentCount: botMessages.length,
      uniqueUsers: botTouchMap.size,
      recoveredUsers: botRecoveredUsers,
      recoveryRate: botTouchMap.size > 0 ? Math.round((botRecoveredUsers / botTouchMap.size) * 100) : 0,
      detailText: `${botRepliedUsers} respuestas · ${botEmailSent} emails · ${botPushSent} push`,
    },
    {
      key: 'local_capacitor',
      label: 'Notificaciones locales Capacitor',
      category: 'mobile_local',
      platforms: ['capacitor'],
      scheduleLabel: 'Dispositivo (14:00 / 20:00 + 1–3d)',
      windowLabel: 'Últimos 30 días',
      sentCount: localCapScheduled.length,
      uniqueUsers: localCapStats.uniqueUsers,
      recoveredUsers: localCapStats.recoveredUsers,
      recoveryRate: localCapStats.recoveryRate,
      detailText: `${localCapScheduled.length} programaciones · ${localCapOpened.length} aperturas directas`,
    },
    {
      key: 'local_native',
      label: 'Notificaciones locales App Nativa',
      category: 'mobile_local',
      platforms: ['native'],
      scheduleLabel: 'Dispositivo (10:00 / 14:30 + 1–3d)',
      windowLabel: 'Últimos 30 días',
      sentCount: localNativeScheduled.length,
      uniqueUsers: localNativeStats.uniqueUsers,
      recoveredUsers: localNativeStats.recoveredUsers,
      recoveryRate: localNativeStats.recoveryRate,
      detailText: `${localNativeScheduled.length} programaciones · ${localNativeOpened.length} aperturas directas`,
    },
    {
      key: 'in_app_hooks',
      label: 'Ganchos Día 2 y Semana 2',
      category: 'in_app',
      platforms: ['web', 'capacitor', 'native'],
      scheduleLabel: 'Micro-reto · Repetir ayer · Próx. objetivo',
      windowLabel: 'Últimos 30 días',
      sentCount: hookEvents.length,
      uniqueUsers: hookStats.uniqueUsers,
      recoveredUsers: hookStats.recoveredUsers,
      recoveryRate: hookStats.recoveryRate,
      detailText: (() => {
        const p = countPlatforms(hookEvents);
        const microCount = hookEvents.filter(e => e.title === 'hook_micro_challenge').length;
        const repeatCount = hookEvents.filter(e => e.title === 'hook_repeat_yesterday').length;
        const targetCount = hookEvents.filter(e => e.title === 'hook_next_session_target').length;
        return `${microCount} micro-reto · ${repeatCount} repetir ayer · ${targetCount} próx. objetivo (W:${p.web} · C:${p.capacitor} · N:${p.native})`;
      })(),
    },
  ];

  const channelsSummary = {
    totalChannels: recoveryChannels.length,
    totalTouches30d: recoveryChannels.reduce((acc, ch) => acc + ch.sentCount, 0),
    activeChannelsCount: recoveryChannels.filter(ch => ch.sentCount > 0).length,
    totalRecoveredAcrossChannels: recoveryChannels.reduce((acc, ch) => acc + ch.recoveredUsers, 0),
  };

  return {
    summary: {
      totalInactive72h: eligibleInactiveUsers.length,
      pendingToRescueCount,
      emailEligibleInactiveCount,
      emailIneligibleInactiveCount,
      pendingEmailSendCount,
      pendingEmailSkipCount,
      earlyCohortPendingCount,
      upcomingCount: upcomingUsers.length,
      upcomingEmailSendCount,
      emailAuthorizedTotal,
      totalSentCount,
      successSentCount,
      errorSentCount,
      emailSentCount,
      emailSkippedCount,
      emailErrorCount,
      recoveredCount,
      channelsSummary,
    },
    recoveryChannels,
    eligibleInactiveUsers,
    upcomingUsers,
    historyLogs: formattedLogs,
  };
};

/**
 * Envía el rescate personalizado a un usuario concreto y registra el log completo en RetentionRescueLog.
 */
export const dispatchRetentionRescueForUser = async (userItem, { triggerType = 'auto_cron' } = {}) => {
  let inAppStatus = 'error';
  let pushStatus = userItem.hasPushSubscription ? 'error' : 'no_subscription';
  let pushError = null;
  let emailStatus = userItem.email ? 'error' : 'skipped';
  let emailError = null;

  // 1. Enviar Notificación In-App + Push
  try {
    const delivery = await createNotification(userItem.id, {
      type: 'retention_rescue_72h',
      pushPurpose: 'training',
      title: userItem.previewTitle,
      message: userItem.previewMessage,
      data: {
        url: userItem.ctaUrl || '/routines',
        segment: userItem.segment,
      },
    });
    inAppStatus = delivery.inAppSaved ? 'success' : 'error';
    pushStatus = delivery.pushStatus;
    if (pushStatus === 'error') pushError = 'Error en el servicio de notificaciones';
  } catch (err) {
    pushStatus = 'error';
    pushError = err.message || 'Error en servicio de notificaciones';
  }

  // 2. Enviar Correo Personalizado
  if (userItem.email) {
    try {
      const emailResult = await sendRetentionRescueEmail({
        userId: userItem.id,
        email: userItem.email,
        userName: userItem.username,
        loadPayload: loadEmailRescuePayload
      });
      emailStatus = emailResult?.skipped ? 'skipped' : 'success';
    } catch (err) {
      emailStatus = 'error';
      emailError = err.message || 'Error SMTP al enviar correo de rescate';
    }
  }

  // 3. Calcular overall_status
  let overallStatus = 'success';
  if (emailStatus === 'error' && (pushStatus === 'error' || pushStatus === 'no_subscription')) {
    overallStatus = 'error';
  } else if (emailStatus === 'error' || pushStatus === 'error') {
    overallStatus = 'partial';
  }

  // 4. Registrar en RetentionRescueLog
  const createdLog = await db.RetentionRescueLog.create({
    user_id: userItem.id,
    segment: userItem.segment,
    inactive_hours: userItem.inactiveHours,
    title: userItem.previewTitle,
    message: userItem.previewMessage,
    context_label: userItem.contextLabel,
    in_app_status: inAppStatus,
    push_status: pushStatus,
    push_error: pushError,
    email_status: emailStatus,
    email_error: emailError,
    overall_status: overallStatus,
    trigger_type: triggerType,
    reference_activity_at: userItem.lastActivityAt ? new Date(userItem.lastActivityAt) : null,
    sent_at: new Date(),
  });

  return createdLog;
};

/**
 * Ejecuta un pase del detector de abandono (>=72h sin actividad).
 * - Si isManual === false (cron horario), respeta horario diurno local (11:00 a 20:00) y procesa hasta `limit` usuarios por lote.
 * - Si isManual === true (desde Admin Panel), envía inmediatamente hasta `limit` usuarios pendientes.
 */
export const runRetentionRescueBatch = async ({
  isManual = false,
  limit = 15,
  onlyEarlyCohort = false,
  specificUserId = null,
} = {}) => {
  const overview = await getRetentionRescueOverview();

  let candidates = overview.eligibleInactiveUsers;

  if (specificUserId) {
    candidates = candidates.filter(u => Number(u.id) === Number(specificUserId));
  } else {
    candidates = candidates.filter(u => u.canAutoSend);
    if (onlyEarlyCohort) {
      candidates = candidates.filter(u => u.isEarlyCohort);
    }
    if (!isManual) {
      // En modo automático por cron, enviar en horario diurno del usuario (entre 11:00 y 20:00)
      candidates = candidates.filter(u => {
        try {
          const tz = u.timezone || 'Europe/Madrid';
          const localHour = parseInt(
            new Date().toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: 'numeric' }),
            10
          );
          return localHour >= 11 && localHour <= 20;
        } catch {
          return true;
        }
      });
    }
  }

  const batch = candidates.slice(0, limit);
  const results = [];

  for (const candidate of batch) {
    const log = await dispatchRetentionRescueForUser(candidate, {
      triggerType: isManual ? 'manual_admin' : 'auto_cron',
    });
    results.push(log);
  }

  return {
    processedCount: results.length,
    remainingEligibleCount: Math.max(0, candidates.length - results.length),
    emailSentCount: results.filter(log => log.email_status === 'success').length,
    emailSkippedCount: results.filter(log => log.email_status === 'skipped').length,
    emailErrorCount: results.filter(log => log.email_status === 'error').length,
    pushSentCount: results.filter(log => log.push_status === 'success').length,
    results,
  };
};
