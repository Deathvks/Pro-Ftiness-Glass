/* backend/services/notificationService.js */
import models from '../models/index.js';
import pushService from './pushService.js';

const { Notification, PushSubscription } = models;

/**
 * Crea una notificación persistente y envía una alerta Push.
 */
export const createNotification = async (userId, { type = 'info', title, message, data = null }) => {
  try {
    // 1. Guardar en Base de Datos
    if (!Notification) throw new Error('Modelo Notification no cargado correctamente.');

    await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      data
    });

    // 2. Enviar Push (si hay suscripciones)
    if (PushSubscription) {
      const subscriptions = await PushSubscription.findAll({ where: { user_id: userId } });

      if (subscriptions.length > 0) {
        const payload = {
          title,
          body: message,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          data: { url: '/', ...data }
        };

        const pushPromises = subscriptions.map(async (sub) => {
          try {
            await pushService.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
          } catch (err) {
            // Eliminar suscripción si ya no es válida
            if (err.statusCode === 410 || err.statusCode === 404) {
              await sub.destroy();
            } else {
              console.error('[Push] Error envío:', err.message);
            }
          }
        });

        await Promise.all(pushPromises);
      }
    }
  } catch (error) {
    console.error(`[NotificationService] Error usuario ${userId}:`, error.message);
  }
};

export default { createNotification };