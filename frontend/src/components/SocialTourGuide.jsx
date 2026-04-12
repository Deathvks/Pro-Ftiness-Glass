/* frontend/src/components/SocialTourGuide.jsx */
import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useAppStore from '../store/useAppStore';

const SocialTourGuide = () => {
    const { socialTourCompleted, completeSocialTour } = useAppStore(state => ({
        socialTourCompleted: state.socialTourCompleted,
        completeSocialTour: state.completeSocialTour
    }));

    const driverRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const styleId = 'driver-js-social-theme';
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
          transform: translateY(env(safe-area-inset-top, 0px)) !important;
          margin-bottom: env(safe-area-inset-bottom, 16px) !important;
          max-height: calc(100vh - env(safe-area-inset-top, 40px) - env(safe-area-inset-bottom, 30px) - 64px) !important;
          overflow-y: auto !important;
          z-index: 999999 !important;
        }

        /* Flechas */
        .driver-popover-arrow { border-width: 8px !important; }
        .driver-popover-arrow::after {
          content: ""; position: absolute; border-width: 8px; border-style: solid; border-color: transparent;
        }
        .driver-popover-arrow-side-left.driver-popover-arrow { border-left-color: var(--glass-border) !important; border-right-color: transparent !important; border-top-color: transparent !important; border-bottom-color: transparent !important; }
        .driver-popover-arrow-side-left.driver-popover-arrow::after { border-left-color: var(--bg-secondary); right: 2px; top: -8px; }
        .driver-popover-arrow-side-right.driver-popover-arrow { border-right-color: var(--glass-border) !important; border-left-color: transparent !important; border-top-color: transparent !important; border-bottom-color: transparent !important; }
        .driver-popover-arrow-side-right.driver-popover-arrow::after { border-right-color: var(--bg-secondary); left: 2px; top: -8px; }
        .driver-popover-arrow-side-top.driver-popover-arrow { border-top-color: var(--glass-border) !important; border-bottom-color: transparent !important; border-left-color: transparent !important; border-right-color: transparent !important; }
        .driver-popover-arrow-side-top.driver-popover-arrow::after { border-top-color: var(--bg-secondary); bottom: 2px; left: -8px; }
        .driver-popover-arrow-side-bottom.driver-popover-arrow { border-bottom-color: var(--glass-border) !important; border-top-color: transparent !important; border-left-color: transparent !important; border-right-color: transparent !important; }
        .driver-popover-arrow-side-bottom.driver-popover-arrow::after { border-bottom-color: var(--bg-secondary); top: 2px; left: -8px; }

        /* Textos */
        .driver-popover-title { font-family: inherit !important; font-size: 18px !important; font-weight: 800 !important; margin-bottom: 8px !important; letter-spacing: -0.02em !important; }
        .driver-popover-description { font-family: inherit !important; color: var(--text-secondary) !important; font-size: 14px !important; line-height: 1.5 !important; margin-bottom: 24px !important; font-weight: 400 !important; }

        /* Botones */
        .driver-popover-footer { margin-top: 0 !important; display: flex !important; gap: 8px !important; justify-content: flex-end !important; }
        .driver-popover-footer button { font-family: inherit !important; border-radius: 10px !important; padding: 8px 16px !important; font-size: 13px !important; font-weight: 600 !important; cursor: pointer !important; transition: all 0.2s !important; text-shadow: none !important; outline: none !important; }
        .driver-popover-footer button.driver-popover-prev-btn { border: 1px solid var(--glass-border) !important; background-color: transparent !important; color: var(--text-secondary) !important; }
        .driver-popover-footer button.driver-popover-prev-btn:hover { background-color: var(--bg-primary) !important; color: var(--text-primary) !important; }
        .driver-popover-footer button.driver-popover-next-btn, .driver-popover-footer button.driver-popover-done-btn { background-color: var(--accent) !important; border: 1px solid var(--accent) !important; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.3) !important; color: #ffffff !important; }
        .light-theme .driver-popover-footer button.driver-popover-next-btn, .light-theme .driver-popover-footer button.driver-popover-done-btn { color: #000000 !important; }
        .driver-popover-footer button.driver-popover-next-btn:hover, .driver-popover-footer button.driver-popover-done-btn:hover { filter: brightness(1.1) !important; transform: translateY(-1px) !important; }
        .driver-popover-progress-text { color: var(--text-muted) !important; font-size: 12px !important; font-weight: 600 !important; }
        .driver-overlay path { fill: var(--bg-primary) !important; opacity: 0.85 !important; }
      `;
            document.head.appendChild(style);
        }

        if (socialTourCompleted) return;

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
                    popover: {
                        title: 'La Comunidad',
                        description: 'Comparte tus logros, descubre los de tus amigos y compite por estar en lo más alto del ranking.',
                    }
                },
                {
                    element: '#social-privacy-banner',
                    popover: {
                        title: 'Tu Privacidad',
                        description: 'Aquí puedes ver rápidamente si tu perfil es público o privado, y cambiarlo con un solo toque.',
                        side: 'bottom'
                    }
                },
                {
                    element: '#social-stories',
                    popover: {
                        title: 'Historias Efímeras',
                        description: 'Comparte un momento de tu entrenamiento. Desaparecerá automáticamente después de 24 horas.',
                        side: 'bottom'
                    }
                },
                {
                    element: '#social-tabs',
                    popover: {
                        title: 'Secciones',
                        description: 'Navega entre el Muro principal, tu lista de amigos, los grupos (squads) y el ranking global.',
                        side: 'top'
                    }
                }
            ],
            onDestroyed: () => {
                completeSocialTour();
            }
        });

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

    }, [socialTourCompleted, completeSocialTour]);

    return null;
};

export default SocialTourGuide;