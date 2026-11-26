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
  subtitle?: string;
  detail?: string;
  totalSeconds?: number;
  color?: string;
  sound?: boolean;
  vibrate?: boolean;
  userId?: string | number | null;
}

const isSetFilled = (s: any): boolean =>
  (s?.reps !== '' && s?.reps !== null && s?.reps !== undefined) ||
  (s?.weight_kg !== '' && s?.weight_kg !== null && s?.weight_kg !== undefined);

const formatCompactSetTarget = (weight: any, reps: any): string => {
  const hasW = weight !== '' && weight !== null && weight !== undefined && Number(weight) > 0;
  const hasR = reps !== '' && reps !== null && reps !== undefined && String(reps).trim() !== '';
  if (hasW && hasR) return `${weight} kg × ${reps}`;
  if (hasR) return `${reps} reps`;
  if (hasW) return `${weight} kg`;
  return '';
};

export const getRestNotificationContext = (activeWorkout: any): { subtitle: string; detail: string } => {
  const exercises = Array.isArray(activeWorkout?.exercises) ? activeWorkout.exercises : [];
  if (exercises.length === 0) {
    return { subtitle: 'Siguiente serie lista', detail: '' };
  }

  let currentExIndex = -1;
  for (let i = 0; i < exercises.length; i++) {
    const sets = Array.isArray(exercises[i]?.setsDone) ? exercises[i].setsDone : [];
    const hasFilled = sets.some(isSetFilled);
    const hasPending = sets.some((s: any) => !isSetFilled(s));
    if (hasFilled && hasPending) {
      currentExIndex = i;
    }
  }

  if (currentExIndex === -1) {
    let lastFilledEx = -1;
    for (let i = 0; i < exercises.length; i++) {
      const sets = Array.isArray(exercises[i]?.setsDone) ? exercises[i].setsDone : [];
      if (sets.some(isSetFilled)) lastFilledEx = i;
    }
    const startSearch = lastFilledEx >= 0 ? lastFilledEx + 1 : 0;
    for (let i = startSearch; i < exercises.length; i++) {
      const sets = Array.isArray(exercises[i]?.setsDone) ? exercises[i].setsDone : [];
      if (sets.some((s: any) => !isSetFilled(s)) || sets.length === 0) {
        currentExIndex = i;
        break;
      }
    }
  }

  if (currentExIndex === -1) {
    return {
      subtitle: 'Última serie completada',
      detail: 'Puedes finalizar o añadir otra serie',
    };
  }

  const ex = exercises[currentExIndex];
  const sets = Array.isArray(ex?.setsDone) ? ex.setsDone : [];
  const nextSetIndex = sets.findIndex((s: any) => !isSetFilled(s));
  const workingSets = sets.filter((s: any) => !s?.is_warmup && !s?.is_dropset);
  const nextSet = nextSetIndex >= 0 ? sets[nextSetIndex] : null;
  const exName = (ex?.name || 'Siguiente ejercicio').trim();

  let setProgressLabel = '';
  if (nextSet && !nextSet.is_warmup && !nextSet.is_dropset && workingSets.length > 0) {
    const workingPos = workingSets.indexOf(nextSet) + 1;
    if (workingPos > 0) setProgressLabel = ` · Serie ${workingPos}/${workingSets.length}`;
  } else if (nextSet?.is_warmup) {
    setProgressLabel = ' · Calentamiento';
  } else if (nextSet?.is_dropset) {
    setProgressLabel = ' · Dropset';
  }

  const subtitle = `Siguiente: ${exName}${setProgressLabel}`;

  const detailParts: string[] = [];
  const plannedTarget = formatCompactSetTarget(nextSet?.weight_kg, nextSet?.reps);
  if (plannedTarget) {
    detailParts.push(`Objetivo: ${plannedTarget}`);
  } else {
    const prevSets = Array.isArray(ex?.last_performance?.sets) ? ex.last_performance.sets : [];
    const prevMatch =
      (nextSetIndex >= 0 ? prevSets[nextSetIndex] : null) || prevSets[0] || null;
    const prevLabel = prevMatch ? formatCompactSetTarget(prevMatch.weight_kg, prevMatch.reps) : '';
    if (prevLabel) {
      detailParts.push(`Anterior: ${prevLabel}`);
    } else if (ex?.reps) {
      detailParts.push(`Meta: ${ex.reps} reps`);
    }
  }

  const remainingExercises = exercises.slice(currentExIndex + 1).filter((item: any) => {
    const itemSets = Array.isArray(item?.setsDone) ? item.setsDone : [];
    return itemSets.length === 0 || itemSets.some((s: any) => !isSetFilled(s));
  }).length;
  if (remainingExercises > 0) {
    detailParts.push(remainingExercises === 1 ? 'Queda 1 ej.' : `Quedan ${remainingExercises} ej.`);
  }

  return {
    subtitle,
    detail: detailParts.join(' · '),
  };
};

export const buildNativeRestTimerOptions = (state: any, endTimeMs: number): NativeTimerOptions => {
  const { subtitle, detail } = getRestNotificationContext(state?.activeWorkout);
  const totalSeconds = Math.max(
    1,
    Number(state?.restTimerInitialDuration) || Math.ceil((endTimeMs - Date.now()) / 1000)
  );
  return {
    subtitle,
    detail,
    totalSeconds,
    color: resolveStoredAccentHex(),
    sound: state?.restSoundEnabled ?? true,
    vibrate: state?.hapticsEnabled ?? true,
    userId: state?.userProfile?.id,
  };
};

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
        totalSeconds: options.totalSeconds || Math.max(1, Math.ceil((endTimeMs - Date.now()) / 1000)),
        title: options.title || 'Descanso',
        subtitle: options.subtitle || 'Siguiente serie lista',
        detail: options.detail || '',
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
    await scheduleRestTimerNotification(remainingSec, options.subtitle || options.title);
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
        } else if (deadline > Date.now() + 1000) {
          void startNativeRestTimer(deadline, buildNativeRestTimerOptions(state, deadline));
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

    void startNativeRestTimer(deadline, buildNativeRestTimerOptions(state, deadline));
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
