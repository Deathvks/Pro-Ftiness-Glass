/* frontend/src/services/socket.js */
import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import useAppStore from '../store/useAppStore';

// Obtenemos la URL base.
const API_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_URL ? API_URL.replace('/api', '') : 'http://localhost:3001';

let socket;
let isListenerRegistered = false;

export const initSocket = () => {
    // Evitar crear múltiples conexiones si ya existe una instancia
    if (socket) return socket;

    // Obtener el token actual del store para autenticación
    const token = useAppStore.getState().token;

    if (!token) {
        console.warn("Intentando conectar socket sin token.");
        return null;
    }

    // Inicializar conexión
    socket = io(SOCKET_URL, {
        auth: {
            token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true
    });

    socket.on('connect', function() {
        console.log('🟢 Conectado al servidor de Sockets:', this.id);
    });

    socket.on('connect_error', (err) => {
        console.error('🔴 Error de conexión Socket:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.warn('🟠 Socket desconectado:', reason);
    });

    // --- NUEVO: GESTIÓN DE BATERÍA EN SEGUNDO PLANO ---
    // Registramos el listener solo una vez para evitar duplicados
    if (Capacitor.isNativePlatform() && !isListenerRegistered) {
        isListenerRegistered = true;
        
        CapApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                // Volvemos a la app -> Reconectar si estábamos desconectados
                if (socket && socket.disconnected) {
                    console.log('🔋 App en primer plano: Reconectando socket...');
                    socket.connect();
                }
            } else {
                // App en segundo plano -> Desconectar para ahorrar batería
                if (socket && socket.connected) {
                    console.log('🔋 App en segundo plano: Desconectando socket para ahorrar batería...');
                    socket.disconnect();
                }
            }
        });
    }
    // --- FIN GESTIÓN DE BATERÍA ---

    // --- FIN GESTIÓN DE BATERÍA ---

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};