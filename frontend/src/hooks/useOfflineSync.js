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
            if (syncQueue.length === 0 || isSyncing) return;

            addToast('Conexión recuperada. Sincronizando cambios...', 'info');
            setSyncing(true);

            // Procesar secuencialmente para mantener el orden de operaciones
            const queueToProcess = [...syncQueue];
            let processedCount = 0;

            for (const item of queueToProcess) {
                try {
                    // Reintentamos la petición original
                    // apiClient obtendrá el token actual automáticamente
                    await apiClient(item.endpoint, item.options);

                    // Si tiene éxito, la quitamos de la cola
                    removeFromSyncQueue(item.id);
                    processedCount++;
                } catch (error) {
                    console.error('Fallo al resincronizar item:', item.id, error);
                    // Si falla (ej: la conexión es inestable y se va de nuevo),
                    // paramos el bucle. Se reintentará en el próximo evento.
                    break;
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
        if (navigator.onLine && syncQueue.length > 0) {
            handleOnline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncQueue, isSyncing, removeFromSyncQueue, setSyncing, addToast]);
};