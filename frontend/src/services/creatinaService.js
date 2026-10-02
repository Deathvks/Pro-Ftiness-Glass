import apiClient from './apiClient';

// Obtener registros de creatina, ahora con filtros opcionales (startDate, endDate)
export const getCreatinaLogs = async (params = {}) => {
    try {
        const urlParams = new URLSearchParams(params);
        const response = await apiClient(`/creatina?${urlParams.toString()}`);
        return response;
    } catch (error) {
        console.error('Error fetching creatina logs:', error);
        throw new Error(error.message || 'Error al obtener registros de creatina');
    }
};

// Crear nuevo registro de creatina
export const createCreatinaLog = async (logData) => {
    try {
        const response = await apiClient('/creatina', {
            method: 'POST',
            body: logData
        });
        return response;
    } catch (error) {
        console.error('Error creating creatina log:', error);
        throw new Error(error.message || 'Error al crear registro de creatina');
    }
};

// Actualizar registro de creatina existente
export const updateCreatinaLog = async (id, logData) => {
    try {
        const response = await apiClient(`/creatina/${id}`, {
            method: 'PUT',
            body: logData
        });
        return response;
    } catch (error) {
        console.error('Error updating creatina log:', error);
        throw new Error(error.message || 'Error al actualizar registro de creatina');
    }
};

// Eliminar registro de creatina
export const deleteCreatinaLog = async (id) => {
    try {
        const response = await apiClient(`/creatina/${id}`, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        console.error('Error deleting creatina log:', error);
        throw new Error(error.message || 'Error al eliminar registro de creatina');
    }
};

// Obtener estadísticas de creatina
export const getCreatinaStats = async () => {
    try {
        const response = await apiClient('/creatina/stats');
        return response;
    } catch (error) {
        console.error('Error fetching creatina stats:', error);
        throw new Error(error.message || 'Error al obtener estadísticas de creatina');
    }
};