import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';

import { initLocalStorage } from '@/utils/localStoragePolyfill';
import useAppStore from '@/store/useAppStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function prepare() {
      await initLocalStorage();
      // Inicializar el estado de la app llamando checkAuth si fuera necesario
      // useAppStore.getState().checkAuth();
      setIsReady(true);
      SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  // Proteccin de Rutas
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';

    if (!isAuthenticated && !inLogin) {
      // Si no est logueado y no est en login, manda a login
      router.replace('/login');
    } else if (isAuthenticated && inLogin) {
      // Si est logueado y en login, mndalo a tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isReady, segments]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      </Stack>
    </ThemeProvider>
  );
}
