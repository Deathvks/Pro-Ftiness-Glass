/* frontend/src/App.jsx */
import React, { useState, lazy, useMemo, useCallback, useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, Dumbbell, BarChart2, Settings, Utensils, Users, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import useAppStore from './store/useAppStore';

import { useAppNavigation } from './hooks/useAppNavigation';
import { useAppTheme } from './hooks/useAppTheme';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useLocalNotifications } from './hooks/useLocalNotifications';

import AuthScreens from './components/AuthScreens';
import MainAppLayout from './components/MainAppLayout';
import InitialLoadingSkeleton from './components/InitialLoadingSkeleton';
import TwoFactorPromoModal from './components/TwoFactorPromoModal';
import RestTimerModal from './components/RestTimerModal';
import DynamicIslandTimer from './components/DynamicIslandTimer';
import VersionUpdater from './components/VersionUpdater';
import APKUpdater from './components/APKUpdater';
import AndroidDownloadPrompt from './components/AndroidDownloadPrompt';
import SEOHead from './components/SEOHead';
import StoryViewer from './components/StoryViewer';

import OnboardingScreen from './pages/OnboardingScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';
import LandingPage from './pages/LandingPage'; 

// Lazy loading de páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Progress = lazy(() => import('./pages/Progress'));
const Routines = lazy(() => import('./pages/Routines'));
const Workout = lazy(() => import('./pages/Workout'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const TemplateDiets = lazy(() => import('./pages/TemplateDiets'));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen'));
const PhysicalProfileEditor = lazy(() => import('./pages/PhysicalProfileEditor'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const Profile = lazy(() => import('./pages/Profile'));
const TwoFactorSetup = lazy(() => import('./pages/TwoFactorSetup'));
const NotificationsScreen = lazy(() => import('./pages/NotificationsScreen'));
const Social = lazy(() => import('./pages/Social'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const QuickCardio = lazy(() => import('./pages/QuickCardio'));
const ActiveCardioSession = lazy(() => import('./pages/ActiveCardioSession'));

const CANONICAL_BASE_URL = 'https://pro-fitness-glass.zeabur.app';
const DEFAULT_OG_IMAGE = `${CANONICAL_BASE_URL}/logo.webp`;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

export default function App() {
  // --- BLOQUEO DE EMERGENCIA PARA RUTAS PÚBLICAS (FIX GOOGLE) ---
  // Normalizamos la ruta eliminando slash final para evitar errores de duplicidad
  // Ejemplo: '/privacy/' se convierte en '/privacy'
  const path = window.location.pathname.replace(/\/+$/, '');

  if (path === '/privacy') {
    return (
      <Suspense fallback={<div className="p-10">Cargando política...</div>}>
         {/* Renderizamos directo, sin layout de app, sin auth checks */}
         <PrivacyPolicy onBack={() => window.location.href = '/'} />
      </Suspense>
    );
  }

  if (path === '/terms') {
    return (
      <Suspense fallback={<div className="p-10">Cargando términos...</div>}>
         <TermsPage />
      </Suspense>
    );
  }

  if (path === '/reset-password') {
     return <ResetPasswordScreen showLogin={() => { window.location.href = '/'; }} />;
  }
  // -------------------------------------------------------------

  const [authView, setAuthView] = useState('login');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [show2FAPromo, setShow2FAPromo] = useState(false);
  
  // Estado para controlar la Landing Page
  const [showLanding, setShowLanding] = useState(true);

  const [viewingMyStory, setViewingMyStory] = useState(false);

  const {
    view,
    setView,
    navParams,
    mainContentRef,
    navigate,
    handleBackFromPolicy,
    handleCancelProfile,
    handleShowPolicy
  } = useAppNavigation();

  const { theme, setTheme, accent, setAccent, resolvedTheme, themeColor } = useAppTheme();
  
  const timer = useWorkoutTimer();
  const { t } = useTranslation('translation');

  const { 
    requestPermissions: requestNotificationPermissions, 
    scheduleEngagementNotifications, 
    scheduleDailyReminders 
  } = useLocalNotifications();

  const {
    isInitialLoad,
    ...verificationProps
  } = useAppInitialization({ setView, setAuthView, view });

  const {
    isAuthenticated,
    userProfile,
    isLoading,
    handleLogout: performLogout,
    fetchInitialData,
    isResting,
    restTimerMode,
    myStories,
  } = useAppStore(state => ({
    isAuthenticated: state.isAuthenticated,
    userProfile: state.userProfile,
    isLoading: state.isLoading,
    handleLogout: state.handleLogout,
    fetchInitialData: state.fetchInitialData,
    isResting: state.isResting,
    restTimerMode: state.restTimerMode,
    myStories: state.myStories,
  }));

  // Sincronización de Tema
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const applyNativeTheme = async () => {
        try {
          await StatusBar.setBackgroundColor({ color: themeColor });
          const isLight = resolvedTheme === 'light';
          await StatusBar.setStyle({ style: isLight ? Style.Light : Style.Dark });
          await NavigationBar.setColor({ color: themeColor });
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch (error) {
          console.warn('Error configurando interfaz nativa:', error);
        }
      };
      applyNativeTheme();
    }
    document.body.style.backgroundColor = themeColor;
  }, [themeColor, resolvedTheme]);

  // Init Notificaciones
  useEffect(() => {
    if (isAuthenticated && !isLoading && Capacitor.isNativePlatform()) {
      const initNotifications = async () => {
        const granted = await requestNotificationPermissions();
        if (granted) {
          await scheduleEngagementNotifications();
          await scheduleDailyReminders(false, false);
        }
      };
      initNotifications();
    }
  }, [isAuthenticated, isLoading, requestNotificationPermissions, scheduleEngagementNotifications, scheduleDailyReminders]);

  useEffect(() => {
    if (isAuthenticated && userProfile && !isLoading) {
      const hasSeenPromo = localStorage.getItem('has_seen_2fa_promo');
      const isAlreadyEnabled = userProfile?.twoFactorEnabled || userProfile?.isTwoFactorEnabled;

      if (!hasSeenPromo && !isAlreadyEnabled) {
        const timer = setTimeout(() => setShow2FAPromo(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, userProfile, isLoading]);

  // Efecto para saltar la landing si ya estamos autenticados
  useEffect(() => {
    if (isAuthenticated) {
        setShowLanding(false);
    }
  }, [isAuthenticated]);

  const handleLogoutClick = useCallback(() => setShowLogoutConfirm(true), []);

  const confirmLogout = useCallback(() => {
    performLogout();
    setShowLogoutConfirm(false);
    setShowLanding(true);
    // Forzamos redirección a la raíz para mostrar la Landing limpia
    window.history.pushState({}, '', '/');
  }, [performLogout]);

  const handleClose2FAPromo = () => {
    setShow2FAPromo(false);
    localStorage.setItem('has_seen_2fa_promo', 'true');
  };

  const handleConfigure2FA = () => {
    handleClose2FAPromo();
    navigate('twoFactorSetup');
  };

  const handleHeaderAvatarClick = useCallback(() => {
    if (myStories && myStories.length > 0) {
      setViewingMyStory(true);
    } else {
      navigate('profile');
    }
  }, [myStories, navigate]);

  // Títulos dinámicos
  const currentTitle = useMemo(() => {
    const titleMap = {
      dashboard: { key: 'Dashboard', default: 'Dashboard' },
      nutrition: { key: 'Nutrición', default: 'Nutrición' },
      progress: { key: 'Progreso', default: 'Progreso' },
      routines: { key: 'Rutinas', default: 'Rutinas' },
      settings: { key: 'Ajustes', default: 'Ajustes' },
      workout: { key: 'Entreno', default: 'Entreno' },
      profile: { key: 'Perfil', default: 'Perfil' },
      physicalProfileEditor: { key: 'Editar Perfil Físico', default: 'Editar Perfil Físico' },
      adminPanel: { key: 'Panel de Admin', default: 'Panel de Admin' },
      privacyPolicy: { key: 'Política de Privacidad', default: 'Política de Privacidad' },
      terms: { key: 'Términos del Servicio', default: 'Términos del Servicio' },
      twoFactorSetup: { key: 'Seguridad 2FA', default: 'Seguridad 2FA' },
      notifications: { key: 'Notificaciones', default: 'Notificaciones' },
      templateDiets: { key: 'Dietas Plantilla', default: 'Dietas Plantilla' },
      social: { key: 'Comunidad', default: 'Comunidad' },
      publicProfile: { key: 'Perfil Público', default: 'Perfil Público' },
      quickCardio: { key: 'Cardio Rápido', default: 'Cardio Rápido' },
      'active-cardio': { key: 'Sesión Activa', default: 'Sesión Activa' },
    };
    const titleInfo = titleMap[view];
    if (titleInfo) return t(titleInfo.key, { defaultValue: titleInfo.default });

    const fallbackKey = view.charAt(0).toUpperCase() + view.slice(1);
    return t(fallbackKey, { defaultValue: fallbackKey });
  }, [view, t]);

  const currentDescription = useMemo(() => {
    const descKeys = {
      dashboard: t('dashboard_desc', { defaultValue: 'Tu resumen diario de actividad, nutrición y progreso.' }),
      nutrition: t('nutrition_desc', { defaultValue: 'Registra tus comidas, agua y suplementos. Sigue tus macros y calorías.' }),
      social: t('social_desc', { defaultValue: 'Conecta con amigos, comparte rutinas y compite en el ranking global.' }),
      publicProfile: t('public_profile_desc', { defaultValue: 'Explora el perfil, estadísticas y rutinas de otros usuarios.' }),
      default: t('default_desc', { defaultValue: 'Registra tus entrenamientos, sigue tu progreso nutricional y alcanza tus objetivos de fitness con Pro Fitness Glass.' }),
    };
    return descKeys[view] || descKeys.default;
  }, [view, t]);

  const fullPageTitle = `${currentTitle} - Pro Fitness Glass`;

  const currentViewComponent = useMemo(() => {
    switch (view) {
      case 'dashboard': return <Dashboard setView={navigate} />;
      case 'progress': return <Progress darkMode={resolvedTheme !== 'light'} />;
      case 'routines': return <Routines setView={navigate} />;
      case 'workout': return <Workout timer={timer} setView={navigate} />;
      case 'nutrition': return <Nutrition setView={navigate} />;
      case 'templateDiets': return <TemplateDiets setView={navigate} />;
      case 'social': return <Social setView={navigate} />;
      case 'publicProfile': return <PublicProfile userId={navParams?.userId} onBack={() => navigate('social')} />;
      case 'quickCardio': return <QuickCardio onBack={() => navigate('dashboard')} setView={navigate} />;
      case 'active-cardio': return <ActiveCardioSession activityId={navParams?.activityId} setView={navigate} />;
      case 'settings':
        return (
          <SettingsScreen
            theme={theme}
            setTheme={setTheme}
            accent={accent}
            setAccent={setAccent}
            setView={navigate}
            onLogoutClick={handleLogoutClick}
            // FIX: Pasamos el parámetro highlight para el scroll automático
            highlight={navParams?.highlight}
          />
        );
      case 'physicalProfileEditor': return <PhysicalProfileEditor onDone={() => navigate('settings')} />;
      case 'profile': return <Profile onCancel={handleCancelProfile} navigate={navigate} />;
      case 'adminPanel': return userProfile?.role === 'admin' ? <AdminPanel onCancel={() => navigate('settings')} /> : <Dashboard setView={navigate} />;
      case 'privacyPolicy': return <PrivacyPolicy onBack={handleBackFromPolicy} />;
      case 'terms': return <TermsPage />;
      case 'twoFactorSetup': return <TwoFactorSetup setView={navigate} />;
      case 'notifications': return <NotificationsScreen setView={navigate} />;
      default: return <Dashboard setView={navigate} />;
    }
  }, [view, navigate, theme, resolvedTheme, timer, accent, handleLogoutClick, userProfile, handleBackFromPolicy, handleCancelProfile, navParams]);

  // Helper para URL de imagen de perfil
  const profileImgSrc = useMemo(() => {
    if (!userProfile?.profile_image_url) return null;
    const rawUrl = userProfile.profile_image_url.startsWith('http')
      ? userProfile.profile_image_url
      : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`;
    
    if (userProfile.updated_at) {
       // Cache busting
       const separator = rawUrl.includes('?') ? '&' : '?';
       return `${rawUrl}${separator}v=${new Date(userProfile.updated_at).getTime()}`;
    }
    return rawUrl;
  }, [userProfile]);

  // Lógica para el borde de historias en el avatar del navbar
  const hasStories = useMemo(() => myStories && myStories.length > 0, [myStories]);
  const hasUnseen = useMemo(() => hasStories && myStories.some(s => !s.viewed), [hasStories, myStories]);

  const navItems = useMemo(() => [
    { id: 'dashboard', label: t('Dashboard', { defaultValue: 'Dashboard' }), icon: <Home size={24} /> },
    { id: 'social', label: t('Comunidad', { defaultValue: 'Comunidad' }), icon: <Users size={24} /> },
    { id: 'nutrition', label: t('Nutrición', { defaultValue: 'Nutrición' }), icon: <Utensils size={24} /> },
    { id: 'progress', label: t('Progreso', { defaultValue: 'Progreso' }), icon: <BarChart2 size={24} /> },
    { id: 'routines', label: t('Rutinas', { defaultValue: 'Rutinas' }), icon: <Dumbbell size={24} /> },
    { 
      id: 'profile', 
      label: t('Perfil', { defaultValue: 'Perfil' }), 
      icon: profileImgSrc ? (
        <div className={`rounded-full flex items-center justify-center transition-all duration-300 
            ${hasStories 
                ? `w-8 h-8 p-[2px] ${hasUnseen ? 'bg-accent' : 'bg-gray-400 dark:bg-gray-600'}` 
                : 'w-8 h-8'
            }
        `}>
            <img 
              src={profileImgSrc} 
              alt="Perfil" 
              className={`w-full h-full rounded-full object-cover ${hasStories ? 'border-[2px] border-bg-primary' : ''}`} 
            />
        </div>
      ) : (
        <User size={24} /> 
      )
    },
  ], [t, profileImgSrc, hasStories, hasUnseen]);

  // --- LOGICA DE RENDERIZADO PRINCIPAL ---
  const content = useMemo(() => {
    
    if (view === 'active-cardio') {
      return <ActiveCardioSession activityId={navParams?.activityId} setView={navigate} />;
    }

    if (isInitialLoad) {
      return <InitialLoadingSkeleton />;
    }

    // 2. ESTADO NO AUTENTICADO
    if (!isAuthenticated) {
        // Landing Page por defecto (Requisito Google: Info sin login)
        if (showLanding) {
            return (
                <LandingPage 
                    onLogin={() => {
                        setAuthView('login');
                        setShowLanding(false);
                    }}
                    onRegister={() => {
                        setAuthView('register');
                        setShowLanding(false);
                    }}
                />
            );
        }
        // Auth Screens solo si el usuario hizo clic en "Iniciar Sesión"
        return <AuthScreens authView={authView} setAuthView={setAuthView} />;
    }

    // 3. ESTADO AUTENTICADO (App Completa)
    if (!userProfile || (isLoading && !userProfile.goal)) {
      return <InitialLoadingSkeleton />;
    }

    if (!userProfile.goal) {
      return <OnboardingScreen />;
    }

    const userProfileWithStory = {
        ...userProfile,
        hasStories: myStories && myStories.length > 0
    };

    return (
      <>
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
          onHeaderAvatarClick={handleHeaderAvatarClick}
          userProfile={userProfileWithStory}
        />
        {isResting && (
          restTimerMode === 'minimized' ? <DynamicIslandTimer /> : <RestTimerModal />
        )}
        {show2FAPromo && (
          <TwoFactorPromoModal
            onClose={handleClose2FAPromo}
            onConfigure={handleConfigure2FA}
          />
        )}
        {viewingMyStory && (
            <StoryViewer 
                userId={userProfile.id} 
                onClose={() => setViewingMyStory(false)} 
            />
        )}
      </>
    );
  }, [
    authView, isInitialLoad, isLoading, isAuthenticated, userProfile, view, navigate,
    mainContentRef, currentTitle, currentViewComponent, navItems, handleLogoutClick,
    showLogoutConfirm, confirmLogout, handleShowPolicy, fetchInitialData, verificationProps,
    isResting, restTimerMode, show2FAPromo, navParams, myStories, viewingMyStory, handleHeaderAvatarClick,
    showLanding 
  ]);

  // --- CONFIGURACIÓN SEO DINÁMICA ---
  const isLandingPage = !isAuthenticated && showLanding;

  const shouldRenderGlobalSEO = useMemo(() => {
    // Si es landing page, SI queremos SEO (para que salga en Google)
    if (isLandingPage) return true;
    
    // Si no está autenticado y no es landing, no mostramos SEO global (login/register)
    if (!isAuthenticated) return false;

    const viewsWithInternalSEO = ['dashboard', 'publicProfile', 'privacyPolicy', 'terms'];
    return !viewsWithInternalSEO.includes(view);
  }, [isAuthenticated, view, isLandingPage]);

  // Definimos props de SEO según el estado (Landing vs App Privada)
  const seoConfig = useMemo(() => {
    if (isLandingPage) {
        return {
            title: "Pro Fitness Glass - Tu Entrenador Personal Inteligente",
            description: "Alcanza tus objetivos fitness con rutinas personalizadas, seguimiento de nutrición y análisis de progreso. Únete a la comunidad Pro Fitness Glass hoy mismo.",
            noIndex: false // ¡IMPORTANTE! False = Indexable por Google
        };
    }
    return {
        title: fullPageTitle,
        description: currentDescription,
        noIndex: true // App privada = No indexar
    };
  }, [isLandingPage, fullPageTitle, currentDescription]);


  return (
    <>
      {shouldRenderGlobalSEO && (
        <SEOHead 
            title={seoConfig.title} 
            description={seoConfig.description} 
            route={view} 
            noIndex={seoConfig.noIndex} 
        />
      )}

      <Helmet>
        <html lang="es" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5" />
        <meta name="keywords" content="fitness, gym, entrenamiento, nutrición, rutinas, pesas, calorías, macros, salud, deporte, tracker" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:site_name" content="Pro Fitness Glass" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:image" content={DEFAULT_OG_IMAGE} />
        <meta name="theme-color" content={themeColor} />
      </Helmet>

      <VersionUpdater />
      <APKUpdater />
      <AndroidDownloadPrompt />

      {content}
    </>
  );
}