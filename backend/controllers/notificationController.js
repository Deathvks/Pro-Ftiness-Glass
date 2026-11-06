/* backend/controllers/notificationController.js */
import { body, validationResult } from 'express-validator';
import db from '../models/index.js';
import { createNotification as sendNotificationService } from '../services/notificationService.js';
import { hasPushConsent, PUSH_CONSENT_VERSION, PUSH_PURPOSES } from '../config/pushConsent.js';
import { isSupportedPushEndpoint } from '../services/pushService.js';

// Accedemos de forma segura por si db no se ha cargado bien
const { PushSubscription, Notification, User, sequelize } = db;

const formatPushPreferences = consents => Object.fromEntries(
  PUSH_PURPOSES.map(purpose => [purpose, hasPushConsent(consents, purpose)])
);

const getPushPreferences = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId, { attributes: ['push_consents'] });
    if (!user) return res.sendStatus(404);
    return res.set('Cache-Control', 'no-store').json(formatPushPreferences(user.push_consents));
  } catch (error) {
    next(error);
  }
};

const updatePushPreferences = async (req, res, next) => {
  const { purpose, granted, version } = req.body ?? {};
  if (!PUSH_PURPOSES.includes(purpose) || typeof granted !== 'boolean') {
    return res.status(400).json({ error: 'Preferencia de notificaciones no válida.' });
  }
  if (granted && version !== PUSH_CONSENT_VERSION) {
    return res.status(409).json({ error: 'Actualiza la app para consultar el aviso de consentimiento vigente.' });
  }

  try {
    const preferences = await sequelize.transaction(async transaction => {
      const user = await User.findByPk(req.user.userId, { attributes: ['id', 'push_consents'], transaction, lock: transaction.LOCK.UPDATE });
      if (!user) return null;
      const consents = user.push_consents ?? {};
      if (granted ? hasPushConsent(consents, purpose) : !consents[purpose]?.grantedAt || consents[purpose].withdrawnAt) {
        return formatPushPreferences(consents);
      }

      const now = new Date().toISOString();
      const entry = granted
        ? { version: PUSH_CONSENT_VERSION, grantedAt: now }
        : { ...consents[purpose], withdrawnAt: now };
      const updated = { ...consents, [purpose]: entry };
      await user.update({ push_consents: updated }, { transaction });
      return formatPushPreferences(updated);
    });
    if (!preferences) return res.sendStatus(404);
    return res.set('Cache-Control', 'no-store').json(preferences);
  } catch (error) {
    next(error);
  }
};

/* =========================================
   SECCIÓN 1: PUSH NOTIFICATIONS (VAPID)
   ========================================= */

// 1. Controlador para enviar la VAPID Key pública al frontend
const getVapidKey = (req, res) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    console.error('VAPID_PUBLIC_KEY no está definida en .env');
    return res.status(500).json({
      error: 'Error de configuración del servidor (VAPID).'
    });
  }

  res.status(200).json({ key: vapidPublicKey });
};

// 2. Controlador para suscribir a un usuario
const subscribe = [
  body('endpoint').custom(isSupportedPushEndpoint).withMessage('Proveedor de notificaciones push no admitido.'),
  body('keys.p256dh').isString().notEmpty().withMessage('Clave p256dh requerida.'),
  body('keys.auth').isString().notEmpty().withMessage('Clave auth requerida.'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!PushSubscription) {
      return res.status(500).json({ error: 'Error interno: Modelo PushSubscription no cargado.' });
    }

    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Usuario no autenticado.' });
      }

      const { userId } = req.user;
      const { endpoint, keys } = req.body;

      await PushSubscription.upsert({ user_id: userId, endpoint, keys, updated_at: new Date() });

      return res.status(201).json({ message: 'Suscripción guardada correctamente.' });

    } catch (error) {
      console.error('[Push] Error guardando la suscripción:', error.name);
      return res.status(500).json({ error: 'No se pudo guardar la suscripción push.' });
    }
  }
];

