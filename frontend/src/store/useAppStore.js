/* frontend/src/store/useAppStore.js */
import { create } from 'zustand';
import { createAuthSlice } from './authSlice';
import { createDataSlice } from './dataSlice';
import { createWorkoutSlice } from './workoutSlice';
// --- INICIO DE LA MODIFICACIÓN ---
import { createNotificationSlice } from './notificationSlice';
// --- FIN DE LA MODIFICACIÓN ---

const useAppStore = create((set, get) => ({
    ...createAuthSlice(set, get),
    ...createDataSlice(set, get),
    ...createWorkoutSlice(set, get),
    // --- INICIO DE LA MODIFICACIÓN ---
    ...createNotificationSlice(set, get),
    // --- FIN DE LA MODIFICACIÓN ---
}));

export default useAppStore;