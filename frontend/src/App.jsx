/* frontend/src/App.jsx */
import React, { useState, lazy, useMemo, useCallback, useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle } from 'lucide-react';
import { HomeIcon as HomeOutline, UsersIcon as UsersOutline, ChartBarIcon as ChartOutline, FireIcon as FireOutline, UserIcon as UserOutline, BoltIcon as BoltOutline, Squares2X2Icon as SquaresOutline } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, UsersIcon as UsersSolid, ChartBarIcon as ChartSolid, FireIcon as FireSolid, UserIcon as UserSolid, BoltIcon as BoltSolid, Squares2X2Icon as SquaresSolid } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { App as CapApp } from '@capacitor/app';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom'; 
import useAppStore from './store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

import { useAppNavigation } from './hooks/useAppNavigation';
import { useAppTheme } from './hooks/useAppTheme';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useLocalNotifications } from './hooks/useLocalNotifications';

import AuthScreens from './components/AuthScreens';
import MainAppLayout from './components/MainAppLayout';
import InitialLoadingSkeleton from './components/InitialLoadingSkeleton';
import RestTimerModal from './components/RestTimerModal';
import DynamicIslandTimer from './components/DynamicIslandTimer';
import VersionUpdater from './components/VersionUpdater';
import APKUpdater from './components/APKUpdater';
import AndroidDownloadPrompt from './components/AndroidDownloadPrompt';
import SEOHead from './components/SEOHead';
import PermissionModal from './components/PermissionModal'; 
import NotFoundPage from './pages/NotFoundPage';

const TwoFactorPromoModal = lazy(() => import('./components/TwoFactorPromoModal'));
const StoryViewer = lazy(() => import('./components/StoryViewer'));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'));
const PageTutorialPlayback = lazy(() => import('./components/PageTutorialPlayback'));
const OnboardingScreen = lazy(() => import('./pages/OnboardingScreen'));
const LandingPage = lazy(() => import('./pages/LandingPage')); 
const AsesoriaScreen = lazy(() => import('./pages/AsesoriaScreen'));

const VIEW_CHUNK_LOADERS = {
  dashboard: () => import('./pages/Dashboard'),
  progress: () => import('./pages/Progress'),
  routines: () => import('./pages/Routines'),
  workout: () => import('./pages/Workout'),
  nutrition: () => import('./pages/Nutrition'),
  settings: () => import('./pages/SettingsScreen'),
  physicalProfileEditor: () => import('./pages/PhysicalProfileEditor'),
  adminPanel: () => import('./pages/AdminPanel'),
  adminNotifications: () => import('./pages/AdminNotifications'),
  privacyPolicy: () => import('./pages/PrivacyPolicy'),
  terms: () => import('./pages/TermsPage'),
  profile: () => import('./pages/Profile'),
  twoFactorSetup: () => import('./pages/TwoFactorSetup'),
  notifications: () => import('./pages/NotificationsScreen'),
  social: () => import('./pages/Social'),
  publicProfile: () => import('./pages/PublicProfile'),
  quickCardio: () => import('./pages/QuickCardio'),
  'active-cardio': () => import('./pages/ActiveCardioSession'),
  trainerPanel: () => import('./components/TrainerPanel/TrainerPanel'),
  hub: () => import('./pages/Hub'),
  resetPassword: () => import('./pages/ResetPasswordScreen'),
  sharedRoutine: () => import('./pages/SharedRoutinePreview'),
  appearance: () => import('./pages/AppearanceScreen'),
  support: () => import('./pages/SupportScreen'),
  socialLinks: () => import('./pages/SocialLinksScreen'),
  challenges: () => import('./pages/ChallengesScreen'),
  asesoria: () => import('./pages/AsesoriaScreen'),
};

const preloadedViews = new Set();
export const preloadViewChunk = (viewId) => {
  if (!viewId || preloadedViews.has(viewId)) return;
  const loader = VIEW_CHUNK_LOADERS[viewId];
  if (loader) {
    preloadedViews.add(viewId);
    loader().catch(() => {
      preloadedViews.delete(viewId);
    });
  }
};

