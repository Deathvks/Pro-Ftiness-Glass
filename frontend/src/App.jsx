/* frontend/src/App.jsx */
import React, { useState, lazy, Suspense, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, Dumbbell, BarChart2, Settings, Utensils } from 'lucide-react';
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

// --- Imports de Páginas (Lazy) ---
import OnboardingScreen from './pages/OnboardingScreen';
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

// --- Constantes ---
const CANONICAL_BASE_URL = 'https://pro-fitness-glass.zeabur.app';

// --- Componente Fallback para Suspense ---
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full pt-20">
    <Spinner size={40} />
  </div>
);

export default function App() {
  // --- 1. Estado Local Mínimo ---
  const [authView, setAuthView] = useState('login');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  // El hook de inicialización gestiona la carga inicial, modales de bienvenida/email, etc.
  const { 
    isInitialLoad, 
    ...verificationProps 
  } = useAppInitialization({ setView, setAuthView, view });
  // (verificationProps contiene: showEmailVerificationModal, setShowEmailVerificationModal, etc.)

  // --- 3. Hook de Zustand (Datos Globales) ---
  const {
    isAuthenticated,
    userProfile,
    isLoading,
    handleLogout: performLogout,
    fetchInitialData, // Necesario para el modal de verificación
  } = useAppStore(state => ({
    isAuthenticated: state.isAuthenticated,
    userProfile: state.userProfile,
    isLoading: state.isLoading,
    handleLogout: state.handleLogout,
    fetchInitialData: state.fetchInitialData,
  }));

  // --- 4. Callbacks (Manejadores de Eventos) ---
  const handleLogoutClick = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const confirmLogout = useCallback(() => {
    performLogout();
    setShowLogoutConfirm(false);
  }, [performLogout]);

  // --- 5. Memos para Títulos, Descripciones y Vista Actual ---
  
  // Memo para el título (usado en <Helmet> y Header Móvil)
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
    };
    const titleInfo = titleMap[view];
    if (titleInfo) {
      return t(titleInfo.key, { defaultValue: titleInfo.default });
    }
    const fallbackKey = view.charAt(0).toUpperCase() + view.slice(1);
    return t(fallbackKey, { defaultValue: fallbackKey });
  }, [view, t]);

  // Memo para la descripción (usado en <Helmet>)
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
      default: t('default_desc', { defaultValue: 'Registra tus entrenamientos, sigue tu progreso nutricional y alcanza tus objetivos de fitness con Pro Fitness Glass.' }),
    };
    return descKeys[view] || descKeys.default;
  }, [view, t, userProfile?.username]);
  
  // Memo para la URL Canónica (usado en <Helmet>)
  const currentPath = useMemo(() => {
    if (view === 'dashboard') return '/';
    if (view) return `/${view}`;
    return '/';
  }, [view]);

  const canonicalUrl = `${CANONICAL_BASE_URL}${currentPath}`;

  // Memo para el componente de la página actual
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


  // --- 6. Guard Clauses (Retornos Condicionales) ---

  // 6.1. Pantalla de Carga Inicial
  if (isLoading && isInitialLoad) {
    return <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">Cargando...</div>;
  }

  // 6.2. Pantallas de Autenticación
  if (!isAuthenticated) {
    return <AuthScreens authView={authView} setAuthView={setAuthView} />;
  }

  // 6.3. Pantalla de Onboarding
  if (userProfile && !userProfile.goal) {
    return <OnboardingScreen />;
  }
  
  // 6.4. Fallback si el perfil aún no carga (post-auth)
  if (!userProfile) {
      return <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">Cargando perfil...</div>;
  }
  
  // --- 7. Renderizado Principal (Layout Autenticado) ---

  // Definición de los items de navegación (requiere 't' de i18n)
  const navItems = [
    { id: 'dashboard', label: t('Dashboard', { defaultValue: 'Dashboard' }), icon: <Home size={24} /> },
    { id: 'nutrition', label: t('Nutrición', { defaultValue: 'Nutrición' }), icon: <Utensils size={24} /> },
    { id: 'progress', label: t('Progreso', { defaultValue: 'Progreso' }), icon: <BarChart2 size={24} /> },
    { id: 'routines', label: t('Rutinas', { defaultValue: 'Rutinas' }), icon: <Dumbbell size={24} /> },
    { id: 'settings', label: t('Ajustes', { defaultValue: 'Ajustes' }), icon: <Settings size={24} /> },
  ];

  return (
    <>
      {/* Helmet para SEO y metadatos */}
      <Helmet>
        <html lang="es" />
        <title>{currentTitle} - Pro Fitness Glass</title>
        <meta name="description" content={currentDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </Helmet>

      {/* Layout principal de la App (Sidebar, Navbars, Modales) */}
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
    </>
  );
}