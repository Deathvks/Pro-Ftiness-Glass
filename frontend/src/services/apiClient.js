import useAppStore from '../store/useAppStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = async (endpoint, options = {}) => {
    const token = useAppStore.getState().token;
    const { body, ...customConfig } = options;
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers: { ...headers, ...customConfig.headers },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                useAppStore.getState().handleLogout();
            }
            // --- INICIO DE LA MODIFICACIÓN ---
            // Construye un mensaje de error claro a partir de la respuesta de la API
            let errorMessage = data.error || 'Ha ocurrido un error inesperado.';
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                errorMessage = data.errors[0].msg; // Extrae el mensaje de express-validator
            }
            throw new Error(errorMessage);
            // --- FIN DE LA MODIFICACIÓN ---
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