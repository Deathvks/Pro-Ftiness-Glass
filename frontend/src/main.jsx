/* frontend/src/main.jsx */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
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
