/* frontend/src/main.jsx */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from './config/version';
import './index.css';
import './i18n';
import App from './App.jsx';
import ToastProvider from './contexts/ToastProvider.jsx';
import ErrorBoundary from './components/ErrorBoundary';

// --- ENTORNO LOCAL / DESARROLLO: NUNCA PERMITIR SERVICE WORKER ACTIVO EN LOCALHOST ---
if (
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
) {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        console.warn('[ViteDev] Desregistrando Service Worker residual en localhost:', reg.scope);
        reg.unregister();
      }
    }).catch(() => {});
  }
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        console.warn('[ViteDev] Purgando caché residual en localhost:', key);
        caches.delete(key);
      }
    }).catch(() => {});
  }
}


// --- ENTORNO NATIVO (CAPACITOR): DESACTIVAR CUALQUIER SERVICE WORKER RESIDUAL ---
if (Capacitor.isNativePlatform()) {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
}

// --- MANEJADOR DE RESCATE DE EMERGENCIA POR URL (?reset=1 / ?repair=1 / ?clear=1) ---
try {
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const searchParams = new URLSearchParams(window.location.search);
    if (
      searchParams.has('reset') ||
      searchParams.has('repair') ||
      searchParams.has('clear') ||
      searchParams.has('clean')
    ) {
      console.warn('[EmergencyReset] Restablecimiento forzado activado por parámetro URL.');
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
      if ('caches' in window) {
      caches.delete('api-read-cache').catch(() => {});
    }
      const cleanUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/login';
      window.location.replace(cleanUrl);
    }
  }
} catch (e) {
  console.warn('[EmergencyReset] Error procesando reset de emergencia:', e);
}

// --- SANEAMIENTO HIGIÉNICO EN ACTUALIZACIONES Y AUTOPROTECCIÓN ---
const APP_VERSION_STORAGE_KEY = 'pfg_app_version';
try {
  const previousVersion = localStorage.getItem(APP_VERSION_STORAGE_KEY);
  if (previousVersion !== APP_VERSION) {
    console.log(`[AppUpdate] Migrando de ${previousVersion || 'instalación previa'} a v${APP_VERSION}`);
    localStorage.removeItem('pfg_auto_reloaded_version');
    localStorage.removeItem('pfg_crash_loop_count');
    localStorage.removeItem('profitness_insights_expanded');
    // Conservar la caché local completa (perfil, rutinas, nutrición de hoy, historial) para que el contenido
    // prioritario pinte al instante tras actualizar, aunque el backend aún esté reiniciándose.
    // Solo se descarta si está corrupta; si causara un fallo, CrashGuard la purga en el siguiente arranque.
    try {
      const rawCache = localStorage.getItem('pfg_cached_initial_state_v1');
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (!(parsed?.userProfile && typeof parsed.userProfile === 'object' && parsed.userProfile.id)) {
          localStorage.removeItem('pfg_cached_initial_state_v1');
        }
      }
    } catch {
      localStorage.removeItem('pfg_cached_initial_state_v1');
    }
    localStorage.removeItem('pfg_social_feed_cache');
    localStorage.removeItem('pfg_pending_target_view');
    // Preservar lastSeenVersion y lastSeenWelcomeTitle para no repetir el modal en parches menores

    // NUNCA preservar una vista problemática como 'social' al actualizar versión.
    // Forzar SIEMPRE el inicio en 'dashboard' para garantizar que el usuario ingrese limpio.
    localStorage.setItem('lastView', 'dashboard');

    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
    }
    try {
      sessionStorage.clear();
    } catch {}

    localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
    localStorage.setItem('pfg_cache_version', APP_VERSION);
  } else {
    // Si la versión es la misma pero hubo un fallo previo (pfg_crash_loop_count >= 1),
    // autosanear antes de montar React para auto-recuperar silenciosamente
    const crashCount = parseInt(localStorage.getItem('pfg_crash_loop_count') || '0', 10);
    if (crashCount >= 1) {
      console.warn(`[CrashGuard] Fallo previo detectado (${crashCount}). Autolimpiando snapshots...`);
      localStorage.removeItem('pfg_cached_initial_state_v1');
      localStorage.removeItem('pfg_cache_version');
      localStorage.removeItem('pfg_social_feed_cache');
      localStorage.setItem('lastView', 'dashboard');
      sessionStorage.clear();
      if (crashCount >= 3) {
        console.warn('[CrashGuard] Bucle recurrente crítico (>=3). Forzando purga de emergencia...');
        localStorage.clear();
      } else {
        localStorage.removeItem('pfg_crash_loop_count');
      }
    }
  }
} catch (e) {
  console.warn('[AppUpdate] Error durante migración de versión:', e);
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("Falta la variable VITE_GOOGLE_CLIENT_ID en el archivo .env del frontend");
}

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS) {
  document.documentElement.classList.add('is-ios');
}

const mountApp = () => {
  if (typeof window !== 'undefined') {
    window.__pfg_mounted = true;
    try {
      sessionStorage.removeItem('pfg_splash_rescue_count');
      sessionStorage.removeItem('pfg_entry_rescue_ts');
      if (
        window.location.search &&
        (window.location.search.includes('rescue=') ||
          window.location.search.includes('updated=') ||
          window.location.search.includes('pfg_fresh='))
      ) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('rescue');
        cleanUrl.searchParams.delete('updated');
        cleanUrl.searchParams.delete('r');
        cleanUrl.searchParams.delete('pfg_fresh');
        const nextUrl =
          cleanUrl.pathname +
          (cleanUrl.search && cleanUrl.search !== '?' ? cleanUrl.search : '') +
          cleanUrl.hash;
        window.history.replaceState({}, document.title, nextUrl);
      }
    } catch {}
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <GoogleOAuthProvider clientId={googleClientId}>
          <HelmetProvider>
            <BrowserRouter>
              <ToastProvider>
                <App />
              </ToastProvider>
            </BrowserRouter>
          </HelmetProvider>
        </GoogleOAuthProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
};

// Evitar FOUC manteniendo el .app-splash-screen (con CSS inline) hasta que la hoja de estilos principal esté lista
const pendingStylesheets = Array.from(
  document.querySelectorAll('link[rel="stylesheet"]')
).filter((link) => {
  try {
    const href = link.getAttribute('href') || '';
    return href.includes('/assets/') && !link.sheet;
  } catch {
    return false;
  }
});

if (pendingStylesheets.length === 0) {
  mountApp();
} else {
  let mounted = false;
  const finishMount = () => {
    if (mounted) return;
    mounted = true;
    mountApp();
  };
  const fallbackTimer = setTimeout(finishMount, 600);
  Promise.all(
    pendingStylesheets.map(
      (link) =>
        new Promise((resolve) => {
          try {
            if (link.sheet) return resolve();
          } catch {
            return resolve();
          }
          link.addEventListener('load', resolve, { once: true });
          link.addEventListener('error', resolve, { once: true });
        })
    )
  ).then(() => {
    clearTimeout(fallbackTimer);
    finishMount();
  });
}
