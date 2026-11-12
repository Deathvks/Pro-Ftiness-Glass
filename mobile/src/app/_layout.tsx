import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Appearance, AppState } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initLocalStorage } from '@/utils/localStoragePolyfill';
import { installHapticsInterceptor } from '@/utils/haptics';
import { loadCardioSession, syncPendingCardio } from '@/utils/cardio';
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
    const inOnboarding = segments[0] === 'onboarding';
    const inLegal = ['privacy', 'terms', 'legal-notice', 'cookies'].includes(segments[0]);
    const inNews = segments[0] === 'noticias';

    const needsOnboarding = isAuthenticated && userProfile && !userProfile.goal && userProfile.role !== 'trainee';

    if (!isAuthenticated && !inLogin && !inRegister && !inForgot && !inLegal && !inNews) {
      router.replace('/login');
    } else if (needsOnboarding && !inOnboarding && !inNews) {
      // Bloquear acceso hasta que complete el onboarding
      router.replace('/onboarding');
    } else if (isAuthenticated && (inLogin || inRegister || inForgot)) {
      if (needsOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && !hasRestoredPath) {
      setHasRestoredPath(true);
      // Only restore if we're currently at the root/index - don't redirect if already navigated
      const atRoot = segments.length <= 1 || (segments[0] === '(tabs)' && (!segments[1] || (segments[1] as string) === 'index'));
      if (atRoot && !needsOnboarding && !inNews) {
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

  // Cargar datos iniciales
  useEffect(() => {
    if (isReady && isAuthenticated) {
      useAppStore.getState().fetchInitialData();
      useAppStore.getState().fetchDataForDate(new Date().toISOString().split('T')[0]);
    }
  }, [isReady, isAuthenticated]);

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
          <Stack.Screen name="privacy" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="terms" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="legal-notice" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="cookies" options={{ headerShown: false, animation: 'slide_from_right' }} />
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
        </Stack>
        <DynamicIslandTimer />
        <RestTimerModal />
        <OfflineDownloadFloatingBar />
        <StoryHost />
        <ToastContainer />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
