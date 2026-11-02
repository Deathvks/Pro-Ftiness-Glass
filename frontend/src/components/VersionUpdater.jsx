/* frontend/src/components/VersionUpdater.jsx */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION, isNewerVersion } from '../config/version';
import useAppStore from '../store/useAppStore';
import { reloadAppWithoutStaleCache } from '../utils/appRecovery';

const SWUpdaterCore = () => {
  const [pendingRemoteVersion, setPendingRemoteVersion] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const lastCheckTimeRef = useRef(0);
  const isCheckingRef = useRef(false);

  // 1. Registro del Service Worker nativo
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => {});
  }, []);

  // 2. Comprobar si acabamos de actualizar a una nueva versión para mostrar WelcomeModal
  useEffect(() => {
    try {
      const lastSeenVersion = localStorage.getItem('lastSeenVersion');
      const isUpgraded = !lastSeenVersion || isNewerVersion(lastSeenVersion, APP_VERSION);
      if (isUpgraded) {
        // Consultar notas de la versión actual para el WelcomeModal
        fetch(`/version.json?t=${Date.now()}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            useAppStore.setState({
              showWelcomeModal: true,
              welcomeRemoteData: data,
              welcomeRemoteVersion: APP_VERSION
            });
          })
          .catch(() => {
            useAppStore.setState({
              showWelcomeModal: true,
              welcomeRemoteVersion: APP_VERSION
            });
          });
      }
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

    const isIOS =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.navigator.standalone ||
        window.matchMedia('(display-mode: standalone)').matches);

    try {
      if ('serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' });
        }

        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          try {
            await registration.update();
          } catch {}

          if (!isIOS && !isStandalone) {
            try {
              await registration.unregister();
            } catch {}
          }
        }
      }
    } catch {}

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => !isStandalone || key.includes('api-') || key.includes('runtime') || key.includes('vite-hashed') || key.includes('workbox-precache'))
            .map((key) => caches.delete(key))
        );
      } catch {}
    }

    try {
      sessionStorage.removeItem('pfg_auto_reloaded_version');
      sessionStorage.removeItem('pfg_last_chunk_autoreload');
      sessionStorage.removeItem('pfg_last_safe_reload_time');
      sessionStorage.removeItem('pfg_reload_count');
      sessionStorage.removeItem('pfg_entry_rescue_ts');
      sessionStorage.removeItem('pfg_splash_rescue_count');
      localStorage.removeItem('pfg_auto_reloaded_version');
      localStorage.removeItem('pfg_crash_loop_count');
      localStorage.removeItem('lastView');
    } catch {}

    await new Promise((r) => setTimeout(r, 200));

    window.location.replace(window.location.origin + '/?updated=' + Date.now());
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
