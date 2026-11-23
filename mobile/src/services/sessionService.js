/* frontend/src/services/sessionService.js */
import apiClient from './apiClient';

export const getSessions = async () => {
    // apiClient devuelve directamente el JSON de la respuesta
    return await apiClient('/sessions');
};

export const revokeSession = async (sessionId) => {
    return await apiClient(`/sessions/${sessionId}`, {
        method: 'DELETE'
    });
};

export const revokeAllOtherSessions = async () => {
    return await apiClient('/sessions/other', {
        method: 'DELETE'
    });
};