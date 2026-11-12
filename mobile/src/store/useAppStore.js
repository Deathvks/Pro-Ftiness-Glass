import '@/utils/localStoragePolyfill';
import { create } from 'zustand';
import { Appearance, Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { getThemeBaseBackground } from '@/constants/theme';
import { createAuthSlice } from './authSlice';
import { createDataSlice } from './dataSlice';
import { createWorkoutSlice } from './workoutSlice';
import { createNotificationSlice } from './notificationSlice';
import { createGamificationSlice } from './gamificationSlice';
import { createSocialSlice } from './socialSlice';
import { createSyncSlice } from './syncSlice';
import { createStorySlice } from './storySlice';
import { createRoutineEditorSlice } from './routineEditorSlice';

// 'system' es una preferencia del usuario; el resto de la app trabaja siempre con el tema resuelto
export const resolveTheme = (pref) => {
    if (pref === 'system') {
        return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
    }
    return pref || 'oled';
};

let themeTestInterval = null;
const clearThemeTestInterval = () => {
    if (themeTestInterval) {
        clearInterval(themeTestInterval);
        themeTestInterval = null;
    }
};

const isDarkTheme = theme => !['light', 'ocean', 'desert'].includes(theme);
let nativeScheme;
let nativeBackground;
let nativeNavigationStyle;

export const applyNativeColorScheme = (pref, theme) => {
    if (Platform.OS === 'web') return;

    const scheme = pref === 'system' ? 'unspecified' : isDarkTheme(theme) ? 'dark' : 'light';
    if (scheme !== nativeScheme) {
        try {
            Appearance.setColorScheme(scheme);
            nativeScheme = scheme;
        } catch {}
    }

    if (Platform.OS !== 'android') return;

    const active = pref === 'system' ? resolveTheme(pref) : theme;
    const background = getThemeBaseBackground(active);
    if (background !== nativeBackground) {
        try {
            nativeBackground = background;
            void SystemUI.setBackgroundColorAsync(background).catch(() => {
                if (nativeBackground === background) nativeBackground = undefined;
            });
        } catch {
            nativeBackground = undefined;
        }
    }

    const style = isDarkTheme(active) ? 'light' : 'dark';
    if (style !== nativeNavigationStyle) {
        try {
            const NavigationBar = require('expo-navigation-bar');
            NavigationBar.setStyle(style);
            nativeNavigationStyle = style;
        } catch {}
    }
};

const initialThemePref = (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null) || 'oled';

const useAppStore = create((set, get) => ({
    hydrateFromStorage: () => {
        if (typeof localStorage === 'undefined') return;
        
        const theme = localStorage.getItem('theme');
        if (theme) set({ themePreference: theme, theme: resolveTheme(theme) });
        
        const accent = localStorage.getItem('accent');
        if (accent) set({ accent });
        
        const haptics = localStorage.getItem('hapticsEnabled');
        if (haptics !== null) {
            try { set({ hapticsEnabled: JSON.parse(haptics) }); } catch(e){}
        }

        const galaxyEffects = localStorage.getItem('galaxyEffectsEnabled');
        if (galaxyEffects !== null) {
            try { set({ galaxyEffectsEnabled: JSON.parse(galaxyEffects) }); } catch(e){}
        }
        
                const tours = ['tourCompleted', 'nutritionTourCompleted', 'routineTourCompleted', 'socialTourCompleted', 'hubTourCompleted'];
        tours.forEach(tour => {
            if (localStorage.getItem(tour) === 'true') set({ [tour]: true });
        });
        
        const routineDraft = localStorage.getItem('routineEditorState');
        if (routineDraft) {
            try { set({ routineEditorState: JSON.parse(routineDraft) }); } catch(e){}
        }
        
        // Hydrate AI queries
        const lastDate = localStorage.getItem('ai_last_date');
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
        let aiRemaining = localStorage.getItem('ai_remaining_uses');
        let aiLimit = localStorage.getItem('ai_daily_limit');
        
        if (lastDate !== today) {
            localStorage.removeItem('ai_remaining_uses');
            localStorage.setItem('ai_last_date', today);
            aiRemaining = null;
        }
        
        if (aiRemaining !== null) {
            set(state => ({
                gamification: {
                    ...state.gamification,
                    ai_queries_remaining: parseInt(aiRemaining, 10),
                    ai_queries_limit: aiLimit ? parseInt(aiLimit, 10) : 5
                }
            }));
        }
    },
    themePreference: initialThemePref,
    theme: resolveTheme(initialThemePref),
    setTheme: (pref) => {
        const current = get();
        if (pref === current.themePreference && !current.themeTest) return;
        clearThemeTestInterval();
        const resolved = pref === 'system' && current.themeTest?.previousTheme && pref === current.themePreference
            ? current.themeTest.previousTheme
            : resolveTheme(pref);
        set({ themePreference: pref, theme: resolved, themeTest: null });
        if (typeof localStorage !== 'undefined') localStorage.setItem('theme', pref);
    },
    // Re-sincroniza el tema cuando el usuario usa "Sistema" y cambia el modo del dispositivo
    syncSystemTheme: () => {
        const { themePreference, themeTest, theme } = get();
        if (themePreference === 'system' && !themeTest) {
            const resolved = resolveTheme('system');
            if (resolved !== theme) set({ theme: resolved });
        }
    },

    // --- Prueba temporal de temas bloqueados (igual que la web) ---
    themeTest: null, // { name, timeLeft, previousTheme }
    startThemeTest: (name = 'galaxy', durationSecs = 10) => {
        clearThemeTestInterval();
        const { theme, themeTest } = get();
        const previousTheme = themeTest?.previousTheme ?? theme;
        set({ theme: name, themeTest: { name, timeLeft: durationSecs, previousTheme } });
        themeTestInterval = setInterval(() => {
            const current = get().themeTest;
            if (!current) {
                clearThemeTestInterval();
                return;
            }
            const left = current.timeLeft - 1;
            if (left <= 0) {
                clearThemeTestInterval();
                const pref = get().themePreference || 'oled';
                const resolved = pref === 'system' ? current.previousTheme : resolveTheme(pref);
                set({ themeTest: null, theme: resolved });
            } else {
                set({ themeTest: { ...current, timeLeft: left } });
            }
        }, 1000);
    },
    cancelThemeTest: () => {
        const { themePreference, themeTest } = get();
        if (!themeTest) return;
        clearThemeTestInterval();
        const resolved = themePreference === 'system' ? themeTest.previousTheme : resolveTheme(themePreference);
        set({ themeTest: null, theme: resolved });
    },
    accent: (typeof localStorage !== 'undefined' && (typeof localStorage !== 'undefined' ? localStorage.getItem('accent') : null)) || '#3b82f6',
    setAccent: (accent) => {
        set({ accent });
        if (typeof localStorage !== 'undefined') if (typeof localStorage !== 'undefined') localStorage.setItem('accent', accent);
    },
    galaxyEffectsEnabled: (typeof localStorage !== 'undefined' && localStorage.getItem('galaxyEffectsEnabled') !== null)
        ? localStorage.getItem('galaxyEffectsEnabled') === 'true'
        : true,
    setGalaxyEffectsEnabled: (enabled) => {
        set({ galaxyEffectsEnabled: enabled });
        if (typeof localStorage !== 'undefined') localStorage.setItem('galaxyEffectsEnabled', JSON.stringify(enabled));
    },
    ...createAuthSlice(set, get),
    ...createDataSlice(set, get),
    ...createWorkoutSlice(set, get),
    ...createNotificationSlice(set, get),
    ...createGamificationSlice(set, get),
    ...createSocialSlice(set, get),
    ...createSyncSlice(set, get),
    ...createStorySlice(set, get),
    ...createRoutineEditorSlice(set, get),

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
            const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('hapticsEnabled') : null);
            return stored === null ? true : JSON.parse(stored);
        } catch (e) {
            return true;
        }
    })(),

    setHapticsEnabled: (enabled) => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem('hapticsEnabled', JSON.stringify(enabled));
        } catch (e) {
            console.warn('Error saving haptics preference', e);
        }
        set({ hapticsEnabled: enabled });
    },

    // --- Configuración Global: Sonido de Descanso ---
    restSoundEnabled: (() => {
        try {
            const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('restSoundEnabled') : null);
            return stored === null ? true : JSON.parse(stored);
        } catch (e) {
            return true;
        }
    })(),

    setRestSoundEnabled: (enabled) => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem('restSoundEnabled', JSON.stringify(enabled));
        } catch (e) {
            console.warn('Error saving rest sound preference', e);
        }
        set({ restSoundEnabled: enabled });
    },

    // --- Configuración Global: Tour Guiado General ---
    tourCompleted: (() => {
        try {
            return (typeof localStorage !== 'undefined' ? localStorage.getItem('tourCompleted') : null) === 'true';
        } catch (e) {
            return false;
        }
    })(),

    completeTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem('tourCompleted', 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ tourCompleted: true });
    },

    resetTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem('tourCompleted');
        } catch (e) { }
        set({ tourCompleted: false });
    },

    // --- Configuración Global: Tour Nutrición ---
    nutritionTourCompleted: (() => {
        try {
            return (typeof localStorage !== 'undefined' ? localStorage.getItem('nutritionTourCompleted') : null) === 'true';
        } catch (e) {
            return false;
        }
    })(),

    completeNutritionTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem('nutritionTourCompleted', 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ nutritionTourCompleted: true });
    },

    resetNutritionTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem('nutritionTourCompleted');
        } catch (e) { }
        set({ nutritionTourCompleted: false });
    },

    // --- Configuración Global: Tour Rutinas ---
    routineTourCompleted: (() => {
        try {
            return (typeof localStorage !== 'undefined' ? localStorage.getItem('routineTourCompleted') : null) === 'true';
        } catch (e) {
            return false;
        }
    })(),

    completeRoutineTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem('routineTourCompleted', 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ routineTourCompleted: true });
    },

    resetRoutineTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem('routineTourCompleted');
        } catch (e) { }
        set({ routineTourCompleted: false });
    },

    // --- Configuración Global: Tour Social ---
    socialTourCompleted: (() => {
        try {
            return (typeof localStorage !== 'undefined' ? localStorage.getItem('socialTourCompleted') : null) === 'true';
        } catch (e) {
            return false;
        }
    })(),

    completeSocialTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem('socialTourCompleted', 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ socialTourCompleted: true });
    },

    resetSocialTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem('socialTourCompleted');
        } catch (e) { }
        set({ socialTourCompleted: false });
    },

    // --- Configuración Global: Tour Hub ---
    hubTourCompleted: (() => {
        try {
            return (typeof localStorage !== 'undefined' ? localStorage.getItem('hubTourCompleted') : null) === 'true';
        } catch (e) {
            return false;
        }
    })(),

    completeHubTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem('hubTourCompleted', 'true');
        } catch (e) {
            console.warn(e);
        }
        set({ hubTourCompleted: true });
    },

    resetHubTour: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem('hubTourCompleted');
        } catch (e) { }
        set({ hubTourCompleted: false });
    }
}));

export default useAppStore;
