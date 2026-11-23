/* mobile/src/store/toastStore.ts */
import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'gym' | 'shield';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastStore {
  currentToast: ToastItem | null;
  queue: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  currentToast: null,
  queue: [],
  showToast: (message, type = 'info', duration = 3500) => {
    const nextItem: ToastItem = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      duration,
    };
    set((state) => {
      if (!state.currentToast) {
        return { currentToast: nextItem };
      }
      const lastQueued = state.queue[state.queue.length - 1] || state.currentToast;
      if (lastQueued?.message === message && lastQueued?.type === type) {
        return state;
      }
      return { queue: [...state.queue, nextItem].slice(-6) };
    });
  },
  hideToast: () =>
    set((state) => {
      if (state.queue.length === 0) {
        return { currentToast: null };
      }
      const [next, ...rest] = state.queue;
      return { currentToast: next, queue: rest };
    }),
}));
