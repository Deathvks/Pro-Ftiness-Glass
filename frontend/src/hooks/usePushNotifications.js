/* frontend/src/hooks/usePushNotifications.js */
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';
import * as notificationService from '../services/notificationService';

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

  // Comprueba si las notificaciones y service workers son compatibles
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

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
      setError('Notificaciones Push no soportadas por este navegador.');
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const registration = await getServiceWorkerRegistration();
        const currentSubscription = await registration.pushManager.getSubscription();

        if (currentSubscription) {
          setIsSubscribed(true);
          setSubscription(currentSubscription);
        } else {
          setIsSubscribed(false);
          setSubscription(null);
        }
      } catch (err) {
        console.error('Error comprobando suscripción:', err);
        // --- INICIO DE LA MODIFICACIÓN ---
        // Damos un mensaje de error más específico que puede incluir el error del SW
        setError(`Error al comprobar notificaciones: ${err.message}`);
        // --- FIN DE LA MODIFICACIÓN ---
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSupported, getServiceWorkerRegistration]);

  /**
   * Proceso de Suscripción
   * (sin cambios)
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      addToast('Tu navegador no soporta notificaciones push.', 'error');
      return;
    }

    // 1. Comprobar permiso
    const permission = Notification.permission;
    if (permission === 'denied') {
      addToast('Has bloqueado las notificaciones. Debes activarlas en los ajustes de tu navegador.', 'error');
      return;
    }

    // 2. Solicitar permiso si es 'default'
    if (permission === 'default') {
      const newPermission = await Notification.requestPermission();
      if (newPermission !== 'granted') {
        addToast('No se ha concedido el permiso para las notificaciones.', 'warning');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // 3. Obtener la VAPID key del backend
      const { key: vapidPublicKey } = await notificationService.getVapidKey();

      // --- INICIO DE LA MODIFICACIÓN (Añadir Logs) ---
      console.log('--- DEBUG PUSH (Frontend) ---');
      console.log('Clave VAPID recibida del backend:', vapidPublicKey);
      if (!vapidPublicKey) {
          console.error('¡ERROR FATAL: La clave VAPID del backend es nula o vacía!');
      }
      // --- FIN DE LA MODIFICACIÓN ---

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // --- INICIO DE LA MODIFICACIÓN (Añadir Logs) ---
      console.log('Clave VAPID convertida (applicationServerKey):', applicationServerKey);
      console.log('Intentando suscribirse al PushManager...');
      // --- FIN DE LA MODIFICACIÓN ---

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

    } catch (err) {
      // --- INICIO DE LA MODIFICACIÓN (Añadir Logs) ---
      console.error('--- DEBUG PUSH (Frontend) ---');
      console.error('Error detallado al suscribirse:', err);
      console.error('Error Name:', err.name);
      console.error('Error Message:', err.message);
      if (err.name === 'AbortError') {
          console.error('¡Error detectado: AbortError! Esto confirma un problema con la clave VAPID o el servicio push.');
      }
      // --- FIN DE LA MODIFICACIÓN ---
      addToast(`Error al activar notificaciones: ${err.message}`, 'error');
      setError('Error al activar notificaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, addToast, getServiceWorkerRegistration]);

  /**
   * Proceso de Desuscripción
   */
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      addToast('No estás suscrito.', 'warning');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // --- INICIO DE LA MODIFICACIÓN ---
      // Invertimos el orden para priorizar la desuscripción local.
      // El usuario quiere dejar de recibir notificaciones en *este* dispositivo.

      // 1. Desuscribir el PushManager (local)
      const unsubscribed = await subscription.unsubscribe();
      if (!unsubscribed) {
        throw new Error('No se pudo cancelar la suscripción desde el navegador.');
        // --- INICIO DE LA CORRECCIÓN ---
        // Se elimina la 'D' que causaba un error de sintaxis
        // --- FIN DE LA CORRECCIÓN ---
      }

      // 2. Si la desuscripción local tiene éxito, informar al backend
      try {
        await notificationService.unsubscribeFromPush(subscription.endpoint);
      } catch (backendError) {
        // Si el backend falla, lo registramos pero no bloqueamos al usuario,
        // ya que localmente ya está desuscrito.
        console.error('Error al desuscribir del backend (la desuscripción local tuvo éxito):', backendError);
        addToast('Desactivado localmente, pero hubo un error al notificar al servidor.', 'warning');
      }
      // --- FIN DE LA MODIFICACIÓN ---

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
  }, [subscription, addToast]);

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading,
    error,
    isSupported,
    permission: isSupported ? Notification.permission : 'denied'
  };
};