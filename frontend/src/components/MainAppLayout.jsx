/* frontend/src/components/MainAppLayout.jsx */
import React, { Suspense, useEffect, useState, useRef } from 'react';
import { User, Zap, Bell, Settings, Sparkles } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { APP_VERSION } from '../config/version';
import { useToast } from '../hooks/useToast';
import { useOfflineSync } from '../hooks/useOfflineSync';

// Componentes UI
import Sidebar from './Sidebar';
import Spinner from './Spinner';
import PRToast from './PRToast';
import ConfirmationModal from './ConfirmationModal';
import WelcomeModal from './WelcomeModal';
import EmailVerificationModal from './EmailVerificationModal';
import EmailVerification from './EmailVerification';
import CookieConsentBanner from './CookieConsentBanner';
import AndroidDownloadPrompt from './AndroidDownloadPrompt';
import APKUpdater from './APKUpdater';
import AIInfoModal from './AIInfoModal';

// Constantes
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full pt-20">
    <Spinner size={40} />
  </div>
);

export default function MainAppLayout({
  view,
  navigate,
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
}) {
  const { addToast } = useToast();
  useOfflineSync();

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
    gamificationEvents,
    clearGamificationEvents,
    socialRequests,
    fetchFriendRequests,
    subscribeToSocialEvents,
  } = useAppStore(state => ({
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
    gamificationEvents: state.gamification?.gamificationEvents,
    clearGamificationEvents: state.clearGamificationEvents,
    socialRequests: state.socialRequests,
    fetchFriendRequests: state.fetchFriendRequests,
    subscribeToSocialEvents: state.subscribeToSocialEvents,
  }));

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRemaining, setAiRemaining] = useState(() => localStorage.getItem('ai_remaining_uses') || '5');
  const [aiLimit, setAiLimit] = useState(() => localStorage.getItem('ai_daily_limit') || '5');
  const [viewResetKey, setViewResetKey] = useState(0);

  // --- REFS Y ESTADOS PARA LA GOTA LÍQUIDA ---
  const navRef = useRef(null);
  const dropRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [isDraggingDrop, setIsDraggingDrop] = useState(false);
  const [itemWidth, setItemWidth] = useState(0);
  const [navWidth, setNavWidth] = useState(0);
  const [isInitialRender, setIsInitialRender] = useState(true);

  // --- REFS PARA EL MOTOR DE GESTOS (SWIPE) DEL CONTENIDO ---
  const swipeContainerRef = useRef(null);
  const contentTouchStartRef = useRef(null);
  const contentTouchEndRef = useRef(null);
  const isSwipingContentRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const prevViewRef = useRef(view);
  const SWIPE_THRESHOLD = 60; 

  const handleNavClick = (itemId) => {
    if (itemId === 'routines') {
      localStorage.removeItem('routinesEditingState_v2');
      localStorage.setItem('routinesForceTab', 'myRoutines');
      localStorage.removeItem('quickCardioOrigin');
    }
    
    if (view === itemId) {
      if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate(itemId);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // EFECTO DE TRANSICIÓN: Desliza la nueva pantalla al entrar
  useEffect(() => {
    if (prevViewRef.current !== view) {
      isTransitioningRef.current = true;
      const prevIndex = navItems.findIndex(i => i.id === prevViewRef.current);
      const currentIndex = navItems.findIndex(i => i.id === view);
      
      let dir = 'right';
      if (prevIndex !== -1 && currentIndex !== -1) {
        dir = currentIndex > prevIndex ? 'right' : 'left';
      }

      if (swipeContainerRef.current) {
        swipeContainerRef.current.style.transition = 'none';
        swipeContainerRef.current.style.transform = `translate3d(${dir === 'right' ? '100vw' : '-100vw'}, 0, 0)`;
        
        void swipeContainerRef.current.offsetWidth; 
        
        requestAnimationFrame(() => {
          swipeContainerRef.current.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
          swipeContainerRef.current.style.transform = 'translate3d(0, 0, 0)';
          
          setTimeout(() => {
            isTransitioningRef.current = false;
            if (swipeContainerRef.current) {
              swipeContainerRef.current.style.transform = '';
              swipeContainerRef.current.style.transition = '';
            }
          }, 350);
        });
      } else {
        isTransitioningRef.current = false;
      }
      prevViewRef.current = view;
    }
  }, [view, navItems]);

  // --- MOTOR DE GESTOS EN PANTALLA ---
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
        (node.classList && (
          node.classList.contains('no-swipe') || 
          node.classList.contains('fixed')
        )) ||
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

    if (blockSwipe) {
      contentTouchStartRef.current = null;
      return;
    }

    contentTouchEndRef.current = null;
    contentTouchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
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
        swipeContainerRef.current.style.transition = 'none';
      }
    }

    if (isSwipingContentRef.current) {
      const currentIndex = navItems.findIndex(item => item.id === view);
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
        swipeContainerRef.current.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
        swipeContainerRef.current.style.transform = `translate3d(0, 0, 0)`;
        setTimeout(() => {
          if (swipeContainerRef.current) {
            swipeContainerRef.current.style.transform = '';
            swipeContainerRef.current.style.transition = '';
          }
        }, 300);
      }
    };

    if (!contentTouchStartRef.current || !contentTouchEndRef.current) {
      if (isSwipingContentRef.current) resetSwipe();
      isSwipingContentRef.current = false;
      return;
    }

    const dx = contentTouchStartRef.current.x - contentTouchEndRef.current.x; 
    const currentIndex = navItems.findIndex(item => item.id === view);
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
      const screenWidth = window.innerWidth;
      const exitX = dx > 0 ? -screenWidth : screenWidth;
      
      if (swipeContainerRef.current) {
        swipeContainerRef.current.style.transition = 'transform 0.2s ease-out';
        swipeContainerRef.current.style.transform = `translate3d(${exitX}px, 0, 0)`;
      }

      setTimeout(() => {
        handleNavClick(nextId);
      }, 200);
    } else {
      resetSwipe();
    }

    contentTouchStartRef.current = null;
    contentTouchEndRef.current = null;
    isSwipingContentRef.current = false;
  };

  // --- LÓGICA DE LA GOTA LÍQUIDA EN NAVBAR ---
  useEffect(() => {
    if (!navRef.current) return;

    const updateSize = () => {
      if (navRef.current) {
        setItemWidth(navRef.current.offsetWidth / navItems.length);
        setNavWidth(navRef.current.offsetWidth);
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    
    resizeObserver.observe(navRef.current);
    window.addEventListener('resize', updateSize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [navItems.length]);

  useEffect(() => {
    if (!isDraggingDrop && itemWidth > 0 && navWidth > 0) {
      const activeIndex = navItems.findIndex(item => item.id === view);
      if (activeIndex !== -1) {
        const halfItem = itemWidth / 2;
        let targetX = (activeIndex + 0.5) * itemWidth;
        targetX = Math.max(halfItem, Math.min(targetX, navWidth - halfItem));
        setDragX(targetX);
        
        if (isInitialRender) {
          setTimeout(() => setIsInitialRender(false), 50);
        }
      }
    }
  }, [view, isDraggingDrop, itemWidth, navWidth, navItems, isInitialRender]);

  const handleDropDragStart = () => {
    setIsDraggingDrop(true);
    hasDraggedRef.current = false;
  };

  const handleDropDragMove = (e) => {
    if (!isDraggingDrop || !navRef.current || itemWidth <= 0 || navWidth <= 0) return;
    hasDraggedRef.current = true;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = navRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    
    const halfItem = itemWidth / 2;
    x = Math.max(halfItem, Math.min(x, navWidth - halfItem));
    
    setDragX(x);
  };

  const handleDropDragEnd = () => {
    setIsDraggingDrop(false);
    setTimeout(() => { hasDraggedRef.current = false; }, 100);

    if (itemWidth > 0 && navWidth > 0) {
      const nearestIndex = Math.min(
        navItems.length - 1,
        Math.max(0, Math.round((dragX / itemWidth) - 0.5))
      );
      const selectedItem = navItems[nearestIndex];
      
      if (selectedItem.id !== view) {
        handleNavClick(selectedItem.id);
      }
      
      const halfItem = itemWidth / 2;
      let targetX = (nearestIndex + 0.5) * itemWidth;
      targetX = Math.max(halfItem, Math.min(targetX, navWidth - halfItem));
      setDragX(targetX);
    }
  };

  // --- RESTO DE EFECTOS ---
  useEffect(() => {
    if (userProfile) {
      fetchNotifications();
      fetchFriendRequests();
      subscribeToSocialEvents();
    }
  }, [fetchNotifications, fetchFriendRequests, subscribeToSocialEvents, userProfile]);

  useEffect(() => {
    if (gamificationEvents && gamificationEvents.length > 0) {
      gamificationEvents.forEach(event => {
        if (event.type === 'xp') {
          addToast(`+${event.amount} XP: ${event.reason}`, 'success');
        } else if (event.type === 'badge') {
          addToast(`¡Insignia Desbloqueada! ${event.badge.name}`, 'success');
        }
      });
      clearGamificationEvents();
    }
  }, [gamificationEvents, clearGamificationEvents, addToast]);

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
    <div 
      className="relative flex w-full h-full overflow-hidden" 
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <Sidebar
        view={view}
        navigate={handleNavClick}
        navItems={navItems}
        userProfile={userProfile}
        BACKEND_BASE_URL={BACKEND_BASE_URL}
        handleLogoutClick={handleLogoutClick}
        unreadCount={unreadCount}
      />

      <div className="flex flex-col flex-1 w-full h-full overflow-hidden relative">

        <header 
          className="md:hidden shrink-0 w-full border-b border-glass-border z-40 relative"
          style={{ 
            backgroundColor: 'var(--header-solid)',
            paddingTop: 'env(safe-area-inset-top)' 
          }}
        >
          <div className="flex justify-between items-center w-full h-14 px-4">
            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
              <span
                key={currentTitle}
                className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary animate-fade-in-up truncate"
              >
                {currentTitle}
              </span>
              {view === 'social' && (
                <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase animate-fade-in-up shrink-0">
                  BETA
                </span>
              )}
            </div>

            <div className="flex items-center shrink-0">
              <div className="flex items-center justify-center mr-1 sm:mr-2">
                <button
                  onClick={() => setShowAIModal(true)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-colors outline-none focus:outline-none ${isAILimitReached ? 'bg-bg-secondary text-text-muted border-glass-border opacity-70' : 'bg-accent/10 text-accent border-black/5 dark:border-white/10'}`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Créditos IA"
                >
                  <Sparkles size={14} />
                  <span>{aiRemaining}/{aiLimit}</span>
                </button>
              </div>

              <div
                className={`flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${view === 'notifications' ? 'w-0 opacity-0 mr-0 translate-x-4' : 'w-10 opacity-100 mr-0 translate-x-0'}`}
              >
                <button
                  onClick={() => handleNavClick('notifications')}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95 duration-200 outline-none focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Bell size={24} />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-2 w-3 h-3 bg-accent rounded-full z-10 border-2 border-[--glass-bg]"></span>}
                </button>
              </div>

              <div
                className={`flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${view === 'settings' ? 'w-0 opacity-0 ml-0 translate-x-4' : 'w-10 opacity-100 ml-0 sm:ml-2 translate-x-0'}`}
              >
                <button
                  onClick={() => handleNavClick('settings')}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95 duration-200 outline-none focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Settings size={24} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* --- CONTENEDOR PRINCIPAL CON SWIPE EVENT LISTENERS --- */}
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
          style={{ backgroundColor: 'var(--bg-primary)', touchAction: 'pan-y' }}
          onTouchStart={handleContentTouchStart}
          onTouchMove={handleContentTouchMove}
          onTouchEnd={handleContentTouchEnd}
          onTouchCancel={handleContentTouchEnd}
        >
          <div ref={swipeContainerRef} className="min-h-full w-full">
            <Suspense fallback={<LoadingFallback />}>
              <React.Fragment key={`${view}-${viewResetKey}`}>
                {currentViewComponent}
              </React.Fragment>
            </Suspense>

            {/* Espaciador inferior ajustado para la nueva altura del Navbar nativo */}
            <div className="md:hidden w-full shrink-0" style={{ height: 'calc(80px + env(safe-area-inset-bottom))' }}></div>
          </div>
        </main>

      </div>

      {/* --- NUEVO NAVBAR INFERIOR NATIVO DE ANCHO COMPLETO --- */}
      <div
        className="md:hidden fixed bottom-0 left-0 w-full z-50 pointer-events-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Fondo Glass que se extiende por TODO el safe-area-inset-bottom gracias a su posición absoluta */}
        <div 
          className="absolute inset-0 glass -z-10 border-t border-glass-border"
          style={{ borderRadius: 0, borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }}
        ></div>
        
        {/* Contenedor de iconos con altura estándar de iOS (64px) */}
        <div className="flex items-center w-full h-[64px] relative px-1 sm:px-2">
          
          <nav ref={navRef} className="relative w-full h-full flex justify-evenly items-center">
            
            {/* --- GOTA VISUAL LÍQUIDA --- */}
            <div
              className="absolute top-1/2 w-[60px] h-12 rounded-[24px] pointer-events-none z-[1] flex items-start justify-center"
              style={{
                left: 0,
                transform: `translate3d(calc(${dragX}px - 50%), -50%, 0) scale(${isDraggingDrop ? '1.15, 0.85' : '1, 1'})`,
                opacity: isDropVisible ? 1 : 0,
                transition: (isDraggingDrop || isInitialRender) ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(8px) brightness(1.2)',
                WebkitBackdropFilter: 'blur(8px) brightness(1.2)',
                WebkitBackfaceVisibility: 'hidden',
                willChange: 'transform',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: 'inset 0px 4px 6px rgba(255,255,255,0.4), inset 0px -2px 6px rgba(0,0,0,0.05), 0px 4px 10px rgba(0,0,0,0.15)',
              }}
            >
            </div>

            {/* Iconos del navbar con iluminación en tiempo real */}
            {navItems.map((item, index) => {
              const isActive = view === item.id;
              let isVisuallyActive = isActive;
              
              if (isDraggingDrop && itemWidth > 0) {
                const nearestIndex = Math.max(0, Math.min(Math.round((dragX / itemWidth) - 0.5), navItems.length - 1));
                isVisuallyActive = index === nearestIndex;
              }

              const isSocial = item.id === 'social';
              const pendingCount = isSocial ? (socialRequests?.received?.length || 0) : 0;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative z-[2] flex flex-col items-center justify-center flex-1 h-full transition-colors duration-300 ease-out active:scale-90 outline-none focus:outline-none ring-0 ${isVisuallyActive ? 'text-accent' : 'text-text-secondary'}`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div 
                    className={`transition-transform duration-300 transform-gpu ${isVisuallyActive ? 'scale-110' : 'scale-100 group-hover:scale-110'} relative`} 
                    style={{ WebkitBackfaceVisibility: 'hidden' }}
                  >
                    {item.icon}
                    {pendingCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-[--glass-bg]"></span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* --- CONTROLADOR DE ARRASTRE INVISIBLE DE LA GOTA --- */}
            <div
              ref={dropRef}
              onTouchStart={handleDropDragStart}
              onTouchMove={handleDropDragMove}
              onTouchEnd={handleDropDragEnd}
              onTouchCancel={handleDropDragEnd}
              onMouseDown={handleDropDragStart}
              onMouseMove={handleDropDragMove}
              onMouseUp={handleDropDragEnd}
              onMouseLeave={handleDropDragEnd}
              className="absolute top-1/2 w-[60px] h-12 rounded-[24px] cursor-grab active:cursor-grabbing z-[10] touch-none"
              style={{
                left: 0,
                transform: `translate3d(calc(${dragX}px - 50%), -50%, 0)`,
                transition: (isDraggingDrop || isInitialRender) ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                WebkitBackfaceVisibility: 'hidden',
                willChange: 'transform',
                display: isDropVisible ? 'block' : 'none',
              }}
              onClick={(e) => {
                if (hasDraggedRef.current) {
                  e.stopPropagation();
                  return;
                }
                
                if (!isDraggingDrop) {
                  const activeIndex = navItems.findIndex(item => item.id === view);
                  if (activeIndex !== -1) handleNavClick(navItems[activeIndex].id);
                }
              }}
            />

          </nav>
        </div>
      </div>

      <PRToast newPRs={prNotification} onClose={() => useAppStore.setState({ prNotification: null })} />

      {/* --- EL ORDEN IMPORTA: Cookies primero, Welcome Modal si las cookies están OK --- */}
      {cookieConsent === null && (
        <CookieConsentBanner 
          onAccept={handleAcceptCookies} 
          onDecline={handleDeclineCookies} 
          onShowPolicy={handleShowPolicy} 
        />
      )}

      {showWelcomeModal && cookieConsent !== null && (
        <WelcomeModal onClose={closeWelcomeModal} />
      )}
      
      {showAIModal && (
        <AIInfoModal onClose={() => setShowAIModal(false)} />
      )}

      {showLogoutConfirm && (
        <ConfirmationModal 
          message="¿Estás seguro de que quieres cerrar sesión?" 
          onConfirm={confirmLogout} 
          onCancel={() => setShowLogoutConfirm(false)} 
          confirmText="Cerrar Sesión" 
        />
      )}

      {activeWorkout && workoutStartTime && view !== 'workout' && (
        <button
          onClick={() => handleNavClick('workout')}
          className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-10 md:right-10 z-[60] flex items-center gap-3 px-4 py-3 rounded-full bg-accent text-bg-secondary font-semibold shadow-lg animate-[fade-in-up_0.5s_ease-out] transition-transform hover:scale-105"
        >
          <Zap size={20} />
          <span>Volver al Entreno</span>
        </button>
      )}

      <div className="hidden md:block absolute bottom-4 right-4 z-[60] bg-bg-secondary/50 text-text-muted text-xs px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
        v{APP_VERSION}
      </div>

      {showEmailVerificationModal && userProfile && (
        <EmailVerificationModal 
          currentEmail={verificationEmail} 
          onEmailUpdated={(newEmail) => { 
            setVerificationEmail(newEmail); 
            setShowEmailVerificationModal(false); 
            setShowCodeVerificationModal(true); 
          }} 
          onCodeSent={() => { 
            setShowEmailVerificationModal(false); 
            setShowCodeVerificationModal(true); 
          }} 
        />
      )}

      {showCodeVerificationModal && (
        <EmailVerification 
          email={verificationEmail} 
          onSuccess={() => { 
            setShowCodeVerificationModal(false); 
            fetchInitialData(); 
          }} 
          onBack={() => { 
            setShowCodeVerificationModal(false); 
            setShowEmailVerificationModal(true); 
          }} 
          backButtonText="Volver" 
        />
      )}

      <AndroidDownloadPrompt />
      <APKUpdater />
    </div>
  );
}