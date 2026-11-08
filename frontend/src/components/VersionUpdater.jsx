/* frontend/src/components/VersionUpdater.jsx */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION, hasSeenCurrentWelcome, isNewerVersion } from '../config/version';
import useAppStore from '../store/useAppStore';

const SWUpdaterCore = () => {
  const [pendingRemoteVersion, setPendingRemoteVersion] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const lastCheckTimeRef = useRef(0);
  const isCheckingRef = useRef(false);

  // 1. Comprobación reactiva y ágil de nuevas versiones en el servidor
  const checkForNewVersion = useCallback(async (force = false) => {
    const isLocal =
      import.meta.env.DEV ||
      Capacitor.isNativePlatform() ||
      (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.endsWith('.local')));
    if (isLocal) return;

    const now = Date.now();
    // Throttle ágil: no comprobar más de una vez cada 15 segundos (salvo comprobación forzada)
    if (!force && now - lastCheckTimeRef.current < 15000) return;
    if (isCheckingRef.current || isUpdating) return;

    lastCheckTimeRef.current = now;
    isCheckingRef.current = true;

    try {
      const res = await fetch(`/version.json?t=${now}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        const remoteVersion = data?.version;
        if (remoteVersion && isNewerVersion(APP_VERSION, remoteVersion)) {
          setPendingRemoteVersion(remoteVersion);
        }
      }
    } catch {
      // Ignorar fallos de red puntuales
    } finally {
      isCheckingRef.current = false;
    }
  }, [isUpdating]);

  // 2. Registro del Service Worker nativo con detección reactiva instantánea
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (Capacitor.isNativePlatform()) return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (!registration) return;

        // Si ya hay un worker en espera de activación:
        if (registration.waiting) {
          checkForNewVersion(true);
        }

        // Si el navegador descubre una nueva compilación de sw.js:
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                checkForNewVersion(true);
              }
            });
          }
        });
      })
      .catch(() => {});
  }, [checkForNewVersion]);

  // 3. Comprobar al arrancar si hay versión pendiente o WelcomeModal que mostrar
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const url = new URL(window.location.href);
        if (url.searchParams.has('pfg_fresh') || url.searchParams.has('rescue') || url.searchParams.has('updated')) {
          url.searchParams.delete('pfg_fresh');
          url.searchParams.delete('rescue');
          url.searchParams.delete('updated');
          const cleanUrl = url.pathname + (url.search ? url.search : '') + (url.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch {
      // Ignorar limpieza de parámetros
    }

    try {
      fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.version) return;
          const remoteVersion = data.version;

          // Si el servidor tiene una versión más nueva que la app cargada en el navegador:
          if (isNewerVersion(APP_VERSION, remoteVersion)) {
            setPendingRemoteVersion(remoteVersion);
            return;
          }

          // Si ya estamos en la versión actual o superior, comprobar novedades de bienvenida
          const remoteTitle = data.welcome?.title;
          const currentSeenTitle = localStorage.getItem('lastSeenWelcomeTitle');
          if (remoteTitle && !hasSeenCurrentWelcome(currentSeenTitle, remoteTitle)) {
            useAppStore.setState({
              showWelcomeModal: true,
              welcomeRemoteData: data,
              welcomeRemoteVersion: APP_VERSION
            });
          } else {
            localStorage.setItem('lastSeenVersion', APP_VERSION);
            if (remoteTitle) localStorage.setItem('lastSeenWelcomeTitle', remoteTitle);
          }
        })
        .catch(() => {});
    } catch {
      // Ignorar errores de carga inicial
    }
  }, []);

  // 4. Temporizadores activos y escucha de navegación
  useEffect(() => {
    // Comprobación inicial rápida a los 1,5 segundos de arrancar
    const initialTimer = setTimeout(() => {
      checkForNewVersion(false);
    }, 1500);

    // Comprobar al recuperar el foco de la ventana o al volver a estar visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForNewVersion(true);
      }
    };

    const handleFocus = () => checkForNewVersion(true);
    const handlePopState = () => checkForNewVersion(false);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('popstate', handlePopState);

    // Intervalo activo cada 30 segundos (en vez de 5 minutos)
    const interval = setInterval(() => checkForNewVersion(false), 30 * 1000);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, [checkForNewVersion]);

  const handleApplyUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        await caches.delete('api-read-cache').catch(() => {});
      }
    } catch {
      // Ignorar errores de caché
    }

    try {
      sessionStorage.removeItem('pfg_auto_reloaded_version');
      sessionStorage.removeItem('pfg_last_chunk_autoreload');
      sessionStorage.removeItem('pfg_last_safe_reload_time');
      sessionStorage.removeItem('pfg_reload_count');
      sessionStorage.removeItem('pfg_entry_rescue_ts');
      sessionStorage.removeItem('pfg_splash_rescue_count');
      localStorage.removeItem('pfg_crash_loop_count');
      localStorage.removeItem('pfg_social_feed_cache');
      // Preservar pfg_cached_initial_state_v1 para que el arranque tras actualizar sea instantáneo (0ms)
      if (pendingRemoteVersion) {
        localStorage.setItem('lastSeenVersion', pendingRemoteVersion);
        localStorage.setItem('pfg_cache_version', pendingRemoteVersion);
      }
    } catch {
      // Ignorar errores de almacenamiento
    }

    let navigated = false;
    const navigateToFreshApp = () => {
      if (navigated) return;
      navigated = true;
      const freshUrl = new URL(window.location.pathname || '/', window.location.origin);
      freshUrl.searchParams.set('pfg_fresh', String(Date.now()));
      window.location.replace(freshUrl.toString());
    };

    try {
      if ('serviceWorker' in navigator) {
        const controllerChanged = new Promise((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(true), { once: true });
        });

        const registration = await Promise.race([
          navigator.serviceWorker.getRegistration(),
          new Promise((resolve) => setTimeout(() => resolve(null), 500))
        ]);

        if (registration) {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            await Promise.race([controllerChanged, new Promise((resolve) => setTimeout(resolve, 900))]);
          } else {
            await Promise.race([
              registration.update().catch(() => {}),
              new Promise((resolve) => setTimeout(resolve, 1200))
            ]);
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            if (registration.installing || registration.waiting) {
              await Promise.race([controllerChanged, new Promise((resolve) => setTimeout(resolve, 900))]);
            }
          }
        }
      }
    } catch {
      // Ignorar errores del Service Worker
    }

    navigateToFreshApp();
  };

  // Si no hay versión pendiente o el usuario descartó el aviso en esta sesión:
  if (!pendingRemoteVersion || isDismissed) {
    return null;
  }

  // Pill sutil, moderno, 100% adaptado a temas y responsive en cualquier móvil
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-[200] animate-[fade-in_0.3s_ease-out] w-auto max-w-[calc(100vw-1.5rem)] px-1"
      style={{ top: 'calc(var(--safe-top, 0px) + 0.65rem)' }}
    >
      <div className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-bg-secondary/95 text-text-primary shadow-2xl border border-glass-border ring-1 ring-accent/30 dark:ring-accent/40 backdrop-blur-2xl transition-colors">
        <Sparkles size={14} className="text-accent shrink-0 animate-pulse" />
        <span className="text-xs sm:text-sm font-semibold tracking-tight text-text-primary whitespace-nowrap">
          <span className="hidden xs:inline">Nueva versión </span>
          <span className="xs:hidden">Nueva </span>
          <strong className="text-accent font-extrabold">v{pendingRemoteVersion}</strong>
          <span className="hidden sm:inline"> disponible</span>
        </span>
        <button
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          className="ml-0.5 sm:ml-1 px-2.5 sm:px-3 py-1 bg-accent text-accent-contrast font-extrabold text-[11px] sm:text-xs rounded-full hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
        >
          {isUpdating ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <span>Actualizar</span>
          )}
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-text-muted hover:text-text-primary p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
          title="Descartar aviso"
          aria-label="Cerrar aviso"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

const VersionUpdater = () => {
  if (
    Capacitor.isNativePlatform() ||
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.local')))
  ) {
    return null;
  }
  return <SWUpdaterCore />;
};

export default VersionUpdater;
