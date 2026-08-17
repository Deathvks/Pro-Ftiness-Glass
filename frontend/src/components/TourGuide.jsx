/* frontend/src/components/TourGuide.jsx */
import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useAppStore from '../store/useAppStore';

const TourGuide = () => {
  const { tourCompleted, completeTour } = useAppStore(state => ({
    tourCompleted: state.tourCompleted,
    completeTour: state.completeTour
  }));

  const driverRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // --- Inyección de Estilos Personalizados (Glassmorphism Theme) ---
    

    if (tourCompleted) return;

    // Configuración del Driver
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      smoothScroll: false, 
      doneBtnText: '¡A entrenar!',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      progressText: '{{current}} / {{total}}',
      
      // FIX DEFINITIVO iPHONE PWA: Forzamos la acción táctil directamente al evento nativo del botón
      onPopoverRender: (popover, { config, state }) => {
        const forceTouchAction = (btn, action) => {
          if (!btn) return;
          const fireAction = (e) => {
            e.preventDefault();
            e.stopPropagation();
            action();
          };
          btn.ontouchend = fireAction;
          btn.onclick = fireAction;
        };

        forceTouchAction(popover.nextButton, () => {
          if (!driverRef.current) return;
          if (state.activeIndex === config.steps.length - 1) {
            driverRef.current.destroy();} else {
            driverRef.current.moveNext();
          }
        });

        forceTouchAction(popover.previousButton, () => {
          if (driverRef.current) driverRef.current.movePrevious();
        });

        forceTouchAction(popover.closeButton, () => {
          if (driverRef.current) driverRef.current.destroy();});
      },
      
      // FIX SCROLL: Forzamos el scroll sobre tu nuevo MainAppLayout
      onHighlightStarted: (element) => {
        if (!element) return;
        const node = element.node || document.querySelector(element.element);
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      },

      steps: [
        {
          element: '#tour-gamification',
          popover: {
            title: 'Nivel y Racha',
            description: 'Tu progreso gamificado. ¡Mantén la llama encendida entrenando o registrando datos cada día para subir de nivel!'
          }
        },
        {
          element: '#tour-stats',
          popover: {
            title: 'Resumen Semanal',
            description: 'Un vistazo rápido a tus sesiones, calorías quemadas y cumplimiento de tu meta calórica diaria.'
          }
        },
        {
          element: '#tour-nutrition',
          popover: {
            title: 'Nutrición Rápida',
            description: 'Toca los anillos para registrar calorías, proteínas, agua o creatina al instante. ¡Todo cuenta!'
          }
        },
        {
          element: '#tour-routines',
          popover: {
            title: 'Tus Rutinas',
            description: 'Aquí aparecen tus rutinas creadas. Pulsa "Play" para iniciar el Modo Entrenamiento.'
          }
        },
        {
          element: '#tour-quick-cardio',
          popover: {
            title: 'Cardio Exprés',
            description: '¿Solo vas a correr o usar la bici? Inicia una sesión rápida sin necesidad de configurar una rutina compleja.'
          }
        },
        {
          element: '#tour-weight',
          popover: {
            title: 'Control de Peso',
            description: 'Registra tu peso corporal regularmente para ver tu tendencia y gráfica de progreso aquí mismo.'
          }
        }
      ],
      onDestroyed: () => {
        completeTour();
      }
    });

    const checkModalsAndStart = () => {
            if (window.location.pathname !== '/') {
                timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
                return;
            }
    
      const state = useAppStore.getState();

      // 1. Prioridad: Esperar a que se resuelvan las cookies y el modal de bienvenida
      if (state.cookieConsent === null || state.showWelcomeModal) {
        timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
        return;
      }

      // 2. Prioridad: Esperar a la promo del 2FA (solo si no es la primera sesión, ya que en la 1ra sesión no se muestra la promo)
      const hasSeenPromo = localStorage.getItem('has_seen_2fa_promo');
      const isAlreadyEnabled = state.userProfile?.twoFactorEnabled || state.userProfile?.isTwoFactorEnabled;
      const isFirstLoginSession = sessionStorage.getItem('just_logged_in') === 'true';

      if (!hasSeenPromo && !isAlreadyEnabled && !isFirstLoginSession) {
        timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
        return;
      }

      // 3. Prioridad: Chequeo de otros modales activos en la pantalla
      const activeModals = Array.from(document.querySelectorAll('.fixed.inset-0')).filter(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex, 10) || 0;
        return zIndex >= 40 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });

      if (activeModals.length > 0) {
        timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
      } else {
        if (!hasStartedRef.current && driverRef.current) {
                    hasStartedRef.current = true;
                    localStorage.setItem('tourCompleted', 'true');
                    driverRef.current.drive();
                }
      }
    };

    // Iniciamos la comprobación
    timeoutRef.current = setTimeout(checkModalsAndStart, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (driverRef.current) {
        driverRef.current.destroy();}
    };
  }, [tourCompleted, completeTour]);

  return null;
};

export default TourGuide;

