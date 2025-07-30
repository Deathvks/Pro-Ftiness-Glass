import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // 1. ESTADO
  isAuthenticated: false,
  userProfile: null,
  routines: [],
  workoutLog: [],
  bodyWeightLog: [],
  isLoading: true,
  prNotification: null,

  // 2. ACCIONES (Actions)
  
  /**
   * Muestra una notificación de nuevo récord personal.
   */
  showPRNotification: (newPRs) => {
    set({ prNotification: newPRs });
    setTimeout(() => set({ prNotification: null }), 7000);
  },

  /**
   * Carga todos los datos iniciales del usuario autenticado.
   */
  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const profileResponse = await fetch('http://localhost:3001/api/users/me', { credentials: 'include' });
      if (!profileResponse.ok) {
        throw new Error('Sesión no válida.');
      }
      const profileData = await profileResponse.json();
      set({ userProfile: profileData, isAuthenticated: true });

      if (profileData.goal) {
        const [routinesRes, workoutsRes, bodyweightRes] = await Promise.all([
          fetch('http://localhost:3001/api/routines', { credentials: 'include' }),
          fetch('http://localhost:3001/api/workouts', { credentials: 'include' }),
          fetch('http://localhost:3001/api/bodyweight', { credentials: 'include' })
        ]);
        set({
          routines: await routinesRes.json(),
          workoutLog: await workoutsRes.json(),
          bodyWeightLog: await bodyweightRes.json(),
        });
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      get().handleLogout(); // Llama a otra acción del store
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Cierra la sesión del usuario y limpia el estado.
   */
  handleLogout: async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      set({
        isAuthenticated: false,
        userProfile: null,
        routines: [],
        workoutLog: [],
        bodyWeightLog: [],
      });
    }
  },

  /**
   * Registra una nueva sesión de entrenamiento.
   */
  logWorkout: async (workoutData) => {
    try {
      const response = await fetch('http://localhost:3001/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
        credentials: 'include'
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || 'Error al guardar.');
      
      if (responseData.newPRs && responseData.newPRs.length > 0) {
        get().showPRNotification(responseData.newPRs);
      }
      // Vuelve a cargar los datos para reflejar el nuevo entrenamiento
      await get().fetchInitialData(); 
      return { success: true, message: 'Entrenamiento guardado con éxito.' };
    } catch (error) {
      console.error("Error en logWorkout:", error);
      return { success: false, message: `Error al guardar: ${error.message}` };
    }
  },
  
  /**
   * Elimina un registro de entrenamiento.
   */
  deleteWorkoutLog: async (workoutId) => {
    try {
        const response = await fetch(`http://localhost:3001/api/workouts/${workoutId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ocurrió un error.');
        
        // Refresca los datos para eliminar el log de la UI
        await get().fetchInitialData();
        return { success: true, message: 'Entrenamiento eliminado.' };
    } catch (error) {
        console.error("Error en deleteWorkoutLog:", error.message);
        return { success: false, message: `Error al eliminar: ${error.message}` };
    }
  },

  /**
   * Actualiza el perfil del usuario (onboarding o edición).
   */
  updateUserProfile: async (formData) => {
    try {
        const response = await fetch('http://localhost:3001/api/users/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar los datos.');
        }
        await get().fetchInitialData();
        return { success: true, message: 'Perfil actualizado con éxito.' };
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        return { success: false, message: `Error: ${error.message}` };
    }
  },
}));

export default useAppStore;