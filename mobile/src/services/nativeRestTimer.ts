import { AppState, DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import {
  cancelRestTimerNotification,
  ensureTimerNotificationPermission,
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

  const granted = await ensureTimerNotificationPermission();
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

const ACCENT_HEX_MAP: Record<string, string> = {
  green: '#22c55e', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b',
  rose: '#f43f5e', teal: '#14b8a6', cyan: '#06b6d4', orange: '#f97316',
  lime: '#84cc16', fuchsia: '#d946ef', emerald: '#10b981', indigo: '#6366f1',
  purple: '#a855f7', pink: '#ec4899', red: '#ef4444', yellow: '#eab308',
  sky: '#0ea5e9', slate: '#64748b', zinc: '#71717a', stone: '#78716c', neutral: '#737373',
};

const resolveStoredAccentHex = () => {
  try {
    const accent = (typeof localStorage !== 'undefined' ? localStorage.getItem('accent') : null) || 'green';
    return ACCENT_HEX_MAP[accent] || '#22c55e';
  } catch {
    return '#22c55e';
  }
};

export const initNativeTimerSync = (store: any): (() => void) => {
  if (Platform.OS === 'web') return () => {};

  const syncFromNative = async () => {
    if (!NativeTimer) return;
    const deadline = store.getState().restTimerEndTime;
    if (!deadline) return;
    try {
      const res = await NativeTimer.getTimerState();
      const endTimeMs = Number(res?.endTimeMs || 0);
      const skippedEndTimeMs = Number(res?.skippedEndTimeMs || 0);
      const state = store.getState();
      if (!state.isResting || state.isRestTimerPaused || state.restTimerEndTime !== deadline) return;
      if (!endTimeMs) {
        if (skippedEndTimeMs === deadline) {
          state.stopRestTimer({ notifyNative: false });
        }
      } else if (Math.abs(endTimeMs - deadline) >= 1000) {
        state.addRestTime(Math.round((endTimeMs - deadline) / 1000), endTimeMs);
      }
    } catch {}
  };

  const eventSub = NativeTimer
    ? DeviceEventEmitter.addListener('nativeTimerAction', (data: any) => {
        const state = store.getState();
        if (!state.isResting || state.isRestTimerPaused || state.restTimerEndTime !== data?.endTimeMs) return;
        if (data.action === 'addTime') {
          state.addRestTime(data.seconds, data.newEndTimeMs);
        } else if (data.action === 'skip' || data.action === 'complete') {
          state.stopRestTimer({ notifyNative: false });
        }
      })
    : null;

  const syncOnForeground = async () => {
    await syncFromNative();
    if (AppState.currentState === 'active') {
      await stopNativeRestTimer();
    }
  };

  const launchOnMinimize = () => {
    const state = store.getState();
    if (!state.isResting || state.isRestTimerPaused) return;
    const deadline = Number(state.restTimerEndTime || 0);
    if (!deadline || deadline <= Date.now() + 500) return;

    const routineName = state.activeWorkout?.routineName;
    void startNativeRestTimer(deadline, {
      title: routineName ? `Descanso · ${routineName}` : 'Descanso entre series',
      color: resolveStoredAccentHex(),
      sound: state.restSoundEnabled ?? true,
      vibrate: state.hapticsEnabled ?? true,
      userId: state.userProfile?.id,
    });
  };

  const appStateSub = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      void syncOnForeground();
    } else if (nextState === 'background') {
      launchOnMinimize();
    }
  });

  if (AppState.currentState === 'active') {
    void syncOnForeground();
  }

  return () => {
    eventSub?.remove();
    appStateSub.remove();
  };
};
