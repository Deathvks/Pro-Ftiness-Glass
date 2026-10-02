import apiClient from './apiClient';

export const submitAppRating = async (rating, comment) => {
    return await apiClient('/ratings', {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
    });
};

export const getAppRatings = async () => {
    return await apiClient('/admin/ratings');
};
