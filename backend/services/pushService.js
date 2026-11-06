/* backend/services/pushService.js */

// --- INICIO DE LA MODIFICACIÓN (Convertido a ESM) ---
import webPush from 'web-push';

const browserPushHosts = ['fcm.googleapis.com', 'android.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com', 'notify.live.net'];

export const isSupportedPushEndpoint = endpoint => {
  if (typeof endpoint !== 'string' || endpoint.length > 500) return false;
  if (/^fcm:\/\/[a-z0-9:_.-]+$/i.test(endpoint)) return true;
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash
      && browserPushHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
};
// --- FIN DE LA MODIFICACIÓN ---

// 1. Cargar las claves VAPID desde el .env
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

// 2. Validar que las claves existan
if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
  console.warn(
    'ADVERTENCIA: Las claves VAPID (PUBLIC, PRIVATE o SUBJECT) no están configuradas en el fichero .env. ' +
    'El servicio de notificaciones push no funcionará.'
  );
} else {
  // 3. Configurar web-push con las claves
  try {
    webPush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );
    console.log('Servicio de Notificaciones Push (VAPID) configurado correctamente.');
  } catch (error) {
    console.error('Error al configurar VAPID. Verifica tus claves.', error);
  }
}

/**
 * Envía una notificación push a una suscripción específica.
 * @param {object} subscription - El objeto de suscripción (almacenado en la BD)
 * @param {object} payload - El objeto de datos a enviar (ej: { title, body, url })
 */
const sendNotification = (subscription, payload, ttl) =>
  webPush.sendNotification(subscription, JSON.stringify(payload), { TTL: ttl });

// --- INICIO DE LA MODIFICACIÓN (Convertido a ESM) ---
// 4. Exportar el servicio configurado y la función de envío
export default {
  webPush,
  sendNotification,
};
// --- FIN DE LA MODIFICACIÓN ---
