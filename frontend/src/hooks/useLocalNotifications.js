/* frontend/src/hooks/useLocalNotifications.js */
import { useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

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

export const useLocalNotifications = () => {
  
  const isNative = Capacitor.isNativePlatform();

  const requestPermissions = useCallback(async () => {
    if (!isNative) return false;
    
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.warn('Error solicitando permisos de notificaciones locales:', error);
      return false;
    }
  }, [isNative]);

  const scheduleEngagementNotifications = useCallback(async () => {
    if (!isNative) return;

    try {
      // Limpiamos notificaciones antiguas programadas (IDs 2000-2100 para engagement)
      const pending = await LocalNotifications.getPending();
      const engagementIds = pending.notifications
        .filter(n => n.id >= 2000 && n.id < 2100)
        .map(n => n.id);
      
      if (engagementIds.length > 0) {
        await LocalNotifications.cancel({ notifications: engagementIds.map(id => ({ id })) });
      }

      // Programamos 3 notificaciones aleatorias para los próximos días
      const notifications = [];
      const now = new Date();

      for (let i = 1; i <= 3; i++) {
        const randomMsg = ENGAGEMENT_MESSAGES[Math.floor(Math.random() * ENGAGEMENT_MESSAGES.length)];
        // Aleatorio entre 10am y 8pm del día siguiente + i
        const scheduleDate = new Date(now);
        scheduleDate.setDate(scheduleDate.getDate() + i);
        scheduleDate.setHours(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0);

        notifications.push({
          title: randomMsg.title,
          body: randomMsg.body,
          id: 2000 + i,
          schedule: { at: scheduleDate },
          sound: 'beep.wav',
          // Eliminado smallIcon para usar el icono por defecto de la app
          actionTypeId: '',
          extra: null
        });
      }

      await LocalNotifications.schedule({ notifications });

    } catch (error) {
      console.warn('Error programando notificaciones de engagement:', error);
    }
  }, [isNative]);

  const scheduleDailyReminders = useCallback(async (hasLoggedMeals = false, hasClaimedXP = false) => {
    if (!isNative) return;

    try {
      const notifications = [];
      const now = new Date();

      // 1. Recordatorio de Login / XP (Si no ha reclamado XP, recordar a las 8 PM)
      // Se programa siempre para hoy a las 20:00 o mañana si ya pasó
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

      // 2. Recordatorio de Macros (Si no ha logueado comidas)
      // Programar para las 2 PM (almuerzo) o 9 PM (cena)
      if (!hasLoggedMeals) {
        let mealDate = new Date();
        // Si es antes de las 14:00, programar para las 14:00. Si no, para las 21:00.
        if (now.getHours() < 14) {
          mealDate.setHours(14, 0, 0);
        } else if (now.getHours() < 21) {
          mealDate.setHours(21, 0, 0);
        } else {
          // Si ya pasó todo hoy, programar para mañana a las 14:00
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
        // Cancelamos previos para no duplicar
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
    } catch (e) { /* silent */ }
  }, [isNative]);

  const cancelLoginReminder = useCallback(async () => {
    if (!isNative) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: ID_LOGIN_REMINDER }] });
    } catch (e) { /* silent */ }
  }, [isNative]);

  return {
    requestPermissions,
    scheduleEngagementNotifications,
    scheduleDailyReminders,
    cancelMealReminder,
    cancelLoginReminder
  };
};