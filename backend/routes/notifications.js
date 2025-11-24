/* backend/routes/notifications.js */

import express from 'express';
// --- INICIO DE LA MODIFICACIÓN ---
import { param } from 'express-validator'; // Importar validador para IDs
// --- FIN DE LA MODIFICACIÓN ---
import notificationController from '../controllers/notificationController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

/* =========================================
   SECCIÓN 1: PUSH NOTIFICATIONS (VAPID)
   ========================================= */

/**
 * @route   GET /api/notifications/vapid-key
 * @desc    Obtiene la clave pública VAPID
 * @access  Public
 */
router.get(
  '/vapid-key',
  notificationController.getVapidKey
);

/**
 * @route   POST /api/notifications/subscribe
 * @desc    Guarda una nueva suscripción push
 * @access  Private
 */
router.post(
  '/subscribe',
  authenticateToken,
  notificationController.subscribe
);

/**
 * @route   POST /api/notifications/unsubscribe
 * @desc    Elimina una suscripción push existente
 * @access  Private
 */
router.post(
  '/unsubscribe',
  authenticateToken,
  notificationController.unsubscribe
);

/* =========================================
   SECCIÓN 2: NOTIFICACIONES INTERNAS (App)
   ========================================= */

// Middleware de validación de ID
const validateId = [
  param('id').isInt().withMessage('ID de notificación inválido')
];

/**
 * @route   GET /api/notifications
 * @desc    Obtiene las notificaciones del usuario (paginadas)
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  notificationController.getNotifications
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Marca todas las notificaciones como leídas
 * @access  Private
 */
router.put(
  '/read-all',
  authenticateToken,
  notificationController.markAllAsRead
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Marca una notificación específica como leída
 * @access  Private
 */
router.put(
  '/:id/read',
  authenticateToken,
  validateId,
  notificationController.markAsRead
);

/**
 * @route   DELETE /api/notifications
 * @desc    Elimina TODAS las notificaciones del usuario
 * @access  Private
 */
router.delete(
  '/',
  authenticateToken,
  notificationController.deleteAllNotifications
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Elimina una notificación específica
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateToken,
  validateId,
  notificationController.deleteNotification
);

export default router;