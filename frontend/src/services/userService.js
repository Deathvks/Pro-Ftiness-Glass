import apiClient from './apiClient';

export const getMyProfile = () => {
    return apiClient('/users/me');
};

export const updateUserProfile = (profileData) => {
    return apiClient('/users/me', { body: profileData, method: 'PUT' });
};