/* frontend/src/utils/gpsUtils.js */
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// --- Funciones Matemáticas (Sin cambios, funcionan igual en Web/Native) ---

// Radio de la Tierra en metros
const R = 6371e3;

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
};

export const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};

export const calculatePace = (seconds, meters) => {
  if (meters === 0) return '0:00 /km';
  const km = meters / 1000;
  const paceSeconds = seconds / km;

  const paceMin = Math.floor(paceSeconds / 60);
  const paceSec = Math.round(paceSeconds % 60);

  return `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} /km`;
};

// --- Funciones de Geolocalización (Híbridas Web/Nativo) ---

/**
 * Obtiene la posición actual gestionando permisos.
 * Funciona en Web (pide permiso al navegador) y Nativo (pide permiso al OS).
 */
export const getCurrentLocation = async () => {
  try {
    // Solo verificamos permisos explícitamente en Nativo para asegurar el flujo
    if (Capacitor.isNativePlatform()) {
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          throw new Error('Permiso de ubicación denegado por el usuario.');
        }
      }
    }

    // getCurrentPosition funciona en ambos (en Web usa navigator.geolocation)
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    throw error;
  }
};

/**
 * Inicia el seguimiento de la posición.
 * Devuelve el ID del watcher para poder detenerlo después.
 */
export const watchLocation = async (callback) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        await Geolocation.requestPermissions();
      }
    }

    // watchPosition devuelve un ID
    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
      (position, err) => {
        if (err) {
          console.warn('Error en watchLocation:', err);
          return;
        }
        if (position) {
          callback({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        }
      }
    );

    return watchId;
  } catch (error) {
    console.error('Error iniciando watchLocation:', error);
    return null;
  }
};

/**
 * Detiene el seguimiento de la posición.
 */
export const clearLocationWatch = async (watchId) => {
  if (watchId) {
    await Geolocation.clearWatch({ id: watchId });
  }
};