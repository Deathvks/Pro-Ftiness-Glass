import { useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';
import { completeNativeRestTimer } from '../store/workoutSlice';
import { notifyRestTimerComplete } from '../utils/timerSound';

export function useRestTimerCompletion() {
  const deadline = useAppStore(state => state.isResting && !state.isRestTimerPaused ? state.restTimerEndTime : null);
  const completed = useRef(null);

  useEffect(() => {
    if (!deadline || completed.current === deadline) return;
    let timeout;
    const check = () => {
      clearTimeout(timeout);
      const { isResting, isRestTimerPaused, restTimerEndTime } = useAppStore.getState();
      if (!isResting || isRestTimerPaused || restTimerEndTime !== deadline || completed.current === deadline) return;
      const remaining = deadline - Date.now();
      if (remaining > 0) {
        timeout = setTimeout(check, Math.min(remaining, 2147483647));
        return;
      }

      completed.current = deadline;
      const fallback = () => {
        if (remaining >= -60000) void notifyRestTimerComplete();
      };
      const nativeCompletion = completeNativeRestTimer(deadline);
      if (nativeCompletion) nativeCompletion.catch(fallback);
      else fallback();
    };

    check();
    document.addEventListener('visibilitychange', check);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', check);
    };
  }, [deadline]);
}
