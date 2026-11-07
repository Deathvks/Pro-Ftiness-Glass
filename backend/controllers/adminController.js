/* backend/controllers/adminController.js */
import { Op } from 'sequelize';
import { Resolver } from 'node:dns/promises';
import db from '../models/index.js';
import { createNotification, hasFirebasePush } from '../services/notificationService.js';
import os from 'os';
import fs from 'node:fs';
import { processUploadedFile } from '../services/uploadService.js';
import { deleteFile } from '../services/imageService.js';
import { canSendOptionalEmail, sendDomainMailboxTest, sendEmailPreferenceTest } from '../services/emailService.js';
import { isDomainSmtpConfigured } from '../config/mailContacts.js';
import { PUSH_PURPOSES } from '../config/pushConsent.js';
import { isSupportedPushEndpoint } from '../services/pushService.js';
import {
  getRetentionRescueOverview,
  runRetentionRescueBatch,
} from '../services/retentionRescueService.js';

const User = db.User;
const SystemSettings = db.SystemSettings;

// Obtener configuración del sistema
export const getAllUsers = async (req, res, next) => {
  try {
    const [
      users,
      referralCounts,
      sessionDevices,
      routineCounts,
      workoutCounts,
      nutritionCounts,
    ] = await Promise.all([
      User.findAll({
        attributes: [
          'id',
          'name',
          'email',
          'role',
          'is_verified',
          'username',
          'profile_image_url',
          'lastSeen',
          'level',
          'xp',
          'goal',
          'height',
          'age',
          'google_id',
          'discord_id',
          'x_id',
          'github_id',
          'spotify_id',
          'facebook_id',
          ['created_at', 'createdAt'],
        ],
        order: [['created_at', 'DESC']],
        raw: true,
      }),
      db.sequelize
        .query(
          'SELECT referred_by AS user_id, COUNT(*) AS cnt FROM users WHERE referred_by IS NOT NULL GROUP BY referred_by',
          { type: db.sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
      db.sequelize
        .query(
          'SELECT user_id, device_type FROM user_sessions ORDER BY last_active DESC',
          { type: db.sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
      db.sequelize
        .query('SELECT user_id, COUNT(*) AS cnt FROM routines GROUP BY user_id', {
          type: db.sequelize.QueryTypes.SELECT,
        })
        .catch(() => []),
      db.sequelize
        .query('SELECT user_id, COUNT(*) AS cnt FROM workout_logs GROUP BY user_id', {
          type: db.sequelize.QueryTypes.SELECT,
        })
        .catch(() => []),
      db.sequelize
        .query('SELECT user_id, COUNT(*) AS cnt FROM nutrition_logs GROUP BY user_id', {
          type: db.sequelize.QueryTypes.SELECT,
        })
        .catch(() => []),
    ]);

    const refMap = new Map(referralCounts.map(r => [Number(r.user_id), parseInt(r.cnt, 10) || 0]));
    const devMap = new Map();
    for (const s of sessionDevices) {
      const uid = Number(s.user_id);
      if (!devMap.has(uid) && s.device_type) devMap.set(uid, s.device_type);
    }
    const rMap = new Map(routineCounts.map(r => [Number(r.user_id), parseInt(r.cnt, 10) || 0]));
    const wMap = new Map(workoutCounts.map(w => [Number(w.user_id), parseInt(w.cnt, 10) || 0]));
    const nMap = new Map(nutritionCounts.map(n => [Number(n.user_id), parseInt(n.cnt, 10) || 0]));

    const enrichedUsers = users.map(u => {
      const uid = Number(u.id);
      return {
        ...u,
        referralCount: refMap.get(uid) || 0,
        latest_device: devMap.get(uid) || null,
        routineCount: rMap.get(uid) || 0,
        workoutCount: wMap.get(uid) || 0,
        nutritionCount: nMap.get(uid) || 0,
      };
    });

    res.json(enrichedUsers);
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo usuario
export const createUser = async (req, res, next) => {
  let { username, name, email, password, role, is_verified } = req.body;

  // Compatibilidad: si envían name pero no username, usamos name
  if (!username && name) username = name;

  try {
    // Validamos duplicados solo si tenemos datos para comparar
    const checks = [];
    if (email) checks.push({ email });
    if (username) checks.push({ username });

    if (checks.length > 0) {
      const existingUser = await User.findOne({
        where: { [Op.or]: checks }
      });

      if (existingUser) {
        if (email && existingUser.email === email) return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
        if (username && existingUser.username === username) return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
      }
    }

    const newUser = await User.create({
      username,
      name: username, // Mantenemos name y username sincronizados
      email,
      password_hash: password,
      role: role || 'user',
      is_verified: is_verified || false,
    });

    // Sequelize puebla automáticamente los campos virtuales/mapeados tras crear
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      is_verified: newUser.is_verified,
      profile_image_url: newUser.profile_image_url,
      lastSeen: newUser.lastSeen,
      createdAt: newUser.createdAt || newUser.getDataValue('created_at')
    });
  } catch (error) {
    console.error('ERROR MYSQL EXACTO (createUser):', error.parent ? error.parent.sqlMessage : error.message);
    next(error);
  }
};

// Actualizar un usuario
export const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  let { username, name, email, role, is_verified, password, level } = req.body;

  // Compatibilidad: si envían name pero no username, usamos name
  if (!username && name) username = name;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Construcción dinámica de validación de duplicados
    const checks = [];
    if (email) checks.push({ email });
    if (username) checks.push({ username });

    if (checks.length > 0) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: checks,
          id: { [Op.ne]: userId } // Excluir al propio usuario
        }
      });

      if (existingUser) {
        if (email && existingUser.email === email) return res.status(409).json({ message: 'El email ya está en uso.' });
        if (username && existingUser.username === username) return res.status(409).json({ message: 'El usuario ya está en uso.' });
      }
    }

    const updateData = {};
    if (username) {
      updateData.username = username;
      updateData.name = username;
    }
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    // Verificamos explícitamente undefined porque es un booleano
    if (typeof is_verified !== 'undefined') updateData.is_verified = is_verified;

    if (password) updateData.password_hash = password;

    if (level !== undefined && !isNaN(parseInt(level))) {
      const newLevel = Math.max(1, parseInt(level));
      updateData.level = newLevel;
      // Fórmula de XP: 50 * level^2 + 350 * level - 400 (Nivel 1 = 0 XP)
      updateData.xp = newLevel <= 1 ? 0 : 50 * Math.pow(newLevel, 2) + 350 * newLevel - 400;
    }

    await user.update(updateData);

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      level: user.level,
      xp: user.xp,
      profile_image_url: user.profile_image_url,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt || user.getDataValue('created_at')
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Si el usuario tenía clientes asignados, desvincularlos
    await User.update({ trainer_id: null }, { where: { trainer_id: userId } });

    await user.destroy();
    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// Actualizar o eliminar la foto de perfil de un entrenador (restringido a entrenadores)
