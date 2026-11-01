/* frontend/src/services/workoutService.js */
import apiClient from './apiClient';
import useAppStore from '../store/useAppStore';

export const getWorkouts = (params) => {
    const finalParams = params ? { ...params } : {};
    if (finalParams.date && finalParams.tzOffset === undefined) {
      finalParams.tzOffset = new Date().getTimezoneOffset();
    }
    const query = Object.keys(finalParams).length > 0 ? `?${new URLSearchParams(finalParams)}` : '';
    return apiClient(`/workouts${query}`);
};

export const logWorkout = (workoutData) => {
    return apiClient('/workouts', { body: workoutData, method: 'POST' });
};

export const deleteWorkout = (workoutId) => {
    return apiClient(`/workouts/${workoutId}`, { method: 'DELETE' });
};

export const importWorkouts = (data) => {
    return apiClient('/workouts/import', { body: data, method: 'POST' });
};

export const exportWorkoutsCSV = async () => {
    const token = useAppStore.getState().token;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(`${API_BASE_URL}/workouts/export/csv`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al exportar el historial de entrenamientos.');
    }

    return response.blob();
};
