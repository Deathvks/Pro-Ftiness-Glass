/* frontend/src/components/MainAppLayout.jsx */
import React, { Suspense, useEffect, useState } from 'react';
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

// Fallback para Suspense
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full pt-20">
    <Spinner size={40} />
  </div>
);

export default function MainAppLayout({
  // Props de Navegación
  view,
  navigate,
  mainContentRef,
  currentTitle,
  currentViewComponent,

  // Props de Items de Navegación
  navItems,

  // Props de Logout
  handleLogoutClick,
  showLogoutConfirm,
  confirmLogout,
  setShowLogoutConfirm,

  // Props de Modales
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

  // Activamos la sincronización offline
  useOfflineSync();

  // Estados y acciones obtenidos directamente de Zustand
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
    // Gamificación
    gamificationEvents,
    clearGamificationEvents,
    // Social y Sockets
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
    // Gamificación
    gamificationEvents: state.gamification?.gamificationEvents,
    clearGamificationEvents: state.clearGamificationEvents,
    // Social
    socialRequests: state.socialRequests,
    fetchFriendRequests: state.fetchFriendRequests,
    subscribeToSocialEvents: state.subscribeToSocialEvents,
  }));

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRemaining, setAiRemaining] = useState(() => localStorage.getItem('ai_remaining_uses') || '5');
  const [aiLimit, setAiLimit] = useState(() => localStorage.getItem('ai_daily_limit') || '5');

  // --- ESTADO PARA FORZAR EL RESETEO DE VISTAS ---
  const [viewResetKey, setViewResetKey] = useState(0);

  // --- LÓGICA CENTRAL DE NAVEGACIÓN (Reseteo a la raíz) ---
  const handleNavClick = (itemId) => {
    // 1. Limpieza de memoria (localStorage) específica de la página
    if (itemId === 'routines') {
      localStorage.removeItem('routinesEditingState_v2'); // Salir del modo edición
      localStorage.setItem('routinesForceTab', 'myRoutines'); // Volver a la pestaña mis rutinas
      localStorage.removeItem('quickCardioOrigin');
    }

    // 2. Si ya estamos en esa página, cambiamos la Key para forzar un re-render desde cero
    if (view === itemId) {
      setViewResetKey(prev => prev + 1);
    } else {
      // Si es una página nueva, simplemente navegamos
      navigate(itemId);
    }
  };

  // Calculamos el contador de no leídas localmente para asegurar consistencia
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Cargar notificaciones y suscribir a eventos de Sockets al inicio
  useEffect(() => {
    if (userProfile) {
      fetchNotifications();
      fetchFriendRequests(); // Traer el estado inicial de solicitudes
      subscribeToSocialEvents(); // Suscribirse a los avisos en tiempo real
    }
  }, [fetchNotifications, fetchFriendRequests, subscribeToSocialEvents, userProfile]);

  // Efecto para detectar eventos de Gamificación y lanzar Toast
  useEffect(() => {
    if (gamificationEvents && gamificationEvents.length > 0) {
      gamificationEvents.forEach(event => {
        if (event.type === 'xp') {
          addToast(`+${event.amount} XP: ${event.reason}`, 'success');
        } else if (event.type === 'badge') {
          addToast(`¡Insignia Desbloqueada! ${event.badge.name}`, 'success');
        }
      });

      // Limpiamos todos los eventos procesados
      clearGamificationEvents();
    }
  }, [gamificationEvents, clearGamificationEvents, addToast]);

  // --- NUEVO: OBLIGAR A CAMBIAR EL EMAIL DE X (TWITTER) ---
  useEffect(() => {
    if (userProfile && userProfile.email && userProfile.email.endsWith('@x-auth.local')) {
      // Solo abrimos si no hay ya un modal de verificación abierto
      if (!showCodeVerificationModal && !showEmailVerificationModal) {
        addToast('Por seguridad, debes vincular un correo real a tu cuenta de X.', 'warning', 6000);
        setShowEmailVerificationModal(true);
        // Truco UX: Le limpiamos el correo placeholder para que tenga que escribir el suyo
        setVerificationEmail(''); 
      }
    }
  }, [userProfile, showCodeVerificationModal, showEmailVerificationModal, setShowEmailVerificationModal, setVerificationEmail, addToast]);

  // --- SINCRONIZACIÓN ESTRICTA DEL THEME COLOR PARA EL NOTCH EN iOS ---
  useEffect(() => {
    const syncThemeColors = () => {
      const root = document.documentElement;
      const headerColor = getComputedStyle(root).getPropertyValue('--header-solid').trim();
      if (!headerColor) return;

      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', headerColor);

      root.style.setProperty('background-color', headerColor, 'important');
      if (document.body) {
        document.body.style.setProperty('background-color', headerColor, 'important');
      }
    };

    syncThemeColors();
    const t1 = setTimeout(syncThemeColors, 100);
    const t2 = setTimeout(syncThemeColors, 500);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          syncThemeColors();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, []);

  // FIX PWA iOS: Forzamos metaetiquetas de viewport y status bar
  useEffect(() => {
    let metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport) {
      if (!metaViewport.content.includes('viewport-fit=cover')) {
        metaViewport.content += ', viewport-fit=cover';
      }
    } else {
      metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      metaViewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      document.head.appendChild(metaViewport);
    }

    let metaStatus = document.querySelector('meta[name=apple-mobile-web-app-status-bar-style]');
    if (!metaStatus) {
      metaStatus = document.createElement('meta');
      metaStatus.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(metaStatus);
    }
    metaStatus.content = 'black-translucent';
  }, []);

  // --- Sincronización de Cookies e IA Automática ---
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

  return (
    <div 
      className="relative flex w-full h-full overflow-hidden" 
      // MAGIA 1: Todo el lienzo principal adopta el color del header.
      // Así es imposible que el Notch absorba un color incorrecto en la parte alta.
      style={{ backgroundColor: 'var(--header-solid)' }}
    >

      {/* Sidebar (Desktop) */}
      <Sidebar
        view={view}
        navigate={handleNavClick}
        navItems={navItems}
        userProfile={userProfile}
        BACKEND_BASE_URL={BACKEND_BASE_URL}
        handleLogoutClick={handleLogoutClick}
        unreadCount={unreadCount}
      />

      {/* CONTENEDOR MÓVIL: Flex Columna para separar Header y Main */}
      <div className="flex flex-col flex-1 w-full h-full overflow-hidden relative">

        {/* --- FONDOS ABSOLUTOS DE COLOR (bg-primary) --- */}
        {/* MAGIA 2: En móvil, el color de fondo bg-primary de la app empieza EXACTAMENTE donde termina el header (56px = h-14 + notch). Arriba de eso, reina el var(--header-solid) del contenedor padre */}
        <div 
          className="md:hidden absolute inset-x-0 bottom-0 bg-bg-primary z-0 pointer-events-none"
          style={{ top: 'calc(56px + env(safe-area-inset-top, 0px))' }}
        ></div>
        
        {/* En escritorio (no hay header top móvil), el bg-primary sí ocupa toda la pantalla */}
        <div className="hidden md:block absolute inset-0 bg-bg-primary z-0 pointer-events-none"></div>

        {/* --- HEADER --- */}
        <header 
          className="md:hidden shrink-0 w-full border-b border-glass-border z-40 relative"
          style={{ 
            backgroundColor: 'var(--header-solid)',
            paddingTop: 'env(safe-area-inset-top, 0px)'
          }}
        >
          <div className="flex justify-between items-center w-full h-14 px-4">

            {/* Animación Título Header */}
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

            {/* Botones de Header (IA + Notif + Ajustes) */}
            <div className="flex items-center shrink-0">
              <div className="flex items-center justify-center mr-1 sm:mr-2">
                <button
                  onClick={() => setShowAIModal(true)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-colors outline-none focus:outline-none ${isAILimitReached ? 'bg-bg-secondary text-text-muted border-glass-border opacity-70' : 'bg-accent/10 text-accent border-black/5 dark:border-white/10'
                    }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Créditos IA"
                >
                  <Sparkles size={14} />
                  <span>{aiRemaining}/{aiLimit}</span>
                </button>
              </div>

              <div
                className={`
                      flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                      ${view === 'notifications'
                    ? 'w-0 opacity-0 mr-0 translate-x-4'
                    : 'w-10 opacity-100 mr-0 translate-x-0'
                  }
                  `}
              >
                <button
                  onClick={() => handleNavClick('notifications')}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95 duration-200 outline-none focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-label="Notificaciones"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 w-3 h-3 bg-accent rounded-full z-10 border-2 border-[--glass-bg]"></span>
                  )}
                </button>
              </div>

              <div
                className={`
                      flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                      ${view === 'settings'
                    ? 'w-0 opacity-0 ml-0 translate-x-4'
                    : 'w-10 opacity-100 ml-0 sm:ml-2 translate-x-0'
                  }
                  `}
              >
                <button
                  onClick={() => handleNavClick('settings')}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95 duration-200 outline-none focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-label="Ajustes"
                >
                  <Settings size={24} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* --- MAIN: Único contenedor que hace scroll (z-10 para flotar sobre los fondos absolutos) --- */}
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative z-10"
        >
          <Suspense fallback={<LoadingFallback />}>
            <React.Fragment key={`${view}-${viewResetKey}`}>
              {currentViewComponent}
            </React.Fragment>
          </Suspense>

          <div className="md:hidden w-full shrink-0" style={{ height: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}></div>
        </main>

      </div>

      {/* --- EFECTO DE DESENFOQUE INFERIOR (iOS Bloom/Blur) --- */}
      <div 
        className="md:hidden fixed bottom-0 left-0 w-full z-40 pointer-events-none"
        style={{
          height: 'calc(120px + env(safe-area-inset-bottom, 0px))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0) 100%)',
        }}
      ></div>

      {/* --- NAVBAR: Píldora Flotante con estilo Glass --- */}
      <div
        className="md:hidden fixed bottom-0 left-0 w-full pointer-events-none z-50 flex justify-center px-4 pt-2"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))' }}
      >
        <nav
          className="pointer-events-auto flex justify-evenly items-center w-full max-w-sm h-16 glass rounded-full overflow-hidden relative"
        >
          {navItems.map((item, index) => {
            const isActive = view === item.id;
            const isSocial = item.id === 'social';
            const pendingCount = isSocial ? (socialRequests?.received?.length || 0) : 0;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  group flex flex-col items-center justify-center flex-1 h-full
                  transition-all duration-300 ease-out active:scale-90 animate-fade-in-up
                  outline-none focus:outline-none ring-0
                  ${isActive ? 'text-accent' : 'text-text-secondary'}
                `}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div className={`transition-transform duration-300 ${isActive ? 'scale-125' : 'group-hover:scale-110'} relative`}>
                  {item.icon}
                  {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-[--glass-bg]"></span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* --- Modales y Notificaciones --- */}

      <PRToast newPRs={prNotification} onClose={() => useAppStore.setState({ prNotification: null })} />

      {showWelcomeModal && (
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
          className="fixed right-4 bottom-28 md:bottom-10 md:right-10 z-[60] flex items-center gap-3 px-4 py-3 rounded-full bg-accent text-bg-secondary font-semibold shadow-lg animate-[fade-in-up_0.5s_ease-out] transition-transform hover:scale-105"
        >
          <Zap size={20} />
          <span>Volver al Entreno</span>
        </button>
      )}

      {/* Versión (Desktop) */}
      <div className="hidden md:block absolute bottom-4 right-4 z-[60] bg-bg-secondary/50 text-text-muted text-xs px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
        v{APP_VERSION}
      </div>

      {/* Modales de Verificación de Email */}
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