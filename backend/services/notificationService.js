/* backend/services/notificationService.js */
import models from '../models/index.js';
import pushService, { isSupportedPushEndpoint } from './pushService.js';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { hasPushConsent } from '../config/pushConsent.js';

// 1. Inicializar Firebase Admin (Solo una vez)
try {
  let serviceAccount = null;
  const serviceAccountPath = path.resolve('firebase-admin.json');

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin Inicializado correctamente para notificaciones nativas.');
  } else if (!serviceAccount) {
    console.warn('⚠️ Credenciales de Firebase Admin no encontradas (ni local ni en ENV). Las notificaciones nativas fallarán.');
  }
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
}

const { Notification, PushSubscription, PushDeliveryLog, User } = models;
const serviceDestinations = new Set(['/asesoria', '/trainerPanel', '/routines', '/social']);
const pushBodies = {
  training: 'Tienes un recordatorio de entrenamiento. Puedes gestionarlo desde Ajustes.',
  coaching: 'Tienes un recordatorio de asesoría. Puedes gestionarlo desde Ajustes.',
  news: 'Tienes una novedad. Puedes gestionar estos avisos desde Ajustes.'
};

export const hasFirebasePush = () => admin.apps.length > 0;

export const createNotification = async (userId, { type = 'info', title, message, data = null, pushPurpose = 'service' }, { endpoint } = {}) => {
  let inAppSaved = false;
  try {
    // 1. Guardar en Base de Datos
    if (!Notification) throw new Error('Modelo Notification no cargado correctamente.');

    // FIX: Generamos la fecha explícitamente en la app para asegurar UTC y evitar desfases de la BD
    const now = new Date();

    await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      data,
      created_at: now,
      updated_at: now
    });
    inAppSaved = true;

    if (!pushPurpose) return { inAppSaved, pushStatus: 'skipped' };
    if (pushPurpose !== 'service') {
      if (!Object.hasOwn(pushBodies, pushPurpose)) return { inAppSaved, pushStatus: 'skipped' };
      const user = await User.findByPk(userId, { attributes: ['push_consents'] });
      if (!hasPushConsent(user?.push_consents, pushPurpose)) return { inAppSaved, pushStatus: 'skipped' };
    }

    // El aviso en el dispositivo lleva solo un texto genérico y una ruta interna.
    if (PushSubscription) {
      const subscriptions = (await PushSubscription.findAll({ where: { user_id: userId, ...(endpoint ? { endpoint } : {}) } }))
        .filter(sub => isSupportedPushEndpoint(sub.endpoint));

      if (subscriptions.length > 0) {
        const ttl = pushPurpose === 'service' ? 900 : 300;
        const pushTitle = 'Pro Fitness Glass';
        const pushBody = pushBodies[pushPurpose] ?? 'Tienes una notificación. Abre la app para ver los detalles.';
        const pushData = { url: pushPurpose === 'service' && serviceDestinations.has(data?.url) ? data.url : '/notifications' };
        const webPayload = {
          title: pushTitle,
          body: pushBody,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [200, 100, 200],
          data: { ...pushData, manage: pushPurpose !== 'service' }
        };

        const pushPromises = subscriptions.map(async (sub) => {
          try {
            // ENRUTADOR: ¿Es un token de Android Nativo o de Web Push?
            const isFcm = sub.endpoint.startsWith('fcm://');
            if (isFcm) {
              
              // --- NOTIFICACIÓN NATIVA ANDROID (FIREBASE) ---
              if (!admin.apps.length) throw new Error('Firebase Admin no configurado');
              
              const token = sub.endpoint.replace('fcm://', '');
              
              const fcmMessage = {
                notification: { title: pushTitle, body: pushBody },
                data: pushData,
                token: token,
                android: {
                  ttl: ttl * 1000,
                  notification: {
                    icon: 'ic_notification', // Usa el icono que tienes en capacitor para notificaciones locales
                    color: '#00E676',
                    clickAction: 'FCM_PLUGIN_ACTIVITY' // Crucial para que Capacitor procese el click
                  }
                }
              };

              await admin.messaging().send(fcmMessage);

            } else {
              
              // --- NOTIFICACIÓN WEB PUSH (VAPID) ---
              const keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
              await pushService.sendNotification({ endpoint: sub.endpoint, keys }, webPayload, ttl);
              
            }

            // Log Success
            if (PushDeliveryLog) {
              await PushDeliveryLog.create({
                user_id: userId,
                title: pushTitle,
                body: pushBody,
                type: isFcm ? 'fcm' : 'webpush',
                status: 'success'
              }).catch(() => console.error('[Push] No se pudo guardar el registro de entrega.'));
            }
            return true;

          } catch (err) {
            // Eliminar suscripción si ya no es válida (VAPID o FCM)
            if (
              err.statusCode === 410 || 
              err.statusCode === 404 || 
              err.code === 'messaging/registration-token-not-registered'
            ) {
              await sub.destroy();
            } else {
              console.error('[Push] Error de entrega:', err.code || err.statusCode || 'desconocido');
            }

            // Log Error
            if (PushDeliveryLog) {
              await PushDeliveryLog.create({
                user_id: userId,
                title: pushTitle,
                body: pushBody,
                type: sub.endpoint.startsWith('fcm://') ? 'fcm' : 'webpush',
                status: 'error',
                error_message: String(err.code || err.statusCode || 'Error de entrega')
              }).catch(() => console.error('[Push] No se pudo guardar el registro de entrega.'));
            }
            return false;
          }
        });

        const deliveries = await Promise.all(pushPromises);
        return { inAppSaved, pushStatus: deliveries.some(Boolean) ? 'success' : 'error' };
      }
    }
    return { inAppSaved, pushStatus: 'no_subscription' };
  } catch (error) {
    console.error(`[NotificationService] Error usuario ${userId}:`, error.message);
    return { inAppSaved, pushStatus: 'error' };
  }
};

export default { createNotification };
