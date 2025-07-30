import apiClient from './apiClient';

export const getWorkouts = () => {
    return apiClient('/workouts');
};

export const logWorkout = (workoutData) => {
    return apiClient('/workouts', { body: workoutData, method: 'POST' });
};

export const deleteWorkout = (workoutId) => {
    return apiClient(`/workouts/${workoutId}`, { method: 'DELETE' });
};