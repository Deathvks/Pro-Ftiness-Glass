/* frontend/src/services/apiClient.js */
import useAppStore from '../store/useAppStore';
import { Capacitor } from '@capacitor/core';

const CANONICAL_API_BASE_URL = 'https://profitnessglass.es/api';

const resolveApiBaseUrl = () => {
    const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
    const isLocalDev = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
        !Capacitor.isNativePlatform();

    if (isLocalDev && envUrl && !envUrl.includes('zeabur')) {
        return envUrl;
    }
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('10.0.2.2') || envUrl.includes('zeabur')) {
        return CANONICAL_API_BASE_URL;
    }
    return envUrl;
};

const API_BASE_URL = resolveApiBaseUrl();

const apiClient = async (endpoint, options = {}) => {
    const token = useAppStore.getState().token;
    const { body, queueWhenOffline = true, ...customConfig } = options;

    // Headers por defecto.
    const headers = { ...customConfig.headers };

    // --- MODIFICADO: Identificamos si es Nativo, PWA o Web Normal ---
    let platform = 'web';
    if (Capacitor.isNativePlatform()) {
        platform = 'native';
    } else if (typeof window !== 'undefined') {
        // Detecta PWA instalada en Chrome/Edge/Android
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            platform = 'pwa';
        } 
        // Detecta PWA instalada en iOS Safari
        else if (window.navigator && window.navigator.standalone === true) {
            platform = 'pwa';
        }
    }
    
    headers['X-App-Platform'] = platform;

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: body ? 'POST' : 'GET',
        credentials: 'include',
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
    const requestTimeout = customConfig.timeout || 12000;
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);
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
                        const maintenanceErr = new Error(maintenanceData.message || 'Estamos en mantenimiento. Volvemos enseguida.');
                        maintenanceErr.status = 503;
                        maintenanceErr.isMaintenance = true;
                        throw maintenanceErr;
                    }
                } catch (e) {
                    if (e.isMaintenance) throw e;
                }
            }

            // Solo expirar la sesión si la respuesta corresponde al token que
            // sigue activo. Peticiones antiguas pueden responder después de
            // cerrar sesión o iniciar una sesión nueva.
            if (
                response.status === 401 &&
                token &&
                useAppStore.getState().token === token &&
                !endpoint.startsWith('/auth/')
            ) {
                const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
                const isPublic = currentPath.startsWith('/noticias') ||
                                 currentPath === '/calculadora-1rm' ||
                                 currentPath === '/calculadora-calorias-macros' ||
                                 currentPath === '/ejercicios' ||
                                 currentPath === '/sobre-nosotros' ||
                                 currentPath === '/faq' ||
                                 currentPath === '/privacy' ||
                                 currentPath === '/terms' ||
                                 currentPath === '/aviso-legal' ||
                                 currentPath === '/legal' ||
                                 currentPath.startsWith('/share/');
                if (isPublic) {
                    useAppStore.getState().handleLogout();
                } else {
                    useAppStore.getState().handleSessionExpiry();
                }
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
        if (isNetworkFailure && config.method !== 'GET' && queueWhenOffline) {
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
