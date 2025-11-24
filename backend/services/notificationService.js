/* backend/services/notificationService.js */
import db from '../models/index.js';

const { Notification } = db;

/**
 * Crea una notificación interna para un usuario de forma asíncrona.
 * No bloquea ni lanza error para no interrumpir el flujo principal.
 * * @param {number} userId - ID del usuario.
 * @param {object} details - Detalles de la notificación.
 * @param {string} details.type - Tipo ('info', 'success', 'warning', 'alert').
 * @param {string} details.title - Título breve.
 * @param {string} details.message - Mensaje descriptivo.
 * @param {object} [details.data] - Datos adicionales opcionales (JSON).
 */
export const createNotification = async (userId, { type = 'info', title, message, data = null }) => {
  try {
    if (!Notification) {
        console.warn('[NotificationService] Modelo Notification no disponible.');
        return;
    }

    await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      data
    });
  } catch (error) {
    // Solo logueamos el error, no interrumpimos la operación principal del usuario
    console.error(`[NotificationService] Error creando notificación para usuario ${userId}:`, error.message);
  }
};

export default {
  createNotification
};