// mobile/src/utils/gpsUtils.ts
import * as Location from 'expo-location';

const R = 6371e3; // Radio de la Tierra en metros

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const f1 = toRad(lat1);
  const f2 = toRad(lat2);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(f1) * Math.cos(f2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
};

export const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};

export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('Error solicitando permisos de ubicación:', err);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<{ lat: number; lng: number }> => {
  try {
    // 1. Solicita permiso explícito de ubicación al usuario
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (!canAskAgain) {
        throw new Error(
          'Permiso de ubicación denegado en ajustes. Puedes buscar tu gimnasio por nombre o ciudad.'
        );
      }
      throw new Error(
        'Permiso de ubicación no concedido. Puedes buscar tu gimnasio por nombre o ciudad.'
      );
    }

    // 2. Intentar obtener rápidamente la última posición conocida (instantáneo)
    try {
      const last = await Location.getLastKnownPositionAsync({
        maxAge: 180000,
      });
      if (last?.coords?.latitude && last?.coords?.longitude) {
        return {
          lat: last.coords.latitude,
          lng: last.coords.longitude,
        };
      }
    } catch {
      // Ignorar fallo y continuar con getCurrentPositionAsync
    }

    // 3. Obtener posición GPS en tiempo real
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    if (position?.coords?.latitude && position?.coords?.longitude) {
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    }

    throw new Error('No se pudo determinar tu posición geográfica actual.');
  } catch (error: any) {
    // Fallback para entorno web si aplica
    if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
      return new Promise((resolve, reject) => {
        (navigator as any).geolocation.getCurrentPosition(
          (pos: any) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          () => reject(error),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      });
    }
    throw error;
  }
};
