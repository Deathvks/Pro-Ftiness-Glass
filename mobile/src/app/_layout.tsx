import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { Appearance, AppState, Platform } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initLocalStorage } from '@/utils/localStoragePolyfill';
import { installHapticsInterceptor } from '@/utils/haptics';
import { loadCardioSession, syncPendingCardio } from '@/utils/cardio';
import { resolveDeepLink } from '@/utils/deepLinking';
import { syncPushOnAppStart } from '@/services/nativeNotifications';
import useAppStore, { applyNativeColorScheme } from '@/store/useAppStore';
import type { QueuedRequest } from '@/store/syncSlice';
import ThemeBackground from '@/components/ThemeBackground';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground } from '@/constants/theme';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { DynamicIslandTimer } from '@/components/workout/DynamicIslandTimer';
import { RestTimerModal } from '@/components/workout/RestTimerModal';
import { OfflineDownloadFloatingBar } from '@/components/OfflineDownloadFloatingBar';
import { StoryHost } from '@/components/social/StoryHost';
import { TourOverlay } from '@/components/tutorials/TourOverlay';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { VersionUpdater } from '@/components/VersionUpdater';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { DomainMigrationModal } from '@/components/modals/DomainMigrationModal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasRestoredPath, setHasRestoredPath] = useState(false);
  const hasCheckedCardio = useRef(false);
  
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const userProfile = useAppStore(state => state.userProfile);
  const cardioUserId = userProfile?.id;
  const hasPendingCardio = useAppStore(state => state.syncQueue.some((item: QueuedRequest) => item.cardioUserId === cardioUserId));
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    async function prepare() {
      await initLocalStorage();
      installHapticsInterceptor();
      useAppStore.getState().hydrateFromStorage();
      useAppStore.getState().hydrateSyncQueue();
      
      const token = localStorage.getItem('pro_fitness_token');
      if (token) useAppStore.setState({ isAuthenticated: true, token });

      useAppStore.getState().loadRoutineEditorState();

      setIsReady(true);
      SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  // Si la preferencia es "Sistema", seguimos los cambios de modo claro/oscuro del dispositivo
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      useAppStore.getState().syncSystemTheme();
    });
    return () => sub.remove();
  }, []);

  // Save last path for reload persistence - only save stable tab paths
  useEffect(() => {
    if (isReady && isAuthenticated && pathname && pathname !== '/') {
      const isStablePath = pathname.startsWith('/(tabs)') || pathname === '/routines' || pathname === '/nutrition' || pathname === '/hub' || pathname === '/social' || pathname === '/profile';
      // Also save if it's the index tab
      const isIndex = pathname === '/' || pathname === '/index';
      if ((isStablePath || isIndex) && typeof localStorage !== 'undefined') {
        localStorage.setItem('last_path', pathname);
      }
    }
  }, [pathname, isReady, isAuthenticated]);

  // Proteccion de Rutas
  useEffect(() => {
    if (!isReady) return;

    const inLogin = segments[0] === 'login';
    const inRegister = segments[0] === 'register';
    const inForgot = segments[0] === 'forgot-password';
    const inResetPassword = segments[0] === 'reset-password';
    const inNotFound = segments[0] === '+not-found';
    const inOnboarding = segments[0] === 'onboarding';
    const inLegal = ['privacy', 'terms', 'legal-notice', 'cookies'].includes(segments[0]);
    const inNews = segments[0] === 'noticias';
    const inShare = segments[0] === 'share';
    const inPublicUtility = [
      'calculadora-1rm',
      'calculadora-calorias-macros',
      'faq',
      'sobre-nosotros',
      'ejercicios',
      'mantenimiento',
    ].includes(segments[0]);

    const needsOnboarding = isAuthenticated && userProfile && !userProfile.goal && userProfile.role !== 'trainee';

    if (!isAuthenticated && !inLogin && !inRegister && !inForgot && !inResetPassword && !inNotFound && !inLegal && !inNews && !inShare && !inPublicUtility) {
      router.replace('/login');
    } else if (needsOnboarding && !inOnboarding && !inNews && !inShare && !inPublicUtility && !inResetPassword && !inNotFound) {
      // Bloquear acceso hasta que complete el onboarding
      router.replace('/onboarding');
    } else if (isAuthenticated && (inLogin || inRegister || inForgot)) {
      if (needsOnboarding) {
        router.replace('/onboarding');
      } else {
        const pendingRedirect = typeof localStorage !== 'undefined' ? localStorage.getItem('post_auth_redirect') : null;
        if (pendingRedirect && pendingRedirect.startsWith('/')) {
          localStorage.removeItem('post_auth_redirect');
          router.replace(pendingRedirect as any);
        } else {
          router.replace('/(tabs)');
        }
      }
    } else if (isAuthenticated && !hasRestoredPath) {
      setHasRestoredPath(true);
      // Only restore if we're currently at the root/index - don't redirect if already navigated
      const atRoot = segments.length <= 1 || (segments[0] === '(tabs)' && (!segments[1] || (segments[1] as string) === 'index'));
      if (atRoot && !needsOnboarding && !inNews && !inShare) {
        const lastPath = typeof localStorage !== 'undefined' ? localStorage.getItem('last_path') : null;
        if (lastPath && lastPath !== '/' && lastPath !== '/index' && !lastPath.includes('login') && !lastPath.includes('register') && !lastPath.includes('onboarding')) {
          setTimeout(() => {
            const user = useAppStore.getState().userProfile;
            if (!loadCardioSession(user?.id)) router.replace(lastPath as any);
          }, 100);
        }
      }
    }
  }, [isAuthenticated, isReady, segments, hasRestoredPath, userProfile]);

  useEffect(() => {
    if (!isAuthenticated) hasCheckedCardio.current = false;
    if (!isReady || !isAuthenticated || userProfile?.id == null || hasCheckedCardio.current) return;
    if (!userProfile.goal && userProfile.role !== 'trainee') return;
    if (segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'forgot-password') return;

    hasCheckedCardio.current = true;
    const saved = loadCardioSession(userProfile.id);
    if (saved && (segments[0] === '(tabs)' || pathname === '/')) {
      router.push({ pathname: '/active-cardio', params: { activityId: saved.activityId, recovered: '1' } });
    }
  }, [isReady, isAuthenticated, userProfile, segments, pathname, router]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || cardioUserId == null || !hasPendingCardio) return;
    const sync = () => {
      if (AppState.currentState === 'active' || AppState.currentState == null) {
        void syncPendingCardio(cardioUserId).catch(() => {});
      }
    };
    sync();
    const foreground = AppState.addEventListener('change', sync);
    const interval = setInterval(sync, 15_000);
    return () => {
      foreground.remove();
      clearInterval(interval);
    };
  }, [cardioUserId, hasPendingCardio, isAuthenticated, isReady]);

  // Cargar datos iniciales y sincronizar notificaciones push del dispositivo
  useEffect(() => {
    if (isReady && isAuthenticated) {
      useAppStore.getState().fetchInitialData();
      useAppStore.getState().fetchDataForDate(new Date().toISOString().split('T')[0]);
      if (userProfile?.id) {
        void syncPushOnAppStart(userProfile.id);
      }
    }
  }, [isReady, isAuthenticated, userProfile?.id]);

  // Listeners nativos de notificaciones recibidas y pulsadas
  useEffect(() => {
    if (!isReady || Platform.OS === 'web') return;

    const navigateFromNotification = (response: Notifications.NotificationResponse | null) => {
      if (!response || !useAppStore.getState().isAuthenticated) return;
      const rawUrl = response.notification?.request?.content?.data?.url;
      const target = typeof rawUrl === 'string' && rawUrl.startsWith('/') ? rawUrl : '/notifications';
      try {
        router.push(target as any);
      } catch {}
    };

    Notifications.getLastNotificationResponseAsync()
      .then(navigateFromNotification)
      .catch(() => {});

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      const store = useAppStore.getState();
      if (store.isAuthenticated) {
        store.incrementUnreadCount?.();
        void store.fetchNotifications?.(1);
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(navigateFromNotification);

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isReady, router]);

  // Deep Links / Enlaces compartidos (Universal Links, App Links y esquema mobile://)
  useEffect(() => {
    if (!isReady) return;

    const handleIncomingUrl = (url: string | null | undefined) => {
      const target = resolveDeepLink(url);
      if (!target) return;

      const isPublicDeepLink =
        target.pathname.startsWith('/share/') ||
        target.pathname.startsWith('/noticias') ||
        target.pathname === '/login' ||
        target.pathname === '/register' ||
        target.pathname === '/forgot-password' ||
        target.pathname === '/reset-password' ||
        [
          '/privacy',
          '/terms',
          '/legal-notice',
          '/cookies',
          '/calculadora-1rm',
          '/calculadora-calorias-macros',
          '/faq',
          '/sobre-nosotros',
          '/ejercicios',
          '/mantenimiento',
        ].includes(target.pathname);

      if (!useAppStore.getState().isAuthenticated && !isPublicDeepLink) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('post_auth_redirect', target.pathname);
          }
        } catch {}
        router.replace('/login');
        return;
      }

      try {
        if (target.params) {
          router.push({ pathname: target.pathname as any, params: target.params });
        } else {
          router.push(target.pathname as any);
        }
      } catch {}
    };

    Linking.getInitialURL()
      .then(url => {
        if (url) handleIncomingUrl(url);
      })
      .catch(() => {});

    const linkSub = Linking.addEventListener('url', event => {
      handleIncomingUrl(event.url);
    });

    return () => linkSub.remove();
  }, [isReady, router]);

  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const themePreference = useAppStore(state => state.themePreference);
  const previewTheme = useAppStore(state => state.themeTest?.name);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  useEffect(() => {
    if (!isReady) return;
    const frame = requestAnimationFrame(() => {
      applyNativeColorScheme(previewTheme ?? themePreference, theme);
      if (!previewTheme && themePreference === 'system') useAppStore.getState().syncSystemTheme();
    });
    return () => cancelAnimationFrame(frame);
  }, [isReady, themePreference, previewTheme, theme]);

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, primary: colors.tint, background: 'transparent' } };
  }, [isDark, colors.tint]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background }}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {pathname !== '/appearance' && <ThemeBackground root />}
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="routine-editor" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="register" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="reset-password" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="privacy" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="terms" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="legal-notice" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="cookies" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="calculadora-1rm" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="calculadora-calorias-macros" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="faq" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="sobre-nosotros" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="ejercicios" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="mantenimiento" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="admin" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="trainerPanel" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="noticias" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="asesoria" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="appearance" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="challenges" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="progress" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="support" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="social-networks" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="physical-profile-editor" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="two-factor-setup" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="workout" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="quick-cardio" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="active-cardio" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="share/routine/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
        <DynamicIslandTimer />
        <RestTimerModal />
        <OfflineDownloadFloatingBar />
        <StoryHost />
        <VersionUpdater />
        <WelcomeModal />
        <DomainMigrationModal />
        <CookieConsentBanner />
        <TourOverlay />
        <ToastContainer />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
