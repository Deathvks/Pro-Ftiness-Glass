/* backend/controllers/notificationController.js */
import { body, validationResult } from 'express-validator';
import db from '../models/index.js';
import { createNotification as sendNotificationService } from '../services/notificationService.js';

// Accedemos de forma segura por si db no se ha cargado bien
const { PushSubscription, Notification } = db;

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
  body('endpoint').isURL().withMessage('Endpoint no válido.'),
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

      const userId = req.user.userId;
      const { endpoint, keys } = req.body;

      // Buscar primero, luego crear o actualizar
      let subscription = await PushSubscription.findOne({
        where: { endpoint: endpoint }
      });

      if (subscription) {
        subscription.userId = userId;
        subscription.keys = keys;
        await subscription.save();
      } else {
        await PushSubscription.create({
          userId: userId,
          endpoint: endpoint,
          keys: keys
        });
      }

      return res.status(201).json({ message: 'Suscripción guardada correctamente.' });

    } catch (error) {
      console.error('[Push] EXCEPCIÓN en subscribe:', error);
      const msg = error.message || 'Error desconocido';
      return res.status(500).json({ error: `Error del servidor al guardar: ${msg}` });
    }
  }
];

// 3. Controlador para desuscribir a un usuario
const unsubscribe = [
  body('endpoint').isURL().withMessage('Endpoint no válido.'),

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

      const userId = req.user.userId;
      const { endpoint } = req.body;

      await PushSubscription.destroy({
        where: {
          endpoint: endpoint,
          userId: userId,
        }
      });

      return res.status(200).json({ message: 'Suscripción eliminada.' });

    } catch (error) {
      console.error('[Push] EXCEPCIÓN en unsubscribe:', error);
      return res.status(500).json({ error: `Error al desuscribir: ${error.message}` });
    }
  }
];

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
        data
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
      // CAMBIO: Usamos 'created_at' explícitamente para evitar conflicto de alias
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
      { is_read: true },
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
  // Internas
  create,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
};