const Dashboard = lazy(VIEW_CHUNK_LOADERS.dashboard);
const Progress = lazy(VIEW_CHUNK_LOADERS.progress);
const Routines = lazy(VIEW_CHUNK_LOADERS.routines);
const Workout = lazy(VIEW_CHUNK_LOADERS.workout);
const Nutrition = lazy(VIEW_CHUNK_LOADERS.nutrition);
const SettingsScreen = lazy(VIEW_CHUNK_LOADERS.settings);
const PhysicalProfileEditor = lazy(VIEW_CHUNK_LOADERS.physicalProfileEditor);
const AdminPanel = lazy(VIEW_CHUNK_LOADERS.adminPanel);
const AdminNotifications = lazy(VIEW_CHUNK_LOADERS.adminNotifications);
const PrivacyPolicy = lazy(VIEW_CHUNK_LOADERS.privacyPolicy);
const TermsPage = lazy(VIEW_CHUNK_LOADERS.terms);
const Profile = lazy(VIEW_CHUNK_LOADERS.profile);
const TwoFactorSetup = lazy(VIEW_CHUNK_LOADERS.twoFactorSetup);
const NotificationsScreen = lazy(VIEW_CHUNK_LOADERS.notifications);
const Social = lazy(VIEW_CHUNK_LOADERS.social);
const PublicProfile = lazy(VIEW_CHUNK_LOADERS.publicProfile);
const QuickCardio = lazy(VIEW_CHUNK_LOADERS.quickCardio);
const ActiveCardioSession = lazy(VIEW_CHUNK_LOADERS['active-cardio']);
const TrainerPanel = lazy(VIEW_CHUNK_LOADERS.trainerPanel);
const Hub = lazy(VIEW_CHUNK_LOADERS.hub);
const ResetPasswordScreen = lazy(VIEW_CHUNK_LOADERS.resetPassword);
const SharedRoutinePreview = lazy(VIEW_CHUNK_LOADERS.sharedRoutine);
const AppearanceScreen = lazy(VIEW_CHUNK_LOADERS.appearance);
const SupportScreen = lazy(VIEW_CHUNK_LOADERS.support);
const SocialLinksScreen = lazy(VIEW_CHUNK_LOADERS.socialLinks);
const ChallengesScreen = lazy(VIEW_CHUNK_LOADERS.challenges);

