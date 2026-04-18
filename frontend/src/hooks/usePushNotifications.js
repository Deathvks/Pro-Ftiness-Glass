/* frontend/src/hooks/usePushNotifications.js */
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';
import * as notificationService from '../services/notificationService';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

// Función helper (sin cambios)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook para gestionar la suscripción a notificaciones Push.
 * @returns {object} - { isSubscribed, subscribe, unsubscribe, isLoading, error, isSupported }
 */
export const usePushNotifications = () => {
  const { addToast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NUEVO: Detectar si es App Nativa o Web ---
  const isNative = Capacitor.isNativePlatform();

  // Comprueba si las notificaciones y service workers son compatibles (o si es nativo)
  const isSupported = isNative || ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window);

  /**
   * Obtiene el Service Worker (SW) registrado.
   * (sin cambios)
   */
  const getServiceWorkerRegistration = useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      throw new Error('Service Worker no está listo.');
    }
    return registration;
  }, []);

  /**
   * Comprueba el estado de la suscripción al cargar el hook.
   */
  useEffect(() => {
    if (!isSupported) {
      setError('Notificaciones Push no soportadas por este navegador/dispositivo.');
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (isNative) {
          // --- LÓGICA NATIVA ---
          const perm = await PushNotifications.checkPermissions();
          if (perm.receive === 'granted') {
            setIsSubscribed(true);
          }
        } else {
          // --- LÓGICA WEB ---
          const registration = await getServiceWorkerRegistration();
          const currentSubscription = await registration.pushManager.getSubscription();

          if (currentSubscription) {
            setIsSubscribed(true);
            setSubscription(currentSubscription);
          } else {
            setIsSubscribed(false);
            setSubscription(null);
          }
        }
      } catch (err) {
        console.error('Error comprobando suscripción:', err);
        setError(`Error al comprobar notificaciones: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();

    // --- NUEVO: Listeners Nativos de Firebase ---
    if (isNative) {
      PushNotifications.addListener('registration', async (token) => {
        try {
          // Guardamos el token FCM con formato especial para identificarlo en el backend
          await notificationService.subscribeToPush({
            endpoint: `fcm://${token.value}`,
            keys: { p256dh: 'fcm-token', auth: 'native-android' }
          });
          setSubscription(token.value);
          setIsSubscribed(true);
          addToast('¡Notificaciones nativas activadas!', 'success');
        } catch (err) {
          console.error('Error enviando token al backend:', err);
          addToast('Error al vincular con el servidor.', 'error');
        }
        setIsLoading(false);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('Error en el registro nativo:', err);
        setError('Error al registrar dispositivo.');
        setIsLoading(false);
      });
    }

    // Limpiamos los listeners al desmontar
    return () => {
      if (isNative) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [isSupported, getServiceWorkerRegistration, isNative, addToast]);

  /**
   * Proceso de Suscripción
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      addToast('Tu dispositivo no soporta notificaciones push.', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isNative) {
        // --- SUSCRIPCIÓN NATIVA (Firebase) ---
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          // Esto dispara el listener 'registration' que configuramos en el useEffect
          await PushNotifications.register(); 
        } else {
          addToast('No se ha concedido el permiso para las notificaciones.', 'warning');
          setIsLoading(false);
        }
      } else {
        // --- SUSCRIPCIÓN WEB (VAPID) ---
        // 1. Comprobar permiso
        const permission = Notification.permission;
        if (permission === 'denied') {
          addToast('Has bloqueado las notificaciones. Debes activarlas en los ajustes de tu navegador.', 'error');
          setIsLoading(false);
          return;
        }

        // 2. Solicitar permiso si es 'default'
        if (permission === 'default') {
          const newPermission = await Notification.requestPermission();
          if (newPermission !== 'granted') {
            addToast('No se ha concedido el permiso para las notificaciones.', 'warning');
            setIsLoading(false);
            return;
          }
        }

        // 3. Obtener la VAPID key del backend
        const { key: vapidPublicKey } = await notificationService.getVapidKey();

        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // 4. Suscribir el PushManager
        const registration = await getServiceWorkerRegistration();
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        // 5. Enviar la suscripción al backend
        await notificationService.subscribeToPush(newSubscription);

        setSubscription(newSubscription);
        setIsSubscribed(true);
        addToast('¡Notificaciones activadas!', 'success');
        setIsLoading(false);
      }

    } catch (err) {
      // --- INICIO DE LA MODIFICACIÓN: Detección de error específico de Brave ---
      const errorMessage = err.message || '';
      
      // El error típico de Brave cuando los servicios de Google están deshabilitados es:
      // "Registration failed - push service error"
      if (errorMessage.includes('push service error')) {
        addToast('Error de navegador: Si usas Brave, activa "Servicios de Google para mensajería push" en Configuración > Privacidad.', 'error', 6000);
        setError('Servicios Push bloqueados por el navegador (ej. Brave Shields).');
      } else {
        addToast(`Error al activar notificaciones: ${errorMessage}`, 'error');
        setError('Error al activar notificaciones.');
      }
      // --- FIN DE LA MODIFICACIÓN ---
      console.error('Error completo de suscripción:', err);
      setIsLoading(false);
    }
  }, [isSupported, isNative, addToast, getServiceWorkerRegistration]);

  /**
   * Proceso de Desuscripción
   */
  const unsubscribe = useCallback(async () => {
    if (!isSubscribed) {
      addToast('No estás suscrito.', 'warning');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let endpointToUnsubscribe;

      if (isNative) {
        // En nativo (Capacitor) eliminamos nuestra referencia en el servidor
        endpointToUnsubscribe = `fcm://${subscription}`;
      } else {
        // 1. Desuscribir el PushManager (local web)
        if (subscription && typeof subscription.unsubscribe === 'function') {
          const unsubscribed = await subscription.unsubscribe();
          if (!unsubscribed) {
            throw new Error('No se pudo cancelar la suscripción desde el navegador.');
          }
        }
        endpointToUnsubscribe = subscription ? subscription.endpoint : null;
      }

      // 2. Si la desuscripción local tiene éxito, informar al backend
      if (endpointToUnsubscribe) {
        try {
          await notificationService.unsubscribeFromPush(endpointToUnsubscribe);
        } catch (backendError) {
          console.error('Error al desuscribir del backend:', backendError);
          addToast('Desactivado localmente, pero hubo un error al notificar al servidor.', 'warning');
        }
      }

      setSubscription(null);
      setIsSubscribed(false);
      addToast('Notificaciones desactivadas.', 'success');

    } catch (err) {
      console.error('Error al desuscribirse:', err);
      addToast(`Error al desactivar notificaciones: ${err.message}`, 'error');
      setError('Error al desactivar notificaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [subscription, isSubscribed, isNative, addToast]);

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading,
    error,
    isSupported,
    permission: isSupported && !isNative ? Notification.permission : 'granted'
  };
};