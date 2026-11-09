/* mobile/src/store/syncSlice.js */
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = 'offline_sync_queue';

/** @typedef {{ id: string, endpoint: string, options: Record<string, unknown>, cardioUserId?: number | string }} QueuedRequest */
/** @returns {QueuedRequest[]} */
const getInitialQueue = () => {
    try {
        const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
        const queue = stored ? JSON.parse(stored) : [];
        return Array.isArray(queue) ? queue : [];
    } catch (e) {
        console.error('Failed to parse offline sync queue from localStorage', e);
        return [];
    }
};

const saveQueue = (queue) => {
    try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error('Failed to save offline sync queue to localStorage', e);
    }
};

export const createSyncSlice = (set, get) => ({
    syncQueue: getInitialQueue(),
    hydrateSyncQueue: () => set({ syncQueue: getInitialQueue() }),
    isSyncing: false,

    // Añadir una petición a la cola
    addToSyncQueue: (request) => {
        const { endpoint, options, cardioUserId } = request;
        const currentQueue = get().syncQueue;

        // Evitamos duplicados exactos muy seguidos (opcional, pero recomendado)
        const isDuplicate = currentQueue.some(item =>
            item.endpoint === endpoint &&
            item.cardioUserId === cardioUserId &&
            JSON.stringify(item.options) === JSON.stringify(options)
        );

        if (isDuplicate) return;

        const newQueue = [...currentQueue, {
            id: Crypto.randomUUID(),
            endpoint,
            options,
            cardioUserId,
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