export const updateTrainerProfileImage = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      if (req.file) {
        try {
          await deleteFile(req.file.path);
        } catch (e) {
          // ignorar
        }
      }
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Restriccion estricta: UNICAMENTE para usuarios con rol de entrenador
    if (user.role !== 'trainer' && user.role !== 'entrenador') {
      if (req.file) {
        try {
          await deleteFile(req.file.path);
        } catch (e) {
          // ignorar
        }
      }
      return res.status(403).json({ error: 'Solo se puede asignar o modificar la foto de perfil a entrenadores.' });
    }

    let newImagePath = null;
    if (req.file) {
      try {
        const processed = await processUploadedFile(req.file);
        newImagePath = processed.url;
      } catch (uploadError) {
        return res.status(400).json({ error: 'Error procesando la imagen: ' + uploadError.message });
      }
    } else if (req.body.removeImage === 'true' || req.body.removeImage === true || req.method === 'DELETE') {
      newImagePath = null;
    } else {
      return res.status(400).json({ error: 'No se envio ninguna imagen.' });
    }

    const oldImageUrl = user.profile_image_url;
    await user.update({ profile_image_url: newImagePath });

    if (oldImageUrl && oldImageUrl !== newImagePath) {
      try {
        await deleteFile(oldImageUrl);
      } catch (e) {
        console.warn('Error al eliminar imagen anterior del entrenador:', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: newImagePath ? 'Foto de perfil del entrenador actualizada correctamente' : 'Foto de perfil eliminada',
      profile_image_url: newImagePath,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_image_url: newImagePath
      }
    });
  } catch (error) {
    if (req.file) {
      try {
        await deleteFile(req.file.path);
      } catch (e) {
        // ignorar
      }
    }
    next(error);
  }
};

