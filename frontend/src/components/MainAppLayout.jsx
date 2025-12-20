/* frontend/src/components/MainAppLayout.jsx */
import React, { Suspense, useEffect, useState } from 'react';
import { User, Zap, Bell } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { APP_VERSION } from '../config/version';

// Componentes UI
import Sidebar from './Sidebar';
import Spinner from './Spinner';
import PRToast from './PRToast';
import Toast from './Toast';
import ConfirmationModal from './ConfirmationModal';
import WelcomeModal from './WelcomeModal';
import EmailVerificationModal from './EmailVerificationModal';
import EmailVerification from './EmailVerification';
import CookieConsentBanner from './CookieConsentBanner';

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

  // Estado local para Toast de Gamificación
  const [gamificationToast, setGamificationToast] = useState(null);

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
    gamificationEvent,
    clearGamificationEvent,
    // Solicitudes sociales para el badge del navbar
    socialRequests
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
    gamificationEvent: state.gamification?.gamificationEvent,
    clearGamificationEvent: state.clearGamificationEvent,
    socialRequests: state.socialRequests
  }));

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
    if (gamificationEvent) {
      if (gamificationEvent.type === 'xp') {
        setGamificationToast({
          message: `+${gamificationEvent.amount} XP: ${gamificationEvent.reason}`,
          type: 'success'
        });
      } else if (gamificationEvent.type === 'badge') {
        setGamificationToast({
          message: `¡Insignia Desbloqueada! ${gamificationEvent.badge.name}`,
          type: 'success'
        });
      }

      // Limpiamos el evento del store para que no se repita
      clearGamificationEvent();

      // El Toast se autocierra en su componente interno, pero limpiamos estado local a los 5s
      setTimeout(() => setGamificationToast(null), 5000);
    }
  }, [gamificationEvent, clearGamificationEvent]);


  // --- Sincronización de Cookies ---
  useEffect(() => {
    const handleStorageChange = () => {
      if (localStorage.getItem('cookie_consent') === 'accepted' && cookieConsent !== 'accepted') {
        handleAcceptCookies();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [cookieConsent, handleAcceptCookies]);

  // --- Helper para URL de imagen de perfil con cache busting ---
  const getProfileImgSrc = () => {
    if (!userProfile?.profile_image_url) return null;

    const rawUrl = userProfile.profile_image_url.startsWith('http')
      ? userProfile.profile_image_url
      : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`;

    // Si tenemos updated_at, lo usamos como versión para forzar la recarga si cambió
    if (userProfile.updated_at) {
      const separator = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${separator}v=${new Date(userProfile.updated_at).getTime()}`;
    }

    return rawUrl;
  };

  const profileImgSrc = getProfileImgSrc();

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
        className="flex-1 overflow-y-auto overflow-x-hidden md:pb-0 
                   pb-[calc(5rem+env(safe-area-inset-bottom))]" // 5rem (h-20) + safe-area
      >

        {/* Header (Móvil) */}
        <div className="md:hidden flex justify-between items-center border-b border-[--glass-border] sticky top-0 bg-[--glass-bg] backdrop-blur-glass z-10
                        px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]
                        sm:px-6 sm:pb-6 sm:pt-[calc(1.5rem+env(safe-area-inset-top))]">

          {/* Animación Título Header */}
          <div className="flex items-center gap-2">
            <span
              key={currentTitle}
              className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary animate-fade-in-up"
            >
              {currentTitle}
            </span>
            {/* MODIFICACIÓN: Badge BETA en Header Móvil */}
            {view === 'social' && (
              <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase animate-fade-in-up">
                BETA
              </span>
            )}
          </div>

          {/* Botones de Header (Notif + Perfil) */}
          <div className="flex items-center">

            {/* Botón de Notificaciones con Animación Wrapper tipo iOS */}
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

            {/* Botón de Perfil con Animación Wrapper tipo iOS */}
            <div
              className={`
                    flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                    ${view === 'profile'
                  ? 'w-0 opacity-0 ml-0 translate-x-4'
                  : 'w-10 opacity-100 ml-3 translate-x-0'
                }
                `}
            >
              <button
                onClick={() => navigate('profile')}
                className="w-10 h-10 rounded-full bg-bg-secondary border border-glass-border flex items-center justify-center overflow-hidden shrink-0 active:scale-95 transition-transform duration-200 outline-none focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {profileImgSrc ? (
                  <img
                    src={profileImgSrc}
                    alt={`Foto de perfil de ${userProfile?.username || 'usuario'}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={24} className="text-text-secondary" />
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Renderizado de la Vista/Página Actual */}
        <Suspense fallback={<LoadingFallback />}>
          {currentViewComponent}
        </Suspense>

      </main>

      {/* Navbar (Móvil) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-evenly bg-[--glass-bg] backdrop-blur-glass border-t border-[--glass-border] z-50
                      pb-[env(safe-area-inset-bottom)] 
                      pl-[max(env(safe-area-inset-left),_0.5rem)] 
                      pr-[max(env(safe-area-inset-right),_0.5rem)]">
        {navItems.map((item, index) => {
          const isActive = view === item.id;

          // Lógica para badge de solicitudes sociales
          const isSocial = item.id === 'social';
          const pendingCount = isSocial ? (socialRequests?.received?.length || 0) : 0;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`
                group flex flex-col items-center justify-center h-20 flex-grow 
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
              {/* Contenedor relativo para posicionar el badge */}
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

      {/* Toast de Gamificación */}
      {gamificationToast && (
        <div className="fixed top-20 md:top-6 right-4 z-[60] w-full max-w-sm animate-fade-in-down">
          <Toast
            message={gamificationToast.message}
            type={gamificationToast.type}
            onClose={() => setGamificationToast(null)}
          />
        </div>
      )}

      <PRToast newPRs={prNotification} onClose={() => useAppStore.setState({ prNotification: null })} />

      {showWelcomeModal && (
        <WelcomeModal onClose={closeWelcomeModal} />
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
          className="fixed right-4 md:bottom-10 md:right-10 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-accent text-bg-secondary font-semibold shadow-lg animate-[fade-in-up_0.5s_ease-out] transition-transform hover:scale-105
                      bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-10"
        >
          <Zap size={20} />
          <span>Volver al Entreno</span>
        </button>
      )}

      {/* Versión (Desktop) */}
      <div className="hidden md:block absolute bottom-4 right-4 z-50 bg-bg-secondary/50 text-text-muted text-xs px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
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
    </div>
  );
}