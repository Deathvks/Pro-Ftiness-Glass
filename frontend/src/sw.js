/* frontend/src/sw.js */
// Desactivamos logs de desarrollo
self.__WB_DISABLE_DEV_LOGS = true;

import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { clientsClaim } from 'workbox-core';

// 1. Tomar control inmediato de la página y forzar actualización automática
self.skipWaiting(); // <-- Obliga a instalar la nueva versión sin esperar
clientsClaim();

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        if ('caches' in self) {
          await caches.delete('api-read-cache');
        }
      } catch (e) {
        console.warn('[SW] Error eliminando api-read-cache en activación:', e);
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 2. Limpieza de cachés antiguas y precarga
registerRoute(
  ({ request, url }) => request.mode === 'navigate' && !url.pathname.startsWith('/sitemap.xml') && !url.pathname.startsWith('/robots.txt'),
  async ({ request }) => {
    try {
      let response;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        response = await fetch(request, { signal: controller.signal, cache: 'no-cache' });
        clearTimeout(timeoutId);
      } catch {
        response = await matchPrecache('/index.html');
      }
      if (!response || !response.ok) {
        response = await matchPrecache('/index.html') || await fetch(request);
      }
      if (!response) return fetch(request);
      
      const html = await response.text();
      
      const cookieStr = request.headers.get('cookie') || '';
      const match = cookieStr.match(/app_theme=([^;]+)/);
      const theme = match ? match[1] : 'system';
      
      let lightColor = '#f8fafc';
      let darkColor = '#0f172a';
      
      if (theme === 'light') { lightColor = '#f8fafc'; darkColor = '#f8fafc'; }
      else if (theme === 'dark') { lightColor = '#0f172a'; darkColor = '#0f172a'; }
      else if (theme === 'oled') { lightColor = '#000000'; darkColor = '#000000'; }
      else if (theme === 'galaxy') { lightColor = '#000000'; darkColor = '#000000'; }
      else if (theme === 'desert') { lightColor = '#fff1e6'; darkColor = '#2c1e16'; }
      
      const modifiedHtml = html.replace(
        /<meta[^>]*id="theme-color-light"[^>]*>/i,
        `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${lightColor}" id="theme-color-light" />`
      ).replace(
        /<meta[^>]*id="theme-color-dark"[^>]*>/i,
        `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${darkColor}" id="theme-color-dark" />`
      );
      
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/html');
      
      return new Response(modifiedHtml, {
        headers: headers,
        status: response.status,
        statusText: response.statusText
      });
    } catch (e) {
      return fetch(request);
    }
  }
);

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

// A2. Chunks secundarios con hash (/assets/*.js y /assets/*.css) -> StaleWhileRevalidate seguro
registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/assets/') &&
    (request.destination === 'script' || request.destination === 'style' || /\.(js|css)$/i.test(url.pathname)),
  new StaleWhileRevalidate({
    cacheName: 'vite-hashed-assets',
    plugins: [
      {
        fetchDidSucceed: async ({ response }) => {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            return new Response('Chunk no encontrado (nueva versión)', {
              status: 404,
              statusText: 'Not Found',
              headers: { 'Content-Type': 'text/plain' }
            });
          }
          return response;
        },
        cacheWillUpdate: async ({ response }) => {
          if (!response || response.status !== 200) return null;
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) return null;
          return response;
        },
      },
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 }),
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
// NOTA CRÍTICA: Excluimos explícitamente endpoints de autenticación, perfil de usuario, admin y notificaciones
// para garantizar que nunca se sirvan sesiones caducadas, corruptas o datos erróneos de usuario desde caché.
registerRoute(
  ({ url, request }) => {
    if (request.method !== 'GET') return false;
    if (!url.pathname.startsWith('/api/')) return false;
    if (
      url.pathname.startsWith('/api/auth/') ||
      url.pathname.startsWith('/api/users/') ||
      url.pathname.startsWith('/api/admin/') ||
      url.pathname.startsWith('/api/notifications/')
    ) {
      return false;
    }
    return true;
  },
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
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { body: event.data.text() };
  }

  const title = payload.title || 'Pro Fitness Glass';
  const options = {
    body: payload.body || 'Tienes una nueva notificación.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag: payload.tag || `notif-${Date.now()}`,
    vibrate: payload.vibrate || [100, 50, 100],
    data: {
      url: (payload.data && payload.data.url) ? payload.data.url : '/',
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










