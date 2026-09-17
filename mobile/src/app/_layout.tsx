import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initLocalStorage } from '@/utils/localStoragePolyfill';
import useAppStore from '@/store/useAppStore';

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

  // Save last path for reload persistence
  useEffect(() => {
    if (isReady && isAuthenticated && pathname && pathname !== '/' && !pathname.includes('login') && !pathname.includes('register')) {
      if (typeof localStorage !== 'undefined') {
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
      const lastPath = typeof localStorage !== 'undefined' ? localStorage.getItem('last_path') : null;
      if (lastPath && lastPath !== '/' && lastPath !== '/login' && lastPath !== '/register') {
        // Allow time for initial render before jumping to the deep link
        setTimeout(() => router.replace(lastPath as any), 0);
      }
      setHasRestoredPath(true);
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
  const isDark = theme === 'dark' || theme === 'oled';

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="routine-editor" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="register" options={{ headerShown: false, animation: 'fade' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
