/* frontend/src/services/workoutService.js */
import apiClient from './apiClient';

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