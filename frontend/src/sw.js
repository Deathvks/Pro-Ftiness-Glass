/* frontend/src/sw.js */

// --- INICIO DE LA MODIFICACIÓN ---
// RESTAURAMOS los imports necesarios de Workbox.
// vite-plugin-pwa los procesará y empaquetará correctamente.
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { clientsClaim } from 'workbox-core';
// --- FIN DE LA MODIFICACIÓN ---


// 1. Reclamar el control de la página inmediatamente
// Esto asegura que el nuevo SW se active en cuanto se instale
self.skipWaiting();
clientsClaim(); // Ahora 'clientsClaim' está importado y definido

// 2. Pre-cache de los assets de la app
// El array self.__WB_MANIFEST será inyectado por vite-plugin-pwa
cleanupOutdatedCaches(); // 'cleanupOutdatedCaches' está importado
precacheAndRoute(self.__WB_MANIFEST || []); // 'precacheAndRoute' está importado

// 3. Estrategias de caché (Opcional, pero recomendado)
// 'registerRoute' y 'StaleWhileRevalidate' están importados
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);

// --- 4. LÓGICA DE PUSH NOTIFICATIONS ---

/**
 * Evento 'push': Se dispara cuando el servidor envía una notificación push.
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push Recibido.');
  
  let data;
  try {
    // Intentamos parsear la notificación como JSON
    data = event.data.json();
  } catch (e) {
    // Si falla, la tratamos como texto plano
    data = { body: event.data.text() };
  }

  const title = data.title || 'Pro Fitness Glass';
  const options = {
    body: data.body || 'Tienes una nueva notificación.',
    icon: data.icon || '/pwa-192x192.webp',   // Icono principal
    badge: data.badge || '/pwa-192x192.webp', // Icono para la barra de estado (Android)
    tag: data.tag || 'general-notification',  // Agrupa notificaciones
    vibrate: [100, 50, 100], // Patrón de vibración
    data: {
      url: data.url || '/', // URL a la que navegar al hacer click
    },
  };

  // Mantenemos el SW "vivo" hasta que se muestre la notificación
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Evento 'notificationclick': Se dispara cuando el usuario hace click en la notificación.
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en Notificación.');
  
  // Cerrar la notificación
  event.notification.close();

  // URL a abrir (la que definimos en `data.url` o la raíz)
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  // Buscamos si hay una pestaña de la app abierta
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      
      // Si hay una pestaña abierta con esa URL, la enfocamos
      for (const client of clientList) {
        if (new URL(client.url, self.location.origin).href === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ninguna pestaña abierta, abrimos una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});