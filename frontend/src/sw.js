/* frontend/src/sw.js */
// Desactivamos logs de desarrollo
self.__WB_DISABLE_DEV_LOGS = true;

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { clientsClaim } from 'workbox-core';

// 1. Tomar control inmediato de la página
clientsClaim();

// Escuchamos el evento 'message' para actualizaciones
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 2. Limpieza de cachés antiguas y precarga
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// --- 3. ESTRATEGIAS DE CACHÉ (RUNTIME) ---

// A. Fuentes de Google (Cacheamos explícitamente porque son assets estáticos de UI)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// B. Imágenes estáticas LOCALES (logo, iconos, etc.)
// IMPORTANTE: Excluimos '/uploads/', VÍDEOS y ORÍGENES EXTERNOS para evitar errores de CORS/Opaque.
registerRoute(
  ({ request, url }) => {
    // 1. EXCLUSIÓN CRÍTICA: Si la imagen NO es de nuestro propio dominio, IGNORAR.
    // Esto soluciona el error "opaque response" con imágenes de Google/lh3.googleusercontent.com
    if (url.origin !== self.location.origin) return false;

    // 2. Si viene de /uploads/ (imágenes subidas por usuarios), ignorar (suelen ser dinámicas o requieren auth fresca)
    if (url.pathname.startsWith('/uploads/')) return false;

    // 3. CRÍTICO: Si es un video (.mp4, .mov, etc.), IGNORAR.
    // Safari requiere 'Range Requests' (206 Partial Content).
    if (url.pathname.match(/\.(mp4|mov|webm|mkv)$/i)) return false;

    // 4. Interceptamos solo imágenes reales del propio sitio
    return request.destination === 'image' || url.pathname.startsWith('/images/');
  },
  new StaleWhileRevalidate({
    cacheName: 'local-images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

// C. API - Lectura (GET) -> NetworkFirst (Intenta red, si falla usa caché)
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'api-read-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 horas
      }),
    ],
    networkTimeoutSeconds: 5, // Si tarda más de 5s, usa caché
  })
);

// D. API - Escritura (POST, PUT, DELETE) -> Background Sync
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method !== 'GET',
  new NetworkOnly({
    plugins: [
      new BackgroundSyncPlugin('api-mutation-queue', {
        maxRetentionTime: 24 * 60, // Reintentar hasta 24 horas
      }),
    ],
  })
);

// --- 4. LÓGICA DE PUSH NOTIFICATIONS ---

self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { body: event.data.text() };
  }

  const title = data.title || 'Pro Fitness Glass';
  const options = {
    body: data.body || 'Tienes una nueva notificación.',
    icon: data.icon || '/pwa-192x192.webp',
    badge: data.badge || '/pwa-192x192.webp',
    tag: data.tag || 'general-notification',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if (new URL(client.url, self.location.origin).href === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});