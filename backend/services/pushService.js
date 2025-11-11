/* backend/services/pushService.js */

// --- INICIO DE LA MODIFICACIÓN (Convertido a ESM) ---
import webPush from 'web-push';
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
const sendNotification = async (subscription, payload) => {
  // El payload debe ser un string
  const payloadString = JSON.stringify(payload);
  
  try {
    // Enviamos la notificación
    await webPush.sendNotification(subscription, payloadString);
  } catch (error) {
    console.error(`Error al enviar notificación a ${subscription.endpoint.substring(0, 20)}...:`, error.message);
    
    // Si el error es 410 (Gone) o 404 (Not Found), la suscripción 
    // ha expirado o no es válida y debe ser eliminada.
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Lanzamos el error para que el llamador (controller) 
      // sepa que debe borrar esta suscripción de la BD.
      throw error; 
    }
  }
};

// --- INICIO DE LA MODIFICACIÓN (Convertido a ESM) ---
// 4. Exportar el servicio configurado y la función de envío
export default {
  webPush,
  sendNotification,
};
// --- FIN DE LA MODIFICACIÓN ---