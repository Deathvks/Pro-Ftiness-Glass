/* frontend/src/services/notificationService.js */
import apiClient from './apiClient';

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
    // --- INICIO DE LA MODIFICACIÓN ---
    method: 'POST', // Cambiado de 'DELETE' a 'POST' para coincidir con la ruta del backend
    // --- FIN DE LA MODIFICACIÓN ---
    body: { endpoint },
  });
};