// Obtener un ajuste del sistema por su clave
export const getSetting = async (req, res, next) => {
  const { key } = req.params;
  try {
    const setting = await SystemSettings.findByPk(key);
    if (!setting) {
      return res.status(200).json({ value: null });
    }
    res.status(200).json({ value: setting.value });
  } catch (error) {
    next(error);
  }
};

// Actualizar un ajuste del sistema
export const updateSetting = async (req, res, next) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    const [setting, created] = await SystemSettings.upsert({
      key,
      value
    });
    res.status(200).json({ key, value });
  } catch (error) {
    next(error);
  }
};

const emailTestLabels = { training: 'entrenamiento', activity: 'actividad', coaching: 'asesoría' };
const notificationReviewChecks = ['registration', 'recovery', 'twoFactor', 'inboxes', 'emailOptOut', 'browser', 'android', 'donDominio', 'firebase', 'activityBasis', 'emailRetention'];

export const getNotificationTestStatus = async (req, res, next) => {
  const resolver = new Resolver({ timeout: 2000, tries: 1 });
  const domain = 'profitnessglass.es';
  const checkDns = async (query, matches) => {
    try { return matches(await query); }
    catch (error) { return ['ENODATA', 'ENOTFOUND'].includes(error.code) ? false : null; }
  };
  try {
    const [mx, spf, dkim, dmarc] = await Promise.all([
      checkDns(resolver.resolveMx(domain), rows => rows.some(row => row.exchange.toLowerCase().replace(/\.$/, '') === 'mx01.dondominio.com')),
      checkDns(resolver.resolveTxt(domain), rows => rows.some(row => /^v=spf1\s.*include:spf\.dondominio\.com(?:\s|$)/i.test(row.join('')))),
      checkDns(resolver.resolveTxt(`dddk._domainkey.${domain}`), rows => rows.some(row => /^v=DKIM1;.*\bp=[^;\s]+/i.test(row.join('')))),
      checkDns(resolver.resolveTxt(`_dmarc.${domain}`), rows => rows.some(row => /^v=DMARC1;/i.test(row.join(''))))
    ]);
    return res.set('Cache-Control', 'no-store').json({
      mx, spf, dkim, dmarc,
      smtp: isDomainSmtpConfigured,
      frontendUrl: process.env.FRONTEND_URL?.replace(/\/+$/, '') === 'https://profitnessglass.es',
      webPush: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT),
      androidPush: hasFirebasePush()
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationReview = async (req, res, next) => {
  try {
    const keys = notificationReviewChecks.map(check => `notification_review_${check}`);
    const rows = await SystemSettings.findAll({ where: { key: { [Op.in]: keys } } });
    return res.set('Cache-Control', 'no-store').json(Object.fromEntries(rows.filter(row => row.value).map(row => [
      row.key.replace('notification_review_', ''), JSON.parse(row.value)
    ])));
  } catch (error) {
    next(error);
  }
};

export const updateNotificationReview = async (req, res, next) => {
  const { check, reviewed } = req.body ?? {};
  if (!notificationReviewChecks.includes(check) || typeof reviewed !== 'boolean') {
    return res.status(400).json({ error: 'Comprobación no válida.' });
  }
  try {
    const entry = reviewed ? { reviewedAt: new Date().toISOString(), reviewerId: req.user.userId } : null;
    await SystemSettings.upsert({ key: `notification_review_${check}`, value: entry ? JSON.stringify(entry) : null });
    return res.json({ check, entry });
  } catch (error) {
    next(error);
  }
};

const getEmailTestAccount = userId => User.findOne({
  where: { id: userId, role: 'admin' },
  attributes: ['id', 'email', 'is_verified', 'email_activity_notifications', 'email_marketing_consent', 'email_coaching_consent']
});

export const getEmailUnsubscribeTestStatus = async (req, res, next) => {
  try {
    const user = await getEmailTestAccount(req.user.userId);
    if (!user) return res.status(403).json({ error: 'Se requiere una cuenta de administrador activa.' });

    const verified = Boolean(user.is_verified && user.email && !/@(?:x-auth\.local|profitnessglass\.internal)$/i.test(user.email));
    const [training, activity, coaching] = await Promise.all(
      ['training', 'activity', 'coaching'].map(category => canSendOptionalEmail(user, category))
    );
    return res.set('Cache-Control', 'no-store').json({
      email: user.email,
      verified,
      training, activity, coaching
    });
  } catch (error) {
    next(error);
  }
};

export const sendEmailUnsubscribeTest = async (req, res, next) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'La solicitud debe enviarse desde el panel de administración.' });
  }

  const { category = 'training', checkOnly = false } = req.body ?? {};
  if (typeof category !== 'string' || !Object.hasOwn(emailTestLabels, category) || typeof checkOnly !== 'boolean') {
    return res.status(400).json({ error: 'Categoría o modo de prueba de correo no válidos.' });
  }
  try {
    const user = await getEmailTestAccount(req.user.userId);
    if (!user) return res.status(403).json({ error: 'Se requiere una cuenta de administrador activa.' });
    if (!user.is_verified || !user.email || /@(?:x-auth\.local|profitnessglass\.internal)$/i.test(user.email)) {
      return res.status(409).json({ error: 'Necesitas una dirección de correo verificada en tu cuenta.' });
    }

    if (checkOnly === true) {
      return res.json({ email: user.email, checkedOnly: true, skipped: !(await canSendOptionalEmail(user, category)) });
    }

    const result = await sendEmailPreferenceTest({ userId: user.id, email: user.email, category, label: emailTestLabels[category] });
    if (result?.skipped) {
      return res.json({ email: user.email, skipped: true });
    }
    if (!result?.accepted?.length) {
      return res.status(502).json({ error: 'El servidor de correo no confirmó la aceptación del mensaje.' });
    }

    return res.json({ email: user.email });
  } catch (error) {
    next(error);
  }
};

