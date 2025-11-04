/* frontend/src/App.jsx */
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, Dumbbell, BarChart2, Settings, LogOut, Zap, Utensils, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAppStore from './store/useAppStore';
import { APP_VERSION } from './config/version';

// ... (imports de componentes estáticos y lazy sin cambios) ...
import GlassCard from './components/GlassCard';
import Spinner from './components/Spinner';
import PRToast from './components/PRToast';
import ConfirmationModal from './components/ConfirmationModal';
import WelcomeModal from './components/WelcomeModal';
import EmailVerificationModal from './components/EmailVerificationModal';
import EmailVerification from './components/EmailVerification';
import CookieConsentBanner from './components/CookieConsentBanner';
import Sidebar from './components/Sidebar';

import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';
import OnboardingScreen from './pages/OnboardingScreen';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Progress = lazy(() => import('./pages/Progress'));
const Routines = lazy(() => import('./pages/Routines'));
const Workout = lazy(() => import('./pages/Workout'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen'));
const PhysicalProfileEditor = lazy(() => import('./pages/PhysicalProfileEditor'));
const AccountEditor = lazy(() => import('./pages/AccountEditor'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Profile = lazy(() => import('./pages/Profile'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full pt-20">
    <Spinner size={40} />
  </div>
);


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
const CANONICAL_BASE_URL = 'https://pro-fitness-glass.zeabur.app';

export default function App() {
  const {
    // ... (imports de useAppStore sin cambios) ...
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

  const [view, setView] = useState('dashboard');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [previousView, setPreviousView] = useState(null);
  const mainContentRef = useRef(null);

  const [authView, setAuthView] = useState('login');

  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showCodeVerificationModal, setShowCodeVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');
  const [accent, setAccentState] = useState(() => localStorage.getItem('accent') || 'green');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isWorkoutPaused, workoutAccumulatedTime } = useAppStore();
  const [timer, setTimer] = useState(0);

  const { t } = useTranslation('translation');

  // 1. Callbacks Estables
  const handleLogoutClick = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const confirmLogout = useCallback(() => {
    performLogout();
    setShowLogoutConfirm(false);
  }, [performLogout]);

  // STABLE: navigate
  // --- INICIO DE LA MODIFICACIÓN ---
  // Refactorizada para ser segura con <StrictMode>
  const navigate = useCallback((viewName, options = {}) => {
    if (options.forceTab) {
      localStorage.setItem('routinesForceTab', options.forceTab);
    }
    
    // Primero, leemos el estado 'view' actual y lo guardamos en 'previousView'
    // Usamos el formato de callback para asegurar que leemos el valor más reciente.
    setPreviousView(currentView => {
      // Solo actualizamos 'previousView' si la vista realmente va a cambiar
      if (currentView !== viewName) {
        return currentView;
      }
      return currentView; // Mantenemos el 'previousView' si no hay cambio
    });
    
    // Segundo, actualizamos la 'view' principal a la nueva vista.
    // Esta función también es segura para StrictMode.
    setView(currentView => {
      if (currentView === viewName) {
        return currentView; // Evita re-renderizado innecesario
      }
      return viewName; // Establece la nueva vista
    });

  }, []); // <-- Array de dependencias VACÍO. La función es estable.
  // --- FIN DE LA MODIFICACIÓN ---

  // STABLE: handleBackFromPolicy
  const handleBackFromPolicy = useCallback(() => {
    setPreviousView(currentPreviousView => {
      // Navega a la vista anterior O a 'dashboard' si no hay nada
      setView(currentPreviousView || 'dashboard');
      return null; // Limpia el estado de 'previousView'
    });
  }, []); // <-- Estable

  // STABLE: handleShowPolicy
  const handleShowPolicy = useCallback(() => {
    navigate('privacyPolicy');
  }, [navigate]); // <-- Estable (depende de 'navigate' que es estable)

  // STABLE: handleCancelProfile
  const handleCancelProfile = useCallback(() => {
    setPreviousView(currentPreviousView => {
      // El fallback de Perfil es 'settings'
      setView(currentPreviousView || 'settings');
      return null; // Limpia el estado de 'previousView'
    });
  }, []); // <-- Estable
  
  // 2. Efectos
  
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [view]);

  useEffect(() => {
    if (!isInitialLoad && view !== 'privacyPolicy') {
      localStorage.setItem('lastView', view);
    }
  }, [view, isInitialLoad]);

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

  useEffect(() => {
    const loadInitialDataAndSetView = async () => {
      await fetchInitialData(); 
      const loadedUserProfile = useAppStore.getState().userProfile;
      const loadedActiveWorkout = useAppStore.getState().activeWorkout;
      
      let targetView = 'dashboard'; 
      if (loadedActiveWorkout) {
        targetView = 'workout'; 
      } else {
        const lastView = localStorage.getItem('lastView');
        if (lastView && loadedUserProfile?.goal) {
          if (lastView === 'adminPanel' && loadedUserProfile?.role !== 'admin') {
            targetView = 'dashboard'; 
          } else if (lastView !== 'login' && lastView !== 'register' && lastView !== 'forgotPassword' && lastView !== 'resetPassword') {
            targetView = lastView;
          }
        }
      }
      
      setView(targetView);
      setIsInitialLoad(false); 
    };

    if (isAuthenticated) {
      loadInitialDataAndSetView();
    } else {
      setIsInitialLoad(false); 
    }
  }, [isAuthenticated, fetchInitialData]);


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

  useEffect(() => {
    if (isAuthenticated && userProfile && !isLoading) {
      if (!userProfile.is_verified) {
        setShowEmailVerificationModal(true);
        setVerificationEmail(userProfile.email);
      }
      if (!isInitialLoad) { 
          checkWelcomeModal();
      }
    }
  }, [isAuthenticated, userProfile, isLoading, checkWelcomeModal, isInitialLoad]);

  // 3. Lógica de renderizado y memoización (Sin cambios)
  
  const currentTitle = useMemo(() => {
    const titleMap = {
      dashboard: { key: 'Dashboard', default: 'Dashboard' },
      nutrition: { key: 'Nutrición', default: 'Nutrición' },
      progress: { key: 'Progreso', default: 'Progreso' },
      routines: { key: 'Rutinas', default: 'Rutinas' },
      settings: { key: 'Ajustes', default: 'Ajustes' },
      workout: { key: 'Entrenamiento Activo', default: 'Entrenamiento Activo' },
      profile: { key: 'Perfil', default: 'Perfil' },
      physicalProfileEditor: { key: 'Editar Perfil Físico', default: 'Editar Perfil Físico' },
      accountEditor: { key: 'Editar Cuenta', default: 'Editar Cuenta' },
      adminPanel: { key: 'Panel de Admin', default: 'Panel de Admin' },
      privacyPolicy: { key: 'Política de Privacidad', default: 'Política de Privacidad' },
    };
    const titleInfo = titleMap[view];
    if (titleInfo) {
      return t(titleInfo.key, { defaultValue: titleInfo.default });
    }
    const fallbackKey = view.charAt(0).toUpperCase() + view.slice(1);
    return t(fallbackKey, { defaultValue: fallbackKey });
  }, [view, t]);

  const currentDescription = useMemo(() => {
    const descKeys = {
      dashboard: t('dashboard_desc', { defaultValue: 'Tu resumen diario de actividad, nutrición y progreso.' }),
      nutrition: t('nutrition_desc', { defaultValue: 'Registra tus comidas, agua y suplementos. Sigue tus macros y calorías.' }),
      progress: t('progress_desc', { defaultValue: 'Visualiza tu progreso en gráficos: peso, fuerza por ejercicio y nutrición.' }),
      routines: t('routines_desc', { defaultValue: 'Crea, edita y explora rutinas de entrenamiento personalizadas.' }),
      settings: t('settings_desc', { defaultValue: 'Configura la apariencia de la app, tu cuenta y preferencias.' }),
      profile: t('profile_desc', { defaultValue: `Edita tu perfil, ${userProfile?.username || 'usuario'}.` }), 
      workout: t('workout_desc', { defaultValue: 'Registra tu sesión de entrenamiento actual.' }),
      physicalProfileEditor: t('physicalProfileEditor_desc', { defaultValue: 'Actualiza tus datos físicos como edad, altura y objetivos.' }),
      accountEditor: t('accountEditor_desc', { defaultValue: 'Modifica tu nombre, email o contraseña.' }),
      adminPanel: t('adminPanel_desc', { defaultValue: 'Gestión de usuarios y configuraciones avanzadas.' }),
      privacyPolicy: t('privacyPolicy_desc', { defaultValue: 'Información sobre cómo tratamos tus datos y el uso de cookies.' }),
      default: t('default_desc', { defaultValue: 'Registra tus entrenamientos, sigue tu progreso nutricional y alcanza tus objetivos de fitness con Pro Fitness Glass.' }),
    };
    return descKeys[view] || descKeys.default;
  }, [view, t, userProfile?.username]);
  
  const currentPath = useMemo(() => {
    if (view === 'dashboard') return '/';
    if (view) return `/${view}`;
    return '/';
  }, [view]);

  const canonicalUrl = `${CANONICAL_BASE_URL}${currentPath}`;


  // 4. Hook 'useMemo' para la vista actual
  const currentViewComponent = useMemo(() => {
    switch (view) {
      case 'dashboard': return <Dashboard setView={navigate} />;
      case 'progress': return <Progress darkMode={theme !== 'light'} />;
      case 'routines': return <Routines setView={navigate} />;
      case 'workout': return <Workout timer={timer} setView={navigate} />;
      case 'nutrition': return <Nutrition />;
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
      case 'physicalProfileEditor': return <PhysicalProfileEditor onDone={() => navigate('settings')} />; // Inline OK (navigate es estable)
      case 'accountEditor': return <AccountEditor onCancel={() => navigate('settings')} />; // Inline OK (navigate es estable)
      
      case 'profile': return <Profile onCancel={handleCancelProfile} />;

      case 'adminPanel':
        return userProfile?.role === 'admin'
          ? <AdminPanel onCancel={() => navigate('settings')} /> // Inline OK (navigate es estable)
          : <Dashboard setView={navigate} />; 
      case 'privacyPolicy': return <PrivacyPolicy onBack={handleBackFromPolicy} />; // Usamos la función estable
      default: return <Dashboard setView={navigate} />;
    }
  }, [
    view,
    navigate, // Estable
    theme,
    timer,
    accent,
    handleLogoutClick, // Estable
    userProfile,
    handleBackFromPolicy, // Estable
    handleCancelProfile   // Estable
  ]);


  // 5. Retornos condicionales (Guards) (Sin cambios)
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

  if (userProfile && !userProfile.goal) {
    return <OnboardingScreen />;
  }
  
  if (!userProfile) {
      return <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">Cargando perfil...</div>;
  }
  
  // 6. Traducimos las etiquetas de 'navItems' (Sin cambios)
  const navItems = [
    { id: 'dashboard', label: t('Dashboard', { defaultValue: 'Dashboard' }), icon: <Home size={24} /> },
    { id: 'nutrition', label: t('Nutrición', { defaultValue: 'Nutrición' }), icon: <Utensils size={24} /> },
    { id: 'progress', label: t('Progreso', { defaultValue: 'Progreso' }), icon: <BarChart2 size={24} /> },
    { id: 'routines', label: t('Rutinas', { defaultValue: 'Rutinas' }), icon: <Dumbbell size={24} /> },
    { id: 'settings', label: t('Ajustes', { defaultValue: 'Ajustes' }), icon: <Settings size={24} /> },
  ];

  return (
    <div className="relative flex w-full h-full overflow-hidden">
      
      {/* <Helmet> Único y centralizado (Sin cambios) */}
      <Helmet>
        <html lang="es" />
        <title>{currentTitle} - Pro Fitness Glass</title>
        <meta name="description" content={currentDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta charSet="UTF-8" />
        {/*
          Asegúrate de que tu 'index.html' tenga 'viewport-fit=cover'
          para que estas 'safe-area-inset' funcionen.
          ej: <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>

      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-accent rounded-full opacity-20 filter blur-3xl -z-10 animate-roam-blob"></div>

      <Sidebar
        view={view}
        navigate={navigate} // Pasamos la función 'navigate' 100% estable
        // --- INICIO DE LA MODIFICACIÓN ---
        // setPreviousView={setPreviousView} // ELIMINADO: Esta prop ya no es necesaria y causaba el bug.
        // --- FIN DE LA MODIFICACIÓN ---
        navItems={navItems} 
        userProfile={userProfile}
        BACKEND_BASE_URL={BACKEND_BASE_URL}
        handleLogoutClick={handleLogoutClick}
      />

      <main ref={mainContentRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">

        <div className="md:hidden flex justify-between items-center p-4 sm:p-6 border-b border-[--glass-border] sticky top-0 bg-[--glass-bg] backdrop-blur-glass z-10">
          <span className="text-3xl font-extrabold text-text-primary">{currentTitle}</span>
          <button
            onClick={() => {
              navigate('profile');
            }}
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

        <Suspense fallback={<LoadingFallback />}>
          {currentViewComponent}
        </Suspense>

      </main>

      {/* --- INICIO DE LA MODIFICACIÓN (NAVBAR MÓVIL) --- */}
      {/* 1. Cambiamos 'justify-around' por 'justify-evenly' para espaciado 100% equitativo */}
      {/* 2. Reemplazamos 'pl/pr' simples por 'pl/pr-[max(...)]' para garantizar un padding MÍNIMO */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-evenly bg-[--glass-bg] backdrop-blur-glass border-t border-[--glass-border]
                   pb-[env(safe-area-inset-bottom)] 
                   pl-[max(env(safe-area-inset-left),_0.5rem)] 
                   pr-[max(env(safe-area-inset-right),_0.5rem)]">
        {/*
          Quitamos pl-[env(safe-area-inset-left)] y pr-[env(safe-area-inset-right)]
          y los reemplazamos por la función max() de CSS para asegurar un padding mínimo de 0.5rem (8px).
          En un iPhone, usará el 'safe-area-inset-left' si es MAYOR que 0.5rem.
          En un Android sin notch, usará 0.5rem como padding.
        */}
      {/* --- FIN DE LA MODIFICACIÓN (NAVBAR MÓVIL) --- */}
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              navigate(item.id); // Llama a la 'navigate' estable
            }}
            // --- INICIO DE LA MODIFICACIÓN (BOTÓN NAVBAR) ---
            // 3. Mantenemos 'flex-grow' para que los botones llenen el espacio.
            //    Junto con 'justify-evenly', esto crea una barra equilibrada.
            className={`flex flex-col items-center justify-center gap-1 h-20 flex-grow transition-colors duration-200 ${view === item.id ? 'text-accent' : 'text-text-secondary'}`}>
            {/* --- FIN DE LA MODIFICACIÓN (BOTÓN NAVBAR) --- */}
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ... (Resto de modales y botones flotantes) ... */}
      <PRToast newPRs={prNotification} onClose={() => useAppStore.setState({ prNotification: null })} />

      {showWelcomeModal && (
        <WelcomeModal onClose={closeWelcomeModal} />
      )}

      {cookieConsent === null && !isInitialLoad && (
        <CookieConsentBanner
          onAccept={handleAcceptCookies}
          onDecline={handleDeclineCookies}
          onShowPolicy={handleShowPolicy} // Estable
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

      {/* --- INICIO DE LA MODIFICACIÓN (BOTÓN FLOTANTE) --- */}
      {/* 4. Ajustamos el 'bottom' del botón flotante para que también respete la 'safe-area' */}
      {activeWorkout && workoutStartTime && view !== 'workout' && (
        <button
          onClick={() => navigate('workout')} // Estable
          className="fixed right-4 md:bottom-10 md:right-10 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-accent text-bg-secondary font-semibold shadow-lg animate-[fade-in-up_0.5s_ease-out] transition-transform hover:scale-105
                     bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-10"
        >
          {/*
            Cambiamos 'bottom-24' (6rem) por una calc() que suma la altura de la navbar (h-20 -> 5rem),
            un poco de espacio (1rem), y el padding de la safe area.
            'bottom-24' (6rem) ya estaba bien, pero 'bottom-[calc(6rem+env(safe-area-inset-bottom))]' es más robusto.
            (h-20 es 5rem, + 1rem de espacio = 6rem. Así que bottom-24 -> 6rem.
            Nueva clase: bottom-[calc(6rem+env(safe-area-inset-bottom))]
            He ajustado el espacio a h-20 (5rem) + 1rem (espacio) = 6rem.
          */}
      {/* --- FIN DE LA MODIFICACIÓN (BOTÓN FLOTANTE) --- */}
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