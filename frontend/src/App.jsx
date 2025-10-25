/* frontend/src/App.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
// --- INICIO DE LA MODIFICACIÓN (YA HECHA) ---
import { Helmet } from 'react-helmet-async';
// --- FIN DE LA MODIFICACIÓN (YA HECHA) ---
import { Home, Dumbbell, BarChart2, Settings, LogOut, Zap, Utensils, User } from 'lucide-react';
import useAppStore from './store/useAppStore';
import { APP_VERSION } from './config/version';

// ... (imports de componentes/páginas sin cambios)
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import Routines from './pages/Routines';
import Workout from './pages/Workout';
import Nutrition from './pages/Nutrition';
import SettingsScreen from './pages/SettingsScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import PhysicalProfileEditor from './pages/PhysicalProfileEditor';
import AccountEditor from './pages/AccountEditor';
import PRToast from './components/PRToast';
import ConfirmationModal from './components/ConfirmationModal';
import WelcomeModal from './components/WelcomeModal';
import AdminPanel from './pages/AdminPanel.jsx';
import EmailVerificationModal from './components/EmailVerificationModal';
import EmailVerification from './components/EmailVerification';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';
import CookieConsentBanner from './components/CookieConsentBanner';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

export default function App() {
  const {
    isAuthenticated,
    userProfile,
    isLoading,
    prNotification,
    fetchInitialData,
    handleLogout: performLogout,
    activeWorkout,
    workoutStartTime,
    showWelcomeModal,
    checkWelcomeModal,
    closeWelcomeModal,
    fetchDataForDate,
    cookieConsent,
    checkCookieConsent,
    handleAcceptCookies,
    handleDeclineCookies,
  } = useAppStore();

  const [view, setView] = useState('dashboard'); // Default inicial seguro
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [previousView, setPreviousView] = useState(null);
  const mainContentRef = useRef(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [view]);

  // Guardar lastView solo si no es la carga inicial y no es privacyPolicy
  useEffect(() => {
    if (!isInitialLoad && view !== 'privacyPolicy') {
      localStorage.setItem('lastView', view);
    }
  }, [view, isInitialLoad]);


  const [authView, setAuthView] = useState('login');

  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showCodeVerificationModal, setShowCodeVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');
  const [accent, setAccentState] = useState(() => localStorage.getItem('accent') || 'green');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isWorkoutPaused, workoutAccumulatedTime } = useAppStore();
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const handleUrlChange = () => {
      if (window.location.pathname === '/reset-password' && !isAuthenticated) {
        setAuthView('resetPassword');
      }
    };

    handleUrlChange();

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [isAuthenticated]);

  useEffect(() => {
    let interval = null;
    if (workoutStartTime && !isWorkoutPaused) {
      interval = setInterval(() => {
        const elapsed = Date.now() - workoutStartTime;
        setTimer(Math.floor((workoutAccumulatedTime + elapsed) / 1000));
      }, 1000);
    } else {
      setTimer(Math.floor(workoutAccumulatedTime / 1000));
    }
    return () => clearInterval(interval);
  }, [workoutStartTime, isWorkoutPaused, workoutAccumulatedTime]);

  const setTheme = (newTheme) => {
    if (cookieConsent) {
        localStorage.setItem('theme', newTheme);
    }
    setThemeState(newTheme);
  };

  const setAccent = (newAccent) => {
      if (cookieConsent) {
          localStorage.setItem('accent', newAccent);
      }
      setAccentState(newAccent);
  };

  // Hook para cargar datos iniciales y establecer la vista correcta
  useEffect(() => {
    const loadInitialDataAndSetView = async () => {
      await fetchInitialData(); // Espera a que los datos se carguen

      // Esta parte se ejecuta DESPUÉS de que fetchInitialData haya terminado y userProfile esté disponible
      const loadedUserProfile = useAppStore.getState().userProfile;
      const loadedActiveWorkout = useAppStore.getState().activeWorkout;

      // Comprobar consentimiento AHORA que userProfile está cargado
      if (loadedUserProfile?.id) {
          checkCookieConsent(loadedUserProfile.id);
      }

      let targetView = 'dashboard'; // Por defecto, vamos al dashboard

      if (loadedActiveWorkout) {
        targetView = 'workout'; // Si hay un workout activo, vamos ahí
      } else {
        const lastView = localStorage.getItem('lastView');
        // Solo restauramos lastView si existe, no es adminPanel para no-admins,
        // y el usuario no acaba de completar el onboarding (userProfile.goal existe)
        if (lastView && loadedUserProfile?.goal) {
          if (lastView === 'adminPanel' && loadedUserProfile?.role !== 'admin') {
            targetView = 'dashboard'; // Forzar dashboard si intentaba ir a admin sin ser admin
          } else if (lastView !== 'login' && lastView !== 'register' && lastView !== 'forgotPassword' && lastView !== 'resetPassword') {
            // Evitar restaurar vistas de autenticación
             targetView = lastView;
          }
        }
      }
      setView(targetView);
      setIsInitialLoad(false); // Marcar la carga inicial como completada
    };

    if (isAuthenticated) {
      loadInitialDataAndSetView();
    } else {
      setIsInitialLoad(false); // No hay carga inicial si no está autenticado
    }

  }, [isAuthenticated, fetchInitialData, checkCookieConsent]);


    useEffect(() => {
        if (view === 'dashboard' && isAuthenticated) {
            const today = new Date().toISOString().split('T')[0];
            fetchDataForDate(today);
        }
    }, [view, isAuthenticated, fetchDataForDate]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (themeValue) => {
      document.body.classList.remove('light-theme', 'dark-theme');
      if (themeValue === 'system') {
        document.body.classList.add(mediaQuery.matches ? 'dark-theme' : 'light-theme');
      } else {
        document.body.classList.add(`${themeValue}-theme`);
      }
    };
    const handleSystemThemeChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    applyTheme(theme);
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  useEffect(() => {
    const toRemove = Array.from(document.body.classList).filter(c => c.startsWith('accent-'));
    toRemove.forEach(c => document.body.classList.remove(c));
    document.body.classList.add(`accent-${accent}`);
  }, [accent]);

  // Simplificamos este useEffect: solo maneja la verificación de email y el modal de bienvenida
  useEffect(() => {
    if (isAuthenticated && userProfile && !isLoading) {
      if (!userProfile.is_verified) {
        setShowEmailVerificationModal(true);
        setVerificationEmail(userProfile.email);
      }
      // Solo comprobar welcome si no es la carga inicial (para evitar mostrarlo junto al onboarding)
      if (!isInitialLoad) {
          checkWelcomeModal();
      }
    }
  }, [isAuthenticated, userProfile, isLoading, checkWelcomeModal, isInitialLoad]);


  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    performLogout();
    setShowLogoutConfirm(false);
  };

  const navigate = useCallback((viewName, options = {}) => {
    // Si estamos navegando DESPUÉS de la carga inicial,
    // guardamos la vista actual como previousView
    if (!isInitialLoad) {
      setPreviousView(view);
    }
    setView(viewName);
    if (options.forceTab) {
      localStorage.setItem('routinesForceTab', options.forceTab);
    }
  }, [view, isInitialLoad]);


  const handleShowPolicy = () => {
    setPreviousView(view);
    setView('privacyPolicy');
  };

  const handleBackFromPolicy = () => {
    setView(previousView || 'dashboard');
    setPreviousView(null);
  };

  // Mostramos 'Cargando...' mientras isInitialLoad es true Y isLoading es true
  if (isLoading && isInitialLoad) {
    return <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">Cargando...</div>;
  }


  if (!isAuthenticated) {
    switch (authView) {
        case 'register':
            return <RegisterScreen showLogin={() => setAuthView('login')} />;
        case 'forgotPassword':
            return <ForgotPasswordScreen showLogin={() => setAuthView('login')} />;
        case 'resetPassword':
            return <ResetPasswordScreen showLogin={() => {
                window.history.pushState({}, '', '/');
                setAuthView('login');
            }} />;
        default:
            return <LoginScreen
                showRegister={() => setAuthView('register')}
                showForgotPassword={() => setAuthView('forgotPassword')}
            />;
    }
  }

  // Si el perfil existe pero falta el 'goal', mostramos Onboarding
  if (userProfile && !userProfile.goal) {
    return <OnboardingScreen />;
  }
  // Si el perfil aún no se ha cargado (puede pasar brevemente después de login/register),
  // mostramos cargando para evitar errores.
  if (!userProfile) {
     return <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">Cargando perfil...</div>;
  }

  // --- INICIO DE LA MODIFICACIÓN (YA HECHA) ---
  const pageTitles = {
    dashboard: 'Dashboard',
    nutrition: 'Nutrición',
    progress: 'Progreso',
    routines: 'Rutinas',
    settings: 'Ajustes',
    profile: 'Perfil',
    workout: 'Entrenamiento Activo',
    physicalProfileEditor: 'Editar Perfil Físico',
    accountEditor: 'Editar Cuenta',
    adminPanel: 'Panel de Admin',
    privacyPolicy: 'Política de Privacidad',
  };

  const pageDescriptions = {
      dashboard: 'Tu resumen diario de actividad, nutrición y progreso.',
      nutrition: 'Registra tus comidas, agua y suplementos. Sigue tus macros y calorías.',
      progress: 'Visualiza tu progreso en gráficos: peso, fuerza por ejercicio y nutrición.',
      routines: 'Crea, edita y explora rutinas de entrenamiento personalizadas.',
      settings: 'Configura la apariencia de la app, tu cuenta y preferencias.',
      profile: `Edita tu perfil, ${userProfile?.username || 'usuario'}.`,
      workout: 'Registra tu sesión de entrenamiento actual.',
      physicalProfileEditor: 'Actualiza tus datos físicos como edad, altura y objetivos.',
      accountEditor: 'Modifica tu nombre, email o contraseña.',
      adminPanel: 'Gestión de usuarios y configuraciones avanzadas.',
      privacyPolicy: 'Información sobre cómo tratamos tus datos y el uso de cookies.',
      default: 'Registra tus entrenamientos, sigue tu progreso nutricional y alcanza tus objetivos de fitness con Pro Fitness Glass.',
  };

  const currentTitle = pageTitles[view] || 'Pro Fitness Glass';
  const currentDescription = pageDescriptions[view] || pageDescriptions.default;
  // --- FIN DE LA MODIFICACIÓN (YA HECHA) ---

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard setView={navigate} />;
      // --- INICIO DE LA MODIFICACIÓN ---
      // Eliminamos 'setView' de Nutrition ya que no se usa
      case 'progress': return <Progress darkMode={theme !== 'light'} />;
      case 'routines': return <Routines setView={navigate} />;
      case 'workout': return <Workout timer={timer} setView={navigate} />;
      case 'nutrition': return <Nutrition />; // Eliminamos setView
      // --- FIN DE LA MODIFICACIÓN ---
      case 'settings':
        return (
          <SettingsScreen
            theme={theme}
            setTheme={setTheme}
            accent={accent}
            setAccent={setAccent}
            setView={navigate}
            onLogoutClick={handleLogoutClick}
          />
        );
      case 'physicalProfileEditor': return <PhysicalProfileEditor onDone={() => navigate('settings')} />;
      case 'accountEditor': return <AccountEditor onCancel={() => navigate('settings')} />;
      case 'profile': return <Profile onCancel={() => navigate(previousView || 'settings')} />;
      case 'adminPanel':
        return userProfile?.role === 'admin'
            ? <AdminPanel onCancel={() => navigate('settings')} />
            : <Dashboard setView={navigate} />;
      case 'privacyPolicy': return <PrivacyPolicy onBack={handleBackFromPolicy} />;
      default: return <Dashboard setView={navigate} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={24} /> },
    { id: 'nutrition', label: 'Nutrición', icon: <Utensils size={24} /> },
    { id: 'progress', label: 'Progreso', icon: <BarChart2 size={24} /> },
    { id: 'routines', label: 'Rutinas', icon: <Dumbbell size={24} /> },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={24} /> },
  ];

  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* --- INICIO DE LA MODIFICACIÓN (YA HECHA) --- */}
      <Helmet>
        <html lang="es" />
        <title>{currentTitle} - Pro Fitness Glass</title>
        <meta name="description" content={currentDescription} />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      {/* --- FIN DE LA MODIFICACIÓN (YA HECHA) --- */}

      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-accent rounded-full opacity-20 filter blur-3xl -z-10 animate-roam-blob"></div>

      <Sidebar
        view={view}
        navigate={navigate}
        setPreviousView={setPreviousView}
        navItems={navItems}
        userProfile={userProfile}
        BACKEND_BASE_URL={BACKEND_BASE_URL}
        handleLogoutClick={handleLogoutClick}
      />

      <main ref={mainContentRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">

        {/* --- INICIO DE LA MODIFICACIÓN (YA HECHA) --- */}
        <div className="md:hidden flex justify-between items-center p-4 sm:p-6 border-b border-[--glass-border] sticky top-0 bg-[--glass-bg] backdrop-blur-glass z-10">
          <span className="text-3xl font-extrabold text-text-primary">{currentTitle}</span>
        {/* --- FIN DE LA MODIFICACIÓN (YA HECHA) --- */}
          <button
            onClick={() => {
              setPreviousView(view);
              navigate('profile');
            }}
            className={`w-10 h-10 rounded-full bg-bg-secondary border border-glass-border flex items-center justify-center overflow-hidden shrink-0 ${view === 'profile' ? 'invisible' : ''}`}
          >
            {userProfile?.profile_image_url ? (
              <img
                src={userProfile.profile_image_url.startsWith('http') ? userProfile.profile_image_url : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`}
                // --- INICIO DE LA MODIFICACIÓN ---
                alt={`Foto de perfil de ${userProfile?.username || 'usuario'}`}
                // --- FIN DE LA MODIFICACIÓN ---
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-text-secondary" />
            )}
          </button>
        </div>

        {renderView()}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 flex justify-around items-center bg-[--glass-bg] backdrop-blur-glass border-t border-[--glass-border]">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              navigate(item.id);
            }}
            className={`flex flex-col items-center justify-center gap-1 h-full flex-grow transition-colors duration-200 ${view === item.id ? 'text-accent' : 'text-text-secondary'}`}>
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <PRToast newPRs={prNotification} onClose={() => useAppStore.setState({ prNotification: null })} />

      {showWelcomeModal && (
        <WelcomeModal onClose={closeWelcomeModal} />
      )}

      {/* --- INICIO DE LA MODIFICACIÓN (YA HECHA) --- */}
      {cookieConsent === null && !isInitialLoad && (
      // --- FIN DE LA MODIFICACIÓN (YA HECHA) ---
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
          onClick={() => navigate('workout')}
          className="fixed bottom-24 right-4 md:bottom-10 md:right-10 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-accent text-bg-secondary font-semibold shadow-lg animate-[fade-in-up_0.5s_ease-out] transition-transform hover:scale-105"
        >
          <Zap size={20} />
          <span>Volver al Entreno</span>
        </button>
      )}

      <div className="hidden md:block absolute bottom-4 right-4 z-50 bg-bg-secondary/50 text-text-muted text-xs px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
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
            fetchInitialData(); // Asegurarse de recargar datos tras verificar
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