// 3. Controlador para desuscribir a un usuario
const unsubscribe = [
  body('endpoint').isString().notEmpty().withMessage('Endpoint requerido.'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!PushSubscription) {
      return res.status(500).json({ error: 'Error interno: Modelo PushSubscription no cargado.' });
    }

    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Usuario no autenticado.' });
      }

      const { userId } = req.user;
      const { endpoint } = req.body;

      await PushSubscription.destroy({
        where: {
          endpoint: endpoint,
          user_id: userId, // CORREGIDO: userId -> user_id
        }
      });

      return res.status(200).json({ message: 'Suscripción eliminada.' });

    } catch (error) {
      console.error('[Push] Error eliminando la suscripción:', error.name);
      return res.status(500).json({ error: 'No se pudo desactivar la suscripción push.' });
    }
  }
];

const subscriptionStatus = async (req, res, next) => {
  const { endpoint } = req.body ?? {};
  if (typeof endpoint !== 'string' || !endpoint || endpoint.length > 500) return res.sendStatus(400);
  try {
    const subscription = isSupportedPushEndpoint(endpoint) && await PushSubscription.findOne({ where: { endpoint, user_id: req.user.userId }, attributes: ['id'] });
    return res.set('Cache-Control', 'no-store').json({ subscribed: !!subscription });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   SECCIÓN 2: NOTIFICACIONES INTERNAS (App)
   ========================================= */

// Crear una notificación manualmente (Para pruebas o uso interno)
const create = [
  body('targetUserId').isInt().withMessage('ID de usuario destino requerido'),
  body('title').isString().notEmpty().withMessage('Título requerido'),
  body('message').isString().notEmpty().withMessage('Mensaje requerido'),
  body('type').optional().isIn(['info', 'success', 'warning', 'alert']),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { targetUserId, title, message, type = 'info', data } = req.body;

      // Usar el servicio centralizado que maneja DB + Push
      await sendNotificationService(targetUserId, {
        type,
        title,
        message,
        data,
        pushPurpose: 'news'
      });

      res.status(201).json({ message: 'Notificación creada y enviada.' });
    } catch (error) {
      next(error);
    }
  }
];

// Obtener notificaciones del usuario (paginadas y filtrables)
const getNotifications = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';
    const { type } = req.query;

    const whereClause = { user_id: userId };
    if (unreadOnly) {
      whereClause.is_read = false;
    }
    if (type) {
      whereClause.type = type;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      // Usamos 'created_at' explícitamente para evitar conflicto de alias
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Contar total de no leídas para el badge
    const unreadCount = await Notification.count({
      where: { user_id: userId, is_read: false }
    });

    res.json({
      notifications: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// Marcar una notificación como leída
const markAsRead = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }

    notification.is_read = true;
    notification.updated_at = new Date(); // MODIFICADO: Forzar fecha UTC
    await notification.save();

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

// Marcar TODAS las notificaciones como leídas
const markAllAsRead = async (req, res, next) => {
  try {
    const { userId } = req.user;

    await Notification.update(
      {
        is_read: true,
        updated_at: new Date() // MODIFICADO: Forzar fecha UTC
      },
      { where: { user_id: userId, is_read: false } }
    );

    res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (error) {
    next(error);
  }
};

// Eliminar una notificación
const deleteNotification = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const deleted = await Notification.destroy({
      where: { id, user_id: userId }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }

    res.json({ message: 'Notificación eliminada.' });
  } catch (error) {
    next(error);
  }
};

// Eliminar TODAS las notificaciones
const deleteAllNotifications = async (req, res, next) => {
  try {
    const { userId } = req.user;

    await Notification.destroy({
      where: { user_id: userId }
    });

    res.json({ message: 'Todas las notificaciones han sido eliminadas.' });
  } catch (error) {
    next(error);
  }
};

export default {
  // Push
  getVapidKey,
  subscribe,
  unsubscribe,
  subscriptionStatus,
  getPushPreferences,
  updatePushPreferences,
  // Internas
  create,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
};
