import apiClient from './apiClient';

export const submitAppRating = async (rating, comment) => {
    return await apiClient('/ratings', {
        method: 'POST',
        body: { rating, comment }
    });
};

export const getAppRatings = async () => {
    return await apiClient('/admin/ratings');
};

export const getMyRating = async () => {
    return await apiClient('/ratings/me');
};
