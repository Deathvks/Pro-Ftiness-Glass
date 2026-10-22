/* frontend/src/components/MainAppLayout.jsx */
import React, { Suspense, lazy, useEffect, useState, useRef, startTransition } from 'react';
import { SparklesIcon, BellIcon, Cog8ToothIcon as SettingsIcon, UserIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { BoltIcon as Zap, CheckCircleIcon } from '@heroicons/react/24/solid';
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { APP_VERSION } from '../config/version';
import { useToast } from '../hooks/useToast';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useAppTheme } from '../hooks/useAppTheme';
import { initSocket } from '../services/socket';
import * as userService from '../services/userService';

// Componentes UI
import Sidebar from './Sidebar';
import ModalPortal from './ModalPortal';
import { Palette, RefreshCw } from 'lucide-react';
import Spinner from './Spinner';
import PRToast from './PRToast';
import AndroidDownloadPrompt from './AndroidDownloadPrompt';
import APKUpdater from './APKUpdater';
import UserAvatar from './UserAvatar';

const ConfirmationModal = lazy(() => import('./ConfirmationModal'));
const WelcomeModal = lazy(() => import('./WelcomeModal'));
const EmailVerificationModal = lazy(() => import('./EmailVerificationModal'));
const EmailVerification = lazy(() => import('./EmailVerification'));
const CookieConsentBanner = lazy(() => import('./CookieConsentBanner'));
const AIInfoModal = lazy(() => import('./AIInfoModal'));
const MilestoneLevelUpModal = lazy(() => import('./MilestoneLevelUpModal'));
const ReferralSuccessAnimation = lazy(() => import('./ReferralSuccessAnimation'));
const GlobalRatingPrompt = lazy(() => import('./GlobalRatingPrompt'));

