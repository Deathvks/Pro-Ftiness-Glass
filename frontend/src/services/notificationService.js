/* frontend/src/services/notificationService.js */
import apiClient from './apiClient';

/* =========================================
   SECCIÓN 1: PUSH NOTIFICATIONS (VAPID)
   ========================================= */

/**
 * Obtiene la clave pública VAPID del servidor.
 * Esta clave es necesaria para que el navegador genere una suscripción.
 */
export const getVapidKey = () => {
  return apiClient('/notifications/vapid-key');
};

/**
 * Envía el objeto de suscripción push al backend para guardarlo.
 * @param {PushSubscription} subscription - El objeto de suscripción generado por el navegador.
 */
export const subscribeToPush = (subscription) => {
  return apiClient('/notifications/subscribe', {
    method: 'POST',
    body: subscription,
  });
};

/**
 * Informa al backend que debe eliminar una suscripción.
 * @param {string} endpoint - El endpoint único de la suscripción que se va a eliminar.
 */
export const unsubscribeFromPush = (endpoint) => {
  return apiClient('/notifications/unsubscribe', {
    method: 'POST',
    body: { endpoint },
  });
};

/* =========================================
   SECCIÓN 2: NOTIFICACIONES INTERNAS (App)
   ========================================= */

/**
 * Obtiene las notificaciones del usuario (paginadas).
 * @param {object} params - { page, limit, unread }
 */
export const getNotifications = (params = {}) => {
  // Convertir objeto de parámetros a query string
  const queryString = new URLSearchParams(params).toString();
  return apiClient(`/notifications?${queryString}`);
};

/**
 * Marca una notificación específica como leída.
 * @param {number} id - ID de la notificación.
 */
export const markAsRead = (id) => {
  return apiClient(`/notifications/${id}/read`, {
    method: 'PUT',
  });
};

/**
 * Marca todas las notificaciones como leídas.
 */
export const markAllAsRead = () => {
  return apiClient('/notifications/read-all', {
    method: 'PUT',
  });
};

/**
 * Elimina una notificación específica.
 * @param {number} id - ID de la notificación.
 */
export const deleteNotification = (id) => {
  return apiClient(`/notifications/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Elimina TODAS las notificaciones del usuario.
 */
export const deleteAllNotifications = () => {
  return apiClient('/notifications', {
    method: 'DELETE',
  });
};