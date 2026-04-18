/* backend/services/notificationService.js */
import models from '../models/index.js';
import pushService from './pushService.js';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// 1. Inicializar Firebase Admin (Solo una vez)
try {
  const serviceAccountPath = path.resolve('firebase-admin.json');
  if (fs.existsSync(serviceAccountPath) && !admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin Inicializado correctamente para notificaciones nativas.');
  } else if (!fs.existsSync(serviceAccountPath)) {
    console.warn('⚠️ Archivo firebase-admin.json no encontrado. Las notificaciones nativas fallarán.');
  }
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
}

const { Notification, PushSubscription } = models;

export const createNotification = async (userId, { type = 'info', title, message, data = null }) => {
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

    // 2. Enviar Push (si hay suscripciones)
    if (PushSubscription) {
      const subscriptions = await PushSubscription.findAll({ where: { user_id: userId } });

      if (subscriptions.length > 0) {
        const webPayload = {
          title,
          body: message,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [200, 100, 200],
          data: { url: '/', ...data }
        };

        const pushPromises = subscriptions.map(async (sub) => {
          try {
            // ENRUTADOR: ¿Es un token de Android Nativo o de Web Push?
            if (sub.endpoint.startsWith('fcm://')) {
              
              // --- NOTIFICACIÓN NATIVA ANDROID (FIREBASE) ---
              if (!admin.apps.length) throw new Error('Firebase Admin no configurado');
              
              const token = sub.endpoint.replace('fcm://', '');
              
              // Firebase requiere que todos los valores del objeto 'data' sean strings
              const stringifiedData = {};
              if (data) {
                for (const key in data) {
                  stringifiedData[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
                }
              }
              if (!stringifiedData.url) stringifiedData.url = '/';

              const fcmMessage = {
                notification: { title, body: message },
                data: stringifiedData,
                token: token,
                android: {
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
              await pushService.sendNotification({ endpoint: sub.endpoint, keys }, webPayload);
              
            }
          } catch (err) {
            // Eliminar suscripción si ya no es válida (VAPID o FCM)
            if (
              err.statusCode === 410 || 
              err.statusCode === 404 || 
              err.code === 'messaging/registration-token-not-registered'
            ) {
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