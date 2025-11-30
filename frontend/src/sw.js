/* frontend/src/sw.js */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

// 1. Control inmediato
self.skipWaiting();
clientsClaim();

// 2. Limpieza y Pre-cache (Assets de compilación)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// --- 3. ESTRATEGIAS DE CACHÉ (RUNTIME) ---

// A. Fuentes de Google (CacheFirst o StaleWhileRevalidate)
// Las fuentes no suelen cambiar, así que StaleWhileRevalidate es seguro y rápido.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }), // 1 año
    ],
  })
);

// B. Imágenes (CacheFirst) - CRÍTICO PARA LCP Y SEO
// Guardamos imágenes del backend (/images/...) y avatares externos.
// Si la imagen ya está en caché, la sirve directo. Si no, va a la red y la guarda.
registerRoute(
  ({ request, url }) => request.destination === 'image' || url.pathname.startsWith('/images/'),
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60, // Guardar hasta 60 imágenes
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

// C. API - Lecturas GET (StaleWhileRevalidate)
// Permite que la app cargue datos "viejos" instantáneamente mientras busca los nuevos.
// Esto hace que la app se sienta "nativa" y muy rápida.
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 horas
      }),
    ],
  })
);

// --- 4. LÓGICA DE PUSH NOTIFICATIONS ---

self.addEventListener('push', (event) => {
  console.log('[SW] Push Recibido.');

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
  console.log('[SW] Click en Notificación.');

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