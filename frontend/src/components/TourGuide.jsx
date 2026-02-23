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

  useEffect(() => {
    // --- Inyección de Estilos Personalizados (Glassmorphism Theme) ---
    const styleId = 'driver-js-custom-theme';
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
        
        /* 1. Base de la flecha (actúa como el borde) */
        .driver-popover-arrow {
          border-width: 8px !important;
        }
        
        /* 2. Pseudo-elemento para el relleno (color de fondo) */
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
          
          /* POR DEFECTO (Dark/OLED): Texto Blanco */
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

    if (tourCompleted) return;

    // Configuración del Driver
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: '¡A entrenar!',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      progressText: '{{current}} / {{total}}',
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

    // Función recursiva para iniciar el tour solo si no hay modales activos
    const checkModalsAndStart = () => {
      // Buscamos elementos que cumplan el patrón de modales de la app
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

    // Iniciamos la comprobación
    timeoutRef.current = setTimeout(checkModalsAndStart, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [tourCompleted, completeTour]);

  return null;
};

export default TourGuide;