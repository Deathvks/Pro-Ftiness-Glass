/* frontend/src/services/socket.js */
import { io } from 'socket.io-client';
import useAppStore from '../store/useAppStore';

// Obtenemos la URL base. Si VITE_API_BASE_URL es "http://localhost:3001/api",
// el socket debe conectarse a "http://localhost:3001" (sin el /api)
const API_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_URL ? API_URL.replace('/api', '') : 'http://localhost:3001';

let socket;

export const initSocket = () => {
    // Evitar crear múltiples conexiones si ya existe una activa
    if (socket && socket.connected) return socket;

    // Obtener el token actual del store para autenticación
    const token = useAppStore.getState().token;

    if (!token) {
        console.warn("Intentando conectar socket sin token.");
        return null;
    }

    // Inicializar conexión
    socket = io(SOCKET_URL, {
        auth: {
            token: token // Enviamos el token para que el backend sepa quiénes somos
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true
    });

    socket.on('connect', () => {
        console.log('🟢 Conectado al servidor de Sockets:', socket.id);
    });

    socket.on('connect_error', (err) => {
        console.error('🔴 Error de conexión Socket:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.warn('🟠 Socket desconectado:', reason);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};