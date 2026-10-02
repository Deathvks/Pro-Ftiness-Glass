/* frontend/src/hooks/useOfflineSync.js */
import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import apiClient from '../services/apiClient';
import { useToast } from './useToast';

export const useOfflineSync = () => {
    const { syncQueue, removeFromSyncQueue, setSyncing, isSyncing } = useAppStore(state => ({
        syncQueue: state.syncQueue,
        removeFromSyncQueue: state.removeFromSyncQueue,
        setSyncing: state.setSyncing,
        isSyncing: state.isSyncing
    }));

    const { addToast } = useToast();

    useEffect(() => {
        const handleOnline = async () => {
            // Obtenemos la versión más reciente de la cola usando el store directamente 
            // para evitar depender de syncQueue en el array de dependencias y causar bucles.
            const currentQueue = useAppStore.getState().syncQueue;
            const currentIsSyncing = useAppStore.getState().isSyncing;

            if (currentQueue.length === 0 || currentIsSyncing) return;

            addToast('Conexión recuperada. Sincronizando cambios...', 'info');
            setSyncing(true);

            // Procesar secuencialmente para mantener el orden de operaciones
            const queueToProcess = [...currentQueue];
            let processedCount = 0;

            for (const item of queueToProcess) {
                try {
                    // Reintentamos la petición original
                    await apiClient(item.endpoint, item.options);

                    // Si tiene éxito, la quitamos de la cola
                    removeFromSyncQueue(item.id);
                    processedCount++;
                } catch (error) {
                    console.error('Fallo al resincronizar item:', item.id, error);
                    
                    // fetch throws Errors with .status attached (modificado en apiClient)
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
                addToast(`Sincronización completada (${processedCount} cambios).`, 'success');
            }
        };

        const handleOffline = () => {
            addToast('Estás offline. Los cambios se guardarán localmente.', 'warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Intentar sincronizar al cargar la página si ya hay internet y pendientes
        // Usamos un timeout corto para que no bloquee el renderizado inicial
        if (navigator.onLine && syncQueue.length > 0) {
            setTimeout(() => {
                handleOnline();
            }, 2000);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
        // Quitamos syncQueue de las dependencias para evitar bucles infinitos cada vez que falla una sincronización
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [removeFromSyncQueue, setSyncing, addToast]);
};