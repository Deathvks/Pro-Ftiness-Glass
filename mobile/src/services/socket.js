/* frontend/src/services/socket.js */
import { io } from 'socket.io-client';


import useAppStore from '../store/useAppStore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || '192.168.1.100';

const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:3001/api`;
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
        if (__DEV__) console.log('🟢 Conectado al servidor de Sockets:', this.id);
    });

    socket.on('connect_error', (err) => {
        console.error('🔴 Error de conexión Socket:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.warn('🟠 Socket desconectado:', reason);
    });

    // --- NUEVO: GESTIÓN DE BATERÍA EN SEGUNDO PLANO ---
    // Registramos el listener solo una vez para evitar duplicados
    if (!isListenerRegistered) {
        isListenerRegistered = true;
        
        const { AppState } = require('react-native');
        AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                if (socket && socket.disconnected) {
                    if (__DEV__) console.log('🟢 App en primer plano: Reconectando socket...');
                    socket.connect();
                }
            } else if (nextAppState.match(/inactive|background/)) {
                if (socket && socket.connected) {
                    if (__DEV__) console.log('🔴 App en segundo plano: Desconectando socket para ahorrar batería...');
                    socket.disconnect();
                }
            }
        });
    }

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
