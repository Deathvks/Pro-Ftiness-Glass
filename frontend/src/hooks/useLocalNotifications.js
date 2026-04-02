/* frontend/src/hooks/useLocalNotifications.js */
import { useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Registramos el plugin nativo que creamos en Android
const NativeTimer = registerPlugin('NativeTimer');

const ENGAGEMENT_MESSAGES = [
  { title: '💧 Hidratación', body: '¿Has bebido suficiente agua hoy? Registra tu consumo.' },
  { title: '💪 A entrenar', body: 'Tu rutina te espera. La constancia es la clave del éxito.' },
  { title: '📊 Tu Progreso', body: 'Revisa tus estadísticas. ¡Mira cuánto has avanzado!' },
  { title: '🥗 Nutrición', body: 'La dieta es el 70%. ¿Ya planificaste tus comidas?' },
  { title: '🏆 Racha', body: 'No rompas la cadena. Entra y mantén tu actividad.' },
  { title: '⚖️ Peso Corporal', body: '¿Te has pesado últimamente? Actualiza tu registro.' }
];

const ID_LOGIN_REMINDER = 1001;
const ID_MEAL_REMINDER = 1002;

// Usamos el diccionario infalible por localStorage para que funcione incluso con el DOM congelado en segundo plano
const getAccentHexColor = () => {
  try {
    const accent = localStorage.getItem('accent') || 'green';
    const colors = {
      green: '#22c55e', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b',
      rose: '#f43f5e', teal: '#14b8a6', cyan: '#06b6d4', orange: '#f97316',
      lime: '#84cc16', fuchsia: '#d946ef', emerald: '#10b981', indigo: '#6366f1',
      purple: '#a855f7', pink: '#ec4899', red: '#ef4444', yellow: '#eab308',
      sky: '#0ea5e9', slate: '#64748b', zinc: '#71717a', stone: '#78716c', neutral: '#737373'
    };
    return colors[accent] || '#22c55e';
  } catch (e) {
    return '#22c55e';
  }
};

export const useLocalNotifications = () => {
  const isNative = Capacitor.isNativePlatform();

  const requestPermissions = useCallback(async () => {
    if (!isNative) return false;
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.warn('Error solicitando permisos:', error);
      return false;
    }
  }, [isNative]);

  // Llamada al plugin nativo (Chronometer) con chequeo de permisos
  const showOngoingNotification = useCallback(async (title, endTimeMs) => {
    if (!isNative || Capacitor.getPlatform() !== 'android') return;
    try {
      // 1. Verificamos y pedimos permisos si es necesario (Vital para Android 13+)
      const check = await LocalNotifications.checkPermissions();
      if (check.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return; // Si el usuario rechaza, cancelamos la acción
      }
      
      // 2. Lanzamos la notificación pasando el color actual infalible
      await NativeTimer.startTimer({ 
        title, 
        endTimeMs,
        color: getAccentHexColor() 
      });
    } catch (error) {
      console.warn('Error mostrando notificación nativa:', error);
    }
  }, [isNative]);

  // Detener el plugin nativo
  const cancelOngoingNotification = useCallback(async () => {
    if (!isNative || Capacitor.getPlatform() !== 'android') return;
    try {
      await NativeTimer.stopTimer();
    } catch (e) {
      console.warn('Error cancelando notificación nativa:', e);
    }
  }, [isNative]);

  const scheduleEngagementNotifications = useCallback(async () => {
    if (!isNative) return;
    try {
      const pending = await LocalNotifications.getPending();
      const engagementIds = pending.notifications
        .filter(n => n.id >= 2000 && n.id < 2100)
        .map(n => n.id);
      
      if (engagementIds.length > 0) {
        await LocalNotifications.cancel({ notifications: engagementIds.map(id => ({ id })) });
      }

      const notifications = [];
      const now = new Date();

      for (let i = 1; i <= 3; i++) {
        const randomMsg = ENGAGEMENT_MESSAGES[Math.floor(Math.random() * ENGAGEMENT_MESSAGES.length)];
        const scheduleDate = new Date(now);
        scheduleDate.setDate(scheduleDate.getDate() + i);
        scheduleDate.setHours(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0);

        notifications.push({
          title: randomMsg.title,
          body: randomMsg.body,
          id: 2000 + i,
          schedule: { at: scheduleDate },
          sound: 'beep.wav',
          actionTypeId: '',
          extra: null
        });
      }

      await LocalNotifications.schedule({ notifications });
    } catch (error) {
      console.warn('Error programando engagement:', error);
    }
  }, [isNative]);

  const scheduleDailyReminders = useCallback(async (hasLoggedMeals = false, hasClaimedXP = false) => {
    if (!isNative) return;
    try {
      const notifications = [];
      const now = new Date();

      if (!hasClaimedXP) {
        let xpDate = new Date();
        xpDate.setHours(20, 0, 0);
        if (now > xpDate) xpDate.setDate(xpDate.getDate() + 1);

        notifications.push({
          title: '🔥 Login Diario',
          body: 'Aún no has hecho login diario. ¡Entra y recoge tu XP!',
          id: ID_LOGIN_REMINDER,
          schedule: { at: xpDate },
        });
      }

      if (!hasLoggedMeals) {
        let mealDate = new Date();
        if (now.getHours() < 14) {
          mealDate.setHours(14, 0, 0);
        } else if (now.getHours() < 21) {
          mealDate.setHours(21, 0, 0);
        } else {
          mealDate.setDate(mealDate.getDate() + 1);
          mealDate.setHours(14, 0, 0);
        }

        notifications.push({
          title: '🍎 Cuenta tus Macros',
          body: 'Registra tus comidas para no perder de vista tus objetivos calóricos.',
          id: ID_MEAL_REMINDER,
          schedule: { at: mealDate },
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.cancel({ 
          notifications: notifications.map(n => ({ id: n.id })) 
        });
        await LocalNotifications.schedule({ notifications });
      }
    } catch (error) {
      console.warn('Error programando recordatorios diarios:', error);
    }
  }, [isNative]);

  const cancelMealReminder = useCallback(async () => {
    if (!isNative) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: ID_MEAL_REMINDER }] });
    } catch (e) {}
  }, [isNative]);

  const cancelLoginReminder = useCallback(async () => {
    if (!isNative) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: ID_LOGIN_REMINDER }] });
    } catch (e) {}
  }, [isNative]);

  return {
    requestPermissions,
    showOngoingNotification,
    cancelOngoingNotification,
    scheduleEngagementNotifications,
    scheduleDailyReminders,
    cancelMealReminder,
    cancelLoginReminder
  };
};