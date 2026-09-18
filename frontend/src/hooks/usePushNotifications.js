/* frontend/src/hooks/usePushNotifications.js */
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const timeoutRef = useRef(null);

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
    let isMounted = true;

    if (!isSupported) {
      setError('Notificaciones Push no soportadas por este navegador/dispositivo.');
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        if (isNative) {
          // --- LÓGICA NATIVA ---
          const perm = await PushNotifications.checkPermissions();
          const isLocallySubscribed = localStorage.getItem('native_push_subscribed') === 'true';
          const localToken = localStorage.getItem('native_push_token');
          
          if (!isMounted) return;
          if (perm.receive === 'granted' && isLocallySubscribed) {
            setIsSubscribed(true);
            if (localToken) setSubscription(localToken);
          } else {
            setIsSubscribed(false);
            setSubscription(null);
          }
        } else {
          // --- LÓGICA WEB ---
          const registration = await getServiceWorkerRegistration();
          const currentSubscription = await registration.pushManager.getSubscription();

          if (!isMounted) return;
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
        if (isMounted) {
          setError(`Error al comprobar notificaciones: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSubscription();

    // --- NUEVO: Listeners Nativos de Firebase ---
    let registrationListener;
    let errorListener;

    if (isNative) {
      PushNotifications.addListener('registration', async (token) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        try {
          // Guardamos el token FCM con formato especial para identificarlo en el backend
          await notificationService.subscribeToPush({
            endpoint: `fcm://${token.value}`,
            keys: { p256dh: 'fcm-token', auth: 'native-android' }
          });
          setSubscription(token.value);
          setIsSubscribed(true);
          localStorage.setItem('native_push_subscribed', 'true');
          localStorage.setItem('native_push_token', token.value);
          addToast('¡Notificaciones nativas activadas!', 'success');
        } catch (err) {
          console.error('Error enviando token al backend:', err);
          addToast('Error al vincular con el servidor.', 'error');
        }
        setIsLoading(false);
      }).then(listener => registrationListener = listener);

      PushNotifications.addListener('registrationError', (err) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.error('Error en el registro nativo:', err);
        setError('Error al registrar dispositivo.');
        setIsLoading(false);
      }).then(listener => errorListener = listener);
    }

    // Limpiamos los listeners al desmontar
    return () => {
      isMounted = false;
      if (registrationListener) registrationListener.remove();
      if (errorListener) errorListener.remove();
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
    
    // Fallback timeout global absoluto para asegurar que nunca se quede colgado
    const globalTimeout = setTimeout(() => {
       setIsLoading(false);
       addToast('Tiempo agotado. Comprueba tu conexión o reinicia la app.', 'warning');
    }, 15000);

    try {
      if (isNative) {
        // --- SUSCRIPCIÓN NATIVA (Firebase) ---
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          // Esto dispara el listener 'registration' que configuramos en el useEffect
          timeoutRef.current = setTimeout(() => {
             setIsLoading(false);
             clearTimeout(globalTimeout);
             addToast('Tiempo agotado. Revisa tus servicios de Google Play o la conexión.', 'warning');
          }, 10000);
          await PushNotifications.register(); 
        } else {
          addToast('Permiso denegado. Se abrirán los ajustes para activarlo.', 'warning');
          setTimeout(async () => {
             try {
                const { NativeSettings, AndroidSettings, IOSSettings } = require('capacitor-native-settings');
                if (Capacitor.getPlatform() === 'android') {
                    await NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
                } else if (Capacitor.getPlatform() === 'ios') {
                    await NativeSettings.openIOS({ option: IOSSettings.App });
                }
             } catch(e) {
                 console.log("Error al abrir settings:", e);
             }
          }, 1500);
          setIsLoading(false);
          clearTimeout(globalTimeout);
        }
      } else {
        // --- SUSCRIPCIÓN WEB (VAPID) ---
        // 1. Comprobar permiso
        const permission = Notification.permission;
        if (permission === 'denied') {
          addToast('Has bloqueado las notificaciones. Debes activarlas en los ajustes de tu navegador.', 'error');
          setIsLoading(false);
          clearTimeout(globalTimeout);
          return;
        }

        // 2. Solicitar permiso si es 'default'
        if (permission === 'default') {
          const newPermission = await Notification.requestPermission();
          if (newPermission !== 'granted') {
            addToast('No se ha concedido el permiso para las notificaciones.', 'warning');
            setIsLoading(false);
            clearTimeout(globalTimeout);
            return;
          }
        }

        // 3. Obtener la VAPID key del backend
        const { key: vapidPublicKey } = await notificationService.getVapidKey();

        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // 4. Suscribir el PushManager
        const registration = await Promise.race([
            getServiceWorkerRegistration(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Service Worker timeout')), 5000))
        ]);
        
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
        clearTimeout(globalTimeout);
      }

    } catch (err) {
      clearTimeout(globalTimeout);
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
        localStorage.removeItem('native_push_subscribed');
        localStorage.removeItem('native_push_token');
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