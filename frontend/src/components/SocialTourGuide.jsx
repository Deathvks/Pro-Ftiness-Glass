/* frontend/src/components/SocialTourGuide.jsx */
import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

const SOCIAL_TOUR_STEPS = [
    {
        popover: {
            title: 'La Comunidad',
            description: 'Tu espacio social para compartir entrenamientos terminados, descubrir a otros atletas, importar sus rutinas y competir en los rankings.'
        }
    },
    {
        element: '#social-privacy-banner',
        popover: {
            title: 'Privacidad de Perfil y Muro',
            description: 'Aquí ves si tu perfil es Público o Privado y puedes cambiarlo al instante. Además, en Rutinas (icono de globo) puedes elegir si tus entrenos se publican en "Todo el mundo", "Solo Amigos" o "No subir".',
            side: 'bottom'
        }
    },
    {
        element: '#social-stories',
        popover: {
            title: 'Historias de 24 Horas',
            description: 'Sube fotos o vídeos de tu entrenamiento que desaparecen automáticamente a las 24 horas. Puedes elegir compartirlas con toda la comunidad o solo con tus amigos.',
            side: 'bottom'
        }
    },
    {
        element: '#social-tabs',
        popover: {
            title: 'Muro, Ranking, Grupos y Más',
            description: 'Desliza entre el Muro de actividad, el Ranking Global (Top 50 por XP y racha), tu lista de Amigos, Grupos privados (Squads con código de invitación), Solicitudes y Búsqueda de atletas.',
            side: 'bottom'
        }
    },
    {
        element: '#social-feed-scopes',
        popover: {
            title: 'Global, Mi Gimnasio y Amigos',
            description: 'Filtra el Muro en 3 modos: Global (entrenos públicos en "Todo el mundo"), Mi Gimnasio (vincula tu centro para descubrir gente que entrena en tu mismo gimnasio o ciudad) y Amigos.',
            side: 'bottom'
        }
    },
    {
        element: '#social-feed-content',
        popover: {
            title: 'Reacciones Rápidas, Rutinas e Histórico',
            description: 'Reacciona con 1 toque (Fuego, Bestia, Respeto o PR), comenta sesiones, importa las rutinas de otros atletas con "Importar", conecta con compañeros o carga publicaciones anteriores del histórico.',
            side: 'top'
        }
    }
];

const SocialTourGuide = () => {
    const { socialTourCompleted, completeSocialTour } = useAppStore(useShallow(state => ({
        socialTourCompleted: state.socialTourCompleted,
        completeSocialTour: state.completeSocialTour
    })));

    const driverRef = useRef(null);
    const timeoutRef = useRef(null);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (socialTourCompleted) return;

        let retryCount = 0;
        const MAX_RETRIES = 10;
        const checkModalsAndStart = () => {
            if (window.location.pathname !== '/social') {
                timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
                return;
            }

            const state = useAppStore.getState();

            // Respetar modales globales por si cargan directo en la pestaña Social
            if (state.cookieConsent === null || state.show2FAPromo) {
                timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
                return;
            }

            const hasSeenPromo = localStorage.getItem('has_seen_2fa_promo');
            const isAlreadyEnabled = state.userProfile?.twoFactorEnabled || state.userProfile?.isTwoFactorEnabled;

            if (!hasSeenPromo && !isAlreadyEnabled) {
                timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
                return;
            }

            const activeModals = Array.from(document.querySelectorAll('.fixed.inset-0')).filter(el => {
                // Excluir overlays del propio driver.js para no bloquearnos a nosotros mismos
                if (el.classList.contains('driver-active-element') || el.id === 'driver-popover-content' || el.closest('#driver-popover-content')) return false;
                const style = window.getComputedStyle(el);
                const zIndex = parseInt(style.zIndex, 10) || 0;
                return zIndex >= 40 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            });

            retryCount++;
            if (activeModals.length > 0) {
                if (retryCount >= MAX_RETRIES) {
                    // Demasiados reintentos — otros modales bloquean el tour. Marcar como completado para no molestar más.
                    completeSocialTour();
                    return;
                }
                timeoutRef.current = setTimeout(checkModalsAndStart, 1000);
            } else {
                if (!hasStartedRef.current) {
                    const availableSteps = SOCIAL_TOUR_STEPS.filter(
                        step => !step.element || document.querySelector(step.element)
                    );

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
                        onPopoverRender: (popover, { config, state: driverState }) => {
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
                                if (driverState.activeIndex === config.steps.length - 1) {
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

                        steps: availableSteps,
                        onDestroyed: () => {
                            hasStartedRef.current = false;
                            completeSocialTour();
                        }
                    });

                    hasStartedRef.current = true;
                    localStorage.setItem('socialTourCompleted', 'true');
                    useAppStore.getState().setTourActive(true);
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

    }, [socialTourCompleted, completeSocialTour]);

    return null;
};

export default SocialTourGuide;
