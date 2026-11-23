import { AppState, DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import {
  cancelRestTimerNotification,
  ensureNotificationPermissionPrompt,
  isExpoGoClient,
  presentInstantNotification,
  scheduleRestTimerNotification,
} from './nativeNotifications';

const NativeTimer =
  Platform.OS === 'android' && !isExpoGoClient()
    ? (NativeModules as Record<string, any>).NativeTimer ?? null
    : null;

export const hasNativeRestTimer = () => Boolean(NativeTimer);

export interface NativeTimerOptions {
  title?: string;
  color?: string;
  sound?: boolean;
  vibrate?: boolean;
  userId?: string | number | null;
}

export const startNativeRestTimer = async (
  endTimeMs: number,
  options: NativeTimerOptions = {}
) => {
  if (Platform.OS === 'web' || !endTimeMs || endTimeMs <= Date.now()) return;

  const granted = await ensureNotificationPermissionPrompt(options.userId);
  if (!granted || endTimeMs <= Date.now()) return;

  if (NativeTimer) {
    try {
      await NativeTimer.startTimer({
        endTimeMs,
        title: options.title || 'Descanso entre series',
        color: options.color || '#22c55e',
        sound: options.sound ?? true,
        vibrate: options.vibrate ?? true,
      });
      return;
    } catch (err) {
      console.warn('[NativeRestTimer] Fallback a notificacion programada:', err);
    }
  }

  const remainingSec = Math.ceil((endTimeMs - Date.now()) / 1000);
  if (remainingSec > 1) {
    await scheduleRestTimerNotification(remainingSec, options.title);
  }
};

export const stopNativeRestTimer = async () => {
  if (NativeTimer) {
    try {
      await NativeTimer.stopTimer();
    } catch {}
  }
  await cancelRestTimerNotification();
};

export const completeNativeRestTimer = (endTimeMs: number): Promise<void> | null => {
  if (!NativeTimer) return null;
  return NativeTimer.completeTimer(endTimeMs);
};

export const notifyRestCompleteFallback = async () => {
  await presentInstantNotification({
    title: '¡Descanso terminado! 💪',
    body: 'Es hora de tu siguiente serie. ¡A por todas!',
    data: { url: '/workout' },
  });
};

export const initNativeTimerSync = (store: any): (() => void) => {
  if (Platform.OS === 'web' || !NativeTimer) return () => {};

  const syncFromNative = async () => {
    const deadline = store.getState().restTimerEndTime;
    if (!deadline) return;
    try {
      const res = await NativeTimer.getTimerState();
      const endTimeMs = Number(res?.endTimeMs || 0);
      const state = store.getState();
      if (!state.isResting || state.isRestTimerPaused || state.restTimerEndTime !== deadline) return;
      if (!endTimeMs) {
        state.stopRestTimer({ notifyNative: false });
      } else if (Math.abs(endTimeMs - deadline) >= 1000) {
        state.addRestTime(Math.round((endTimeMs - deadline) / 1000), endTimeMs);
      }
    } catch {}
  };

  const eventSub = DeviceEventEmitter.addListener('nativeTimerAction', (data: any) => {
    const state = store.getState();
    if (!state.isResting || state.isRestTimerPaused || state.restTimerEndTime !== data?.endTimeMs) return;
    if (data.action === 'addTime') {
      state.addRestTime(data.seconds, data.newEndTimeMs);
    } else if (data.action === 'skip' || data.action === 'complete') {
      state.stopRestTimer({ notifyNative: false });
    }
  });

  const appStateSub = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      void syncFromNative();
    }
  });

  void syncFromNative();

  return () => {
    eventSub.remove();
    appStateSub.remove();
  };
};
