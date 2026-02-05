/* frontend/src/store/useAppStore.js */
import { create } from 'zustand';
import { createAuthSlice } from './authSlice';
import { createDataSlice } from './dataSlice';
import { createWorkoutSlice } from './workoutSlice';
import { createNotificationSlice } from './notificationSlice';
import { createGamificationSlice } from './gamificationSlice';
import { createSocialSlice } from './socialSlice';
import { createSyncSlice } from './syncSlice';
import { createStorySlice } from './storySlice';

const useAppStore = create((set, get) => ({
    ...createAuthSlice(set, get),
    ...createDataSlice(set, get),
    ...createWorkoutSlice(set, get),
    ...createNotificationSlice(set, get),
    ...createGamificationSlice(set, get),
    ...createSocialSlice(set, get),
    ...createSyncSlice(set, get),
    ...createStorySlice(set, get),

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

    // --- Configuración Global: Tour Guiado General ---
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

    resetTour: () => {
        try {
            localStorage.removeItem('tourCompleted');
        } catch (e) { }
        set({ tourCompleted: false });
    },

    // --- Configuración Global: Tour Nutrición ---
    nutritionTourCompleted: (() => {
        try {
            return localStorage.getItem('nutritionTourCompleted') === 'true';
        } catch (e) {
            return false;
        }
    })(),

    completeNutritionTour: () => {
        try {
            localStorage.setItem('nutritionTourCompleted', 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ nutritionTourCompleted: true });
    },

    resetNutritionTour: () => {
        try {
            localStorage.removeItem('nutritionTourCompleted');
        } catch (e) { }
        set({ nutritionTourCompleted: false });
    }
}));

export default useAppStore;