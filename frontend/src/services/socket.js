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
            token: token
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

    // Manejo de visibilidad en la Web (PWA/Navegador de PC)
    if (!Capacitor.isNativePlatform() && !isListenerRegistered) {
        isListenerRegistered = true;
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                if (socket && socket.disconnected) {
                    console.log('🔋 Web activa: Reconectando socket...');
                    socket.connect();
                }
            } else {
                if (socket && socket.connected) {
                    console.log('🔋 Web oculta: Desconectando socket...');
                    socket.disconnect();
                }
            }
        });
    }

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};