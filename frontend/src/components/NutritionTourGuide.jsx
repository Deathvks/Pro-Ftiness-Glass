/* frontend/src/components/NutritionTourGuide.jsx */
import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useAppStore from '../store/useAppStore';

const NutritionTourGuide = () => {
  const { nutritionTourCompleted, completeNutritionTour } = useAppStore(state => ({
    nutritionTourCompleted: state.nutritionTourCompleted,
    completeNutritionTour: state.completeNutritionTour
  }));

  const driverRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // --- Inyección de Estilos Personalizados (Tema Glassmorphism Ajustado) ---
    

    if (nutritionTourCompleted) return;

    // Configuración del Driver
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      smoothScroll: false, 
      doneBtnText: '¡Entendido!',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      progressText: '{{current}} / {{total}}',
      
      // FIX DEFINITIVO iPHONE PWA
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
            driverRef.current.destroy();
          } else {
            driverRef.current.moveNext();
          }
        });

        forceTouchAction(popover.previousButton, () => {
          if (driverRef.current) driverRef.current.movePrevious();
        });

        forceTouchAction(popover.closeButton, () => {
          if (driverRef.current) driverRef.current.destroy();
        });
      },
      
      // FIX SCROLL
      onHighlightStarted: (element) => {
        if (!element) return;
        const node = element.node || document.querySelector(element.element);
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      },

      steps: [
        {
          popover: {
            title: 'Tu Panel de Nutrición',
            description: 'Gestiona tus comidas diarias, controla tus macros y mantén tu hidratación al día desde aquí.',
          }
        },
        {
          element: '#date-navigator',
          popover: {
            title: 'Viaja en el Tiempo',
            description: 'Usa las flechas para revisar registros pasados o planificar tus comidas de los próximos días.',
            side: 'bottom'
          }
        },
        {
          element: '#calories-ring',
          popover: {
            title: 'Objetivo de Calorías',
            description: 'Este anillo te muestra visualmente cuántas calorías has consumido y cuántas te quedan para llegar a tu meta.',
            side: 'bottom'
          }
        },
        {
          element: '#macro-stats',
          popover: {
            title: 'Tus Macros',
            description: 'Desglose detallado de Proteínas, Carbohidratos y Grasas. Toca las tarjetas para ver más detalles si están disponibles.',
            side: 'top'
          }
        },
        {
          element: '#water-tracker',
          popover: {
            title: 'Control de Agua',
            description: 'Registra tu consumo de agua rápidamente. ¡La hidratación es clave para tu rendimiento!',
            side: 'top'
          }
        },
        {
          element: '#add-food-btn',
          popover: {
            title: 'Añadir Alimentos',
            description: 'El botón principal para registrar desayunos, comidas, cenas y snacks. Escanea códigos o busca en la base de datos.',
            side: 'top',
            align: 'end'
          }
        }
      ],
      onDestroyed: () => {
        hasStartedRef.current = false;
        completeNutritionTour();
      }
    });

    const checkModalsAndStart = () => {
      const state = useAppStore.getState();

      // 1. Prioridad: Esperar a que se resuelvan las cookies y el modal de bienvenida
      if (state.cookieConsent === null || state.showWelcomeModal) {
        timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
        return;
      }

      // 2. Prioridad: Esperar a la promo del 2FA 
      const hasSeenPromo = localStorage.getItem('has_seen_2fa_promo');
      const isAlreadyEnabled = state.userProfile?.twoFactorEnabled || state.userProfile?.isTwoFactorEnabled;

      if (!hasSeenPromo && !isAlreadyEnabled) {
        timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
        return;
      }

      // 3. Prioridad: Chequeo de otros modales activos
      const activeModals = Array.from(document.querySelectorAll('.fixed.inset-0')).filter(el => {
        const className = el.className || '';
        return typeof className === 'string' && className.includes('z-') && !className.includes('-z-');
      });

      if (activeModals.length > 0) {
        timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
      } else {
        if (!hasStartedRef.current && driverRef.current) {
          hasStartedRef.current = true;
          driverRef.current.drive();
        }
      }
    };

    timeoutRef.current = setTimeout(checkModalsAndStart, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };

  }, [nutritionTourCompleted, completeNutritionTour]);

  return null;
};

export default NutritionTourGuide;