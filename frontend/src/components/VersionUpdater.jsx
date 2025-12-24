/* frontend/src/components/VersionUpdater.jsx */
import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const VersionUpdater = () => {
    // Hook de PWA para detectar actualizaciones del Service Worker
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            // Comprobar actualizaciones cada hora
            r && setInterval(() => { r.update(); }, 60 * 60 * 1000);
        },
    });

    const [isChunkError, setIsChunkError] = useState(false);

    useEffect(() => {
        // Listener para errores de carga de chunks (versión antigua vs nueva)
        const handleError = (error) => {
            const msg = error.message || '';
            const isChunkLoadError = msg.includes('Loading chunk') || msg.includes('dynamically imported module');

            if (isChunkLoadError) {
                console.warn('ChunkLoadError detectado: Versión desactualizada.');
                setIsChunkError(true);
                setNeedRefresh(true);
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', (e) => handleError(e.reason));

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleError);
        };
    }, [setNeedRefresh]);

    if (!needRefresh && !isChunkError) return null;

    const handleUpdate = () => {
        if (updateServiceWorker) {
            updateServiceWorker(true);
        }
        // Fallback forzoso por si falla el SW o es un error de chunk
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
            <div className="bg-bg-primary border border-glass-border rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                    {isChunkError ? (
                        <AlertTriangle className="text-accent animate-pulse" size={24} />
                    ) : (
                        <RefreshCw className="text-accent animate-spin-slow" size={24} />
                    )}
                </div>

                <h3 className="text-xl font-bold mb-2 text-white">
                    {isChunkError ? 'Recarga necesaria' : 'Nueva versión disponible'}
                </h3>

                <p className="text-text-muted mb-6 text-sm">
                    {isChunkError
                        ? 'Hemos detectado un problema de conexión con la versión actual. Recarga para solucionar el bloqueo.'
                        : 'Hay una actualización lista con mejoras y correcciones. Actualiza ahora para disfrutar de la mejor experiencia.'}
                </p>

                <button
                    onClick={handleUpdate}
                    className="w-full py-3 px-4 bg-accent text-bg-primary font-bold rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw size={18} />
                    Actualizar ahora
                </button>
            </div>
        </div>
    );
};

export default VersionUpdater;