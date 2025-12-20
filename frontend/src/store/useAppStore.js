/* frontend/src/store/useAppStore.js */
import { create } from 'zustand';
import { createAuthSlice } from './authSlice';
import { createDataSlice } from './dataSlice';
import { createWorkoutSlice } from './workoutSlice';
import { createNotificationSlice } from './notificationSlice';
import { createGamificationSlice } from './gamificationSlice';
// --- INICIO DE LA MODIFICACIÓN ---
import { createSocialSlice } from './socialSlice';
// --- FIN DE LA MODIFICACIÓN ---

const useAppStore = create((set, get) => ({
    ...createAuthSlice(set, get),
    ...createDataSlice(set, get),
    ...createWorkoutSlice(set, get),
    ...createNotificationSlice(set, get),
    ...createGamificationSlice(set, get),
    // --- INICIO DE LA MODIFICACIÓN ---
    ...createSocialSlice(set, get),
    // --- FIN DE LA MODIFICACIÓN ---
}));

export default useAppStore;