export const sendPushDeviceTest = async (req, res, next) => {
  const { endpoint, purpose = 'service' } = req.body ?? {};
  if (!req.is('application/json') || !isSupportedPushEndpoint(endpoint) || !['service', ...PUSH_PURPOSES].includes(purpose)) {
    return res.status(400).json({ error: 'Dispositivo o categoría de prueba no válidos.' });
  }
  try {
    const user = await getEmailTestAccount(req.user.userId);
    if (!user) return res.sendStatus(403);
    const device = await db.PushSubscription.findOne({ where: { user_id: user.id, endpoint }, attributes: ['id'] });
    if (!device) return res.json({ inAppSaved: false, pushStatus: 'no_subscription' });

    const result = await createNotification(user.id, {
      type: 'notification_test',
      title: 'Prueba de notificaciones push',
      message: 'Prueba solicitada desde el panel de administración para este dispositivo.',
      pushPurpose: purpose
    }, { endpoint });
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

export const sendEmailMailboxTest = async (req, res, next) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'La solicitud debe enviarse desde el panel de administración.' });
  }
  if (!isDomainSmtpConfigured) {
    return res.status(409).json({ error: 'Configura el SMTP de notificaciones@profitnessglass.es en el backend antes de enviar la prueba.' });
  }

  try {
    return res.json({ results: await sendDomainMailboxTest() });
  } catch (error) {
    next(error);
  }
};

export const getEmailLogs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50, range = 30 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status && status !== 'all') whereClause.status = status;
    
    if (range) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(range, 10));
      whereClause.sent_at = { [Op.gte]: date };
    }

    const { count, rows } = await db.EmailDeliveryLog.findAndCountAll({
      where: whereClause,
      order: [['sent_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      logs: rows
    });
  } catch (error) {
    next(error);
  }
};

