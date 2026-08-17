/* frontend/src/components/HubTourGuide.jsx */
import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useAppStore from '../store/useAppStore';

const HubTourGuide = () => {
    const { hubTourCompleted, completeHubTour } = useAppStore(state => ({
        hubTourCompleted: state.hubTourCompleted,
        completeHubTour: state.completeHubTour
    }));

    const driverRef = useRef(null);
    const timeoutRef = useRef(null);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        

        if (hubTourCompleted) return;

        driverRef.current = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            smoothScroll: false,
            doneBtnText: '¡Entendido!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Atrás',
            progressText: '{{current}} / {{total}}',

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
                        title: 'Tu Centro de Control',
                        description: 'Bienvenido al Hub. Desde aquí puedes acceder a herramientas avanzadas y personalizar tu experiencia al máximo.',
                    }
                },
                {
                    element: '#hub-progress',
                    popover: {
                        title: 'Tu Progreso',
                        description: 'Consulta tus estadísticas detalladas, marcas personales, mapa de calor muscular y volumen entrenado a lo largo del tiempo.',
                        side: 'bottom'
                    }
                },
                {
                    element: '#hub-challenges',
                    popover: {
                        title: 'Retos y Misiones',
                        description: '¡Gamifica tu entrenamiento! Completa misiones diarias y semanales para ganar puntos de experiencia (XP) y subir de nivel.',
                        side: 'bottom'
                    }
                },
                {
                    element: '#hub-appearance',
                    popover: {
                        title: 'Apariencia',
                        description: 'Configura la estética de la app. Cambia entre modo claro y oscuro, ajusta tu color de acento favorito, o desbloquea temas especiales.',
                        side: 'top'
                    }
                },
                {
                    element: '#hub-settings',
                    popover: {
                        title: 'Ajustes de Cuenta',
                        description: 'Gestiona tu privacidad, notificaciones, suscripción y otros datos personales de forma segura.',
                        side: 'top'
                    }
                }
            ],
            onDestroyed: () => {
                hasStartedRef.current = false;
                completeHubTour();
            }
        });

        const checkModalsAndStart = () => {
            if (window.location.pathname !== '/hub') {
                timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
                return;
            }
    
            const state = useAppStore.getState();

            if (state.cookieConsent === null || state.showWelcomeModal) {
                timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
                return;
            }

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
                    localStorage.setItem('hubTourCompleted', 'true');
                    driverRef.current.drive();
                }
            }
        };

        timeoutRef.current = setTimeout(checkModalsAndStart, 1500);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (driverRef.current) {
                driverRef.current.destroy();}
        };

    }, [hubTourCompleted, completeHubTour]);

    return null;
};

export default HubTourGuide;

