/* frontend/src/store/syncSlice.js */
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'offline_sync_queue';

const getInitialQueue = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to parse offline sync queue from localStorage', e);
        return [];
    }
};

const saveQueue = (queue) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error('Failed to save offline sync queue to localStorage', e);
    }
};

export const createSyncSlice = (set, get) => ({
    syncQueue: getInitialQueue(),
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

        const newQueue = [...currentQueue, {
            id: uuidv4(),
            endpoint,
            options,
            timestamp: Date.now(),
            retryCount: 0
        }];
        
        saveQueue(newQueue);
        set({ syncQueue: newQueue });
    },

    // Eliminar una petición de la cola (por éxito o descarte)
    removeFromSyncQueue: (id) => {
        const newQueue = get().syncQueue.filter(item => item.id !== id);
        saveQueue(newQueue);
        set({ syncQueue: newQueue });
    },

    // Actualizar estado de sincronización
    setSyncing: (status) => set({ isSyncing: status }),

    // Limpiar toda la cola (útil al cerrar sesión)
    clearSyncQueue: () => {
        saveQueue([]);
        set({ syncQueue: [] });
    },
});