import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as notificationService from './notificationService';

const CHANNEL_DEFAULT = 'default';
const CHANNEL_REST_TIMER = 'rest-timer';
const ID_REST_TIMER = 'pfg-rest-timer';
const ID_DAILY_LOGIN = 'pfg-daily-login';
const ID_DAILY_MEAL = 'pfg-daily-meal';
const ENGAGEMENT_IDS = ['pfg-engagement-1', 'pfg-engagement-2', 'pfg-engagement-3'];

const ENGAGEMENT_MESSAGES = [
  { title: '💧 Hidratación', body: '¿Has bebido suficiente agua hoy? Registra tu consumo.' },
  { title: '💪 A entrenar', body: 'Tu rutina te espera. La constancia es la clave del éxito.' },
  { title: '📊 Tu Progreso', body: 'Revisa tus estadísticas y marcas personales.' },
  { title: '🥗 Nutrición', body: '¿Ya registraste tus comidas de hoy? Mantén tu objetivo al día.' },
  { title: '🏆 Racha', body: 'No rompas la cadena. Entra y mantén tu actividad.' },
  { title: '⚖️ Peso Corporal', body: '¿Te has pesado últimamente? Actualiza tu registro.' },
];

const isWeb = Platform.OS === 'web';

if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const isExpoGoClient = () =>
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

const safeGetStorage = (key: string): string | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const safeSetStorage = (key: string, value: string) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {}
};

const safeRemoveStorage = (key: string) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {}
};

const pushEnabledKey = (userId?: string | number | null) => `pfg_push_enabled_${userId ?? 'anon'}`;
const pushEndpointKey = (userId?: string | number | null) => `pfg_push_endpoint_${userId ?? 'anon'}`;
const trainingPushKey = (userId?: string | number | null) => `pfg_training_push_${userId ?? 'anon'}`;
const reminderSyncKey = (userId?: string | number | null) => `pfg_local_reminder_sync_${userId ?? 'anon'}`;
const LAST_PUSH_USER_KEY = 'pfg_last_push_user_id';

let activePushUserId: string | number | null = null;

const resolvePushUserId = (userId?: string | number | null): string | number | null => {
  if (userId !== undefined && userId !== null) {
    activePushUserId = userId;
    safeSetStorage(LAST_PUSH_USER_KEY, String(userId));
    return userId;
  }
  if (activePushUserId !== null) return activePushUserId;
  return safeGetStorage(LAST_PUSH_USER_KEY);
};

export const isDevicePushEnabled = (userId?: string | number | null): boolean => {
  const uid = resolvePushUserId(userId);
  return safeGetStorage(pushEnabledKey(uid)) !== 'false';
};

export const isTrainingReminderEnabled = (userId?: string | number | null): boolean => {
  const uid = resolvePushUserId(userId);
  return safeGetStorage(trainingPushKey(uid)) !== 'false';
};

export const syncTrainingPushPreference = async (
  userId?: string | number | null,
  enabled?: boolean
) => {
  if (enabled === undefined) return;
  const uid = resolvePushUserId(userId);
  safeSetStorage(trainingPushKey(uid), enabled ? 'true' : 'false');
  if (!enabled) {
    await cancelLocalReminders();
  } else if (isDevicePushEnabled(uid)) {
    safeRemoveStorage(reminderSyncKey(uid));
    await scheduleLocalReminders(uid);
  }
};

export const ensureAndroidNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_DEFAULT, {
      name: 'General y Entrenamiento',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#22c55e',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync(CHANNEL_REST_TIMER, {
      name: 'Temporizador de Descanso',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 150, 300],
      lightColor: '#22c55e',
      sound: 'default',
    });
  } catch (err) {
    console.warn('[Notifications] Error creando canales Android:', err);
  }
};

