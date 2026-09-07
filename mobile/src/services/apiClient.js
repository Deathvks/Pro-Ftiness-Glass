/* mobile/src/services/apiClient.js */
import useAppStore from '../store/useAppStore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || '192.168.1.100';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:3001/api`;

const apiClient = async (endpoint, options = {}) => {
    const token = useAppStore.getState().token;
    const { body, ...customConfig } = options;

    // Headers por defecto.
    const headers = { ...customConfig.headers };

    // Identificamos plataforma para React Native
    let platform = Platform.OS === 'ios' || Platform.OS === 'android' ? 'native' : 'web';
    
    headers['X-App-Platform'] = platform;

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout para tareas pesadas
    config.signal = controller.signal;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
            // Si la respuesta es un error (ej: 4xx, 5xx), intentamos leer el cuerpo del error.

            // --- MANTENIMIENTO: Detectar si el servidor está en modo mantenimiento ---
            if (response.status === 503) {
                try {
                    const maintenanceData = await response.json();
                    if (maintenanceData.error === 'maintenance') {
                        const maintenanceErr = new Error(maintenanceData.message || '🔧 Estamos en mantenimiento. Volvemos enseguida.');
                        maintenanceErr.status = 503;
                        maintenanceErr.isMaintenance = true;
                        throw maintenanceErr;
                    }
                } catch (e) {
                    if (e.isMaintenance) throw e;
                }
            }

            if (response.status === 401 && !endpoint.includes('/auth/login')) {
                useAppStore.getState().handleSessionExpiry();
                // --- CAMBIO: Interrumpir flujo inmediatamente ---
                throw new Error('Sesión expirada');
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

                const err = new Error(errorMessage);
                err.data = errorData; // Adjuntamos los datos completos
                err.status = response.status; // FUNDAMENTAL para useOfflineSync
                throw err;
            } catch (parseError) {
                if (parseError.data) throw parseError; // Ya es nuestro error personalizado

                // Si no podemos parsear la respuesta, usar mensaje por defecto según status
                if (response.status === 404) {
                    errorMessage = 'Recurso no encontrado';
                } else if (response.status === 403) {
                    errorMessage = 'No tienes permiso para ver este recurso.';
                }
                
                const fallbackErr = new Error(errorMessage);
                fallbackErr.status = response.status;
                throw fallbackErr;
            }
        }

        if (response.status === 204) {
            return; // No hay contenido que devolver
        }

        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);

        const errMessage = (error.message || '').toLowerCase();
        const isNetworkFailure = 
            error.name === 'AbortError' || 
            errMessage.includes('failed to fetch') || 
            errMessage.includes('load failed') || 
            errMessage.includes('networkerror') ||
            errMessage.includes('network request failed');

        // Interceptamos fallos de red (Offline o Timeout por red lentísima) para peticiones de escritura (POST, PUT, DELETE, etc.)
        if (isNetworkFailure && config.method !== 'GET') {
            // No guardamos FormData en la cola por complejidad de serialización (imágenes, etc.)
            const isFormData = body instanceof FormData;

            if (!isFormData) {
                console.log('Detectado modo offline o red muy lenta. Añadiendo petición a la cola de sincronización.');
                useAppStore.getState().addToSyncQueue({ endpoint, options });
                // Lanzamos un error específico para que la UI sepa que se guardó en local
                throw new Error('Conexión inestable. Cambio guardado localmente para sincronizar después.');
            }
        }

        if (isNetworkFailure) {
            if (error.name === 'AbortError') {
                throw new Error('La conexión es muy lenta. Revisa tu internet.');
            }
            throw new Error('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
        }
        
        // Si ya hemos procesado el mensaje, simplemente lo volvemos a lanzar.
        throw error;
    }
};

export default apiClient;