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
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          for (const reg of regs) reg.unregister();
        }).catch(() => {});
      }
      const cleanUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/login';
      window.location.replace(cleanUrl);
    }
  }
} catch (e) {
  console.warn('[EmergencyReset] Error procesando reset de emergencia:', e);
}

// --- SANEAMIENTO HIGIÉNICO EN ACTUALIZACIONES ---
const APP_VERSION_STORAGE_KEY = 'pfg_app_version';
try {
  const previousVersion = localStorage.getItem(APP_VERSION_STORAGE_KEY);
  if (previousVersion !== APP_VERSION) {
    console.log(`[AppUpdate] Migrando de ${previousVersion || 'instalación previa'} a v${APP_VERSION}`);
    localStorage.removeItem('pfg_auto_reloaded_version');
    localStorage.removeItem('pfg_crash_loop_count');
    localStorage.removeItem('profitness_insights_expanded');
    // Retenemos pfg_cached_initial_state_v1 para apertura instantánea (0ms) en actualizaciones

    // En todas las plataformas (web y nativo), purgar caché obsoleta de lectura de API en actualización
    if ('caches' in window) {
      caches.delete('api-read-cache').catch(() => {});
    }
    try {
      // Limpiar solo tokens temporales de reintento de chunks sin eliminar cachés de noticias ni datos útiles
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('pfg_chunk_retry_') || key === 'pfg_reload_count') {
          sessionStorage.removeItem(key);
        }
      });
    } catch {}

    // Desregistrar SW huérfanos solo en Android nativo (Capacitor)
    if (Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
      }).catch(() => {});
    }

    localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
    localStorage.setItem('pfg_cache_version', APP_VERSION);
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

// Evitar FOUC (pérdida momentánea de CSS al recargar): si hay hojas de estilo externas pendientes
// de terminar de cargarse en <head>, mantenemos el .app-splash-screen (con CSS inline) hasta que
// la hoja de estilos esté lista antes de montar React.
const pendingStylesheets = Array.from(
  document.querySelectorAll('link[rel="stylesheet"]')
).filter((link) => !link.sheet);

if (pendingStylesheets.length === 0) {
  mountApp();
} else {
  let mounted = false;
  const finishMount = () => {
    if (mounted) return;
    mounted = true;
    mountApp();
  };
  const fallbackTimer = setTimeout(finishMount, 1200);
  Promise.all(
    pendingStylesheets.map(
      (link) =>
        new Promise((resolve) => {
          if (link.sheet) return resolve();
          link.addEventListener('load', resolve, { once: true });
          link.addEventListener('error', resolve, { once: true });
        })
    )
  ).then(() => {
    clearTimeout(fallbackTimer);
    finishMount();
  });
}
