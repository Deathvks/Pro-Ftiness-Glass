/* mobile/src/services/reportService.js */
import apiClient from './apiClient';
import { Platform, Dimensions } from 'react-native';

// Enviar un nuevo reporte (Usuario) con soporte para imágenes
export const createBugReport = async (category, subject, description, images = []) => {
    // Capturamos info técnica básica
    let screenStr = 'unknown';
    try {
        const { width, height } = Dimensions.get('window');
        screenStr = `${Math.round(width)}x${Math.round(height)}`;
    } catch {}

    const deviceInfo = {
        userAgent: typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : `ProFitnessGlass/${Platform.OS}`,
        platform: Platform.OS || 'mobile',
        language: 'es',
        screenSize: screenStr,
        url: typeof window !== 'undefined' && window.location ? window.location.href : 'mobile://app/support'
    };

    // Usamos FormData para permitir la subida de archivos
    const formData = new FormData();
    formData.append('category', category);
    formData.append('subject', subject);
    formData.append('description', description);
    formData.append('deviceInfo', JSON.stringify(deviceInfo));

    // Añadimos cada imagen a la petición con formato compatible React Native / Web
    images.forEach((img, idx) => {
        if (typeof img === 'string') {
            const filename = img.split('/').pop() || `report_${idx}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            formData.append('images', {
                uri: img,
                name: filename,
                type,
            });
        } else if (img && img.uri) {
            formData.append('images', {
                uri: img.uri,
                name: img.fileName || img.name || `report_${idx}.jpg`,
                type: img.mimeType || img.type || 'image/jpeg',
            });
        } else {
            formData.append('images', img);
        }
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
