/* mobile/src/hooks/useToast.ts */
import { useToastStore, ToastType } from '@/store/toastStore';

export const useToast = () => {
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);

  return {
    showToast,
    addToast: (message: string, type: ToastType = 'info', duration?: number) =>
      showToast(message, type, duration),
    hideToast,
  };
};

export default useToast;
