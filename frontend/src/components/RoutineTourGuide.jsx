/* frontend/src/components/RoutineTourGuide.jsx */
import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useAppStore from '../store/useAppStore';

const RoutineTourGuide = () => {
    const { routineTourCompleted, completeRoutineTour } = useAppStore(state => ({
        routineTourCompleted: state.routineTourCompleted,
        completeRoutineTour: state.completeRoutineTour
    }));

    const driverRef = useRef(null);
    const timeoutRef = useRef(null);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        

        if (routineTourCompleted) return;

        driverRef.current = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            smoothScroll: false, // Desactivado para no chocar con MainLayout
            doneBtnText: '¡Entendido!',
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
                        title: 'Tus Entrenamientos',
                        description: 'Aquí puedes crear tus rutinas personalizadas, descubrir nuevas plantillas y organizar todo tu progreso.',
                    }
                },
                {
                    element: '#routines-tabs',
                    popover: {
                        title: 'Navegación Rápida',
                        description: 'Cambia entre tus rutinas guardadas, explora la biblioteca de plantillas o inicia una sesión de cardio rápida.',
                        side: 'bottom'
                    }
                },
                {
                    element: window.innerWidth < 768 ? '#routines-actions-mobile' : '#routines-actions-desktop',
                    popover: {
                        title: 'Acciones Principales',
                        description: 'Configura la privacidad de tu muro, deja que la IA diseñe una rutina para ti o crea una desde cero.',
                        side: 'bottom',
                        align: 'center'
                    }
                },
                {
                    element: '#routines-search',
                    popover: {
                        title: 'Búsqueda y Filtros',
                        description: 'Si tienes muchas rutinas, puedes buscarlas rápidamente por su nombre o agruparlas usando carpetas.',
                        side: 'top'
                    }
                }
            ],
            onDestroyed: () => {
                hasStartedRef.current = false;
                completeRoutineTour();
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

    }, [routineTourCompleted, completeRoutineTour]);

    return null;
};

export default RoutineTourGuide;