export const getEmailStats = async (req, res, next) => {
  try {
    const { range = 30 } = req.query;
    const date = new Date();
    date.setDate(date.getDate() - parseInt(range, 10));
    const whereClause = { sent_at: { [Op.gte]: date } };

    const total = await db.EmailDeliveryLog.count({ where: whereClause });
    const success = await db.EmailDeliveryLog.count({ where: { ...whereClause, status: 'sent' } });
    const failed = await db.EmailDeliveryLog.count({ where: { ...whereClause, status: 'failed' } });

    res.json({
      total,
      success,
      failed,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0
    });
  } catch (error) {
    next(error);
  }
};

export const getPushLogs = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 50, range = 30 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status && status !== 'all') whereClause.status = status;
    if (type && type !== 'all') whereClause.type = type;
    if (req.query.title) whereClause.title = req.query.title;
    
    if (range) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(range, 10));
      whereClause.created_at = { [Op.gte]: date };
    }

    const logs = await db.PushDeliveryLog.findAndCountAll({
      where: whereClause,
      include: [{ model: db.User, attributes: ['username', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      logs: logs.rows,
      totalPages: Math.ceil(logs.count / limit),
      currentPage: parseInt(page, 10)
    });
  } catch (error) {
    next(error);
  }
};

// Enviar notificación manual
export const sendCustomPush = async (req, res, next) => {
  try {
    const { title, message, url, target_user_id } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Título y mensaje son requeridos.' });
    }

    if (target_user_id === 'ALL') {
      const users = await db.User.findAll({ attributes: ['id'] });
      // Responder inmediatamente para no bloquear
      res.json({ message: `Publicando el aviso para ${users.length} usuarios. El push se enviará a quienes hayan activado las novedades.` });
      
      for (const user of users) {
        await createNotification(user.id, { type: 'info', title, message, data: url ? { url } : null, pushPurpose: 'news' });
      }
    } else {
      await createNotification(target_user_id, { type: 'info', title, message, data: url ? { url } : null, pushPurpose: 'news' });
      res.json({ message: 'Aviso publicado. El push requiere que el usuario haya activado las novedades.' });
    }
  } catch (error) {
    next(error);
  }
};

// Obtener tareas cron (mock estático para info)
export const getCronJobs = async (req, res, next) => {
  try {
    const cronJobs = [
      {
        id: 1,
        name: 'Nutrición (Recordatorio Macros)',
        schedule: '20:00 (Hora Local)',
        frequency: 'Cada Día',
        pushTitle: '¡No olvides tus metas!',
        description: 'Verifica si el usuario ha cumplido sus macros. Si no, envía recordatorio.',
        status: 'active'
      },
      {
        id: 2,
        name: 'Creatina (Recordatorio Diario)',
        schedule: '10:00 (Hora Local)',
        frequency: 'Cada Día',
        pushTitle: '💊 Tu creatina',
        description: 'Recuerda a los usuarios tomar creatina si aún no la han registrado hoy.',
        status: 'active'
      },
      {
        id: 3,
        name: 'Entrenamiento (Recordatorio)',
        schedule: '10:00 (Hora Local)',
        frequency: 'Cada Día',
        pushTitle: '¡Es hora de moverse!',
        description: 'Recuerda a los usuarios entrenar si tienen rutina asignada y no lo han hecho.',
        status: 'active'
      },
      {
        id: 4,
        name: 'Pesaje Mensual',
        schedule: 'Día 1 de cada mes a las 09:00',
        frequency: 'Una vez al mes',
        pushTitle: 'Registro de Progreso Mensual',
        description: 'Recuerda a los usuarios registrar su peso si han pasado más de 30 días.',
        status: 'active'
      },
      {
        id: 5,
        name: 'Streak Wars (Racha en peligro)',
        schedule: '20:00 (Hora Local)',
        frequency: 'Cada Día',
        pushTitle: '🔥 ¡Racha en peligro!',
        description: 'Avisa a los amigos si un usuario está a punto de perder su racha de entrenamiento.',
        status: 'active'
      }
    ];

    const enrichedCronJobs = await Promise.all(cronJobs.map(async (job) => {
      const lastLog = await db.PushDeliveryLog.findOne({
        where: { title: job.pushTitle },
        order: [['created_at', 'DESC']]
      });
      return {
        ...job,
        lastRunAt: lastLog ? lastLog.created_at : null,
        lastRunStatus: lastLog ? lastLog.status : null
      };
    }));

    res.json(enrichedCronJobs);
  } catch (error) {
    next(error);
  }
};