// Constantes
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const ACCENT_UNLOCK_REWARDS = {
  20: [
    { name: 'Supernova', gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 35%, #3b82f6 70%, #7c3aed 100%)', isAnimated: true, glow: 'rgba(124, 58, 237, 0.45)' },
    { name: 'Plasma Cuántico', gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 35%, #3b82f6 70%, #10b981 100%)', isAnimated: true, glow: 'rgba(16, 185, 129, 0.45)' },
    { name: 'Llama Eterna', gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 35%, #facc15 70%, #ef4444 100%)', isAnimated: true, glow: 'rgba(239, 68, 68, 0.45)' },
    { name: 'Vórtice Abisal', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #6366f1 35%, #14b8a6 70%, #1d4ed8 100%)', isAnimated: true, glow: 'rgba(29, 78, 216, 0.45)' },
    { name: 'Oro Cósmico', gradient: 'linear-gradient(135deg, #d97706 0%, #fef08a 35%, #b45309 70%, #d97706 100%)', isAnimated: true, glow: 'rgba(217, 119, 6, 0.45)' },
  ],
  15: [
    { name: 'Aurora Boreal', gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', glow: 'rgba(16, 185, 129, 0.35)' },
    { name: 'Sunset Glow', gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)', glow: 'rgba(244, 63, 94, 0.35)' },
    { name: 'Cyberpunk', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', glow: 'rgba(139, 92, 246, 0.35)' },
    { name: 'Océano Profundo', gradient: 'linear-gradient(135deg, #2563eb 0%, #00f5d4 100%)', glow: 'rgba(37, 99, 235, 0.35)' },
    { name: 'Oro Imperial', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fde047 100%)', glow: 'rgba(245, 158, 11, 0.35)' },
  ],
  10: [
    { name: 'Rosa Atardecer', bg: '#ff9a9e', glow: 'rgba(255, 154, 158, 0.35)' },
    { name: 'Pistacho', bg: '#c5e1a5', glow: 'rgba(197, 225, 165, 0.35)' },
    { name: 'Mango', bg: '#ffbe76', glow: 'rgba(255, 190, 118, 0.35)' },
    { name: 'Limonada', bg: '#fdfd96', glow: 'rgba(253, 253, 150, 0.35)' },
    { name: 'Flor de Cerezo', bg: '#fccbcf', glow: 'rgba(252, 203, 207, 0.35)' },
  ],
  5: [
    { name: 'Menta Suave', bg: '#a8e6cf', glow: 'rgba(168, 230, 207, 0.35)' },
    { name: 'Melocotón', bg: '#ffd3b6', glow: 'rgba(255, 211, 182, 0.35)' },
    { name: 'Agua de Rosas', bg: '#ffaaa5', glow: 'rgba(255, 170, 165, 0.35)' },
    { name: 'Lavanda', bg: '#c5a3ff', glow: 'rgba(197, 163, 255, 0.35)' },
    { name: 'Azul Bebé', bg: '#a2cffe', glow: 'rgba(162, 207, 254, 0.35)' },
  ],
};

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full pt-20">
    <Spinner size={40} />
  </div>
);

class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[ViewErrorBoundary] Error cargando vista:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.view !== this.props.view && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReload = () => {
    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
    }
    sessionStorage.clear();
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.navigate) {
      this.props.navigate('dashboard');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[55vh] flex flex-col items-center justify-center p-6 text-center animate-[fade-in_0.3s_ease-out]">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
            <RefreshCw className="animate-spin-slow" size={32} />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Actualización disponible</h2>
          <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
            Hemos actualizado la aplicación con una nueva versión. Recarga para ver esta sección o vuelve al inicio.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-accent text-accent-contrast font-bold text-sm shadow-md shadow-accent/25 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              Recargar ahora
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-text-secondary hover:text-text-primary font-bold text-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


export default function MainAppLayout({
  view,
  navigate,
  preloadView,
  mainContentRef,
  currentTitle,
  currentViewComponent,
  navItems,
  handleLogoutClick,
  showLogoutConfirm,
  confirmLogout,
  setShowLogoutConfirm,
  handleShowPolicy,
  showEmailVerificationModal,
  showCodeVerificationModal,
  verificationEmail,
  setVerificationEmail,
  setShowEmailVerificationModal,
  setShowCodeVerificationModal,
  fetchInitialData,
  profileImgSrc,
}) {
  const { addToast } = useToast();
  useOfflineSync();
  const { activeTheme, accent } = useAppTheme();
  const isLevel20Accent = ['supernova', 'plasma', 'eternal-flame', 'abyssal-vortex', 'cosmic-gold'].includes(accent);

  // Workaround para re-calcular env(safe-area-inset-top) en iOS PWA al cambiar el tema
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setTimeout(() => {
        document.body.style.paddingTop = '1px';
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => {
          document.body.style.paddingTop = '0px';
        }, 50);
      }, 100);
    }
  }, [activeTheme]);

  const {
    userProfile,
    prNotification,
    showWelcomeModal,
    closeWelcomeModal,
    cookieConsent,
    handleAcceptCookies,
    handleDeclineCookies,
    activeWorkout,
    workoutStartTime,
    notifications,
    fetchNotifications,
    gamification,
    setGamificationData,
    unlockMilestone,
    gamificationEvents,
    clearGamificationEvents,
    socialRequests,
    fetchFriendRequests,
    subscribeToSocialEvents,
    show2FAPromo,
    tourActive,
  } = useAppStore(useShallow(state => ({
    userProfile: state.userProfile,
    prNotification: state.prNotification,
    showWelcomeModal: state.showWelcomeModal,
    closeWelcomeModal: state.closeWelcomeModal,
    cookieConsent: state.cookieConsent,
    handleAcceptCookies: state.handleAcceptCookies,
    handleDeclineCookies: state.handleDeclineCookies,
    activeWorkout: state.activeWorkout,
    workoutStartTime: state.workoutStartTime,
    notifications: state.notifications || [],
    fetchNotifications: state.fetchNotifications,
    gamification: state.gamification,
    setGamificationData: state.setGamificationData,
    unlockMilestone: state.unlockMilestone,
    gamificationEvents: state.gamification?.gamificationEvents,
    clearGamificationEvents: state.clearGamificationEvents,
    socialRequests: state.socialRequests || [],
    fetchFriendRequests: state.fetchFriendRequests,
    subscribeToSocialEvents: state.subscribeToSocialEvents,
    show2FAPromo: state.show2FAPromo,
    tourActive: state.tourActive,
  })));

  const [showAIModal, setShowAIModal] = useState(false);
  const [showAccentUnlockModal, setShowAccentUnlockModal] = useState(false);
  const [accentUnlockLevel, setAccentUnlockLevel] = useState(null);
  const [aiRemaining, setAiRemaining] = useState(() => localStorage.getItem('ai_remaining_uses') || '5');
  const [aiLimit, setAiLimit] = useState(() => localStorage.getItem('ai_daily_limit') || '5');
  const [viewResetKey, setViewResetKey] = useState(0);
  
  // ESTADO GLOBAL DE MODALES PARA OCULTAR NAVBAR
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);

  // --- REFS Y ESTADOS PARA LA GOTA LÍQUIDA ---
  const navRef = useRef(null);
  const dropRef = useRef(null);
  const swipeContainerRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const dragXRef = useRef(0);
  const touchStartXRef = useRef(0);
  const jumpTimeoutRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [dragHoverIndex, setDragHoverIndex] = useState(-1);
  const [isDraggingDrop, setIsDraggingDrop] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [navWidth, setNavWidth] = useState(0);
  const [isInitialRender, setIsInitialRender] = useState(true);

  // --- REFS PARA EL MOTOR DE GESTOS (SWIPE) DEL CONTENIDO ---
  const contentTouchStartRef = useRef(null);
  const contentTouchEndRef = useRef(null);
  const isSwipingContentRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const prevViewRef = useRef(view);
  const SWIPE_THRESHOLD = 60; 

  // --- DETECCIÓN DE SCROLL PARA MATCHEAR LA TRANSPARENCIA DEL NOTCH iOS 27 ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  useEffect(() => {
    const node = mainContentRef?.current;
    if (!node) return;

    // Cuando cambiamos de vista, asegúrate de scrollear arriba y a la izquierda de forma instantánea
    node.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    node.scrollLeft = 0;

    const handleScroll = () => {
      const currentScrollTop = node.scrollTop;
      setIsScrolled(currentScrollTop > 4);
      
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (!isAndroid) {
        setIsHeaderHidden(currentScrollTop > 20);
      } else {
        setIsHeaderHidden(false);
      }
    };

    handleScroll();
    node.addEventListener('scroll', handleScroll, { passive: true });



    return () => node.removeEventListener('scroll', handleScroll);
  }, [mainContentRef, view]);

  const wasSwipeNavRef = useRef(false);

  // OBSERVADOR DE MODALES (Para ocultar Navbar y Header sin recalcular estilos en cada cambio de clase/transform)
  useEffect(() => {
    let rafId;
    const checkModals = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const overlays = document.querySelectorAll('.fixed.inset-0');
        let hasModal = false;
        for (let i = 0; i < overlays.length; i++) {
          const el = overlays[i];
          const style = window.getComputedStyle(el);
          const zIndex = parseInt(style.zIndex, 10) || 0;
          if (zIndex >= 40 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
            hasModal = true;
            break;
          }
        }
        setIsGlobalModalOpen(prev => (prev === hasModal ? prev : hasModal));
      });
    };

    checkModals();
    const observer = new MutationObserver(() => checkModals());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleNavClick = (itemId, options = {}) => {
    if (preloadView) preloadView(itemId);

    if (itemId === 'routines') {
      localStorage.removeItem('routinesEditingState_v2');
      localStorage.setItem('routinesForceTab', 'myRoutines');
      localStorage.removeItem('quickCardioOrigin');
    }

    wasSwipeNavRef.current = Boolean(options.fromSwipe);

    if (view === itemId) {
      if (mainContentRef && mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setViewResetKey(prev => prev + 1);
    } else {
      navigate(itemId);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (notifications.length > 0) {
      const unreadReferrals = notifications.filter(n => !n.is_read && n.type === 'referral_success');
      if (unreadReferrals.length > 0) {
        unreadReferrals.forEach(n => {
          useAppStore.getState().addReferralAnimation({ friendName: n.data?.friendName || 'Tu amigo' });
          useAppStore.getState().markNotificationAsRead(n.id);
        });
      }
    }
  }, [notifications]);

  // EFECTO DE TRANSICIÓN ANIMADA (Solo cuando se navega deslizando con el dedo; al pulsar navbar/sidebar es instantáneo)
  useEffect(() => {
    if (prevViewRef.current !== view) {
      const shouldAnimateSlide = wasSwipeNavRef.current;
      wasSwipeNavRef.current = false;

      if (shouldAnimateSlide && swipeContainerRef.current) {
        isTransitioningRef.current = true;
        const prevIndex = navItems.findIndex(i => i.id === prevViewRef.current);
        const currentIndex = navItems.findIndex(i => i.id === view);
        const dir = (prevIndex !== -1 && currentIndex !== -1 && currentIndex < prevIndex) ? 'left' : 'right';

        const container = swipeContainerRef.current;
        container.style.willChange = 'transform';
        container.style.transition = 'none';
        container.style.transform = `translate3d(${dir === 'right' ? '100vw' : '-100vw'}, 0, 0)`;

        // Forzar reflow síncrono para que el navegador fije la posición inicial fuera de pantalla sin tirones
        void container.offsetWidth;

        requestAnimationFrame(() => {
          if (!swipeContainerRef.current) {
            isTransitioningRef.current = false;
            return;
          }
          swipeContainerRef.current.style.transition = 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)';
          swipeContainerRef.current.style.transform = 'translate3d(0, 0, 0)';

          setTimeout(() => {
            isTransitioningRef.current = false;
            if (swipeContainerRef.current) {
              swipeContainerRef.current.style.transform = '';
              swipeContainerRef.current.style.transition = '';
              swipeContainerRef.current.style.willChange = '';
            }
          }, 320);
        });
      } else {
        isTransitioningRef.current = false;
        if (swipeContainerRef.current) {
          swipeContainerRef.current.style.transform = '';
          swipeContainerRef.current.style.transition = '';
          swipeContainerRef.current.style.willChange = '';
        }
      }
      prevViewRef.current = view;
    }
  }, [view, navItems]);

  // MOTOR DE GESTOS
  const handleContentTouchStart = (e) => {
    if (isTransitioningRef.current) return;
    let node = e.target;
    let blockSwipe = false;
    
    while (node && node !== e.currentTarget) {
      const classNameStr = typeof node.className === 'string' ? node.className.toLowerCase() : '';
      if (
        classNameStr.includes('joyride') ||
        classNameStr.includes('tour') ||
        classNameStr.includes('driver') ||
        (node.classList && (node.classList.contains('no-swipe') || node.classList.contains('fixed'))) ||
        (typeof node.getAttribute === 'function' && node.getAttribute('role') === 'dialog') ||
        (node.id && typeof node.id === 'string' && node.id.toLowerCase().includes('joyride'))
      ) {
        blockSwipe = true; 
        break;
      }
      if (node.tagName === 'INPUT' && node.type === 'range') {
        blockSwipe = true; 
        break;
      }
      if (node.nodeType === 1) { 
        const style = window.getComputedStyle(node);
        if (['auto', 'scroll'].includes(style.overflowX) && node.scrollWidth > node.clientWidth) {
          blockSwipe = true; 
          break;
        }
      }
      node = node.parentNode;
    }

    // Block swipe if view is not in main nav items (i.e. it's a sub-page)
    const currentIndex = navItems.findIndex(item => item.id === view);
    if (currentIndex === -1) {
      blockSwipe = true;
    }

    if (blockSwipe) {
      contentTouchStartRef.current = null;
      return;
    }

    contentTouchEndRef.current = null;
    contentTouchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      currentIndex,
    };
    isSwipingContentRef.current = false;
  };

  const handleContentTouchMove = (e) => {
    if (!contentTouchStartRef.current || !swipeContainerRef.current || isTransitioningRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = contentTouchStartRef.current.x - currentX; 
    const dy = contentTouchStartRef.current.y - currentY;

    if (!isSwipingContentRef.current) {
      if (Math.abs(dy) > Math.abs(dx)) {
        contentTouchStartRef.current = null; 
        return;
      }
      if (Math.abs(dx) > 10) {
        isSwipingContentRef.current = true;
        swipeContainerRef.current.style.willChange = 'transform';
        swipeContainerRef.current.style.transition = 'none';

        // Precargar las vistas adyacentes en cuanto empieza el gesto para evitar cualquier tirón al soltar
        const idx = contentTouchStartRef.current.currentIndex;
        if (preloadView && idx !== -1) {
          if (idx + 1 < navItems.length) preloadView(navItems[idx + 1].id);
          if (idx - 1 >= 0) preloadView(navItems[idx - 1].id);
        }
      }
    }

    if (isSwipingContentRef.current) {
      const currentIndex = contentTouchStartRef.current.currentIndex;
      let transformX = -dx;

      if ((currentIndex === 0 && dx < 0) || (currentIndex === navItems.length - 1 && dx > 0)) {
        transformX = -dx * 0.25; 
      }

      swipeContainerRef.current.style.transform = `translate3d(${transformX}px, 0, 0)`;
    }

    contentTouchEndRef.current = { x: currentX, y: currentY };
  };

  const handleContentTouchEnd = () => {
    if (isTransitioningRef.current) return;

    const resetSwipe = () => {
      if (swipeContainerRef.current) {
        swipeContainerRef.current.style.transition = 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
        swipeContainerRef.current.style.transform = `translate3d(0, 0, 0)`;
        setTimeout(() => {
          if (swipeContainerRef.current) {
            swipeContainerRef.current.style.transform = '';
            swipeContainerRef.current.style.transition = '';
            swipeContainerRef.current.style.willChange = '';
          }
        }, 280);
      }
    };

    if (!contentTouchStartRef.current || !contentTouchEndRef.current) {
      if (isSwipingContentRef.current) resetSwipe();
      isSwipingContentRef.current = false;
      return;
    }

    const dx = contentTouchStartRef.current.x - contentTouchEndRef.current.x; 
    const currentIndex = contentTouchStartRef.current.currentIndex ?? navItems.findIndex(item => item.id === view);
    let navigated = false;
    let nextId = null;

    if (Math.abs(dx) > SWIPE_THRESHOLD && isSwipingContentRef.current) {
      if (dx > 0 && currentIndex < navItems.length - 1) {
        navigated = true;
        nextId = navItems[currentIndex + 1].id;
      } else if (dx < 0 && currentIndex > 0) {
        navigated = true;
        nextId = navItems[currentIndex - 1].id;
      }
    }

    if (navigated && nextId) {
      isTransitioningRef.current = true;
      if (preloadView) preloadView(nextId);
      const screenWidth = window.innerWidth;
      const exitX = dx > 0 ? -screenWidth : screenWidth;
      
      if (swipeContainerRef.current) {
        swipeContainerRef.current.style.transition = 'transform 0.18s ease-out';
        swipeContainerRef.current.style.transform = `translate3d(${exitX}px, 0, 0)`;
      }

      setTimeout(() => {
        handleNavClick(nextId, { fromSwipe: true });
      }, 180);
    } else {
      resetSwipe();
    }

    contentTouchStartRef.current = null;
    contentTouchEndRef.current = null;
    isSwipingContentRef.current = false;
  };

  // --- LÓGICA DE LA GOTA LÍQUIDA ---
  useEffect(() => {
    if (!navRef.current) return;

    const updateSize = () => {
      if (navRef.current) {
        setNavWidth(navRef.current.offsetWidth);
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(navRef.current);
    window.addEventListener('resize', updateSize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [navItems.length]);

  useEffect(() => {
    if (!hasDraggedRef.current && navRef.current) {
      const activeIndex = navItems.findIndex(item => item.id === view);
      if (activeIndex !== -1) {
        const buttons = Array.from(navRef.current.querySelectorAll('button'));
        const btn = buttons[activeIndex];
        if (btn) {
          const navRect = navRef.current.getBoundingClientRect();
          const btnRect = btn.getBoundingClientRect();
          
          const exactCenter = (btnRect.left - navRect.left) + (btnRect.width / 2);
          
          if (!isInitialRender && Math.abs(dragX - exactCenter) > 20) {
            setIsJumping(true);
            if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
            jumpTimeoutRef.current = setTimeout(() => setIsJumping(false), 380);
          }
          
          setDragX(exactCenter);
          dragXRef.current = exactCenter;

          if (isInitialRender) {
            setTimeout(() => setIsInitialRender(false), 50);
          }
        }
      }
    }
  }, [view, navItems, isInitialRender, navWidth]);

  const handleDropDragStart = (e) => {
    // 0 re-renders en el primer toque, el color no se pierde y no hay lag
    hasDraggedRef.current = false;
    dragXRef.current = dragX;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    touchStartXRef.current = clientX;
  };

  const handleDropDragMove = (e) => {
    if (!navRef.current) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    
    // GUARDIA CRÍTICA: Ignorar movimientos pequeños (< 10px) para que los toques (taps) no muevan la gota
    if (!hasDraggedRef.current && Math.abs(clientX - touchStartXRef.current) < 10) {
      return;
    }
    
    if (!hasDraggedRef.current) {
        hasDraggedRef.current = true;
        if (dropRef.current) {
            dropRef.current.style.transition = 'none';
        }
    }
    
    const navRect = navRef.current.getBoundingClientRect();
    
    let x = clientX - navRect.left;
    let nearestIndex = -1; // fallback

    const buttons = Array.from(navRef.current.querySelectorAll('button'));
    if (buttons.length > 0) {
      const firstBtnRect = buttons[0].getBoundingClientRect();
      const lastBtnRect = buttons[buttons.length - 1].getBoundingClientRect();
      
      const firstCenter = (firstBtnRect.left - navRect.left) + (firstBtnRect.width / 2);
      const lastCenter = (lastBtnRect.left - navRect.left) + (lastBtnRect.width / 2);
      
      x = Math.max(firstCenter, Math.min(x, lastCenter));

      // Calculate nearest for highlighting
      let minDistance = Infinity;
      buttons.forEach((btn, idx) => {
        const btnRect = btn.getBoundingClientRect();
        const btnCenter = (btnRect.left - navRect.left) + (btnRect.width / 2);
        const distance = Math.abs(x - btnCenter);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = idx;
        }
      });

      // Pure DOM highlighting (0 React re-renders = 0 lag)
      buttons.forEach((btn, idx) => {
        const iconDiv = btn.querySelector('div');
        if (idx === nearestIndex) {
          btn.style.color = 'var(--color-accent)';
          btn.classList.remove('text-text-secondary');
          if (iconDiv) {
            iconDiv.classList.add('scale-125');
            iconDiv.classList.remove('group-hover:scale-110');
          }
        } else {
          btn.style.color = '';
          btn.classList.add('text-text-secondary');
          if (iconDiv) {
            iconDiv.classList.remove('scale-125');
            iconDiv.classList.add('group-hover:scale-110');
          }
        }
      });
    }
    
    dragXRef.current = x;
    
    // Direct DOM manipulation avoids freezing React
    if (dropRef.current) {
      dropRef.current.style.transform = `translate3d(calc(${x}px - 50%), 0, 0)`;
    }
  };

  const handleDropDragEnd = (e) => {
    if (hasDraggedRef.current) {
      if (navRef.current) {
        let nearestIndex = 0;
        let minDistance = Infinity;
        const buttons = Array.from(navRef.current.querySelectorAll('button'));
        const navRect = navRef.current.getBoundingClientRect();
        
        buttons.forEach((btn, idx) => {
          const btnRect = btn.getBoundingClientRect();
          const btnCenter = (btnRect.left - navRect.left) + (btnRect.width / 2);
          const distance = Math.abs(dragXRef.current - btnCenter);
          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = idx;
          }
        });

        // Limpiar estilos temporales de hover en botones
        buttons.forEach(btn => {
          btn.style.color = '';
          const iconDiv = btn.querySelector('div');
          if (iconDiv) {
            iconDiv.classList.remove('scale-125');
          }
        });

        if (buttons[nearestIndex]) {
            const btnRect = buttons[nearestIndex].getBoundingClientRect();
            const exactCenter = (btnRect.left - navRect.left) + (btnRect.width / 2);
            if (dropRef.current) {
                dropRef.current.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease';
                dropRef.current.style.transform = `translate3d(calc(${exactCenter}px - 50%), 0, 0)`;
            }
            setDragX(exactCenter);
            dragXRef.current = exactCenter;
        }

        const selectedItem = navItems[nearestIndex];
        if (selectedItem && selectedItem.id !== view) {
          handleNavClick(selectedItem.id);
        }
      }
      setTimeout(() => {
        hasDraggedRef.current = false;
        if (dropRef.current) {
          dropRef.current.style.transition = '';
        }
      }, 450);
    }
  };

  // --- LÓGICA DE ANIMACIÓN DE NIVELES DESTACADOS ---
  const [pendingMilestone, setPendingMilestone] = useState(null);
  
  useEffect(() => {
    if (!gamification || !gamification.level) return;
    
    const MILESTONE_LEVELS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
    const unlockedBadges = gamification.unlockedBadges || [];
    const currentLevel = Number(gamification.level);
    
    const highestReached = MILESTONE_LEVELS.find(lvl => currentLevel >= lvl);
    
    if (highestReached) {
      if (!unlockedBadges.includes(`milestone_${highestReached}`)) {
        setPendingMilestone(highestReached);
      }
    }
  }, [gamification, gamification?.level, gamification?.unlockedBadges]);

  const handleMilestoneClose = () => {
    if (pendingMilestone) {
      const milestoneLvl = pendingMilestone;
      unlockMilestone(milestoneLvl);
      setPendingMilestone(null);
      if ([5, 10, 15, 20].includes(milestoneLvl)) {
        setTimeout(() => {
          setAccentUnlockLevel(milestoneLvl);
          setShowAccentUnlockModal(true);
        }, 300);
      }
    }
  };

  // --- RESTO DE EFECTOS (diferidos ligeramente para no saturar conexiones en Ctrl+Shift+R) ---
  useEffect(() => {
    if (!userProfile?.id) return;
    const timerId = setTimeout(() => {
      fetchNotifications();
      fetchFriendRequests();
      subscribeToSocialEvents();
    }, 400);
    return () => clearTimeout(timerId);
  }, [fetchNotifications, fetchFriendRequests, subscribeToSocialEvents, userProfile?.id]);

  useEffect(() => {
    if (gamificationEvents && gamificationEvents.length > 0) {
      gamificationEvents.forEach(event => {
        if (event.type === 'xp') {
          addToast(`+${event.amount} XP: ${event.reason}`, 'success');
        } else if (event.type === 'badge') {
          addToast(`¡Insignia Desbloqueada! ${event.badge.name}`, 'success');
        } else if (event.type === 'level_up') {
          let extraStr = '';
          if (event.newLevel === 5) extraStr = ' (¡Nuevos pasteles desbloqueados!)';
          if (event.newLevel === 10) extraStr = ' (¡Nuevos pasteles vibrantes desbloqueados!)';
          if (event.newLevel === 15) extraStr = ' (¡Nuevos degradados desbloqueados!)';
          if (event.newLevel === 20) extraStr = ' (¡Nuevos acentos animados desbloqueados!)';
          addToast(`¡Felicidades! Has subido al Nivel ${event.newLevel} 🚀${extraStr}`, 'success', 6000);
          if ([5, 10, 15, 20].includes(event.newLevel)) {
            setTimeout(() => {
              setAccentUnlockLevel(event.newLevel);
              setShowAccentUnlockModal(true);
            }, 500);
          }
        } else if (event.type === 'challenge_completed') {
          addToast(`¡Reto completado! ${event.message} (+${event.xpAdded} XP)`, 'success');
          if (event.leveledUp) {
            addToast(`¡Felicidades! Has subido al Nivel ${event.newLevel} 🏆`, 'success', 6000);
            if ([5, 10, 15, 20].includes(event.newLevel)) {
              setTimeout(() => {
                setAccentUnlockLevel(event.newLevel);
                setShowAccentUnlockModal(true);
              }, 500);
            }
          }
        }
      });
      clearGamificationEvents();
    }
  }, [gamificationEvents, clearGamificationEvents, addToast]);

  // --- MODAL DE DESBLOQUEO DE ACENTOS PARA USUARIOS EXISTENTES ---
  useEffect(() => {
    if (!userProfile || !gamification) return;
    const level = gamification.level || 1;
    const userId = userProfile.id;
    if (!userId) return;
    
    // Si hay otros modales bloqueantes, no hacer nada aún
    if (showWelcomeModal || show2FAPromo || tourActive || cookieConsent === null || showEmailVerificationModal || showCodeVerificationModal || isGlobalModalOpen) return;

    const key5 = `accent_unlock_notified_5_${userId}`;
    const key10 = `accent_unlock_notified_10_${userId}`;
    const key15 = `accent_unlock_notified_15_${userId}`;
    const key20 = `accent_unlock_notified_20_${userId}`;

    // Priorizar nivel 20 sobre nivel 15, nivel 10 y nivel 5
    if (level >= 20 && localStorage.getItem(key20) !== 'true') {
      const timer = setTimeout(() => {
        setAccentUnlockLevel(20);
        setShowAccentUnlockModal(true);
        localStorage.setItem(key20, 'true');
        localStorage.setItem(key15, 'true');
        localStorage.setItem(key10, 'true');
        localStorage.setItem(key5, 'true');
      }, 1500);
      return () => clearTimeout(timer);
    } else if (level >= 15 && localStorage.getItem(key15) !== 'true') {
      const timer = setTimeout(() => {
        setAccentUnlockLevel(15);
        setShowAccentUnlockModal(true);
        localStorage.setItem(key15, 'true');
        localStorage.setItem(key10, 'true');
        localStorage.setItem(key5, 'true');
      }, 1500);
      return () => clearTimeout(timer);
    } else if (level >= 10 && localStorage.getItem(key10) !== 'true') {
      const timer = setTimeout(() => {
        setAccentUnlockLevel(10);
        setShowAccentUnlockModal(true);
        localStorage.setItem(key10, 'true');
        localStorage.setItem(key5, 'true');
      }, 1500);
      return () => clearTimeout(timer);
    } else if (level >= 5 && localStorage.getItem(key5) !== 'true') {
      const timer = setTimeout(() => {
        setAccentUnlockLevel(5);
        setShowAccentUnlockModal(true);
        localStorage.setItem(key5, 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    userProfile?.id, 
    gamification?.level, 
    showWelcomeModal, 
    show2FAPromo, 
    tourActive, 
    cookieConsent, 
    showEmailVerificationModal, 
    showCodeVerificationModal,
    isGlobalModalOpen
  ]);

  useEffect(() => {
    if (!userProfile?.id) return;
    
    let activeSocket = null;
    const handleGamificationEvent = async (data) => {
      if (data.type === 'referral_success') {
        useAppStore.getState().addReferralAnimation(data);
      } else if (data.type === 'level_up') {
          let extraStr = '';
          if (data.newLevel === 5) extraStr = ' (¡Nuevos pasteles desbloqueados!)';
          if (data.newLevel === 10) extraStr = ' (¡Nuevos pasteles vibrantes desbloqueados!)';
          if (data.newLevel === 15) extraStr = ' (¡Nuevos degradados desbloqueados!)';
          if (data.newLevel === 20) extraStr = ' (¡Nuevos acentos animados desbloqueados!)';
          addToast(`¡Felicidades! Has subido al Nivel ${data.newLevel} 🚀${extraStr}`, 'success', 6000);
        } else if (data.type === 'challenge_completed') {
        addToast(`¡Reto completado! ${data.message} (+${data.xpAdded} XP)`, 'success');
        if (data.leveledUp) {
          addToast(`¡Felicidades! Has subido al Nivel ${data.newLevel} 🏆`, 'success', 6000);
        }
      }
      
      if (data.type === 'challenge_completed' || data.type === 'referral_success') {
        try {
          const profileData = await userService.getMyProfile();
          if (profileData && setGamificationData) {
            setGamificationData({
              xp: profileData.xp,
              level: profileData.level,
              streak: profileData.streak,
              last_activity_date: profileData.last_activity_date,
              unlocked_badges: profileData.unlocked_badges
            });
          }
        } catch (error) {
          console.error("Error actualizando perfil tras reto completado:", error);
        }
      }
    };

    const handleChatEvent = () => {
      const fetchUnreadChats = useAppStore.getState().fetchUnreadChats;
      if (fetchUnreadChats) fetchUnreadChats();
    };

    const timerId = setTimeout(() => {
      activeSocket = initSocket();
      if (!activeSocket) return;
      activeSocket.on('GAMIFICATION_EVENT', handleGamificationEvent);
      activeSocket.on('chat_message', handleChatEvent);
      subscribeToSocialEvents();
    }, 450);

    return () => {
      clearTimeout(timerId);
      if (activeSocket) {
        activeSocket.off('GAMIFICATION_EVENT', handleGamificationEvent);
        activeSocket.off('chat_message', handleChatEvent);
      }
    };
  }, [userProfile?.id, addToast, setGamificationData, subscribeToSocialEvents]);

  useEffect(() => {
    if (userProfile && userProfile.email && userProfile.email.endsWith('@x-auth.local')) {
      if (!showCodeVerificationModal && !showEmailVerificationModal) {
        addToast('Por seguridad, debes vincular un correo real a tu cuenta de X.', 'warning', 6000);
        setShowEmailVerificationModal(true);
        setVerificationEmail(''); 
      }
    }
  }, [userProfile, showCodeVerificationModal, showEmailVerificationModal, setShowEmailVerificationModal, setVerificationEmail, addToast]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (localStorage.getItem('cookie_consent') === 'accepted' && cookieConsent !== 'accepted') {
        handleAcceptCookies();
      }
    };

    const updateAILimits = () => {
      setAiRemaining(localStorage.getItem('ai_remaining_uses') || '5');
      setAiLimit(localStorage.getItem('ai_daily_limit') || '5');
    };

    const checkMidnightReset = () => {
      const lastDate = localStorage.getItem('ai_last_date');
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

      if (lastDate && lastDate !== today) {
        localStorage.removeItem('ai_remaining_uses');
        localStorage.removeItem('ai_daily_limit');
        localStorage.setItem('ai_last_date', today);
        updateAILimits();
        window.dispatchEvent(new Event('ai_limit_updated'));
      } else {
        updateAILimits();
      }
    };

    const midnightChecker = setInterval(checkMidnightReset, 60000);
    checkMidnightReset();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage', checkMidnightReset);
    window.addEventListener('focus', checkMidnightReset);
    window.addEventListener('ai_limit_updated', checkMidnightReset);

    return () => {
      clearInterval(midnightChecker);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage', checkMidnightReset);
      window.removeEventListener('focus', checkMidnightReset);
      window.removeEventListener('ai_limit_updated', checkMidnightReset);
    };
  }, [cookieConsent, handleAcceptCookies]);

  const isAILimitReached = parseInt(aiRemaining, 10) === 0;
  const activeIndex = navItems.findIndex(item => item.id === view);
  const isDropVisible = activeIndex !== -1 && dragX > 0;

  return (
    <div className="relative flex flex-1 w-full h-full overflow-hidden bg-transparent">
      {/* ATMÓSFERA AURORA BOREAL LÍQUIDA (NIVEL 20 - TRANQUILITA SOLO ARRIBA) */}
      {isLevel20Accent && (
        <div className="aurora-container pointer-events-none fixed top-0 left-0 right-0 h-[40vh] max-h-[360px] z-0 overflow-hidden" aria-hidden="true">
          <div className="aurora-glow" />
          <div className="aurora-curtain" />
        </div>
      )}
      
      <Suspense fallback={null}>
        <GlobalRatingPrompt
          userProfile={userProfile}
          canShow={
            !showWelcomeModal &&
            !show2FAPromo &&
            !tourActive &&
            cookieConsent !== null &&
            !showEmailVerificationModal &&
            !showCodeVerificationModal &&
            !isGlobalModalOpen &&
            !showAIModal &&
            !showAccentUnlockModal &&
            !showLogoutConfirm &&
            !pendingMilestone &&
            !activeWorkout
          }
        />
      </Suspense>
      
      <Sidebar
        view={view}
        navigate={handleNavClick}
        preloadView={preloadView}
        navItems={navItems}
        userProfile={userProfile}
        BACKEND_BASE_URL={BACKEND_BASE_URL}
        handleLogoutClick={handleLogoutClick}
        unreadCount={unreadCount}
      />

      <div className="flex flex-col flex-1 w-full h-full overflow-hidden relative">



        <header 
          className={`md:hidden absolute top-0 left-0 w-full z-40 transition-all duration-300 ease-out global-header-element ${isGlobalModalOpen ? 'opacity-0 pointer-events-none -translate-y-4' : isHeaderHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'} ${isScrolled ? 'bg-bg-primary/70 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}
          style={{ paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex justify-between items-center w-full h-14 px-4">
            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
              {['settings', 'progress', 'appearance', 'support', 'socialLinks', 'challenges'].includes(view) ? (
                <button
                  onClick={() => navigate('hub')}
                  className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95 duration-200"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
              ) : ['profile', 'notifications', 'twoFactorSetup', 'privacyPolicy', 'terms'].includes(view) ? (
                <button
                  onClick={() => navigate('dashboard')}
                  className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95 duration-200"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
              ) : (
                <UserAvatar
                  user={userProfile}
                  size={8}
                  showRoleRing={true}
                  className="shrink-0 relative z-20 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => navigate('profile')}
                />
              )}
                {view !== 'dashboard' && (
                  <span
                    key={currentTitle}
                    className="text-2xl sm:text-3xl font-extrabold truncate text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary ml-1"
                  >
                    {currentTitle}
                  </span>
                )}
              </div>

              {/* Logo Central (Solo en Dashboard) */}
              {view === 'dashboard' && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none mt-[max(0px,calc(var(--safe-top,0px)/2))]">
                  <img src="/logo.webp" alt="Pro Fitness Glass" className="h-8 w-auto object-contain drop-shadow-md rounded-lg" />
                </div>
              )}

            <div className="flex items-center shrink-0">
              <div className="flex items-center justify-center mr-1 sm:mr-2">
                <button
                    onClick={() => setShowAIModal(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all outline-none focus:outline-none ${
                      isAILimitReached 
                        ? 'bg-bg-secondary text-text-muted border border-glass-border opacity-70' 
                        : 'bg-accent text-accent-contrast shadow-md shadow-accent/30 hover:shadow-accent/50 hover:scale-105 border border-transparent'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    title="Créditos IA"
                  >
                    <SparklesIcon className={`w-3.5 h-3.5 ${isAILimitReached ? '' : 'text-accent-contrast drop-shadow-md animate-pulse'}`} />
                    <span className={isAILimitReached ? '' : 'drop-shadow-md'}>{aiRemaining}/{aiLimit}</span>
                  </button>
              </div>

              <div
                className={`flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${view === 'notifications' ? 'w-0 opacity-0 mr-0 translate-x-4' : 'w-10 opacity-100 mr-0 translate-x-0'}`}
              >
                <button
                  onMouseEnter={() => preloadView && preloadView('notifications')}
                  onTouchStart={() => preloadView && preloadView('notifications')}
                  onClick={() => handleNavClick('notifications')}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95 duration-200 outline-none focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <BellIcon className="w-6 h-6" />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-2 w-3 h-3 bg-accent rounded-full z-10 border-2 border-[--glass-bg]"></span>}
                </button>
              </div>


            </div>
          </div>
        </header>

        <main
          ref={(el) => {
            if (mainContentRef) mainContentRef.current = el;
            swipeContainerRef.current = el;
          }}
          className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{ paddingTop: 'calc(var(--safe-top) + 3.5rem)', backgroundColor: 'transparent', touchAction: 'pan-y' }}
          onTouchStart={handleContentTouchStart}
          onTouchMove={handleContentTouchMove}
          onTouchEnd={handleContentTouchEnd}
          onTouchCancel={handleContentTouchEnd}
        >
          {['appearance', 'support', 'socialLinks', 'emotional-onboarding'].includes(view) && (
            <div className={`hidden md:flex items-center pt-2 pb-2 w-full mx-auto ${
              view === 'appearance' 
                ? 'max-w-4xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-8' 
                : 'max-w-4xl px-4 sm:px-6'
            }`}>
              <button
                onClick={() => navigate('hub')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95 shadow-sm"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                <span className="font-bold text-sm">Atrás</span>
              </button>
            </div>
          )}

          <div className="w-full relative">
            <ViewErrorBoundary view={view} navigate={navigate}>
            <Suspense fallback={<LoadingFallback />}>
              <React.Fragment key={`${view}-${viewResetKey}`}>
                {currentViewComponent}
              </React.Fragment>
            </Suspense>
            </ViewErrorBoundary>

            <div className="md:hidden w-full shrink-0" style={{ height: 'calc(80px + var(--safe-bottom))' }}></div>
          </div>
        </main>

      </div>

      {/* ESPACIO INFERIOR DIFUMINADO (Optimizado para Android de gama baja) */}
      <div
        className={`md:hidden fixed bottom-0 left-0 w-full pointer-events-none z-40 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent transition-opacity duration-300 ${isGlobalModalOpen ? 'opacity-0' : 'opacity-100'}`}
        style={{
          height: 'calc(var(--safe-bottom) + 100px)',
          transform: 'translateZ(0)',
        }}
      ></div>

      <div
        className={`md:hidden fixed left-0 w-full pointer-events-none z-50 flex justify-center px-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isGlobalModalOpen ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}
        style={{ bottom: 'calc(var(--safe-bottom) + 12px)' }}
      >
        <div className="pointer-events-auto flex items-center w-full max-w-sm h-16 relative glass rounded-full px-3">
          
          <nav 
            ref={navRef} 
            className="relative w-full h-full flex justify-evenly items-center nav-touch-area"
            onTouchStart={handleDropDragStart}
            onTouchMove={handleDropDragMove}
            onTouchEnd={handleDropDragEnd}
            onTouchCancel={handleDropDragEnd}
          >
            
            <div
              ref={dropRef}
              className="absolute top-1/2 -mt-6 w-[60px] h-12 pointer-events-none z-[1] flex items-center justify-center"
              style={{
                left: 0,
                transform: `translate3d(calc(${dragX}px - 50%), 0, 0)`,
                opacity: isDropVisible ? 1 : 0,
                transition: isInitialRender ? 'none' : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease',
                willChange: 'transform'
              }}
            >
              <div
                className="w-full h-full rounded-[24px]"
                style={{
                  transform: isJumping ? 'scaleX(1.18) scaleY(0.86)' : 'scale(1)',
                  transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)',
                  backdropFilter: 'blur(8px) brightness(1.1)',
                  WebkitBackdropFilter: 'blur(8px) brightness(1.1)',
                  boxShadow: 'inset 0px 1px 1px rgba(255,255,255,0.25), inset 0px -1px 2px rgba(0,0,0,0.15), 0px 4px 10px rgba(0,0,0,0.15)',
                }}
              />
            </div>

            {navItems.map((item, index) => {
              const isActive = view === item.id;
              const isHovered = isDraggingDrop && dragHoverIndex === index;
              const isVisuallyActive = (isActive && !isDraggingDrop) || isHovered;
              
              const isSocial = item.id === 'social';
              const pendingCount = isSocial ? (socialRequests?.received?.length || 0) : 0;

              return (
                <button
                  key={item.id}
                  onMouseEnter={() => preloadView && preloadView(item.id)}
                  onTouchStart={() => preloadView && preloadView(item.id)}
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative z-[2] flex flex-col items-center justify-center flex-1 h-full transition-colors duration-300 ease-out active:scale-90 outline-none focus:outline-none ring-0 ${isVisuallyActive ? '' : 'text-text-secondary'}`}
                  style={{ color: isVisuallyActive ? 'var(--color-accent)' : undefined, animationDelay: `${index * 100}ms`, animationFillMode: 'both', WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className={`transition-transform duration-300 ${isVisuallyActive ? 'scale-125' : 'group-hover:scale-110'} relative`} style={{ WebkitBackfaceVisibility: 'hidden' }}>
                    {typeof item.icon === 'function' ? item.icon(isVisuallyActive) : item.icon}
                    {pendingCount > 0 && <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-accent rounded-full border-[1.5px] border-bg-primary z-10 pointer-events-none"></span>}
                    {pendingCount === 0 && item.badge && (
                      <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-accent rounded-full border-[1.5px] border-bg-primary z-10 pointer-events-none">
                        <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75"></span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

          </nav>
        </div>
      </div>

      <Suspense fallback={null}>
        {pendingMilestone && (
          <MilestoneLevelUpModal 
            level={pendingMilestone} 
            onClose={handleMilestoneClose} 
          />
        )}

        <PRToast newPRs={prNotification} onClose={() => useAppStore.setState({ prNotification: null })} />

        {showWelcomeModal && cookieConsent !== null && !show2FAPromo && !tourActive && (
          <WelcomeModal onClose={closeWelcomeModal} />
        )}
        
        {showAIModal && (
          <AIInfoModal onClose={() => setShowAIModal(false)} />
        )}

        {cookieConsent === null && (
          <CookieConsentBanner 
            onAccept={handleAcceptCookies} 
            onDecline={handleDeclineCookies} 
            onShowPolicy={handleShowPolicy} 
          />
        )}

        {showLogoutConfirm && (
          <ConfirmationModal message="¿Estás seguro de que quieres cerrar sesión?" onConfirm={confirmLogout} onCancel={() => setShowLogoutConfirm(false)} confirmText="Cerrar Sesión" />
        )}
      </Suspense>

      {/* Botón "Volver al Entreno" — bottom usa --safe-bottom en lugar de env() directo */}
      {activeWorkout && workoutStartTime && view !== 'workout' && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(5.5rem+var(--safe-bottom))] md:left-auto md:transform-none md:bottom-10 md:right-10 z-[60]">
          <button
            onClick={() => handleNavClick('workout')}
            className="animate-[fade-in-up_0.5s_ease-out] flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-bg-secondary font-bold text-base shadow-[0_8px_30px_rgba(0,0,0,0.2)] whitespace-nowrap transition-transform hover:scale-105"
          >
            <Zap size={20} className="animate-pulse" />
            <span>Volver al Entreno</span>
          </button>
        </div>
      )}

      <div className="hidden md:block absolute bottom-4 right-4 z-[60] bg-bg-secondary/50 text-text-muted text-xs px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
        v{APP_VERSION}
      </div>

      <Suspense fallback={null}>
        {showEmailVerificationModal && userProfile && (
          <EmailVerificationModal currentEmail={verificationEmail} onEmailUpdated={(newEmail) => { setVerificationEmail(newEmail); setShowEmailVerificationModal(false); setShowCodeVerificationModal(true); }} onCodeSent={() => { setShowEmailVerificationModal(false); setShowCodeVerificationModal(true); }} />
        )}

        {showCodeVerificationModal && (
          <EmailVerification email={verificationEmail} onSuccess={() => { setShowCodeVerificationModal(false); fetchInitialData(); }} onBack={() => { setShowCodeVerificationModal(false); setShowEmailVerificationModal(true); }} backButtonText="Volver" />
        )}
      </Suspense>

      <AndroidDownloadPrompt />
      <APKUpdater />
      {showAccentUnlockModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]" onClick={() => setShowAccentUnlockModal(false)}>
            <div className="bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-[slide-up_0.3s_ease-out] mt-auto sm:mt-0" onClick={e => e.stopPropagation()}>

              {/* Header con drag handle */}
              <div className="shrink-0 p-5 sm:p-6 pb-0 flex flex-col items-center">
                <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                  <Palette className="text-accent" size={28} />
                </div>
                <h3 className="text-xl font-black mb-2 text-text-primary">
                  {accentUnlockLevel === 20 ? (
                    <>¡Acentos <span className="text-accent">Animados Nivel 20</span>!</>
                  ) : accentUnlockLevel === 15 ? (
                    <>¡Acentos con <span className="text-accent">Degradado</span>!</>
                  ) : accentUnlockLevel === 10 ? '¡5 Colores Pastel!' : '¡5 Nuevos Colores Pastel!'}
                </h3>
              </div>

              {/* Contenido */}
              <div className="px-5 sm:px-6 pb-6 pt-2 text-center">
                <p className="text-text-secondary mb-2 text-sm">
                  {accentUnlockLevel === 20
                    ? '¡Hito épico alcanzado! Al llegar al Nivel 20 has desbloqueado 5 acentos dinámicos animados con flujo continuo (Supernova, Plasma Cuántico, Llama Eterna, Vórtice Abisal y Oro Cósmico).'
                    : accentUnlockLevel === 15
                    ? 'Al alcanzar el Nivel 15 has desbloqueado 5 acentos exclusivos con degradado dinámico (Aurora, Sunset, Cyberpunk, Océano y Oro Imperial).'
                    : accentUnlockLevel === 10
                    ? 'Al alcanzar el Nivel 10 has desbloqueado 5 colores pastel adicionales para tu personalización.'
                    : 'Al alcanzar el Nivel 5 has desbloqueado 5 nuevos colores pastel para personalizar tu app.'}
                </p>
                <p className="text-text-muted text-xs mb-5">
                  Ve a <strong>Hub → Personalización</strong> para aplicarlos.
                </p>
                <div className="grid grid-cols-5 gap-2 sm:gap-2.5 justify-center mb-6 w-full">
                  {(ACCENT_UNLOCK_REWARDS[accentUnlockLevel] || []).map((item) => (
                    <div key={item.name} className="flex flex-col items-center">
                      <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center">
                        <span
                          className={`w-full h-full rounded-full shadow-md ring-1 ring-black/10 dark:ring-white/10 ${
                            item.isAnimated ? 'living-accent-preview' : ''
                          }`}
                          style={{
                            background: item.gradient || item.bg,
                            backgroundColor: item.bg,
                            boxShadow: `0 4px 12px ${item.glow}`,
                          }}
                          title={item.name}
                        />
                        {item.isAnimated && (
                          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none animate-[pulse_2s_ease-in-out_infinite]" />
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-text-primary mt-1.5 text-center leading-tight line-clamp-2 px-0.5">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowAccentUnlockModal(false);
                    navigate('appearance');
                  }}
                  className="w-full py-3.5 px-4 bg-accent text-accent-contrast font-bold rounded-2xl hover:bg-accent/90 transition-all mb-2 active:scale-[0.97]"
                >
                  Ir a Personalización
                </button>
                <button
                  onClick={() => setShowAccentUnlockModal(false)}
                  className="w-full py-2.5 px-4 text-text-muted font-medium text-sm active:scale-[0.97]"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <Suspense fallback={null}>
        <ReferralSuccessAnimation />
      </Suspense>
    </div>
  );
}












