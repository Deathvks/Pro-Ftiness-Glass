import { useEffect } from 'react';

/**
 * Hook que bloquea el scroll del fondo y el swipe entre páginas
 * mientras un modal está abierto. Compatible con iOS Safari.
 * 
 * @param {boolean} isActive - Si el modal está visible/activo. Por defecto true.
 */
const useModalLock = (isActive = true) => {
  useEffect(() => {
    if (!isActive) return;

    const scrollY = window.scrollY;

    // 1. Fijar el body para bloquear scroll vertical
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overscrollBehavior = 'none';

    // 2. Bloquear el swipe horizontal entre páginas
    const swipeContainer = document.querySelector('[class*="snap-x"]');
    if (swipeContainer) {
      swipeContainer.style.overflow = 'hidden';
      swipeContainer.style.touchAction = 'none';
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overscrollBehavior = '';
      window.scrollTo(0, scrollY);

      if (swipeContainer) {
        swipeContainer.style.overflow = '';
        swipeContainer.style.touchAction = '';
      }
    };
  }, [isActive]);
};

export default useModalLock;
