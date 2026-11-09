import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Appearance } from 'react-native';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initLocalStorage } from '@/utils/localStoragePolyfill';
import { installHapticsInterceptor } from '@/utils/haptics';
import useAppStore, { resolveTheme, applyNativeColorScheme } from '@/store/useAppStore';
import ThemeBackground from '@/components/ThemeBackground';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground } from '@/constants/theme';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { DynamicIslandTimer } from '@/components/workout/DynamicIslandTimer';
import { RestTimerModal } from '@/components/workout/RestTimerModal';
import { OfflineDownloadFloatingBar } from '@/components/OfflineDownloadFloatingBar';
import GalaxyStarBackground from '@/components/ui/GalaxyStarBackground';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [hasRestoredPath, setHasRestoredPath] = useState(false);
  
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const userProfile = useAppStore(state => state.userProfile);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    async function prepare() {
      await initLocalStorage();
      installHapticsInterceptor();
      useAppStore.getState().hydrateFromStorage();
      
      const token = localStorage.getItem('pro_fitness_token');
      const savedTheme = localStorage.getItem('theme');
      const savedAccent = localStorage.getItem('accent');
      const savedHaptics = localStorage.getItem('hapticsEnabled');
      
      if (token || savedTheme || savedAccent || savedHaptics !== null) {
        useAppStore.setState({ 
          isAuthenticated: !!token, 
          token: token || null,
          ...(savedTheme ? { themePreference: savedTheme, theme: resolveTheme(savedTheme) } : {}),
          ...(savedAccent ? { accent: savedAccent } : {}),
          ...(savedHaptics !== null ? { hapticsEnabled: JSON.parse(savedHaptics) } : {})
        });
      }

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

    const needsOnboarding = isAuthenticated && userProfile && !userProfile.goal && userProfile.role !== 'trainee';

    if (!isAuthenticated && !inLogin && !inRegister && !inForgot && !inLegal) {
      router.replace('/login');
    } else if (needsOnboarding && !inOnboarding) {
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
      if (atRoot && !needsOnboarding) {
        const lastPath = typeof localStorage !== 'undefined' ? localStorage.getItem('last_path') : null;
        if (lastPath && lastPath !== '/' && lastPath !== '/index' && !lastPath.includes('login') && !lastPath.includes('register') && !lastPath.includes('onboarding')) {
          setTimeout(() => router.replace(lastPath as any), 100);
        }
      }
    }
  }, [isAuthenticated, isReady, segments, hasRestoredPath, userProfile]);

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
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  useEffect(() => {
    applyNativeColorScheme(themePreference, theme);
  }, [themePreference, theme]);

  const NavigationTheme = isDark ? { ...DarkTheme, colors: { ...DarkTheme.colors, primary: colors.tint, background: 'transparent' } } : { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.tint, background: 'transparent' } };

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background }}>
      <ThemeProvider value={NavigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ThemeBackground />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="routine-editor" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="register" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="privacy" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="terms" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="legal-notice" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="cookies" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
        <DynamicIslandTimer />
        <RestTimerModal />
        <OfflineDownloadFloatingBar />
        <ToastContainer />
        <GalaxyStarBackground />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
