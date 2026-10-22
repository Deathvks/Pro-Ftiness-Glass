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

    // --- Animations Queue ---
    referralAnimationQueue: [],
    addReferralAnimation: (data) => set((state) => ({
        referralAnimationQueue: [...state.referralAnimationQueue, data]
    })),
    shiftReferralAnimation: () => set((state) => ({
        referralAnimationQueue: state.referralAnimationQueue.slice(1)
    })),

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

    // --- Efectos de galaxia en dispositivos táctiles ---
    galaxyEffectsEnabled: (() => {
        try {
            return localStorage.getItem('galaxyEffectsEnabled') === 'true';
        } catch (e) {
            return false;
        }
    })(),

    setGalaxyEffectsEnabled: (enabled) => {
        try {
            localStorage.setItem('galaxyEffectsEnabled', JSON.stringify(enabled));
        } catch (e) {
            console.warn('Error saving Galaxy effects preference', e);
        }
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('galaxy-effects-enabled', enabled);
        }
        set({ galaxyEffectsEnabled: enabled });
    },

    // --- Configuración Global: Tour Guiado General con persistencia robusta por usuario ---
    tourCompleted: (() => {
        try {
            if (localStorage.getItem('tourCompleted') === 'true') return true;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('tourCompleted_') && localStorage.getItem(k) === 'true') {
                    localStorage.setItem('tourCompleted', 'true');
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    })(),

    completeTour: () => {
        try {
            localStorage.setItem('tourCompleted', 'true');
            const uid = get().userProfile?.id;
            if (uid) localStorage.setItem(`tourCompleted_${uid}`, 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ tourCompleted: true });
    },

    resetTour: () => {
        try {
            localStorage.removeItem('tourCompleted');
            const uid = get().userProfile?.id;
            if (uid) localStorage.removeItem(`tourCompleted_${uid}`);
        } catch {
            /* ignore */
        }
        set({ tourCompleted: false });
    },

    // --- Configuración Global: Tour Nutrición ---
    nutritionTourCompleted: (() => {
        try {
            if (localStorage.getItem('nutritionTourCompleted') === 'true') return true;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('nutritionTourCompleted_') && localStorage.getItem(k) === 'true') {
                    localStorage.setItem('nutritionTourCompleted', 'true');
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    })(),

    completeNutritionTour: () => {
        try {
            localStorage.setItem('nutritionTourCompleted', 'true');
            const uid = get().userProfile?.id;
            if (uid) localStorage.setItem(`nutritionTourCompleted_${uid}`, 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ nutritionTourCompleted: true });
    },

    resetNutritionTour: () => {
        try {
            localStorage.removeItem('nutritionTourCompleted');
            const uid = get().userProfile?.id;
            if (uid) localStorage.removeItem(`nutritionTourCompleted_${uid}`);
        } catch {
            /* ignore */
        }
        set({ nutritionTourCompleted: false });
    },

    // --- Configuración Global: Tour Rutinas ---
    routineTourCompleted: (() => {
        try {
            if (localStorage.getItem('routineTourCompleted') === 'true') return true;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('routineTourCompleted_') && localStorage.getItem(k) === 'true') {
                    localStorage.setItem('routineTourCompleted', 'true');
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    })(),

    completeRoutineTour: () => {
        try {
            localStorage.setItem('routineTourCompleted', 'true');
            const uid = get().userProfile?.id;
            if (uid) localStorage.setItem(`routineTourCompleted_${uid}`, 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ routineTourCompleted: true });
    },

    resetRoutineTour: () => {
        try {
            localStorage.removeItem('routineTourCompleted');
            const uid = get().userProfile?.id;
            if (uid) localStorage.removeItem(`routineTourCompleted_${uid}`);
        } catch {
            /* ignore */
        }
        set({ routineTourCompleted: false });
    },

    // --- Configuración Global: Tour Social ---
    socialTourCompleted: (() => {
        try {
            if (localStorage.getItem('socialTourCompleted') === 'true') return true;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('socialTourCompleted_') && localStorage.getItem(k) === 'true') {
                    localStorage.setItem('socialTourCompleted', 'true');
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    })(),

    completeSocialTour: () => {
        try {
            localStorage.setItem('socialTourCompleted', 'true');
            const uid = get().userProfile?.id;
            if (uid) localStorage.setItem(`socialTourCompleted_${uid}`, 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ socialTourCompleted: true });
    },

    resetSocialTour: () => {
        try {
            localStorage.removeItem('socialTourCompleted');
            const uid = get().userProfile?.id;
            if (uid) localStorage.removeItem(`socialTourCompleted_${uid}`);
        } catch {
            /* ignore */
        }
        set({ socialTourCompleted: false });
    },

    // --- Configuración Global: Tour Hub ---
    hubTourCompleted: (() => {
        try {
            if (localStorage.getItem('hubTourCompleted') === 'true') return true;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('hubTourCompleted_') && localStorage.getItem(k) === 'true') {
                    localStorage.setItem('hubTourCompleted', 'true');
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    })(),

    completeHubTour: () => {
        try {
            localStorage.setItem('hubTourCompleted', 'true');
            const uid = get().userProfile?.id;
            if (uid) localStorage.setItem(`hubTourCompleted_${uid}`, 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ hubTourCompleted: true });
    },

    resetHubTour: () => {
        try {
            localStorage.removeItem('hubTourCompleted');
            const uid = get().userProfile?.id;
            if (uid) localStorage.removeItem(`hubTourCompleted_${uid}`);
        } catch {
            /* ignore */
        }
        set({ hubTourCompleted: false });
    },

    // Sincronización bidireccional de tours para el usuario activo (evita que reaparezcan tras actualizar)
    syncToursForUser: (profile) => {
        if (!profile?.id) return;
        const uid = profile.id;
        const tourList = [
            'tourCompleted',
            'nutritionTourCompleted',
            'routineTourCompleted',
            'socialTourCompleted',
            'hubTourCompleted'
        ];
        const updates = {};
        tourList.forEach((key) => {
            const isCompleted = localStorage.getItem(key) === 'true' || localStorage.getItem(`${key}_${uid}`) === 'true';
            if (isCompleted) {
                localStorage.setItem(key, 'true');
                localStorage.setItem(`${key}_${uid}`, 'true');
                updates[key] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            set(updates);
        }
    }
}));

export default useAppStore;
