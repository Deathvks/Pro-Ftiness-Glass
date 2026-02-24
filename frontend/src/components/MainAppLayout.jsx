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
    // Solicitudes sociales para el badge del navbar
    socialRequests,
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
    socialRequests: state.socialRequests,
  }));

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRemaining, setAiRemaining] = useState(() => localStorage.getItem('ai_remaining_uses') || '5');
  const [aiLimit, setAiLimit] = useState(() => localStorage.getItem('ai_daily_limit') || '5');

  // Calculamos el contador de no leídas localmente para asegurar consistencia
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Cargar notificaciones al inicio
  useEffect(() => {
    if (userProfile) {
      fetchNotifications();
    }
  }, [fetchNotifications, userProfile]);

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

    // VIGILANTE SILENCIOSO: Cada minuto revisa si ya es medianoche en España
    // Si la fecha cambia, resetea todo a 5 usos automáticamente.
    const midnightChecker = setInterval(() => {
      const lastDate = localStorage.getItem('ai_last_date');
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
      
      if (lastDate && lastDate !== today) {
        localStorage.removeItem('ai_remaining_uses');
        localStorage.removeItem('ai_daily_limit');
        localStorage.setItem('ai_last_date', today);
        updateAILimits(); // Actualiza el header y sidebar instantáneamente
        window.dispatchEvent(new Event('ai_limit_updated')); // Avisa a los modales si están abiertos
      }
    }, 60000); // 60.000 ms = 1 minuto

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage', updateAILimits);
    window.addEventListener('focus', updateAILimits);
    window.addEventListener('ai_limit_updated', updateAILimits);

    return () => {
      clearInterval(midnightChecker);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage', updateAILimits);
      window.removeEventListener('focus', updateAILimits);
      window.removeEventListener('ai_limit_updated', updateAILimits);
    };
  }, [cookieConsent, handleAcceptCookies]);

  const isAILimitReached = parseInt(aiRemaining, 10) === 0;

  // Renderizado del layout principal
  return (
    <div className="relative flex w-full h-full overflow-hidden">

      {/* Fondo decorativo */}
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-accent rounded-full opacity-20 filter blur-3xl -z-10 animate-roam-blob"></div>

      {/* Sidebar (Desktop) */}
      <Sidebar
        view={view}
        navigate={navigate}
        navItems={navItems}
        userProfile={userProfile}
        BACKEND_BASE_URL={BACKEND_BASE_URL}
        handleLogoutClick={handleLogoutClick}
        unreadCount={unreadCount}
      />

      {/* Contenido Principal */}
      <main
        ref={mainContentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden pb-32 md:pb-0"
      >

        {/* Header (Móvil) - Padding normal gestionado por Tailwind */}
        <div className="md:hidden flex justify-between items-center sticky top-0 bg-[--glass-bg] backdrop-blur-glass z-50 p-4 border-0 shadow-none [.oled-theme_&]:border-b [.oled-theme_&]:border-white/10">

          {/* Animación Título Header */}
          <div className="flex items-center gap-2">
            <span
              key={currentTitle}
              className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary animate-fade-in-up"
            >
              {currentTitle}
            </span>
            {view === 'social' && (
              <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase animate-fade-in-up">
                BETA
              </span>
            )}
          </div>

          {/* Botones de Header (IA + Notif + Ajustes) */}
          <div className="flex items-center">

            {/* Nuevo Botón de IA */}
            <div className="flex items-center justify-center mr-1 sm:mr-2">
              <button
                onClick={() => setShowAIModal(true)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-colors outline-none focus:outline-none ${
                    isAILimitReached ? 'bg-bg-secondary text-text-muted border-glass-border opacity-70' : 'bg-accent/10 text-accent border-black/5 dark:border-white/10'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                title="Créditos IA"
              >
                <Sparkles size={14} />
                <span>{aiRemaining}/{aiLimit}</span>
              </button>
            </div>

            {/* Botón de Notificaciones */}
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
                onClick={() => navigate('notifications')}
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

            {/* Botón de Ajustes (Reemplaza Perfil) */}
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
                onClick={() => navigate('settings')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95 duration-200 outline-none focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label="Ajustes"
              >
                <Settings size={24} />
              </button>
            </div>
          </div>

        </div>

        {/* Renderizado de la Vista/Página Actual */}
        <Suspense fallback={<LoadingFallback />}>
          {currentViewComponent}
        </Suspense>

      </main>

      {/* Navbar (Móvil) - Cambiado a FIXED para evitar bugs en iOS y asegurar que se ancla a la parte inferior física */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 w-full flex justify-evenly bg-[--glass-bg] backdrop-blur-glass z-50 border-0 shadow-none [.oled-theme_&]:border-t [.oled-theme_&]:border-white/10"
        style={{ 
          minHeight: 'calc(4.5rem + env(safe-area-inset-bottom))', 
          paddingBottom: 'env(safe-area-inset-bottom)' 
        }}
      >
        {navItems.map((item, index) => {
          const isActive = view === item.id;
          const isSocial = item.id === 'social';
          const pendingCount = isSocial ? (socialRequests?.received?.length || 0) : 0;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`
                group flex flex-col items-center justify-center flex-grow py-3
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

      {/* Botón Flotante de "Volver al Entreno" */}
      {activeWorkout && workoutStartTime && view !== 'workout' && (
        <button
          onClick={() => navigate('workout')}
          className="fixed right-4 bottom-24 md:bottom-10 md:right-10 z-[60] flex items-center gap-3 px-4 py-3 rounded-full bg-accent text-bg-secondary font-semibold shadow-lg animate-[fade-in-up_0.5s_ease-out] transition-transform hover:scale-105"
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