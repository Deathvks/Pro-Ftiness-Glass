/* frontend/src/hooks/useOfflineSync.js */
import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import apiClient from '../services/apiClient';
import { useToast } from './useToast';

export const useOfflineSync = () => {
    const { syncQueue, removeFromSyncQueue, setSyncing, isSyncing, setIsOnline } = useAppStore(state => ({
        syncQueue: state.syncQueue,
        removeFromSyncQueue: state.removeFromSyncQueue,
        setSyncing: state.setSyncing,
        isSyncing: state.isSyncing,
        setIsOnline: state.setIsOnline
    }));

    const { addToast } = useToast();

    useEffect(() => {
        if (setIsOnline) setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
        const handleOnline = async () => {
            if (setIsOnline) setIsOnline(true);
            // Obtenemos la versión más reciente de la cola usando el store directamente
            const currentQueue = useAppStore.getState().syncQueue;
            const currentIsSyncing = useAppStore.getState().isSyncing;

            if (!currentQueue || currentQueue.length === 0 || currentIsSyncing) return;

            addToast('Conexión detectada. Sincronizando datos con la nube...', 'info');
            setSyncing(true);

            // Procesar secuencialmente para mantener el orden de operaciones
            const queueToProcess = [...currentQueue];
            let processedCount = 0;
            let hadWorkout = false;

            for (const item of queueToProcess) {
                try {
                    // Reintentamos la petición original
                    await apiClient(item.endpoint, item.options);

                    // Si tiene éxito, la quitamos de la cola
                    removeFromSyncQueue(item.id);
                    processedCount++;
                    if (item.endpoint === '/workouts' || item.endpoint?.startsWith('/workouts')) {
                        hadWorkout = true;
                    }
                } catch (error) {
                    console.error('Fallo al resincronizar item:', item.id, error);

                    // Si el servidor responde con un 4xx (ej: BadRequest/Duplicate) o 5xx persistente,
                    // la única forma de desatascar la cola es eliminar la petición.
                    if (error.status && error.status >= 400) {
                        console.warn(`Descartando item de sincronización por error HTTP ${error.status} irrecoverable.`);
                        removeFromSyncQueue(item.id);
                        processedCount++;
                    } else {
                        // Error de red real (TypeError) o timeout. Paramos el bucle y reintentaremos luego.
                        break;
                    }
                }
            }

            setSyncing(false);

            if (processedCount > 0) {
                if (hadWorkout) {
                    addToast(`¡Conexión recuperada! Entrenamiento sincronizado con éxito (+XP sumada) 🎉`, 'success');
                    try {
                        const fetchInit = useAppStore.getState().fetchInitialData;
                        if (fetchInit) fetchInit();
                    } catch (_) {}
                } else {
                    addToast(`Sincronización completada (${processedCount} cambios).`, 'success');
                }
            }
        };

        const handleOffline = () => {
            if (setIsOnline) setIsOnline(false);
            addToast('Estás offline. Los entrenamientos y cambios se guardarán en tu dispositivo.', 'warning');
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && navigator.onLine) {
                const currentQueue = useAppStore.getState().syncQueue;
                if (currentQueue && currentQueue.length > 0) {
                    handleOnline();
                }
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('pfg-trigger-sync', handleOnline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Intentar sincronizar al cargar la página si ya hay internet y pendientes
        if (navigator.onLine && syncQueue.length > 0) {
            setTimeout(() => {
                handleOnline();
            }, 1500);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('pfg-trigger-sync', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [removeFromSyncQueue, setSyncing, addToast]);
};