// Testear cuántos usuarios recibirían una tarea cron (ignorando la restricción de hora/día)
export const testCronJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    let simulateCount = 0;
    let message = "";

    const allUsers = await db.User.findAll({ attributes: ['id', 'timezone', 'streak', 'last_activity_date'] });
    
    const getLocalTime = (timezone) => {
      try {
        const tz = timezone || 'Europe/Madrid';
        const date = new Date().toLocaleDateString('sv-SE', { timeZone: tz });
        return { date };
      } catch (e) {
        return { date: new Date().toISOString().split('T')[0] };
      }
    };

    if (id === '1') {
      // Nutrición: ¿Quiénes no han llegado al 80% de macros hoy?
      for (const user of allUsers) {
        const { date } = getLocalTime(user.timezone);
        const goal = await db.NutritionGoal.findOne({ where: { user_id: user.id } });
        if (!goal) continue;
        const totalIntake = await db.NutritionLog.sum('calories', { where: { user_id: user.id, log_date: date } }) || 0;
        if (totalIntake < (goal.calories_target * 0.8)) simulateCount++;
      }
      message = `Test: IGNORANDO LA HORA.\nHay ${simulateCount} usuario(s) que NO han llegado al 80% de sus macros hoy. Recibirían la alerta cuando sean sus 20:00.`;
    
    } else if (id === '2') {
      // Creatina: ¿Quiénes toman creatina y no la han registrado hoy?
      const creatineUsers = await db.CreatinaLog.findAll({ attributes: ['user_id'], group: ['user_id'] });
      const creatineUserIds = creatineUsers.map(u => u.user_id);
      
      const targetUsers = allUsers.filter(u => creatineUserIds.includes(u.id));
      for (const user of targetUsers) {
        const { date } = getLocalTime(user.timezone);
        const logged = await db.CreatinaLog.findOne({ where: { user_id: user.id, log_date: date } });
        if (!logged) simulateCount++;
      }
      message = `Test: IGNORANDO LA HORA.\nHay ${simulateCount} usuario(s) que toman creatina y NO la han registrado hoy. Recibirían el push a las 10:00.`;
    
    } else if (id === '3') {
      // Entrenamiento: ¿Quiénes no han entrenado hoy?
      for (const user of allUsers) {
        const { date } = getLocalTime(user.timezone);
        const workoutLog = await db.WorkoutLog.findOne({ where: { user_id: user.id, date } });
        if (!workoutLog) simulateCount++; 
      }
      message = `Test: IGNORANDO LA HORA.\nHay ${simulateCount} usuario(s) en total que NO han entrenado hoy. Recibirían la motivación a las 10:00.`;
    
    } else if (id === '4') {
      // Pesaje Mensual: ¿A quiénes hace >30 días que no se pesan?
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      for (const user of allUsers) {
        const lastLog = await db.BodyWeightLog.findOne({ where: { user_id: user.id }, order: [['log_date', 'DESC']] });
        if (!lastLog || new Date(lastLog.log_date) < thirtyDaysAgo) simulateCount++;
      }
      message = `Test: IGNORANDO EL DÍA 1.\nHay ${simulateCount} usuario(s) que NO han registrado su peso en los últimos 30 días. Serán avisados el día 1 del mes.`;
    
    } else if (id === '5') {
      // Streak Wars: ¿Quién está en peligro de perder la racha (hoy no ha entrenado)?
      const targetUsers = allUsers.filter(user => {
        if (!user.streak || !user.last_activity_date) return false;
        const { date } = getLocalTime(user.timezone);
        const lastActiveDate = new Date(user.last_activity_date).toISOString().split('T')[0];
        return lastActiveDate < date; // Su última actividad fue ayer o antes, y hoy no ha entrenado.
      });
      for (const dangerUser of targetUsers) {
        simulateCount++;
      }
      message = `Test: IGNORANDO LA HORA.\nHay ${simulateCount} usuario(s) con racha activa que aún no han entrenado hoy (racha en peligro).`;      } else {
        message = "Esta tarea no tiene test implementado o es un mantenimiento automático interno.";
      }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

