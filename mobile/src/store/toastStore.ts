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
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  currentToast: null,
  showToast: (message: string, type = 'info', duration = 3500) => {
    set({
      currentToast: {
        id: Math.random().toString(36).substring(2, 9),
        message,
        type,
        duration,
      },
    });
  },
  hideToast: () => set({ currentToast: null }),
}));
