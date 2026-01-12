/* frontend/src/store/useAppStore.js */
import { create } from 'zustand';
import { createAuthSlice } from './authSlice';
import { createDataSlice } from './dataSlice';
import { createWorkoutSlice } from './workoutSlice';
import { createNotificationSlice } from './notificationSlice';
import { createGamificationSlice } from './gamificationSlice';
import { createSocialSlice } from './socialSlice';
import { createSyncSlice } from './syncSlice';

const useAppStore = create((set, get) => ({
    ...createAuthSlice(set, get),
    ...createDataSlice(set, get),
    ...createWorkoutSlice(set, get),
    ...createNotificationSlice(set, get),
    ...createGamificationSlice(set, get),
    ...createSocialSlice(set, get),
    ...createSyncSlice(set, get),

    // --- Configuración Global: Vibración (Haptics) ---
    hapticsEnabled: (() => {
        try {
            const stored = localStorage.getItem('hapticsEnabled');
            return stored === null ? true : JSON.parse(stored);
        } catch (e) {
            return true;
        }
    })(),

    setHapticsEnabled: (enabled) => {
        try {
            localStorage.setItem('hapticsEnabled', JSON.stringify(enabled));
        } catch (e) {
            console.warn('Error saving haptics preference', e);
        }
        set({ hapticsEnabled: enabled });
    },

    // --- Configuración Global: Tour Guiado ---
    tourCompleted: (() => {
        try {
            return localStorage.getItem('tourCompleted') === 'true';
        } catch (e) {
            return false;
        }
    })(),

    completeTour: () => {
        try {
            localStorage.setItem('tourCompleted', 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ tourCompleted: true });
    },

    // Acción útil para desarrollo o para un botón de "Ver tutorial de nuevo"
    resetTour: () => {
        try {
            localStorage.removeItem('tourCompleted');
        } catch (e) { }
        set({ tourCompleted: false });
    }
}));

export default useAppStore;