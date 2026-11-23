import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import {
  completeNativeRestTimer,
  notifyRestCompleteFallback,
} from '@/services/nativeRestTimer';

export function useRestTimerCompletion() {
  const deadline = useAppStore((state: any) =>
    state.isResting && !state.isRestTimerPaused ? state.restTimerEndTime : null
  );
  const completed = useRef<number | null>(null);

  useEffect(() => {
    if (!deadline || completed.current === deadline) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      if (timeout) clearTimeout(timeout);
      const state: any = useAppStore.getState();
      if (
        !state.isResting ||
        state.isRestTimerPaused ||
        state.restTimerEndTime !== deadline ||
        completed.current === deadline
      ) {
        return;
      }

      const remaining = deadline - Date.now();
      if (remaining > 0) {
        timeout = setTimeout(check, Math.min(remaining, 2147483647));
        return;
      }

      completed.current = deadline;
      const fallback = () => {
        if (remaining < -60000) return;
        const latest: any = useAppStore.getState();
        if (latest.hapticsEnabled && Platform.OS !== 'web') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        void notifyRestCompleteFallback();
      };

      const nativeCompletion = completeNativeRestTimer(deadline);
      if (nativeCompletion) {
        nativeCompletion.catch(fallback);
      } else {
        fallback();
      }
    };

    check();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') check();
    });

    return () => {
      if (timeout) clearTimeout(timeout);
      sub.remove();
    };
  }, [deadline]);
}
