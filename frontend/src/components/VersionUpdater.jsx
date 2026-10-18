import ModalPortal from './ModalPortal';
/* frontend/src/components/VersionUpdater.jsx */
import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const VersionUpdater = () => {
  const [isChunkError, setIsChunkError] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      r && setInterval(() => { r.update(); }, 60 * 60 * 1000);
    }
  });

  useEffect(() => {
    const handleError = (error) => {
      const msg = error?.message || '';
      const isChunkLoadError =
        msg.includes('Loading chunk') ||
        msg.includes('dynamically imported module') ||
        msg.includes('MIME type');

      if (isChunkLoadError) {
        console.warn('ChunkLoadError detectado: Versión desactualizada.');
        setIsChunkError(true);
        setNeedRefresh(true);
      }
    };

    const handleRejection = (e) => handleError(e.reason);

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [setNeedRefresh]);

  if (!needRefresh && !isChunkError) return null;

  const handleUpdate = () => {
    if (updateServiceWorker) {
      updateServiceWorker(true);
    }
    setTimeout(() => {
      window.location.reload();
    }, 500);
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

export default VersionUpdater;