const CANONICAL_BASE_URL = 'https://pro-fitness-glass.zeabur.app';
const DEFAULT_OG_IMAGE = `${CANONICAL_BASE_URL}/logo.webp`;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [viewingMyStory, setViewingMyStory] = useState(false);
  const [visitedHub, setVisitedHub] = useState(true);


  const {
    view,
    setView,
    navParams,
    mainContentRef,
    navigate: navigateInternal,
    handleBackFromPolicy,
    handleCancelProfile,
    handleShowPolicy
  } = useAppNavigation();

  const { theme, setTheme, accent, setAccent, resolvedTheme, themeColor, headerColor } = useAppTheme();
  
  const timer = useWorkoutTimer();
  const { t } = useTranslation('translation');

  const { 
    requestPermissions: requestNotificationPermissions, 
    scheduleEngagementNotifications, 
    scheduleDailyReminders 
  } = useLocalNotifications();

  const {
    isInitialLoad,
    showGlobalPermissionModal,
    setShowGlobalPermissionModal,
    missingPermissionName,
    ...verificationProps
  } = useAppInitialization({ 
      setView, 
      setAuthView: (v) => navigate(`/${v}`), 
      view 
  });

  const {
    isAuthenticated,
    userProfile,
    isLoading,
    handleLogout: performLogout,
    fetchInitialData,
    isResting,
    restTimerMode,
    myStories,
    unreadChats,
    sessionExpired,
    cookieConsent,
    showWelcomeModal,
    show2FAPromo,
    setShow2FAPromo,
    checkWelcomeModal,
  } = useAppStore(useShallow(state => ({
    isAuthenticated: state.isAuthenticated,
    userProfile: state.userProfile,
    isLoading: state.isLoading,
    handleLogout: state.handleLogout,
    fetchInitialData: state.fetchInitialData,
    isResting: state.isResting,
    restTimerMode: state.restTimerMode,
    myStories: state.myStories,
    unreadChats: state.unreadChats,
    sessionExpired: state.sessionExpired,
    cookieConsent: state.cookieConsent,
    showWelcomeModal: state.showWelcomeModal,
    show2FAPromo: state.show2FAPromo,
    setShow2FAPromo: state.setShow2FAPromo,
    checkWelcomeModal: state.checkWelcomeModal,
  })));

  const computeHasSeenAllHubHighlights = useCallback(() => {
    if (!userProfile?.id) return true;
    const uid = userProfile.id;
    const hubSeen = localStorage.getItem(`visited_hub_${uid}`) === 'true';
    const tutorialsSeen = localStorage.getItem(`tutorials_opened_from_hub_${uid}`) === 'true';
    const challengesSeen = localStorage.getItem(`visited_challenges_v2_${uid}`) === 'true';
    const asesoriaSeen = ['trainer', 'admin'].includes(userProfile?.role) || localStorage.getItem(`visited_asesoria_${uid}`) === 'true';
    return hubSeen && tutorialsSeen && challengesSeen && asesoriaSeen;
  }, [userProfile?.id, userProfile?.role]);

  useEffect(() => {
    if (!userProfile?.id) return;
    const syncHubBadge = () => {
      setVisitedHub(computeHasSeenAllHubHighlights());
    };
    syncHubBadge();
    window.addEventListener('hub-badges-updated', syncHubBadge);
    window.addEventListener('storage', syncHubBadge);
    return () => {
      window.removeEventListener('hub-badges-updated', syncHubBadge);
      window.removeEventListener('storage', syncHubBadge);
    };
  }, [userProfile?.id, computeHasSeenAllHubHighlights]);

  const isInstalledApp = useMemo(() => {
    return Capacitor.isNativePlatform() || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || sessionExpired) return;

    const checkTokenExistence = () => {
      const token = localStorage.getItem('pro_fitness_token');
      if (!token) {
        useAppStore.getState().handleSessionExpiry();
      }
    };

    window.addEventListener('storage', checkTokenExistence);
    window.addEventListener('focus', checkTokenExistence);
    const intervalId = setInterval(checkTokenExistence, 1000);

    return () => {
      window.removeEventListener('storage', checkTokenExistence);
      window.removeEventListener('focus', checkTokenExistence);
      clearInterval(intervalId);
    };
  }, [isAuthenticated, sessionExpired]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const listener = CapApp.addListener('appUrlOpen', data => {
        try {
          const url = new URL(data.url);
          if (url.pathname && url.pathname !== '/') {
            navigate(url.pathname + url.search);
          }
        } catch (e) {
          console.error('Error parseando deep link:', e);
        }
      });
      return () => {
        listener.then(l => l.remove());
      };
    }
  }, [navigate]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const applyNativeTheme = async () => {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          
          // En Android, para que el overlay funcione bien, el fondo debe ser transparente
          try {
            await StatusBar.setBackgroundColor({ color: '#00000000' });
          } catch (e) {
            // iOS ignora setBackgroundColor cuando overlay es true y puede lanzar warning/error
          }
          
          const isLight = resolvedTheme === 'light';
          await StatusBar.setStyle({ style: isLight ? Style.Light : Style.Dark });
          await NavigationBar.setColor({ color: themeColor });
          
          // Hack para forzar recálculo del safe-area-inset en Android tras cambiar el tema
          setTimeout(() => {
            document.documentElement.style.paddingBottom = '1px';
            window.dispatchEvent(new Event('resize'));
            setTimeout(() => {
              document.documentElement.style.paddingBottom = '';
            }, 50);
          }, 100);
        } catch (error) {
          console.warn('Error configurando interfaz nativa:', error);
        }
      };
      applyNativeTheme();
    }
  }, [themeColor, headerColor, resolvedTheme]);

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

      // EL ORDEN IMPORTA: El 2FA espera a que las cookies hayan terminado
      if (!hasSeenPromo && !isAlreadyEnabled && cookieConsent !== null) {
        setShow2FAPromo(true);
      }
    }
  }, [isAuthenticated, userProfile, isLoading, cookieConsent, showWelcomeModal]);

  const handleLogoutClick = useCallback(() => setShowLogoutConfirm(true), []);

  const confirmLogout = useCallback(() => {
    performLogout();
    setShowLogoutConfirm(false);
    localStorage.removeItem('temp_onboarding_data');
    navigate('/login');
  }, [performLogout, navigate]);

  const handleClose2FAPromo = () => {
    setShow2FAPromo(false);
    localStorage.setItem('has_seen_2fa_promo', 'true');
  };

  const handleConfigure2FA = () => {
    handleClose2FAPromo();
    navigateInternal('twoFactorSetup');
  };

  const handleHeaderAvatarClick = useCallback(() => {
    if (myStories && myStories.length > 0) {
      setViewingMyStory(true);
    } else {
      navigateInternal('profile');
    }
  }, [myStories, navigateInternal]);

  useEffect(() => {
    if (view === 'hub' && userProfile?.id) {
      localStorage.setItem(`visited_hub_${userProfile.id}`, 'true');
      setVisitedHub(computeHasSeenAllHubHighlights());
    }
  }, [view, userProfile?.id, computeHasSeenAllHubHighlights]);

  const currentTitle = useMemo(() => {
    const titleMap = {
      dashboard: { key: 'Dashboard', default: 'Dashboard' },
      challenges: { key: 'Retos', default: 'Retos' },
      nutrition: { key: 'Nutrición', default: 'Nutrición' },
      progress: { key: 'Progreso', default: 'Progreso' },
      routines: { key: 'Rutinas', default: 'Rutinas' },
      settings: { key: 'Ajustes', default: 'Ajustes' },
      appearance: { key: 'Apariencia', default: 'Apariencia' },
      support: { key: 'Soporte', default: 'Soporte' },
      socialLinks: { key: 'Nuestras Redes', default: 'Nuestras Redes' },
      workout: { key: 'Entreno', default: 'Entreno' },
      profile: { key: 'Perfil', default: 'Perfil' },
      physicalProfileEditor: { key: 'Editar Perfil Físico', default: 'Editar Perfil Físico' },
      adminPanel: { key: 'Admin', default: 'Admin' },
      adminNotifications: { key: 'Panel Notificaciones', default: 'Panel Notificaciones' },
      trainerPanel: { key: 'Personal Trainer', default: 'Personal Trainer' },
      privacyPolicy: { key: 'Política de Privacidad', default: 'Política de Privacidad' },
      terms: { key: 'Términos del Servicio', default: 'Términos del Servicio' },
      twoFactorSetup: { key: 'Seguridad 2FA', default: 'Seguridad 2FA' },
      notifications: { key: 'Notificaciones', default: 'Notificaciones' },
      social: { key: 'Comunidad', default: 'Comunidad' },
      publicProfile: { key: 'Perfil Público', default: 'Perfil Público' },
      quickCardio: { key: 'Cardio Rápido', default: 'Cardio Rápido' },
      'active-cardio': { key: 'Sesión Activa', default: 'Sesión Activa' },
      asesoria: { key: 'Asesoría', default: 'Asesoría' },
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
  const workoutTimer = view === 'workout' ? timer : 0;

  // Precargar los módulos de la barra de navegación y del menú lateral en segundo plano tras pintar la vista inicial
  useEffect(() => {
    if (!isAuthenticated || isInitialLoad) return;

    const primaryNavViews = ['dashboard', 'routines', 'nutrition', 'social', 'hub'];
    const secondaryNavViews = ['workout', 'progress', 'profile', 'settings', 'notifications', 'challenges', 'appearance'];

    // Asegurar que la vista activa empiece primero
    preloadViewChunk(view);

    const timeouts = [];
    const schedulePreload = (views, startDelayMs, stepMs) => {
      views.forEach((v, idx) => {
        if (v === view) return;
        const tid = setTimeout(() => {
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(() => preloadViewChunk(v), { timeout: 1500 });
          } else {
            preloadViewChunk(v);
          }
        }, startDelayMs + idx * stepMs);
        timeouts.push(tid);
      });
    };

    schedulePreload(primaryNavViews, 150, 120);
    schedulePreload(secondaryNavViews, 900, 180);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isAuthenticated, isInitialLoad, view]);

  const currentViewComponent = useMemo(() => {
    switch (view) {
      case 'dashboard': return <Dashboard setView={navigateInternal} />;
      case 'progress': return <Progress darkMode={resolvedTheme !== 'light'} setView={navigateInternal} />;
      case 'routines': return <Routines setView={navigateInternal} mainContentRef={mainContentRef} />;
      case 'workout': return <Workout timer={workoutTimer} setView={navigateInternal} navParams={navParams} />;
      case 'nutrition': return <Nutrition setView={navigateInternal} navParams={navParams} />;
      case 'social': return <Social setView={navigateInternal} />;
      case 'publicProfile': return <PublicProfile userId={navParams?.userId} onBack={() => navigateInternal('social')} />;
      case 'hub': return <Hub setView={navigateInternal} />;
      case 'quickCardio': return <QuickCardio onBack={() => navigateInternal('dashboard')} setView={navigateInternal} />;
      case 'active-cardio': return <ActiveCardioSession activityId={navParams?.activityId} setView={navigateInternal} />;
      case 'settings':
        return (
          <SettingsScreen
            theme={theme}
            setTheme={setTheme}
            accent={accent}
            setAccent={setAccent}
            setView={navigateInternal}
            onLogoutClick={handleLogoutClick}
            highlight={navParams?.highlight}
          />
        );
      case 'appearance': return <AppearanceScreen setView={navigateInternal} />;
      case 'support': return <SupportScreen setView={navigateInternal} />;
      case 'socialLinks': return <SocialLinksScreen setView={navigateInternal} />;
      case 'challenges': return <ChallengesScreen setView={navigateInternal} />;
      case 'physicalProfileEditor': return <PhysicalProfileEditor onDone={() => navigateInternal('settings')} />;
      case 'profile': return <Profile onCancel={handleCancelProfile} navigate={navigateInternal} />;
      case 'adminPanel': return userProfile?.role === 'admin' ? <AdminPanel onCancel={() => navigateInternal('hub')} navigate={navigateInternal} /> : <Dashboard setView={navigateInternal} />;
      case 'adminNotifications': return userProfile?.role === 'admin' ? <AdminNotifications /> : <Dashboard setView={navigateInternal} />;
      case 'securityDashboard': return userProfile?.role === 'admin' ? <SecurityDashboard onBack={() => navigateInternal('adminPanel')} /> : <Dashboard setView={navigateInternal} />;
      case 'trainerPanel': return (userProfile?.role === 'admin' || userProfile?.role === 'trainer') ? <TrainerPanel setView={navigateInternal} /> : <Dashboard setView={navigateInternal} />;
      case 'privacyPolicy': return <PrivacyPolicy onBack={handleBackFromPolicy} />;
      case 'terms': return <TermsPage />;
      case 'twoFactorSetup': return <TwoFactorSetup setView={navigateInternal} />;
      case 'notifications': return <NotificationsScreen setView={navigateInternal} />;
      case 'asesoria': {
        const handleBackFromAsesoria = () => {
          let returnTarget = null;
          if (navParams?.returnView) {
            returnTarget = {
              view: navParams.returnView,
              params: navParams.returnParams || {}
            };
          } else {
            try {
              const saved = sessionStorage.getItem('asesoria_return_context');
              if (saved) {
                returnTarget = JSON.parse(saved);
              }
            } catch (e) {
              console.warn('Error recuperando contexto de retorno de asesoría', e);
            }
          }

          if (returnTarget?.view) {
            try {
              sessionStorage.removeItem('asesoria_return_context');
            } catch (e) {}
            navigateInternal(
              returnTarget.view, 
              returnTarget.params || (returnTarget.reopenCoachExercise ? { reopenCoachExercise: returnTarget.reopenCoachExercise } : {})
            );
          } else {
            navigateInternal('hub');
          }
        };
        return <AsesoriaScreen onBack={handleBackFromAsesoria} />;
      }
      case 'not-found': return <NotFoundPage navigate={navigateInternal} />;
      default: return <Dashboard setView={navigateInternal} />;
    }
  }, [view, navigateInternal, theme, resolvedTheme, workoutTimer, accent, handleLogoutClick, userProfile, handleBackFromPolicy, handleCancelProfile, navParams]);

  const profileImgSrc = useMemo(() => {
    if (!userProfile?.profile_image_url) return null;
    const rawUrl = userProfile.profile_image_url.startsWith('http')
      ? userProfile.profile_image_url
      : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`;
    
    if (userProfile.updated_at) {
       const separator = rawUrl.includes('?') ? '&' : '?';
       return `${rawUrl}${separator}v=${new Date(userProfile.updated_at).getTime()}`;
    }
    return rawUrl;
  }, [userProfile]);

  const hasStories = useMemo(() => myStories && myStories.length > 0, [myStories]);
  const hasUnseen = useMemo(() => hasStories && myStories.some(s => !s.viewed), [hasStories, myStories]);

  const navItems = useMemo(() => [
    { id: 'dashboard', label: t('Dashboard', { defaultValue: 'Dashboard' }), icon: (active) => active ? <HomeSolid className="w-6 h-6" /> : <HomeOutline className="w-6 h-6" /> },
    { id: 'social', label: t('Comunidad', { defaultValue: 'Comunidad' }), icon: (active) => active ? <UsersSolid className="w-6 h-6" /> : <UsersOutline className="w-6 h-6" /> },
    { id: 'nutrition', label: t('Nutrición', { defaultValue: 'Nutrición' }), icon: (active) => active ? <FireSolid className="w-6 h-6" /> : <FireOutline className="w-6 h-6" /> },
    { id: 'routines', label: t('Rutinas', { defaultValue: 'Rutinas' }), icon: (active) => active ? <BoltSolid className="w-6 h-6" /> : <BoltOutline className="w-6 h-6" /> },
    { id: 'hub', label: t('Menú', { defaultValue: 'Menú' }), badge: !visitedHub || (unreadChats > 0), icon: (active) => active ? <SquaresSolid className="w-6 h-6" /> : <SquaresOutline className="w-6 h-6" /> },
  ], [t, visitedHub, unreadChats]);

  const AuthenticatedAppContent = useMemo(() => {
    // Si el perfil no tiene la propiedad 'role', significa que es el objeto parcial del login
    // y todava no se ha ejecutado fetchInitialData. Mostramos el skeleton para evitar parpadeos.
    if (!userProfile || !('role' in userProfile) || (isLoading && !userProfile.goal)) {
      return <InitialLoadingSkeleton />;
    }

    if (!userProfile.goal && userProfile.role !== 'trainee') {
      return (
        <Suspense fallback={<InitialLoadingSkeleton />}>
          <OnboardingScreen />
        </Suspense>
      );
    }

    if (view === 'active-cardio') {
      return (
        <Suspense fallback={<InitialLoadingSkeleton />}>
          <ActiveCardioSession activityId={navParams?.activityId} setView={navigateInternal} />
        </Suspense>
      );
    }

    const userProfileWithStory = {
        ...userProfile,
        hasStories: myStories && myStories.length > 0
    };

    return (
      <>
        <MainAppLayout
          view={view}
          navigate={navigateInternal}
          preloadView={preloadViewChunk}
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
          profileImgSrc={profileImgSrc}
        />
        <Suspense fallback={null}>
          <PageTutorialPlayback view={view} navParams={navParams} setView={navigateInternal} />
        </Suspense>
        {isResting && (
          restTimerMode === 'minimized' ? <DynamicIslandTimer /> : <RestTimerModal />
        )}
        {show2FAPromo && (
          <Suspense fallback={null}>
            <TwoFactorPromoModal
              onClose={handleClose2FAPromo}
              onConfigure={handleConfigure2FA}
            />
          </Suspense>
        )}
        {viewingMyStory && (
          <Suspense fallback={null}>
            <StoryViewer 
              userId={userProfile.id} 
              onClose={() => setViewingMyStory(false)} 
            />
          </Suspense>
        )}

        <PermissionModal 
            isOpen={showGlobalPermissionModal} 
            onClose={() => setShowGlobalPermissionModal(false)} 
            permissionName={missingPermissionName} 
        />
      </>
    );
  }, [
    userProfile, isLoading, view, navParams, navigateInternal,
    performLogout, mainContentRef, currentTitle, currentViewComponent,
    navItems, handleLogoutClick, showLogoutConfirm, confirmLogout, handleShowPolicy,
    fetchInitialData, verificationProps, handleHeaderAvatarClick, myStories,
    isResting, restTimerMode, show2FAPromo, viewingMyStory, hasStories,
    showGlobalPermissionModal, missingPermissionName
  ]);

  const isLandingPage = !isAuthenticated && currentPath === '/';

  const shouldRenderGlobalSEO = useMemo(() => {
    if (isLandingPage) return true;
    if (!isAuthenticated) return false;

    const viewsWithInternalSEO = ['dashboard', 'publicProfile', 'privacyPolicy', 'terms'];
    return !viewsWithInternalSEO.includes(view);
  }, [isAuthenticated, view, isLandingPage]);

  const seoConfig = useMemo(() => {
    if (isLandingPage) {
        return {
            title: "Pro Fitness Glass - Tu Entrenador Personal Inteligente",
            description: "Alcanza tus objetivos fitness con rutinas personalizadas, seguimiento de nutrición y análisis de progreso. Únete a la comunidad Pro Fitness Glass hoy mismo.",
            noIndex: false
        };
    }
    return {
        title: fullPageTitle,
        description: currentDescription,
        noIndex: true
    };
  }, [isLandingPage, fullPageTitle, currentDescription]);

  if (isInitialLoad) {
    return <InitialLoadingSkeleton />;
  }

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover" />
        <meta name="keywords" content="fitness, gym, entrenamiento, nutrición, rutinas, pesas, calorías, macros, salud, deporte, tracker" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:site_name" content="Pro Fitness Glass" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:image" content={DEFAULT_OG_IMAGE} />
        
      </Helmet>

      <VersionUpdater />
      <APKUpdater />
      <AndroidDownloadPrompt />

      {sessionExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fade-in_0.3s_ease-out]">
          <div className="bg-bg-primary border border-glass-border p-8 max-w-sm w-full rounded-2xl shadow-2xl text-center flex flex-col items-center animate-[scale-in_0.3s_ease-out]">
            <AlertTriangle size={48} className="text-red mb-4 drop-shadow-md" />
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary mb-2 tracking-tight">
              Sesión Caducada
            </h2>
            <p className="text-text-secondary mb-8 text-[15px] leading-relaxed">
              Tu sesión ha expirado por seguridad o se ha cerrado. Inicia sesión de nuevo para continuar.
            </p>
            <button 
              onClick={() => {
                performLogout();
                navigate('/login', { replace: true });
              }}
              className="w-full bg-accent text-accent-contrast font-bold py-3.5 px-4 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/20"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/privacy" element={
            <Suspense fallback={<div className="p-10">Cargando política...</div>}>
                <PrivacyPolicy onBack={() => navigate('/')} />
            </Suspense>
        } />
        <Route path="/terms" element={
            <Suspense fallback={<div className="p-10">Cargando términos...</div>}>
                <TermsPage />
            </Suspense>
        } />
        <Route path="/reset-password" element={
            <Suspense fallback={<InitialLoadingSkeleton />}>
                 <ResetPasswordScreen showLogin={() => navigate('/login')} />
            </Suspense>
        } />
        
        <Route path="/share/routine/:id" element={
            <Suspense fallback={<InitialLoadingSkeleton />}>
                <SharedRoutinePreview />
            </Suspense>
        } />

        <Route path="/" element={
            !isAuthenticated ? (
                isInstalledApp ? <Navigate to="/login" replace /> : (
                  <Suspense fallback={<InitialLoadingSkeleton />}>
                    <LandingPage onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />
                  </Suspense>
                )
            ) : (
                <Navigate to="/dashboard" replace />
            )
        } />

        <Route path="/login" element={
            !isAuthenticated ? (
                <AuthScreens authView="login" setAuthView={(v) => navigate(`/${v}`, { state: location.state })} onBack={() => navigate('/')} />
            ) : (
                <Navigate to={location.state?.from || "/dashboard"} replace />
            )
        } />

        <Route path="/register" element={
            !isAuthenticated ? (
                <AuthScreens authView="register" setAuthView={(v) => navigate(`/${v}`, { state: location.state })} onBack={() => navigate('/')} />
            ) : (
                <Navigate to={location.state?.from || "/dashboard"} replace />
            )
        } />

        <Route path="/forgotPassword" element={
            !isAuthenticated ? (
                <AuthScreens authView="forgotPassword" setAuthView={(v) => navigate(`/${v}`, { state: location.state })} onBack={() => navigate('/')} />
            ) : (
                <Navigate to={location.state?.from || "/dashboard"} replace />
            )
        } />
         <Route path="/forgot-password" element={<Navigate to="/forgotPassword" replace />} />

        <Route path="/*" element={
            isAuthenticated ? (
                AuthenticatedAppContent
            ) : (
                <Navigate to="/login" replace />
            )
        } />
      </Routes>
    </>
  );
}