export const getNotificationPermissionStatus = async (): Promise<'granted' | 'denied' | 'undetermined'> => {
  if (isWeb) {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'undetermined';
  }
  try {
    const perms = await Notifications.getPermissionsAsync();
    if (perms.granted) return 'granted';
    if (!perms.canAskAgain || perms.status === Notifications.PermissionStatus.DENIED) return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
};

export const requestNotificationPermissions = async () => {
  if (isWeb) {
    if (typeof Notification === 'undefined') {
      return { granted: false, canAskAgain: false, status: 'denied' as const };
    }
    if (Notification.permission === 'granted') {
      return { granted: true, canAskAgain: true, status: 'granted' as const };
    }
    const res = await Notification.requestPermission();
    return {
      granted: res === 'granted',
      canAskAgain: res !== 'denied',
      status: res === 'granted' ? ('granted' as const) : ('denied' as const),
    };
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return { granted: true, canAskAgain: true, status: 'granted' as const };
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return {
    granted: requested.granted,
    canAskAgain: requested.canAskAgain ?? true,
    status: requested.granted ? ('granted' as const) : ('denied' as const),
  };
};

export const cancelLocalReminders = async () => {
  if (isWeb) return;
  const ids = [ID_DAILY_LOGIN, ID_DAILY_MEAL, ...ENGAGEMENT_IDS];
  await Promise.all(
    ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
  );
};

export const scheduleLocalReminders = async (userId?: string | number | null) => {
  if (isWeb) return;
  const uid = resolvePushUserId(userId);
  if (!isDevicePushEnabled(uid) || !isTrainingReminderEnabled(uid)) {
    await cancelLocalReminders();
    return;
  }
  const perm = await getNotificationPermissionStatus();
  if (perm !== 'granted') return;

  await ensureAndroidNotificationChannels();

  const lastSync = Number(safeGetStorage(reminderSyncKey(userId)) || 0);
  if (Date.now() - lastSync < 12 * 60 * 60 * 1000) return;

  await cancelLocalReminders();

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: ID_DAILY_LOGIN,
      content: {
        title: '🔥 ¡Buenos días!',
        body: 'Planifica tu entrenamiento y alimentación de hoy en Pro Fitness Glass.',
        sound: true,
        data: { url: '/(tabs)' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 10,
        minute: 0,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_DEFAULT } : {}),
      },
    });

    await Notifications.scheduleNotificationAsync({
      identifier: ID_DAILY_MEAL,
      content: {
        title: '🥗 Control Nutricional',
        body: 'No olvides registrar tus comidas para mantener tu objetivo diario.',
        sound: true,
        data: { url: '/(tabs)/nutrition' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 14,
        minute: 30,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_DEFAULT } : {}),
      },
    });

    for (let i = 0; i < ENGAGEMENT_IDS.length; i++) {
      const msg = ENGAGEMENT_MESSAGES[Math.floor(Math.random() * ENGAGEMENT_MESSAGES.length)];
      const triggerDate = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000);
      await Notifications.scheduleNotificationAsync({
        identifier: ENGAGEMENT_IDS[i],
        content: {
          title: msg.title,
          body: msg.body,
          sound: true,
          data: { url: '/(tabs)' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_DEFAULT } : {}),
        },
      });
    }

    safeSetStorage(reminderSyncKey(userId), String(Date.now()));
  } catch (err) {
    console.warn('[Notifications] Error programando recordatorios locales:', err);
  }
};

export const cancelRestTimerNotification = async () => {
  if (isWeb) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_REST_TIMER);
  } catch {}
};

export const scheduleRestTimerNotification = async (secondsFromNow: number, routineName?: string) => {
  if (isWeb || !secondsFromNow || secondsFromNow <= 1) return;
  if (!isDevicePushEnabled()) return;
  try {
    const perm = await getNotificationPermissionStatus();
    if (perm !== 'granted') return;

    await ensureAndroidNotificationChannels();
    await cancelRestTimerNotification();

    await Notifications.scheduleNotificationAsync({
      identifier: ID_REST_TIMER,
      content: {
        title: '⏱️ ¡Descanso completado!',
        body: routineName
          ? `Siguiente serie en ${routineName}. ¡A por ello!`
          : 'Tiempo de descanso terminado. ¡Vuelve a la serie!',
        sound: true,
        data: { url: '/workout' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + Math.round(secondsFromNow * 1000)),
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_REST_TIMER } : {}),
      },
    });
  } catch (err) {
    console.warn('[Notifications] Error programando alerta de descanso:', err);
  }
};

export const presentInstantNotification = async ({
  title,
  body,
  data = {},
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) => {
  if (isWeb || !isDevicePushEnabled()) return;
  try {
    const perm = await getNotificationPermissionStatus();
    if (perm !== 'granted') return;
    await ensureAndroidNotificationChannels();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_DEFAULT } : {}),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('[Notifications] Error enviando notificación local:', err);
  }
};

