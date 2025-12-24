/* frontend/src/services/apiClient.js */
import useAppStore from '../store/useAppStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error('FATAL ERROR: La variable de entorno VITE_API_BASE_URL no está definida. Por favor, configura esta variable en tu entorno de despliegue (ej: Zeabur) apuntando a la URL de tu backend.');
}

const apiClient = async (endpoint, options = {}) => {
    const token = useAppStore.getState().token;
    const { body, ...customConfig } = options;

    // Headers por defecto.
    const headers = { ...customConfig.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers,
    };

    // Diferenciamos entre body de tipo FormData (para subida de archivos) 
    // y body de tipo JSON (para todo lo demás).
    if (body) {
        if (body instanceof FormData) {
            // Si es FormData, NO establecemos Content-Type. 
            // El navegador lo hará automáticamente con el 'boundary' correcto.
            config.body = body;
        } else {
            // Si es un objeto JSON, sí establecemos Content-Type y lo convertimos a string.
            headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(body);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            // Si la respuesta es un error (ej: 4xx, 5xx), intentamos leer el cuerpo del error.

            if (response.status === 401) {
                useAppStore.getState().handleSessionExpiry();
            }

            let errorMessage = 'Ha ocurrido un error inesperado.';

            try {
                const errorData = await response.json();
                // Priorizamos el mensaje de error específico de nuestra API
                if (errorData.error) {
                    errorMessage = errorData.error;
                    // Luego, los errores de validación de express-validator
                } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                    errorMessage = errorData.errors[0].msg;
                }
            } catch (parseError) {
                // Si no podemos parsear la respuesta, usar mensaje por defecto según status
                if (response.status === 404) {
                    errorMessage = 'Recurso no encontrado';
                } else if (response.status === 403) {
                    errorMessage = 'No tienes permiso para ver este recurso.';
                }
            }

            throw new Error(errorMessage);
        }

        if (response.status === 204) {
            return; // No hay contenido que devolver
        }

        return response.json();
    } catch (error) {
        // --- INICIO DE LA MODIFICACIÓN ---
        // Interceptamos fallos de red (Offline) para peticiones de escritura (POST, PUT, DELETE, etc.)
        if (error.message === 'Failed to fetch' && config.method !== 'GET') {
            // No guardamos FormData en la cola por complejidad de serialización (imágenes, etc.)
            const isFormData = body instanceof FormData;

            if (!isFormData) {
                console.log('Detectado modo offline. Añadiendo petición a la cola de sincronización.');
                useAppStore.getState().addToSyncQueue({ endpoint, options });
                // Lanzamos un error específico para que la UI sepa que se guardó en local
                throw new Error('Sin conexión. Cambio guardado localmente para sincronizar después.');
            }
        }
        // --- FIN DE LA MODIFICACIÓN ---

        if (error.message === 'Failed to fetch') {
            throw new Error('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
        }
        // Si ya hemos procesado el mensaje, simplemente lo volvemos a lanzar.
        throw error;
    }
};

export default apiClient;