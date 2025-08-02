import useAppStore from '../store/useAppStore';

// Se ha escrito la URL de producción directamente para evitar problemas.
const API_BASE_URL = 'https://fittrack-pro-api.zeabur.app/api';

/**
 * Cliente genérico para realizar peticiones a la API.
 * @param {string} endpoint - El endpoint de la API al que llamar (ej: '/auth/login').
 * @param {object} options - Opciones para la petición fetch (method, headers, body, etc.).
 */
const apiClient = async (endpoint, options = {}) => {
    // --- INICIO DE LA CORRECCIÓN ---
    // Obtenemos el token del store de Zustand en cada llamada.
    const token = useAppStore.getState().token;

    const { body, ...customConfig } = options;
    const headers = { 'Content-Type': 'application/json' };

    // Si existe un token, lo añadimos a la cabecera de autorización.
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // --- FIN DE LA CORRECCIÓN ---

    const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers: {
            ...headers,
            ...customConfig.headers,
        },
        // 'credentials' ya no es necesario porque no usamos cookies para la auth.
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        if (!response.ok) {
            // Si el token es inválido o expiró, deslogueamos al usuario.
            if (response.status === 401 || response.status === 403) {
                useAppStore.getState().handleLogout();
            }
            throw new Error(data.error || response.statusText);
        }
        return data;
    } catch (err) {
        if (err instanceof SyntaxError) {
            const textResponse = await fetch(`${API_BASE_URL}${endpoint}`, config).then(res => res.text());
            return Promise.reject(textResponse || 'Error de red');
        }
        return Promise.reject(err.message);
    }
};

export default apiClient;