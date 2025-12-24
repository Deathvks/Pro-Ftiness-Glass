/* frontend/src/services/reportService.js */
import apiClient from './apiClient';

// Enviar un nuevo reporte (Usuario)
export const createBugReport = async (subject, description) => {
    // Capturamos info técnica básica para ayudar al debug
    const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform || 'unknown',
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        url: window.location.href
    };

    return await apiClient('/reports', {
        body: {
            subject,
            description,
            deviceInfo
        }
    });
};

// Obtener todos los reportes (Admin)
export const getBugReports = async () => {
    return await apiClient('/admin/reports');
};

// Eliminar o resolver un reporte (Admin)
export const deleteBugReport = async (id) => {
    return await apiClient(`/admin/reports/${id}`, {
        method: 'DELETE'
    });
};