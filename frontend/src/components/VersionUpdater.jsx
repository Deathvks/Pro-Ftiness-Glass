import ModalPortal from './ModalPortal';
/* frontend/src/components/VersionUpdater.jsx */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../config/version';
import useAppStore from '../store/useAppStore';

const isNewerVersion = (current, remote) => {
  if (!current || !remote) return false;
  const cParts = String(current).split('.').map(Number);
  const rParts = String(remote).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((rParts[i] || 0) > (cParts[i] || 0)) return true;
    if ((rParts[i] || 0) < (cParts[i] || 0)) return false;
  }
  return false;
};

const SWUpdaterCore = ({ initialChunkError }) => {
  const [isChunkError, setIsChunkError] = useState(initialChunkError);
  const showWelcomeModal = useAppStore((state) => state.showWelcomeModal);
  const swRegRef = useRef(null);
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const isReloadingRef = useRef(false);

  const triggerSafeReload = useCallback((targetVersion) => {
    if (isReloadingRef.current) return true;
    const { activeWorkout, workoutStartTime, showWelcomeModal: isWelcomeOpen } = useAppStore.getState();
    // Si el usuario está en mitad de un entrenamiento activo o viendo el WelcomeModal, no recargamos de golpe
    if ((activeWorkout && workoutStartTime) || isWelcomeOpen) {
      return false;
    }

    if (targetVersion) {
      const lastReloaded = sessionStorage.getItem('pfg_auto_reloaded_version');
      if (lastReloaded === targetVersion) {
        return false;
      }
    }

    const now = Date.now();
    const lastReloadTime = parseInt(sessionStorage.getItem('pfg_last_safe_reload_time') || '0', 10);
    const reloadCount = parseInt(sessionStorage.getItem('pfg_reload_count') || '0', 10);

    // Protección anti-bucle: si ya se recargó hace menos de 8 segundos, NUNCA volver a recargar automáticamente
    if (now - lastReloadTime < 8000) {
      console.warn('[VersionUpdater] Prevención de bucle: última recarga fue hace menos de 8s.');
      return false;
    }

    // Si ya se ha intentado recargar 2 veces en 40 segundos, mostrar modal en vez de bucle infinito
    if (reloadCount >= 2 && now - lastReloadTime < 40000) {
      console.warn('[VersionUpdater] Límite de auto-recargas alcanzado (2 en 40s). Deteniendo bucle.');
      return false;
    }

    sessionStorage.setItem('pfg_last_safe_reload_time', String(now));
    sessionStorage.setItem('pfg_reload_count', String(reloadCount + 1));

    if (targetVersion) {
      sessionStorage.setItem('pfg_auto_reloaded_version', targetVersion);
    }

    isReloadingRef.current = true;
    window.location.reload();
    return true;
  }, []);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (!r) return;
      swRegRef.current = r;
      r.update().catch(() => {});
    },
    onRegistered(r) {
      if (!r) return;
      swRegRef.current = r;
      r.update().catch(() => {});
    }
  });

  const checkForUpdates = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastCheckTimeRef.current < 5000) return;
    if (isCheckingRef.current || isReloadingRef.current) return;

    lastCheckTimeRef.current = now;
    isCheckingRef.current = true;

    try {
      // 1. Iniciar comprobación del Service Worker en paralelo (SIN bloquear la lectura de /version.json)
      if ('serviceWorker' in navigator) {
        Promise.resolve(swRegRef.current || navigator.serviceWorker.getRegistration())
          .then((reg) => {
            if (!reg) return;
            swRegRef.current = reg;
            return reg.update().then(() => {
              if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          })
          .catch(() => {});
      }

      // 2. Comprobar /version.json contra APP_VERSION y lastSeenVersion de inmediato
      const res = await fetch(`/version.json?t=${now}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' }
      });
      if (!res.ok) return;

      const data = await res.json();
      const remoteVersion = data?.version;
      if (!remoteVersion) return;

      const lastSeenVersion = localStorage.getItem('lastSeenVersion');
      const hasNewerThanMemory = isNewerVersion(APP_VERSION, remoteVersion);
      const hasNewerThanSeen = lastSeenVersion ? isNewerVersion(lastSeenVersion, remoteVersion) : false;

      if (hasNewerThanMemory || hasNewerThanSeen) {
        const storeState = useAppStore.getState();
        const isAuthenticatedUser = Boolean(storeState.isAuthenticated && storeState.userProfile);

        // Si el usuario está dentro de la app y aún no ha visto el WelcomeModal de esta versión:
        // mostramos directamente el WelcomeModal en caliente SIN recargar antes.
        // Al pulsar "DESCUBRIR NOVEDADES", el propio WelcomeModal recarga la página limpia.
        if (isAuthenticatedUser && lastSeenVersion !== remoteVersion) {
          if (typeof storeState.triggerRemoteWelcomeModal === 'function') {
            storeState.triggerRemoteWelcomeModal(remoteVersion, data);
          } else {
            useAppStore.setState({ showWelcomeModal: true });
          }
          return;
        }

        // Si no está autenticado (ej. Landing / Login) o ya aceptó el modal pero sigue en bundle antiguo:
        if (hasNewerThanMemory) {
          if (!triggerSafeReload(remoteVersion)) {
            setNeedRefresh(true);
          }
        }
      }
    } catch {
      // Ignorar errores de red temporales (offline)
    } finally {
      isCheckingRef.current = false;
    }
  }, [setNeedRefresh, triggerSafeReload]);

  useEffect(() => {
    // Al cambiar el controlador del Service Worker, comprobar /version.json para mostrar el WelcomeModal en caliente
    const handleControllerChange = () => {
      if (isReloadingRef.current) return;
      checkForUpdates(true);
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    // Comprobar al iniciar
    checkForUpdates(true);

    // Comprobar al volver a la app (salir y entrar en PWA / cambiar de pestaña / recuperar red)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(true);
      }
    };
    const handleFocus = () => checkForUpdates(true);
    const handlePageShow = () => checkForUpdates(true);
    const handleOnline = () => checkForUpdates(true);
    // Comprobar de forma ligera al moverse por la app (throttled a 5s)
    const handleUserNavigation = () => checkForUpdates(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);
    window.addEventListener('popstate', handleUserNavigation);
    window.addEventListener('click', handleUserNavigation, { passive: true });

    // Polling ligero cada 10s mientras la pestaña está visible para detectar nuevas versiones sin recargar
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(true);
      }
    }, 10 * 1000);

    const handleError = (error) => {
      const msg = error?.message || '';
      const isChunkLoadError =
        msg.includes('Loading chunk') ||
        msg.includes('dynamically imported module') ||
        msg.includes('MIME type') ||
        msg.includes('SyntaxError') ||
        msg.includes('Unexpected token');

      if (isChunkLoadError) {
        console.warn('ChunkLoadError detectado: Versión desactualizada.');
        if (!triggerSafeReload('chunk_error')) {
          setIsChunkError(true);
          setNeedRefresh(true);
        }
      }
    };

    const handleRejection = (e) => handleError(e.reason);

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('popstate', handleUserNavigation);
      window.removeEventListener('click', handleUserNavigation);
      clearInterval(intervalId);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [checkForUpdates, setNeedRefresh, triggerSafeReload]);

  if ((showWelcomeModal && !isChunkError) || (!needRefresh && !isChunkError)) return null;

  const handleUpdate = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update().catch(() => {});
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
    } catch (e) {
      console.warn('Error clearing caches on manual update', e);
    }
    sessionStorage.removeItem('pfg_auto_reloaded_version');
    sessionStorage.removeItem('pfg_last_safe_reload_time');
    sessionStorage.removeItem('pfg_reload_count');
    if (updateServiceWorker) {
      updateServiceWorker(true);
    }
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return <ModalPortal>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] !pt-[calc(1rem+var(--safe-top))] !pb-[calc(1rem+var(--safe-bottom))]">
      <div className="bg-bg-primary border border-glass-border rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
          {isChunkError ?
            <AlertTriangle className="text-accent animate-pulse" size={24} /> :
            <RefreshCw className="text-accent animate-spin-slow" size={24} />
          }
        </div>

        <h3 className="text-xl font-bold mb-2 text-text-primary">
          {isChunkError ? 'Recarga necesaria' : 'Nueva versión disponible'}
        </h3>

        <p className="text-text-secondary mb-6 text-sm">
          {isChunkError ?
            'Hemos detectado un problema de conexión con la versión actual. Recarga para solucionar el bloqueo.' :
            'Hay una actualización lista con mejoras y correcciones. Actualiza ahora para disfrutar de la mejor experiencia.'}
        </p>

        <button
          onClick={handleUpdate}
          className="w-full py-3 px-4 bg-accent text-accent-contrast font-bold rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2">
          <RefreshCw size={18} />
          Actualizar ahora
        </button>
      </div>
    </div>
  </ModalPortal>;
};

const VersionUpdater = () => {
  // En aplicaciones nativas (Android APK / Capacitor), las actualizaciones se gestionan mediante el paquete APK nativo.
  // Desactivamos el Service Worker updater para evitar bucles o interferencias en el WebView.
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  const [swReady, setSwReady] = useState(false);
  const [initialChunkError, setInitialChunkError] = useState(false);

  useEffect(() => {
    let timerId;
    const enableSW = () => {
      timerId = setTimeout(() => setSwReady(true), 250);
    };

    if (document.readyState === 'complete') {
      enableSW();
    } else {
      window.addEventListener('load', enableSW, { once: true });
    }

    const handleError = (error) => {
      const msg = error?.message || '';
      const isChunkLoadError =
        msg.includes('Loading chunk') ||
        msg.includes('dynamically imported module') ||
        msg.includes('MIME type') ||
        msg.includes('SyntaxError') ||
        msg.includes('Unexpected token') ||
        msg.includes('is not valid JavaScript');

      if (isChunkLoadError) {
        console.warn('ChunkLoadError detectado tempranamente.');
        setInitialChunkError(true);
        setSwReady(true);
      }
    };

    const handleRejection = (e) => handleError(e.reason);

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      clearTimeout(timerId);
      window.removeEventListener('load', enableSW);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (!swReady && !initialChunkError) return null;

  return <SWUpdaterCore initialChunkError={initialChunkError} />;
};

export default VersionUpdater;
