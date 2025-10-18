import useAppStore from '../store/useAppStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('FATAL ERROR: La variable de entorno VITE_API_BASE_URL no está definida. Por favor, configura esta variable en tu entorno de despliegue (ej: Zeabur) apuntando a la URL de tu backend.');
}

const apiClient = async (endpoint, options = {}) => {
    // --- INICIO DE LA MODIFICACIÓN ---
    // Usamos getState() ya que no estamos en un componente React
    const token = useAppStore.getState().token;
    // --- FIN DE LA MODIFICACIÓN ---
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

        if (!response.ok) {
            // --- INICIO DE LA MODIFICACIÓN ---
            // Si la respuesta es un error de autenticación (ej: token expirado)
            if (response.status === 401 || response.status === 403) {
                // Comprobamos si hay un entrenamiento activo ANTES de llamar a logout
                const workoutIsActive = !!useAppStore.getState().activeWorkout;
                // Llamamos a handleLogout indicando si debe preservar el workout
                useAppStore.getState().handleLogout(workoutIsActive);
                // Lanzamos un error específico para evitar procesar más
                throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
            }
            // --- FIN DE LA MODIFICACIÓN ---

            let errorMessage = 'Ha ocurrido un error inesperado.';

            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                    errorMessage = errorData.errors[0].msg;
                }
            } catch (parseError) {
                if (response.status === 404) {
                    errorMessage = 'Recurso no encontrado';
                }
            }

            throw new Error(errorMessage);
        }

        if (response.status === 204) {
            return; // No hay contenido que devolver
        }

        return response.json();
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
        }
        throw error;
    }
};

export default apiClient;