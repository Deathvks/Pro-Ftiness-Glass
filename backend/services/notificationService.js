/* backend/services/notificationService.js */
import db from '../models/index.js';
import pushService from './pushService.js'; // Importar el servicio de Push

const { Notification, PushSubscription } = db;

/**
 * Crea una notificación interna para un usuario y envía una Notificación Push.
 * No bloquea ni lanza error para no interrumpir el flujo principal.
 * @param {number} userId - ID del usuario.
 * @param {object} details - Detalles de la notificación.
 * @param {string} details.type - Tipo ('info', 'success', 'warning', 'alert').
 * @param {string} details.title - Título breve.
 * @param {string} details.message - Mensaje descriptivo.
 * @param {object} [details.data] - Datos adicionales opcionales (JSON).
 */
export const createNotification = async (userId, { type = 'info', title, message, data = null }) => {
  try {
    // 1. Guardar notificación interna en Base de Datos (Persistencia)
    if (Notification) {
      await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        data
      });
    } else {
      console.warn('[NotificationService] Modelo Notification no disponible.');
    }

    // 2. Enviar Notificación Push (Alerta al dispositivo)
    if (PushSubscription) {
      // Buscamos todas las suscripciones activas de este usuario
      // CORRECCIÓN: Usamos 'user_id' (snake_case) para coincidir con la convención de la DB
      const subscriptions = await PushSubscription.findAll({
        where: { user_id: userId }
      });

      if (subscriptions && subscriptions.length > 0) {

        // Payload estándar para notificaciones Web Push
        const payload = {
          title: title,
          body: message,
          icon: '/pwa-192x192.png', // Icono de la app (ajusta la ruta si es distinta)
          badge: '/pwa-192x192.png', // Icono pequeño para la barra de estado
          data: {
            url: '/', // URL por defecto al hacer clic
            ...data   // Datos extra
          }
        };

        // Enviamos a todas las suscripciones en paralelo
        const pushPromises = subscriptions.map(async (sub) => {
          try {
            // Formateamos la suscripción para web-push
            const pushConfig = {
              endpoint: sub.endpoint,
              keys: sub.keys // Claves p256dh y auth
            };

            await pushService.sendNotification(pushConfig, payload);
          } catch (err) {
            // Si el servicio Push devuelve 410 (Gone) o 404, la suscripción ya no es válida
            if (err.statusCode === 410 || err.statusCode === 404) {
              // La borramos de nuestra BBDD para no intentar enviar más
              await sub.destroy();
            } else {
              console.error('[NotificationService] Error enviando push:', err.message);
            }
          }
        });

        await Promise.all(pushPromises);
      }
    }

  } catch (error) {
    // Solo logueamos el error, no interrumpimos la operación principal del usuario
    console.error(`[NotificationService] Error procesando notificación para usuario ${userId}:`, error.message);
  }
};

export default {
  createNotification
};