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
      
      // REHIDRATACIÓN PARA REACT NATIVE:
      // Como Zustand se evaluó antes de que AsyncStorage terminara, re-leemos la memoria ahora:
      const token = localStorage.getItem('pro_fitness_token');
      if (token) {
        useAppStore.setState({ isAuthenticated: true, token });
      }

      setIsReady(true);
      SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  // Proteccion de Rutas
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';

    if (!isAuthenticated && !inLogin) {
      router.replace('/login');
    } else if (isAuthenticated && inLogin) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isReady, segments]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isReady && isAuthenticated) {
      useAppStore.getState().fetchInitialData();
      useAppStore.getState().fetchDataForDate(new Date().toISOString().split('T')[0]);
    }
  }, [isReady, isAuthenticated]);

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