export interface RegisterPushResult {
  ok: boolean;
  mode?: 'remote-fcm' | 'local-only' | 'local-expo-go';
  reason?: 'denied' | 'unsupported';
  canAskAgain?: boolean;
  endpoint?: string;
  message: string;
}

export const registerDeviceForPushNotifications = async (
  userId?: string | number | null
): Promise<RegisterPushResult> => {
  const perm = await requestNotificationPermissions();
  if (!perm.granted) {
    safeSetStorage(pushEnabledKey(userId), 'false');
    return {
      ok: false,
      reason: 'denied',
      canAskAgain: perm.canAskAgain,
      message: 'Permiso de notificaciones denegado en el dispositivo.',
    };
  }

  await ensureAndroidNotificationChannels();
  safeSetStorage(pushEnabledKey(userId), 'true');
  await scheduleLocalReminders(userId);

  if (isWeb) {
    return {
      ok: true,
      mode: 'local-only',
      message: 'Permiso de notificaciones concedido.',
    };
  }

  // En Expo Go sobre Android (SDK 53+), el push remoto FCM no está incluido en el cliente Expo Go
  if (isExpoGoClient() && Platform.OS === 'android') {
    return {
      ok: true,
      mode: 'local-expo-go',
      message: 'Notificaciones locales activadas. En Expo Go (Android) el push remoto requiere un Development Build.',
    };
  }

  if (!Device.isDevice) {
    return {
      ok: true,
      mode: 'local-only',
      message: 'Avisos locales activados (los tokens push remotos requieren un dispositivo físico).',
    };
  }

  try {
    const tokenRes = await Notifications.getDevicePushTokenAsync();
    const rawToken = typeof tokenRes?.data === 'string' ? tokenRes.data : '';

    // El backend valida endpoints Web Push o fcm://<token> (Firebase Admin SDK)
    if (Platform.OS === 'android' && rawToken) {
      const endpoint = `fcm://${rawToken}`;
      await notificationService.subscribeToPush({
        endpoint,
        keys: { p256dh: 'fcm', auth: 'fcm' },
      });
      safeSetStorage(pushEndpointKey(userId), endpoint);
      return {
        ok: true,
        mode: 'remote-fcm',
        endpoint,
        message: 'Notificaciones push y locales activadas en este dispositivo.',
      };
    }

    return {
      ok: true,
      mode: 'local-only',
      message: 'Permisos y avisos locales activados en el dispositivo.',
    };
  } catch (err: any) {
    console.warn('[Notifications] No se pudo obtener/registrar token remoto:', err?.message || err);
    return {
      ok: true,
      mode: 'local-only',
      message: 'Avisos locales activados. El token push remoto no está disponible en este entorno.',
    };
  }
};

export const unregisterDevicePushNotifications = async (userId?: string | number | null) => {
  safeSetStorage(pushEnabledKey(userId), 'false');
  const storedEndpoint = safeGetStorage(pushEndpointKey(userId));
  if (storedEndpoint) {
    try {
      await notificationService.unsubscribeFromPush(storedEndpoint);
    } catch {}
    safeRemoveStorage(pushEndpointKey(userId));
  }
  await cancelLocalReminders();
  await cancelRestTimerNotification();
};

export const getDevicePushState = async (userId?: string | number | null) => {
  const permissionStatus = await getNotificationPermissionStatus();
  const storedEnabled = safeGetStorage(pushEnabledKey(userId));
  const endpoint = safeGetStorage(pushEndpointKey(userId));
  const isExpoGoAndroid = isExpoGoClient() && Platform.OS === 'android';

  const enabled =
    permissionStatus === 'granted' && storedEnabled !== 'false';

  return {
    permissionStatus,
    enabled,
    endpoint,
    isExpoGoAndroid,
  };
};

export const syncPushOnAppStart = async (userId?: string | number | null) => {
  if (!userId) return;
  const uid = resolvePushUserId(userId);
  await ensureAndroidNotificationChannels();
  try {
    const prefs = await notificationService.getPushPreferences();
    if (prefs && typeof prefs === 'object' && 'training' in prefs) {
      safeSetStorage(trainingPushKey(uid), prefs.training !== false ? 'true' : 'false');
    }
  } catch {}
  const storedEnabled = safeGetStorage(pushEnabledKey(uid));
  const perm = await getNotificationPermissionStatus();
  if (perm === 'granted' && storedEnabled !== 'false') {
    await registerDeviceForPushNotifications(uid);
  }
};
