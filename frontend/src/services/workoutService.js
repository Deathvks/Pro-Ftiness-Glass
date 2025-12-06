/* frontend/src/services/workoutService.js */
import apiClient from './apiClient';

export const getWorkouts = (params) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiClient(`/workouts${query}`);
};

export const logWorkout = (workoutData) => {
    return apiClient('/workouts', { body: workoutData, method: 'POST' });
};

export const deleteWorkout = (workoutId) => {
    return apiClient(`/workouts/${workoutId}`, { method: 'DELETE' });
};