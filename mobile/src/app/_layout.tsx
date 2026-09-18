import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initLocalStorage } from '@/utils/localStoragePolyfill';
import useAppStore from '@/store/useAppStore';
import ThemeBackground from '@/components/ThemeBackground';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [hasRestoredPath, setHasRestoredPath] = useState(false);
  
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    async function prepare() {
      await initLocalStorage();
      
      const token = localStorage.getItem('pro_fitness_token');
      const savedTheme = localStorage.getItem('theme');
      
      if (token || savedTheme) {
        useAppStore.setState({ 
          isAuthenticated: !!token, 
          token: token || null,
          ...(savedTheme ? { theme: savedTheme } : {})
        });
      }

      useAppStore.getState().loadRoutineEditorState();

      setIsReady(true);
      SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  // Save last path for reload persistence — only save stable tab paths
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

    if (!isAuthenticated && !inLogin && !inRegister) {
      router.replace('/login');
    } else if (isAuthenticated && (inLogin || inRegister)) {
      router.replace('/(tabs)');
    } else if (isAuthenticated && !hasRestoredPath) {
      setHasRestoredPath(true);
      // Only restore if we're currently at the root/index — don't redirect if already navigated
      const atRoot = segments.length <= 1 || (segments[0] === '(tabs)' && (!segments[1] || segments[1] === 'index'));
      if (atRoot) {
        const lastPath = typeof localStorage !== 'undefined' ? localStorage.getItem('last_path') : null;
        if (lastPath && lastPath !== '/' && lastPath !== '/index' && !lastPath.includes('login') && !lastPath.includes('register')) {
          setTimeout(() => router.replace(lastPath as any), 100);
        }
      }
    }
  }, [isAuthenticated, isReady, segments, hasRestoredPath]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isReady && isAuthenticated) {
      useAppStore.getState().fetchInitialData();
      useAppStore.getState().fetchDataForDate(new Date().toISOString().split('T')[0]);
    }
  }, [isReady, isAuthenticated]);

  const theme = useAppStore(state => state.theme);
  const isDark = theme === 'dark' || theme === 'oled' || theme === 'galaxy' || theme === 'ocean-dark' || theme === 'desert-dark';

  const NavigationTheme = isDark ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent' } } : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <ThemeProvider value={NavigationTheme}>
        <ThemeBackground />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="routine-editor" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="register" options={{ headerShown: false, animation: 'fade' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
