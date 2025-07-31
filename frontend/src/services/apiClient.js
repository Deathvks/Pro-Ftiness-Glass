// --- INICIO DE LA MODIFICACIÓN ---
// Usa la variable de entorno de Vite (VITE_).
// Si no está definida, utiliza la URL local como alternativa.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
// --- FIN DE LA MODIFICACIÓN ---

/**
 * Cliente genérico para realizar peticiones a la API.
 * @param {string} endpoint - El endpoint de la API al que llamar (ej: '/auth/login').
 * @param {object} options - Opciones para la petición fetch (method, headers, body, etc.).
 */
const apiClient = async (endpoint, options = {}) => {
    const { body, ...customConfig } = options;

    const headers = { 'Content-Type': 'application/json' };

    const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers: {
            ...headers,
            ...customConfig.headers,
        },
        credentials: 'include' // Incluir cookies en todas las peticiones
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || response.statusText);
        }

        return data;
    } catch (err) {
        return Promise.reject(err.message);
    }
};

export default apiClient;