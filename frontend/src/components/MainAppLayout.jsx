/* frontend/src/components/MainAppLayout.jsx */
import React, { Suspense } from 'react';
import { User, Zap, Home, Dumbbell, BarChart2, Settings, Utensils } from 'lucide-react';
// --- INICIO DE LA CORRECCIÓN DE RUTAS ---
// Se cambian las rutas relativas a absolutas desde la raíz del proyecto (/)
// para solucionar problemas de resolución en el entorno de compilación.
import useAppStore from '/src/store/useAppStore.js';
import { APP_VERSION } from '/src/config/version.js';

// Componentes UI
import Sidebar from '/src/components/Sidebar.jsx';
import Spinner from '/src/components/Spinner.jsx';
import PRToast from '/src/components/PRToast.jsx';
import ConfirmationModal from '/src/components/ConfirmationModal.jsx';
import WelcomeModal from '/src/components/WelcomeModal.jsx';
import EmailVerificationModal from '/src/components/EmailVerificationModal.jsx';
import EmailVerification from '/src/components/EmailVerification.jsx';
import CookieConsentBanner from '/src/components/CookieConsentBanner.jsx';
// --- FIN DE LA CORRECCIÓN DE RUTAS ---

// Constantes
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

// Fallback para Suspense
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full pt-20">
    <Spinner size={40} />
  </div>
);

/**
 * Componente que renderiza el layout principal de la aplicación para un
 * usuario autenticado (Sidebar, Header móvil, Navbar móvil, Modales).
 * Recibe la vista actual y los manejadores de estado/eventos desde App.jsx.
 */
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
  }));

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
      />

      {/* Contenido Principal */}
      <main
        ref={mainContentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden md:pb-0 
                   pb-[calc(5rem+env(safe-area-inset-bottom))]" // 5rem (h-20) + safe-area
      >

        {/* Header (Móvil) */}
        <div className="md:hidden flex justify-between items-center p-4 sm:p-6 border-b border-[--glass-border] sticky top-0 bg-[--glass-bg] backdrop-blur-glass z-10">
          <span className="text-3xl font-extrabold text-text-primary">{currentTitle}</span>
          <button
            onClick={() => navigate('profile')}
            className={`w-10 h-10 rounded-full bg-bg-secondary border border-glass-border flex items-center justify-center overflow-hidden shrink-0 ${view === 'profile' ? 'invisible' : ''}`}
          >
            {userProfile?.profile_image_url ? (
              <img
                src={userProfile.profile_image_url.startsWith('http') ? userProfile.profile_image_url : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`}
                alt={`Foto de perfil de ${userProfile?.username || 'usuario'}`}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-text-secondary" />
            )}
          </button>
        </div>

        {/* Renderizado de la Vista/Página Actual */}
        <Suspense fallback={<LoadingFallback />}>
          {currentViewComponent}
        </Suspense>

      </main>

      {/* Navbar (Móvil) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-evenly bg-[--glass-bg] backdrop-blur-glass border-t border-[--glass-border]
                      pb-[env(safe-area-inset-bottom)] 
                      pl-[max(env(safe-area-inset-left),_0.5rem)] 
                      pr-[max(env(safe-area-inset-right),_0.5rem)]">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`flex flex-col items-center justify-center gap-1 h-20 flex-grow transition-colors duration-200 ${view === item.id ? 'text-accent' : 'text-text-secondary'}`}>
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* --- Modales y Notificaciones --- */}

      <PRToast newPRs={prNotification} onClose={() => useAppStore.setState({ prNotification: null })} />

      {showWelcomeModal && (
        <WelcomeModal onClose={closeWelcomeModal} />
      )}

      {cookieConsent === null && ( // 'isInitialLoad' ya no es necesario aquí
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
                     bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-10" // 6rem = 5rem (nav) + 1rem (espacio)
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
            fetchInitialData(); // Refrescar datos del usuario
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