export const resetMilestoneBadges = async (req, res, next) => {
    try {
        await db.sequelize.query("UPDATE Users SET unlocked_badges = '[]' WHERE unlocked_badges IS NOT NULL");
        res.json({ success: true, message: 'Animaciones de nivel reseteadas para todos los usuarios.' });
    } catch (error) {
        next(error);
    }
};

// Liberador manual de memoria RAM
export const freeMemory = async (req, res, next) => {
  try {
    const memoryBefore = process.memoryUsage();
    if (global.gc) {
      global.gc();
      const memoryAfter = process.memoryUsage();
      const freed = (memoryBefore.heapUsed - memoryAfter.heapUsed) / 1024 / 1024;
      
      const totalSysMem = os.totalmem();
      const freeSysMem = os.freemem();

      return res.json({ 
        success: true, 
        message: `Memoria liberada exitosamente. Se liberaron ${freed.toFixed(2)} MB.`,
        beforeMB: (memoryBefore.heapUsed / 1024 / 1024).toFixed(2),
        afterMB: (memoryAfter.heapUsed / 1024 / 1024).toFixed(2),
        stats: {
          ram: {
            rss: Math.round(memoryAfter.rss / 1024 / 1024),
            heapTotal: Math.round(memoryAfter.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memoryAfter.heapUsed / 1024 / 1024),
          },
          system: {
            total: Math.round(totalSysMem / 1024 / 1024),
            free: Math.round(freeSysMem / 1024 / 1024),
          }
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'El recolector de basura (GC) no está expuesto en Node.js.' });
    }
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (req, res, next) => {
  try {
    const memUsage = process.memoryUsage();
    const totalSysMem = os.totalmem();
    const freeSysMem = os.freemem();

    return res.json({
      success: true,
      stats: {
        ram: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        },
        system: {
          total: Math.round(totalSysMem / 1024 / 1024),
          free: Math.round(freeSysMem / 1024 / 1024),
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Monitor integral de recursos del servidor (CPU, RAM, Swap, Disco, Uptime, MySQL, PM2)
export const getServerResources = async (req, res, next) => {
  try {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // Muestreo rápido de uso de CPU (100ms)
    const getCpuTimes = () => {
      let idle = 0;
      let total = 0;
      for (const cpu of os.cpus()) {
        for (const [type, time] of Object.entries(cpu.times)) {
          total += time;
          if (type === 'idle') idle += time;
        }
      }
      return { idle, total };
    };

    const first = getCpuTimes();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const second = getCpuTimes();
    const idleDiff = second.idle - first.idle;
    const totalDiff = second.total - first.total;
    const cpuUsagePercent = totalDiff > 0
      ? Math.min(100, Math.max(0, Math.round((1 - idleDiff / totalDiff) * 100)))
      : 0;

    // Memoria RAM y Swap
    let memTotal = os.totalmem();
    let memFree = os.freemem();
    let memAvailable = memFree;
    let swapTotal = 0;
    let swapFree = 0;

    try {
      if (fs.existsSync('/proc/meminfo')) {
        const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
        const getVal = (key) => {
          const m = meminfo.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'));
          return m ? parseInt(m[1], 10) * 1024 : 0;
        };
        memTotal = getVal('MemTotal') || memTotal;
        memFree = getVal('MemFree') || memFree;
        memAvailable = getVal('MemAvailable') || memFree;
        swapTotal = getVal('SwapTotal');
        swapFree = getVal('SwapFree');
      }
    } catch (_) {}

    const memUsed = Math.max(0, memTotal - memAvailable);
    const memPercent = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0;
    const swapUsed = Math.max(0, swapTotal - swapFree);
    const swapPercent = swapTotal > 0 ? Math.round((swapUsed / swapTotal) * 100) : 0;

    // Disco NVMe
    let diskTotal = 0;
    let diskFree = 0;
    let diskUsed = 0;
    let diskPercent = 0;
    try {
      if (typeof fs.statfsSync === 'function') {
        const stat = fs.statfsSync('/');
        diskTotal = stat.bsize * stat.blocks;
        diskFree = stat.bsize * stat.bavail;
        diskUsed = Math.max(0, diskTotal - diskFree);
        diskPercent = diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 100) : 0;
      }
    } catch (_) {}

    // Proceso Node
    const procMem = process.memoryUsage();

    // Estado y latencia de MySQL
    let dbStatus = 'online';
    let dbLatencyMs = 0;
    try {
      const dbStart = Date.now();
      await db.sequelize.authenticate();
      dbLatencyMs = Date.now() - dbStart;
    } catch (_) {
      dbStatus = 'error';
      dbLatencyMs = -1;
    }

    return res.json({
      success: true,
      timestamp: Date.now(),
      server: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        uptimeSeconds: Math.round(os.uptime()),
        loadAvg: loadAvg.map((l) => parseFloat(l.toFixed(2))),
        cpu: {
          model: cpus[0]?.model || 'vCPU',
          cores: cpus.length,
          usagePercent: cpuUsagePercent,
        },
        ram: {
          totalMB: Math.round(memTotal / 1024 / 1024),
          usedMB: Math.round(memUsed / 1024 / 1024),
          freeMB: Math.round(memAvailable / 1024 / 1024),
          usagePercent: memPercent,
        },
        swap: {
          totalMB: Math.round(swapTotal / 1024 / 1024),
          usedMB: Math.round(swapUsed / 1024 / 1024),
          freeMB: Math.round(swapFree / 1024 / 1024),
          usagePercent: swapPercent,
        },
        disk: {
          totalGB: (diskTotal / (1024 ** 3)).toFixed(1),
          usedGB: (diskUsed / (1024 ** 3)).toFixed(1),
          freeGB: (diskFree / (1024 ** 3)).toFixed(1),
          usagePercent: diskPercent,
        },
      },
      process: {
        pid: process.pid,
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        heapUsedMB: Math.round(procMem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(procMem.heapTotal / 1024 / 1024),
        rssMB: Math.round(procMem.rss / 1024 / 1024),
        gcAvailable: typeof global.gc === 'function',
      },
      database: {
        dialect: 'mysql',
        status: dbStatus,
        latencyMs: dbLatencyMs,
        name: db.sequelize?.config?.database || 'pro_fitness_glass',
      },
    });
  } catch (error) {
    next(error);
  }
};



export const getUploadLogs = async (req, res, next) => {
  try {
    const logs = await db.UploadLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching upload logs:', error);
    next(error);
  }
};




// --- RETENCIÓN TEMPRANA Y RESCATE +72H ---
export const getRetentionRescueDashboard = async (req, res, next) => {
  try {
    const data = await getRetentionRescueOverview();
    res.json(data);
  } catch (error) {
    console.error('Error en getRetentionRescueDashboard:', error);
    next(error);
  }
};

export const triggerRetentionRescue = async (req, res, next) => {
  try {
    const { userId, limit = 15, onlyEarlyCohort = false } = req.body || {};
    const batchResult = await runRetentionRescueBatch({
      isManual: true,
      specificUserId: userId || null,
      limit: Math.min(50, Math.max(1, parseInt(limit, 10) || 15)),
      onlyEarlyCohort: Boolean(onlyEarlyCohort),
    });
    const updatedOverview = await getRetentionRescueOverview();
    res.json({
      success: true,
      processedCount: batchResult.processedCount,
      remainingEligibleCount: batchResult.remainingEligibleCount,
      overview: updatedOverview,
    });
  } catch (error) {
    console.error('Error en triggerRetentionRescue:', error);
    next(error);
  }
};
