/* frontend/src/sw.js */
// --- INICIO DE LA MODIFICACIÓN ---
// Desactivamos logs
self.__WB_DISABLE_DEV_LOGS = true;
// --- FIN DE LA MODIFICACIÓN ---

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
// --- INICIO DE LA MODIFICACIÓN ---
// Importamos NetworkOnly para forzar la carga desde internet
import { StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
// --- FIN DE LA MODIFICACIÓN ---
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

// 1. Control inmediato
self.skipWaiting();
clientsClaim();

// 2. Limpieza y Pre-cache
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// --- 3. ESTRATEGIAS DE CACHÉ (RUNTIME) ---

// A. Fuentes de Google (Mantenemos caché aquí, no suelen cambiar)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// B. Imágenes y Uploads (NetworkOnly)
// --- INICIO DE LA MODIFICACIÓN ---
// CAMBIO IMPORTANTE: Usamos NetworkOnly. 
// Esto desactiva el caché del Service Worker para tus imágenes.
// Siempre se pedirán al servidor. Si cambias la foto, se verá al instante.
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/uploads/'),
  new NetworkOnly({
    plugins: [], // No necesitamos plugins de expiración porque no guardamos nada.
  })
);
// --- FIN DE LA MODIFICACIÓN ---

// C. API (NetworkFirst)
// --- INICIO DE LA MODIFICACIÓN ---
// Usamos NetworkFirst para la API. Intenta internet primero.
// Solo si falla (offline), usa lo guardado.
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 horas
      }),
    ],
    networkTimeoutSeconds: 5, // Esperamos 5s a la red antes de tirar de caché
  })
);
// --- FIN DE LA MODIFICACIÓN ---

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