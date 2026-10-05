import apiClient from './apiClient';

export const getXPHistory = (limit = 50) => {
    return apiClient(`/gamification/xp-history?limit=${limit}`);
};
