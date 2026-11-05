/* backend/services/retentionRescueService.js */
import { Op } from 'sequelize';
import db from '../models/index.js';
import { createNotification } from './notificationService.js';
import { sendRetentionRescueEmail } from './emailService.js';

const formatWeightKg = (val) => {
  const num = parseFloat(val);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Number.isInteger(num) ? String(num) : String(Math.round(num * 10) / 10);
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
      message: `¡Tu rutina ${rName} está lista! ¿Hacemos hoy aunque sea una versión rápida de 20 min?`,
      contextLabel: `Rutina lista: ${rName}`,
      ctaUrl: '/routines',
      ctaText: 'Empezar versión rápida (20 min)',
    };
  }

  // Caso 3: Registró nutrición pero aún no tiene rutina ni entreno
  if (nutritionCount >= 1) {
    return {
      segment: 'nutrition_only',
      title: '¡Acompaña tu nutrición con tu primer entreno!',
      message: 'Ya empezaste controlando tu nutrición. ¿Hacemos hoy aunque sea una sesión rápida de 20 min para activar tu progreso?',
      contextLabel: `Nutrición activa (${nutritionCount} reg.)`,
      ctaUrl: '/routines',
      ctaText: 'Crear mi rutina en 1 min',
    };
  }

  // Caso 4: Registrado sin rutina ni entrenamiento todavía
  return {
    segment: 'no_setup',
    title: '¡Tu plan de entrenamiento te espera!',
    message: '¿Estrenamos hoy tu progreso? Elige una plantilla en 1 toque y hacemos aunque sea una versión rápida de 20 min 💪.',
    contextLabel: 'Pendiente de primera rutina',
    ctaUrl: '/routines',
    ctaText: 'Elegir rutina rápida',
  };
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

  // 1. Cargar usuarios (excluyendo admins) con métricas agregadas
  const users = await db.User.findAll({
    where: {
      role: { [Op.ne]: 'admin' },
    },
    attributes: [
      'id',
      'username',
      'name',
      'email',
      'profile_image_url',
      'role',
      'timezone',
      'lastSeen',
      'last_activity_date',
      ['created_at', 'createdAt'],
      [
        db.sequelize.literal(`(
          SELECT COUNT(*)
          FROM routines
          WHERE routines.user_id = User.id
        )`),
        'routineCount',
      ],
      [
        db.sequelize.literal(`(
          SELECT name
          FROM routines
          WHERE routines.user_id = User.id
          ORDER BY id DESC
          LIMIT 1
        )`),
        'latestRoutineName',
      ],
      [
        db.sequelize.literal(`(
          SELECT COUNT(*)
          FROM workout_logs
          WHERE workout_logs.user_id = User.id
        )`),
        'workoutCount',
      ],
      [
        db.sequelize.literal(`(
          SELECT MAX(workout_date)
          FROM workout_logs
          WHERE workout_logs.user_id = User.id
        )`),
        'lastWorkoutDate',
      ],
      [
        db.sequelize.literal(`(
          SELECT routine_name
          FROM workout_logs
          WHERE workout_logs.user_id = User.id
          ORDER BY workout_date DESC, id DESC
          LIMIT 1
        )`),
        'lastWorkoutRoutineName',
      ],
      [
        db.sequelize.literal(`(
          SELECT COUNT(*)
          FROM nutrition_logs
          WHERE nutrition_logs.user_id = User.id
        )`),
        'nutritionCount',
      ],
      [
        db.sequelize.literal(`(
          SELECT MAX(log_date)
          FROM nutrition_logs
          WHERE nutrition_logs.user_id = User.id
        )`),
        'lastNutritionDate',
      ],
      [
        db.sequelize.literal(`(
          SELECT COUNT(*)
          FROM push_subscriptions
          WHERE push_subscriptions.user_id = User.id
        )`),
        'pushSubCount',
      ],
    ],
    order: [['created_at', 'DESC']],
  });

  // 2. Obtener mejor marca por usuario (PersonalRecords y WorkoutLogDetails)
  const [personalRecords, bestWorkoutDetails, rescueLogs] = await Promise.all([
    db.PersonalRecord.findAll({
      attributes: ['user_id', 'exercise_name', 'weight_kg', 'date'],
      order: [
        ['weight_kg', 'DESC'],
        ['date', 'DESC'],
      ],
    }),
    db.sequelize
      .query(
        `SELECT wl.user_id, wld.exercise_name, wld.best_set_weight
         FROM workout_log_details wld
         INNER JOIN workout_logs wl ON wl.id = wld.workout_log_id
         WHERE wld.best_set_weight > 0
         ORDER BY wl.workout_date DESC, wld.best_set_weight DESC`,
        { type: db.sequelize.QueryTypes.SELECT }
      )
      .catch(() => []),
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
  ]);

  const bestLiftByUser = new Map();
  for (const row of bestWorkoutDetails) {
    if (!bestLiftByUser.has(row.user_id) && row.exercise_name && parseFloat(row.best_set_weight) > 0) {
      bestLiftByUser.set(row.user_id, {
        exerciseName: row.exercise_name,
        weightKg: parseFloat(row.best_set_weight),
      });
    }
  }
  for (const pr of personalRecords) {
    const existing = bestLiftByUser.get(pr.user_id);
    const w = parseFloat(pr.weight_kg);
    if (pr.exercise_name && w > 0 && (!existing || w >= existing.weightKg)) {
      bestLiftByUser.set(pr.user_id, {
        exerciseName: pr.exercise_name,
        weightKg: w,
      });
    }
  }

  // Mapa del último rescate enviado por usuario
  const latestRescueByUser = new Map();
  for (const log of rescueLogs) {
    if (!latestRescueByUser.has(log.user_id)) {
      latestRescueByUser.set(log.user_id, log);
    }
  }

  const eligibleInactiveUsers = [];
  const upcomingUsers = [];
  const userLastActivityMap = new Map();

  for (const u of users) {
    const plain = u.get({ plain: true });
    const createdAt = plain.createdAt ? new Date(plain.createdAt) : new Date(nowMs - 7 * 86400000);
    const lastSeenDate = plain.lastSeen ? new Date(plain.lastSeen) : null;
    const lastWorkoutDate = plain.lastWorkoutDate ? new Date(plain.lastWorkoutDate) : null;
    const lastNutritionDate = plain.lastNutritionDate ? new Date(`${plain.lastNutritionDate}T20:00:00Z`) : null;

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
    userLastActivityMap.set(plain.id, lastOverallActivityAt);

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

    const routineCount = parseInt(plain.routineCount, 10) || 0;
    const workoutCount = parseInt(plain.workoutCount, 10) || 0;
    const nutritionCount = parseInt(plain.nutritionCount, 10) || 0;
    const pushSubCount = parseInt(plain.pushSubCount, 10) || 0;
    const bestLift = bestLiftByUser.get(plain.id) || null;

    const rescuePreview = buildPersonalizedRescuePayload({
      routineCount,
      latestRoutineName: plain.latestRoutineName,
      workoutCount,
      lastWorkoutRoutineName: plain.lastWorkoutRoutineName,
      bestExerciseName: bestLift?.exerciseName || null,
      bestWeightKg: bestLift?.weightKg || null,
      nutritionCount,
    });

    const lastRescue = latestRescueByUser.get(plain.id) || null;
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
      profile_image_url: plain.profile_image_url,
      timezone: plain.timezone || 'Europe/Madrid',
      createdAt: createdAt.toISOString(),
      accountAgeDays,
      isEarlyCohort,
      lastSeen: lastSeenDate ? lastSeenDate.toISOString() : null,
      lastWorkoutDate: lastWorkoutDate ? lastWorkoutDate.toISOString() : null,
      lastNutritionDate: plain.lastNutritionDate || null,
      lastActivityAt: lastOverallActivityAt.toISOString(),
      inactiveHours: Math.round(effectiveInactiveHours),
      inactiveDays: Math.floor(effectiveInactiveHours / 24),
      routineCount,
      latestRoutineName: plain.latestRoutineName || null,
      workoutCount,
      lastWorkoutRoutineName: plain.lastWorkoutRoutineName || null,
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
      eligibleInactiveUsers.push(userItem);
    } else if (effectiveInactiveHours >= 12 && effectiveInactiveHours < 72 && !alreadyRescuedInCurrentCycle) {
      const hoursRemaining = Math.max(1, Math.ceil(72 - effectiveInactiveHours));
      const eligibleAtDate = new Date(nowMs + hoursRemaining * 3600000);
      upcomingUsers.push({
        ...userItem,
        hoursRemaining,
        progressPercent: Math.min(99, Math.max(5, Math.round((effectiveInactiveHours / 72) * 100))),
        eligibleAt: eligibleAtDate.toISOString(),
      });
    }
  }

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
  const earlyCohortPendingCount = eligibleInactiveUsers.filter(
    u => !u.alreadyRescuedInCurrentCycle && u.isEarlyCohort
  ).length;
  const totalSentCount = formattedLogs.length;
  const successSentCount = formattedLogs.filter(l => l.overall_status === 'success').length;
  const errorSentCount = formattedLogs.filter(
    l => l.overall_status === 'error' || l.email_status === 'error' || l.push_status === 'error'
  ).length;
  const recoveredCount = formattedLogs.filter(l => l.recovered).length;

  return {
    summary: {
      totalInactive72h: eligibleInactiveUsers.length,
      pendingToRescueCount,
      earlyCohortPendingCount,
      upcomingCount: upcomingUsers.length,
      totalSentCount,
      successSentCount,
      errorSentCount,
      recoveredCount,
    },
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

  const sentStartTime = new Date();

  // 1. Enviar Notificación In-App + Push
  try {
    await createNotification(userItem.id, {
      type: 'retention_rescue_72h',
      title: userItem.previewTitle,
      message: userItem.previewMessage,
      data: {
        url: userItem.ctaUrl || '/routines',
        segment: userItem.segment,
      },
    });
    inAppStatus = 'success';

    if (userItem.hasPushSubscription && db.PushDeliveryLog) {
      const recentPushLogs = await db.PushDeliveryLog.findAll({
        where: {
          user_id: userItem.id,
          title: userItem.previewTitle,
          created_at: { [Op.gte]: new Date(sentStartTime.getTime() - 15000) },
        },
        order: [['created_at', 'DESC']],
      });

      const anySuccess = recentPushLogs.some(l => l.status === 'success');
      const failedLog = recentPushLogs.find(l => l.status === 'error');

      if (anySuccess) {
        pushStatus = 'success';
      } else if (failedLog) {
        pushStatus = 'error';
        pushError = failedLog.error_message || 'Error entregando notificación push';
      } else {
        pushStatus = 'no_subscription';
      }
    }
  } catch (err) {
    pushStatus = 'error';
    pushError = err.message || 'Error en servicio de notificaciones';
  }

  // 2. Enviar Correo Personalizado
  if (userItem.email) {
    try {
      await sendRetentionRescueEmail(userItem.email, userItem.username, {
        title: userItem.previewTitle,
        message: userItem.previewMessage,
        contextLabel: userItem.contextLabel,
        ctaUrl: userItem.ctaUrl || '/routines',
        ctaText: userItem.ctaText || 'Ir a mi entrenamiento',
      });
      emailStatus = 'success';
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
    results,
  };
};
