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

// --- RESCATE AUTOMÁTICO EN ACTUALIZACIONES (Android & Web) ---
// Si la versión instalada difiere de la almacenada localmente, sanear cachés transitorias incompatibles
const APP_VERSION_STORAGE_KEY = 'pfg_app_version';
try {
  const previousVersion = localStorage.getItem(APP_VERSION_STORAGE_KEY);
  if (previousVersion !== APP_VERSION) {
    console.log(`[AppUpdate] Migrando de ${previousVersion || 'instalación previa'} a v${APP_VERSION}`);
    localStorage.removeItem('pfg_cached_initial_state_v1');
    localStorage.removeItem('pfg_cache_version');
    localStorage.removeItem('profitness_insights_expanded');
    localStorage.removeItem('pfg_auto_reloaded_version');
    localStorage.removeItem('pfg_crash_loop_count');
    localStorage.removeItem('lastView');
    sessionStorage.clear();

    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).catch(() => {});
    }
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
