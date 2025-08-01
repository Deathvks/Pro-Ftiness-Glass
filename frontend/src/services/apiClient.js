// Se ha escrito la URL de producción directamente para evitar problemas.
const API_BASE_URL = 'https://fittrack-pro-api.zeabur.app/api';

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
        credentials: 'include'
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
        // Si la respuesta no es JSON, extraemos el texto
        if (err instanceof SyntaxError) {
            const textResponse = await fetch(`${API_BASE_URL}${endpoint}`, config).then(res => res.text());
            return Promise.reject(textResponse || 'Error de red');
        }
        return Promise.reject(err.message);
    }
};

export default apiClient;