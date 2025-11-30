/* frontend/src/App.jsx */
import React, { useState, lazy, Suspense, useMemo, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, Dumbbell, BarChart2, Settings, Utensils, Bell } from 'lucide-react'; // Añadido Bell
import { useTranslation } from 'react-i18next';
import useAppStore from './store/useAppStore';

// --- Imports de Hooks Modularizados ---
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAppTheme } from './hooks/useAppTheme';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { useAppInitialization } from './hooks/useAppInitialization';

// --- Imports de Componentes de Layout ---
import AuthScreens from './components/AuthScreens';
import MainAppLayout from './components/MainAppLayout';
import Spinner from './components/Spinner';

// --- Imports de Componentes Modales ---
import TwoFactorPromoModal from './components/TwoFactorPromoModal';

// --- Imports de Páginas (Lazy) ---
import OnboardingScreen from './pages/OnboardingScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Progress = lazy(() => import('./pages/Progress'));
const Routines = lazy(() => import('./pages/Routines'));
const Workout = lazy(() => import('./pages/Workout'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen'));
const PhysicalProfileEditor = lazy(() => import('./pages/PhysicalProfileEditor'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Profile = lazy(() => import('./pages/Profile'));
const TwoFactorSetup = lazy(() => import('./pages/TwoFactorSetup'));
// --- INICIO DE LA MODIFICACIÓN ---
const NotificationsScreen = lazy(() => import('./pages/NotificationsScreen'));
// --- FIN DE LA MODIFICACIÓN ---

// --- Constantes ---
const CANONICAL_BASE_URL = 'https://pro-fitness-glass.zeabur.app';
const DEFAULT_OG_IMAGE = `${CANONICAL_BASE_URL}/logo.webp`;

export default function App() {
  // --- 1. Estado Local ---
  const [authView, setAuthView] = useState('login');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [show2FAPromo, setShow2FAPromo] = useState(false);

  // --- 2. Hooks Personalizados ---
  const {
    view,
    setView,
    mainContentRef,
    navigate,
    handleBackFromPolicy,
    handleCancelProfile,
    handleShowPolicy
  } = useAppNavigation();

  const { theme, setTheme, accent, setAccent } = useAppTheme();
  const timer = useWorkoutTimer();
  const { t } = useTranslation('translation');

  const {
    isInitialLoad,
    ...verificationProps
  } = useAppInitialization({ setView, setAuthView, view });

  // --- 3. Hook de Zustand (Datos Globales) ---
  const {
    isAuthenticated,
    userProfile,
    isLoading,
    handleLogout: performLogout,
    fetchInitialData,
  } = useAppStore(state => ({
    isAuthenticated: state.isAuthenticated,
    userProfile: state.userProfile,
    isLoading: state.isLoading,
    handleLogout: state.handleLogout,
    fetchInitialData: state.fetchInitialData,
  }));

  // --- 4. Efectos ---

  // Lógica para mostrar la promo de 2FA una sola vez
  useEffect(() => {
    if (isAuthenticated && userProfile && !isLoading) {
      const hasSeenPromo = localStorage.getItem('has_seen_2fa_promo');
      const isAlreadyEnabled = userProfile?.twoFactorEnabled || userProfile?.isTwoFactorEnabled;

      if (!hasSeenPromo && !isAlreadyEnabled) {
        const timer = setTimeout(() => {
          setShow2FAPromo(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, userProfile, isLoading]);

  // --- 5. Callbacks ---
  const handleLogoutClick = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const confirmLogout = useCallback(() => {
    performLogout();
    setShowLogoutConfirm(false);
  }, [performLogout]);

  const handleClose2FAPromo = () => {
    setShow2FAPromo(false);
    localStorage.setItem('has_seen_2fa_promo', 'true');
  };

  const handleConfigure2FA = () => {
    handleClose2FAPromo();
    navigate('twoFactorSetup');
  };

  // --- 6. Memos para Títulos, Descripciones y Vista Actual ---

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
      adminPanel: { key: 'Panel de Admin', default: 'Panel de Admin' },
      privacyPolicy: { key: 'Política de Privacidad', default: 'Política de Privacidad' },
      twoFactorSetup: { key: 'Seguridad 2FA', default: 'Seguridad 2FA' },
      notifications: { key: 'Notificaciones', default: 'Notificaciones' },
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
      adminPanel: t('adminPanel_desc', { defaultValue: 'Gestión de usuarios y configuraciones avanzadas.' }),
      privacyPolicy: t('privacyPolicy_desc', { defaultValue: 'Información sobre cómo tratamos tus datos y el uso de cookies.' }),
      twoFactorSetup: t('twoFactorSetup_desc', { defaultValue: 'Configura la seguridad adicional de tu cuenta.' }),
      notifications: t('notifications_desc', { defaultValue: 'Consulta tus alertas y recordatorios.' }),
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
  const fullPageTitle = `${currentTitle} - Pro Fitness Glass`;

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
      case 'physicalProfileEditor': return <PhysicalProfileEditor onDone={() => navigate('settings')} />;
      case 'profile': return <Profile onCancel={handleCancelProfile} />;
      case 'adminPanel':
        return userProfile?.role === 'admin'
          ? <AdminPanel onCancel={() => navigate('settings')} />
          : <Dashboard setView={navigate} />;
      case 'privacyPolicy': return <PrivacyPolicy onBack={handleBackFromPolicy} />;
      case 'twoFactorSetup': return <TwoFactorSetup setView={navigate} />;
      case 'notifications': return <NotificationsScreen setView={navigate} />;
      default: return <Dashboard setView={navigate} />;
    }
  }, [
    view,
    navigate,
    theme,
    timer,
    accent,
    handleLogoutClick,
    userProfile,
    handleBackFromPolicy,
    handleCancelProfile
  ]);


  // --- 7. Guard Clauses ---

  // Interceptar ruta de reset password
  if (window.location.pathname === '/reset-password') {
    return (
      <ResetPasswordScreen
        showLogin={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  if (isLoading && isInitialLoad) {
    return <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <AuthScreens authView={authView} setAuthView={setAuthView} />;
  }

  if (userProfile && !userProfile.goal) {
    return <OnboardingScreen />;
  }

  if (!userProfile) {
    return <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">Cargando perfil...</div>;
  }

  // --- 8. Renderizado Principal ---

  const navItems = [
    { id: 'dashboard', label: t('Dashboard', { defaultValue: 'Dashboard' }), icon: <Home size={24} /> },
    { id: 'nutrition', label: t('Nutrición', { defaultValue: 'Nutrición' }), icon: <Utensils size={24} /> },
    { id: 'progress', label: t('Progreso', { defaultValue: 'Progreso' }), icon: <BarChart2 size={24} /> },
    { id: 'routines', label: t('Rutinas', { defaultValue: 'Rutinas' }), icon: <Dumbbell size={24} /> },
    { id: 'settings', label: t('Ajustes', { defaultValue: 'Ajustes' }), icon: <Settings size={24} /> },
  ];

  return (
    <>
      <Helmet>
        <html lang="es" />
        <title>{fullPageTitle}</title>
        <meta name="description" content={currentDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5" />
        <meta name="theme-color" content={theme === 'light' ? '#ffffff' : '#121212'} />

        {/* --- INICIO DE LA MODIFICACIÓN: Keywords --- */}
        <meta name="keywords" content="fitness, gym, entrenamiento, nutrición, rutinas, pesas, calorías, macros, salud, deporte, tracker" />
        {/* --- FIN DE LA MODIFICACIÓN --- */}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={fullPageTitle} />
        <meta property="og:description" content={currentDescription} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:site_name" content="Pro Fitness Glass" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={canonicalUrl} />
        <meta property="twitter:title" content={fullPageTitle} />
        <meta property="twitter:description" content={currentDescription} />
        <meta property="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Helmet>

      <MainAppLayout
        view={view}
        navigate={navigate}
        mainContentRef={mainContentRef}
        currentTitle={currentTitle}
        currentViewComponent={currentViewComponent}
        navItems={navItems}
        handleLogoutClick={handleLogoutClick}
        showLogoutConfirm={showLogoutConfirm}
        confirmLogout={confirmLogout}
        setShowLogoutConfirm={setShowLogoutConfirm}
        handleShowPolicy={handleShowPolicy}
        fetchInitialData={fetchInitialData}
        {...verificationProps}
      />

      {/* Modal Promocional 2FA */}
      {show2FAPromo && (
        <TwoFactorPromoModal
          onClose={handleClose2FAPromo}
          onConfigure={handleConfigure2FA}
        />
      )}
    </>
  );
}