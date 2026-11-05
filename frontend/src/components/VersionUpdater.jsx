/* frontend/src/components/VersionUpdater.jsx */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION, hasSeenCurrentWelcome, isNewerVersion } from '../config/version';
import useAppStore from '../store/useAppStore';
import { reloadAppWithoutStaleCache } from '../utils/appRecovery';

const SWUpdaterCore = () => {
  const [pendingRemoteVersion, setPendingRemoteVersion] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const lastCheckTimeRef = useRef(0);
  const isCheckingRef = useRef(false);

  // 1. Registro del Service Worker nativo (solo Web / PWA, nunca en app nativa)
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (Capacitor.isNativePlatform()) return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => {});
  }, []);

  // 2. Comprobar si hay un anuncio nuevo de bienvenida para mostrar WelcomeModal y limpiar params de actualización
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
    } catch {}

    try {
      fetch(`/version.json?t=${Date.now()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const remoteTitle = data?.welcome?.title;
          // Solo mostrar el modal si el título de las novedades es genuinamente nuevo y no ha sido visto ya
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
    } catch {}
  }, []);

  // 3. Auto-recuperación de chunks desfasados (evento oficial vite:preloadError)
  useEffect(() => {
    const handlePreloadError = (event) => {
      if (event && event.preventDefault) event.preventDefault();
      console.warn('[VersionUpdater] vite:preloadError detectado. Auto-recuperando versión limpia...');

      const now = Date.now();
      const lastAutoReload = parseInt(sessionStorage.getItem('pfg_last_chunk_autoreload') || '0', 10);
      if (now - lastAutoReload > 6000) {
        sessionStorage.setItem('pfg_last_chunk_autoreload', String(now));
        reloadAppWithoutStaleCache({ force: true });
      }
    };

    const handleWindowError = (e) => {
      const msg = (e?.message || '').toLowerCase();
      if (
        msg.includes('failed to fetch dynamically imported module') ||
        msg.includes('loading chunk') ||
        msg.includes('loading css chunk') ||
        msg.includes('importing a module script failed')
      ) {
        handlePreloadError(e);
      }
    };

    window.addEventListener('vite:preloadError', handlePreloadError);
    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  // 4. Comprobación no agresiva de nuevas versiones en el servidor
  const checkForNewVersion = useCallback(async () => {
    const isLocal =
      import.meta.env.DEV ||
      Capacitor.isNativePlatform() ||
      (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.endsWith('.local')));
    if (isLocal) return;

    const now = Date.now();
    // No comprobar más de una vez cada 60 segundos
    if (now - lastCheckTimeRef.current < 60000) return;
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
      // Ignorar fallos de red
    } finally {
      isCheckingRef.current = false;
    }
  }, [isUpdating]);

  useEffect(() => {
    // Comprobar al recuperar el foco de la ventana o al volver a estar visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForNewVersion();
      }
    };

    window.addEventListener('focus', checkForNewVersion);
    document.addEventListener('visibilitychange', handleVisibility);

    // Intervalo relajado de 5 minutos
    const interval = setInterval(checkForNewVersion, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', checkForNewVersion);
      document.removeEventListener('visibilitychange', handleVisibility);
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
    } catch (_) {}

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
    } catch (_) {}

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
    } catch (_) {}

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
