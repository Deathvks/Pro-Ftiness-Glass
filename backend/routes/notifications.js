/* backend/routes/notifications.js */

// --- INICIO DE LA MODIFICACIÓN (Convertido a ESM) ---
import express from 'express';
import notificationController from '../controllers/notificationController.js'; // Usamos import y .js
import authenticateToken from '../middleware/authenticateToken.js'; // Usamos import y .js

const router = express.Router();
// --- FIN DE LA MODIFICACIÓN ---

/**
 * @route   GET /api/notifications/vapid-key
 * @desc    Obtiene la clave pública VAPID
 * @access  Public // <-- MODIFICADO
 */
router.get(
  '/vapid-key',
  // --- INICIO DE LA MODIFICACIÓN ---
  // El 'authenticateToken' se elimina de esta ruta.
  // La clave pública VAPID es segura para ser expuesta.
  notificationController.getVapidKey
  // --- FIN DE LA MODIFICACIÓN ---
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

// --- INICIO DE LA MODIFICACIÓN (Convertido a ESM) ---
export default router; // Usamos export default
// --- FIN DE LA MODIFICACIÓN ---