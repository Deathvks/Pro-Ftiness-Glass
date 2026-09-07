/* frontend/src/services/reportService.js */
import apiClient from './apiClient';

// Enviar un nuevo reporte (Usuario) con soporte para imágenes
export const createBugReport = async (category, subject, description, images = []) => {
    // Capturamos info técnica básica
    const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform || 'unknown',
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        url: window.location.href
    };

    // Usamos FormData para permitir la subida de archivos
    const formData = new FormData();
    formData.append('category', category);
    formData.append('subject', subject);
    formData.append('description', description);
    // Convertimos el objeto de info técnica a string para enviarlo en el FormData
    formData.append('deviceInfo', JSON.stringify(deviceInfo));

    // Añadimos cada imagen a la petición
    images.forEach((image) => {
        formData.append('images', image);
    });

    return await apiClient('/reports', {
        method: 'POST',
        body: formData
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