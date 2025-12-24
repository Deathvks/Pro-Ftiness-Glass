/* frontend/src/store/syncSlice.js */
import { v4 as uuidv4 } from 'uuid';

export const createSyncSlice = (set, get) => ({
    syncQueue: [],
    isSyncing: false,

    // Añadir una petición a la cola
    addToSyncQueue: (request) => {
        const { endpoint, options } = request;
        const currentQueue = get().syncQueue;

        // Evitamos duplicados exactos muy seguidos (opcional, pero recomendado)
        const isDuplicate = currentQueue.some(item =>
            item.endpoint === endpoint &&
            JSON.stringify(item.options) === JSON.stringify(options)
        );

        if (isDuplicate) return;

        set({
            syncQueue: [...currentQueue, {
                id: uuidv4(),
                endpoint,
                options,
                timestamp: Date.now(),
                retryCount: 0
            }]
        });
    },

    // Eliminar una petición de la cola (por éxito o descarte)
    removeFromSyncQueue: (id) => {
        set({
            syncQueue: get().syncQueue.filter(item => item.id !== id)
        });
    },

    // Actualizar estado de sincronización
    setSyncing: (status) => set({ isSyncing: status }),

    // Limpiar toda la cola (útil al cerrar sesión)
    clearSyncQueue: () => set({ syncQueue: [] }),
});