/* frontend/src/services/notificationService.js */
import apiClient from './apiClient';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

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
    queueWhenOffline: false,
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
    queueWhenOffline: false,
  });
};

export const clearDevicePush = async () => {
  if (Capacitor.isNativePlatform()) {
    if (!localStorage.getItem('native_push_token')) return;
    await PushNotifications.unregister();
    localStorage.removeItem('native_push_subscribed');
    localStorage.removeItem('native_push_token');
  } else if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager?.getSubscription();
    await subscription?.unsubscribe();
  }
};

export const getCurrentPushEndpoint = async () => {
  if (Capacitor.isNativePlatform()) {
    const token = localStorage.getItem('native_push_token');
    const permission = await PushNotifications.checkPermissions();
    return token && permission.receive === 'granted' ? `fcm://${token}` : null;
  }
  if (!('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted') return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager?.getSubscription())?.endpoint ?? null;
};

export const getPushPreferences = () => apiClient('/notifications/push-preferences', { cache: 'no-store' });

export const getPushSubscriptionStatus = endpoint => apiClient('/notifications/subscription-status', {
  method: 'POST',
  body: { endpoint },
  queueWhenOffline: false
});

export const updatePushPreferences = (purpose, granted, version) => apiClient('/notifications/push-preferences', {
  method: 'PUT',
  body: { purpose, granted, version },
  queueWhenOffline: false
});

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

export const getNotification = id => apiClient(`/notifications/${encodeURIComponent(id)}`, { cache: 'no-store' });

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
