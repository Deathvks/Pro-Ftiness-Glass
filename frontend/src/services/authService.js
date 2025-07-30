import apiClient from './apiClient';

export const loginUser = (credentials) => {
    return apiClient('/auth/login', { body: credentials, method: 'POST' });
};

export const registerUser = (userData) => {
    return apiClient('/auth/register', { body: userData, method: 'POST' });
};

export const logoutUser = () => {
    return apiClient('/auth/logout', { method: 'POST' });
};