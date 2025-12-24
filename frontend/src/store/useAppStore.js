/* frontend/src/store/useAppStore.js */
import { create } from 'zustand';
import { createAuthSlice } from './authSlice';
import { createDataSlice } from './dataSlice';
import { createWorkoutSlice } from './workoutSlice';
import { createNotificationSlice } from './notificationSlice';
import { createGamificationSlice } from './gamificationSlice';
import { createSocialSlice } from './socialSlice';
// --- INICIO DE LA MODIFICACIÓN ---
import { createSyncSlice } from './syncSlice';
// --- FIN DE LA MODIFICACIÓN ---

const useAppStore = create((set, get) => ({
    ...createAuthSlice(set, get),
    ...createDataSlice(set, get),
    ...createWorkoutSlice(set, get),
    ...createNotificationSlice(set, get),
    ...createGamificationSlice(set, get),
    ...createSocialSlice(set, get),
    // --- INICIO DE LA MODIFICACIÓN ---
    ...createSyncSlice(set, get),
    // --- FIN DE LA MODIFICACIÓN ---
}));

export default useAppStore;