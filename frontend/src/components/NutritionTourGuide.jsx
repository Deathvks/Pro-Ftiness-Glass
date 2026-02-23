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

  useEffect(() => {
    // --- Inyección de Estilos Personalizados (Tema Glassmorphism Ajustado) ---
    const styleId = 'driver-js-nutrition-theme';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        /* Popover Container */
        .driver-popover {
          background-color: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border: 1px solid var(--glass-border) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5) !important;
          padding: 20px !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          max-width: calc(100vw - 32px) !important;
          
          /* FIX: Forzar respeto por las áreas seguras del móvil (Notch y Gestos) */
          margin-top: env(safe-area-inset-top, 16px) !important;
          margin-bottom: env(safe-area-inset-bottom, 16px) !important;
          z-index: 999999 !important;
        }

        /* --- FLECHAS CON BORDE (Técnica de doble triángulo) --- */
        .driver-popover-arrow {
          border-width: 8px !important;
        }
        .driver-popover-arrow::after {
          content: "";
          position: absolute;
          border-width: 8px;
          border-style: solid;
          border-color: transparent;
        }

        /* Flecha Lado IZQUIERDO (Apunta a la DERECHA) */
        .driver-popover-arrow-side-left.driver-popover-arrow {
          border-left-color: var(--glass-border) !important;
          border-right-color: transparent !important;
          border-top-color: transparent !important;
          border-bottom-color: transparent !important;
        }
        .driver-popover-arrow-side-left.driver-popover-arrow::after {
          border-left-color: var(--bg-secondary);
          right: 2px;
          top: -8px;
        }

        /* Flecha Lado DERECHO (Apunta a la IZQUIERDA) */
        .driver-popover-arrow-side-right.driver-popover-arrow {
          border-right-color: var(--glass-border) !important;
          border-left-color: transparent !important;
          border-top-color: transparent !important;
          border-bottom-color: transparent !important;
        }
        .driver-popover-arrow-side-right.driver-popover-arrow::after {
          border-right-color: var(--bg-secondary);
          left: 2px;
          top: -8px;
        }

        /* Flecha Lado SUPERIOR (Apunta ABAJO) */
        .driver-popover-arrow-side-top.driver-popover-arrow {
          border-top-color: var(--glass-border) !important;
          border-bottom-color: transparent !important;
          border-left-color: transparent !important;
          border-right-color: transparent !important;
        }
        .driver-popover-arrow-side-top.driver-popover-arrow::after {
          border-top-color: var(--bg-secondary);
          bottom: 2px;
          left: -8px;
        }

        /* Flecha Lado INFERIOR (Apunta ARRIBA) */
        .driver-popover-arrow-side-bottom.driver-popover-arrow {
          border-bottom-color: var(--glass-border) !important;
          border-top-color: transparent !important;
          border-left-color: transparent !important;
          border-right-color: transparent !important;
        }
        .driver-popover-arrow-side-bottom.driver-popover-arrow::after {
          border-bottom-color: var(--bg-secondary);
          top: 2px;
          left: -8px;
        }

        /* Títulos y Textos */
        .driver-popover-title {
          font-family: inherit !important;
          font-size: 18px !important;
          font-weight: 800 !important;
          margin-bottom: 8px !important;
          letter-spacing: -0.02em !important;
        }
        .driver-popover-description {
          font-family: inherit !important;
          color: var(--text-secondary) !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          margin-bottom: 24px !important;
          font-weight: 400 !important;
        }

        /* Botones Generales */
        .driver-popover-footer {
          margin-top: 0 !important;
          display: flex !important;
          gap: 8px !important;
          justify-content: flex-end !important;
        }
        .driver-popover-footer button {
          font-family: inherit !important;
          border-radius: 10px !important;
          padding: 8px 16px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          text-shadow: none !important;
          outline: none !important;
        }
        
        /* Botón Atrás */
        .driver-popover-footer button.driver-popover-prev-btn {
          border: 1px solid var(--glass-border) !important;
          background-color: transparent !important;
          color: var(--text-secondary) !important;
        }
        .driver-popover-footer button.driver-popover-prev-btn:hover {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }

        /* Botones de Acción (Siguiente / Terminar) */
        .driver-popover-footer button.driver-popover-next-btn,
        .driver-popover-footer button.driver-popover-done-btn {
          background-color: var(--accent) !important;
          border: 1px solid var(--accent) !important;
          box-shadow: 0 4px 12px -2px rgba(0,0,0,0.3) !important;
          color: #ffffff !important;
        }

        /* OVERRIDE: MODO CLARO -> Texto Negro */
        .light-theme .driver-popover-footer button.driver-popover-next-btn,
        .light-theme .driver-popover-footer button.driver-popover-done-btn {
          color: #000000 !important;
        }

        .driver-popover-footer button.driver-popover-next-btn:hover,
        .driver-popover-footer button.driver-popover-done-btn:hover {
          filter: brightness(1.1) !important;
          transform: translateY(-1px) !important;
        }

        .driver-popover-progress-text {
          color: var(--text-muted) !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }

        /* Overlay */
        .driver-overlay path {
          fill: var(--bg-primary) !important;
          opacity: 0.85 !important;
        }
      `;
      document.head.appendChild(style);
    }

    if (nutritionTourCompleted) return;

    // Configuración del Driver
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: '¡Entendido!',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      progressText: '{{current}} / {{total}}',
      steps: [
        {
          element: '#nutrition-header',
          popover: {
            title: 'Tu Panel de Nutrición',
            description: 'Gestiona tus comidas diarias, controla tus macros y mantén tu hidratación al día desde aquí.',
            side: 'bottom',
            align: 'start'
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
        completeNutritionTour();
      }
    });

    // Función recursiva para iniciar el tour solo si no hay modales activos
    const checkModalsAndStart = () => {
      const activeModals = Array.from(document.querySelectorAll('.fixed.inset-0')).filter(el => {
        const className = el.className || '';
        return typeof className === 'string' && className.includes('z-') && !className.includes('-z-');
      });

      if (activeModals.length > 0) {
        timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
      } else {
        driverRef.current.drive();
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