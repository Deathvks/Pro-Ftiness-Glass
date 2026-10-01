/* frontend/src/components/SocialTourGuide.jsx */
import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

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
                hasStartedRef.current = false;
                completeSocialTour();
            }
        });

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
                if (!hasStartedRef.current && driverRef.current) {
                    hasStartedRef.current = true;
                    localStorage.setItem('socialTourCompleted', 'true');
                    useAppStore.getState().setTourActive(true); driverRef.current.drive();
                }
            }
        };

        timeoutRef.current = setTimeout(checkModalsAndStart, 1500);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (driverRef.current) {
                driverRef.current.destroy();}
        };

    }, [socialTourCompleted, completeSocialTour]);

    return null;
};

export default SocialTourGuide;
