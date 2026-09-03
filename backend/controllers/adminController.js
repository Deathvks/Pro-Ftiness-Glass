/* backend/controllers/adminController.js */
import { Op } from 'sequelize';
import db from '../models/index.js';
import { createNotification } from '../services/notificationService.js';

const User = db.User;
const SystemSettings = db.SystemSettings;

// Obtener configuración del sistema
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
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
        // NUEVO: Añadimos los IDs sociales para que el frontend sepa el método de inicio de sesión
        'google_id',
        'discord_id',
        'x_id',
        'github_id',
        'spotify_id',
        'facebook_id',
        // CORRECCIÓN CRÍTICA: Mapeo explícito de la columna de base de datos al atributo
        ['created_at', 'createdAt'],
        // NUEVO: Subconsulta para contar las invitaciones
        [
          db.sequelize.literal(`(
            SELECT COUNT(*)
            FROM users AS referral
            WHERE referral.referred_by = User.id
          )`),
          'referralCount'
        ]
      ],
      // Ordenamos usando el nombre real de la columna en la base de datos
      order: [['created_at', 'DESC']],
    });
    res.json(users);
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

// Obtener logs de notificaciones push
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
      res.json({ message: `Enviando notificación a ${users.length} usuarios.` });
      
      for (const user of users) {
        await createNotification(user.id, { type: 'info', title, message, data: { url: url || '/' } });
      }
    } else {
      await createNotification(target_user_id, { type: 'info', title, message, data: { url: url || '/' } });
      res.json({ message: 'Notificación enviada al usuario exitosamente.' });
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

// Testear cuántos usuarios recibirían una tarea cron en este momento
export const testCronJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    let simulateCount = 0;
    let message = "";

    const allUsers = await db.User.findAll({ attributes: ['id', 'timezone', 'streak', 'last_activity_date'] });
    
    // Función espejo de getLocalTime del cron
    const getLocalTime = (timezone) => {
      try {
        const tz = timezone || 'Europe/Madrid';
        const now = new Date();
        const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: 'numeric' }), 10);
        const day = parseInt(now.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' }), 10);
        const date = now.toLocaleDateString('sv-SE', { timeZone: tz });
        return { hour, day, date };
      } catch (e) {
        return { hour: 0, day: 1, date: new Date().toISOString().split('T')[0] };
      }
    };

    if (id === '1') {
      // Nutrición
      const targetUsers = allUsers.filter(u => getLocalTime(u.timezone).hour === 20);
      for (const user of targetUsers) {
        const { date } = getLocalTime(user.timezone);
        const goal = await db.NutritionGoal.findOne({ where: { user_id: user.id } });
        if (!goal) continue;
        const totalIntake = await db.NutritionLog.sum('calories', { where: { user_id: user.id, log_date: date } }) || 0;
        if (totalIntake < (goal.calories_target * 0.8)) simulateCount++;
      }
      message = `Si el cron se ejecutara AHORA MISMO:\n${simulateCount} usuario(s) recibirían la alerta de nutrición (son las 20:00 locales y no llegan al 80% de macros).`;
    
    } else if (id === '2') {
      // Creatina
      const creatineUsers = await db.CreatinaLog.findAll({ attributes: ['user_id'], group: ['user_id'] });
      const creatineUserIds = creatineUsers.map(u => u.user_id);
      
      const targetUsers = allUsers.filter(u => creatineUserIds.includes(u.id) && getLocalTime(u.timezone).hour === 10);
      for (const user of targetUsers) {
        const { date } = getLocalTime(user.timezone);
        const logged = await db.CreatinaLog.findOne({ where: { user_id: user.id, log_date: date } });
        if (!logged) simulateCount++;
      }
      message = `Si el cron se ejecutara AHORA MISMO:\n${simulateCount} usuario(s) recibirían la alerta de creatina (son las 10:00 locales, toman creatina y no la han registrado hoy).`;
    
    } else if (id === '3') {
      // Entrenamiento
      const targetUsers = allUsers.filter(u => getLocalTime(u.timezone).hour === 10);
      for (const user of targetUsers) {
        const { date } = getLocalTime(user.timezone);
        const workoutLog = await db.WorkoutLog.findOne({ where: { user_id: user.id, date } });
        if (!workoutLog) simulateCount++; 
      }
      message = `Si el cron se ejecutara AHORA MISMO:\n${simulateCount} usuario(s) recibirían la motivación de entrenamiento (son las 10:00 locales y no han entrenado hoy).`;
    
    } else if (id === '4') {
      // Pesaje Mensual
      const targetUsers = allUsers.filter(u => {
        const { hour, day } = getLocalTime(u.timezone);
        return day === 1 && hour === 9;
      });
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      for (const user of targetUsers) {
        const lastLog = await db.BodyWeightLog.findOne({ where: { user_id: user.id }, order: [['log_date', 'DESC']] });
        if (!lastLog || new Date(lastLog.log_date) < thirtyDaysAgo) simulateCount++;
      }
      message = `Si el cron se ejecutara AHORA MISMO:\n${targetUsers.length > 0 ? 'Sí' : 'No'} es día 1 a las 09:00. ${simulateCount} usuario(s) recibirían el aviso de peso.`;
    
    } else if (id === '5') {
      // Streak Wars
      const targetUsers = allUsers.filter(user => {
        if (!user.streak || !user.last_activity_date) return false;
        const { hour, date } = getLocalTime(user.timezone);
        if (hour !== 20) return false;
        const lastActiveDate = new Date(user.last_activity_date).toISOString().split('T')[0];
        return lastActiveDate < date;
      });
      for (const dangerUser of targetUsers) {
        simulateCount++;
      }
      message = `Si el cron se ejecutara AHORA MISMO:\nSe enviaría aviso a los amigos de ${simulateCount} usuario(s) que están en las 20:00 locales a punto de perder la racha.`;
    } else {
      message = "Esta tarea no tiene test implementado o es un mantenimiento automático interno.";
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};
