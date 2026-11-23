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
import { initSocket } from '@/services/socket';
import * as userService from '@/services/userService';
import { useToastStore } from '@/store/toastStore';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { VersionUpdater } from '@/components/VersionUpdater';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { DomainMigrationModal } from '@/components/modals/DomainMigrationModal';
import { ForcePasswordResetModal } from '@/components/modals/ForcePasswordResetModal';
import { EmailVerificationModal } from '@/components/modals/EmailVerificationModal';
import { TwoFactorPromoModal } from '@/components/modals/TwoFactorPromoModal';
import { MilestoneLevelUpModal } from '@/components/modals/MilestoneLevelUpModal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const hasCheckedCardio = useRef(false);
  
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const userProfile = useAppStore(state => state.userProfile);
  const workoutLog = useAppStore(state => state.workoutLog);
  const gamificationLevel = useAppStore(state => state.gamification?.level || state.userProfile?.level || 1);
  const gamificationEvents = useAppStore(state => (state.gamification as any)?.gamificationEvents);
  const clearGamificationEvents = useAppStore(state => (state as any).clearGamificationEvents);
  const [show2FAPromo, setShow2FAPromo] = useState(false);
  const [milestoneLevel, setMilestoneLevel] = useState<number | null>(null);
  const [dismissedEmailVerify, setDismissedEmailVerify] = useState(false);
  const cardioUserId = userProfile?.id;
  const syncQueueLength = useAppStore(state => state.syncQueue.length);
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
      try {
        localStorage.removeItem('last_path');
      } catch {}

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
    }
  }, [isAuthenticated, isReady, segments, userProfile]);

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
    if (!isReady || !isAuthenticated || syncQueueLength === 0) return;
    const syncAll = () => {
      if (AppState.currentState === 'active' || AppState.currentState == null) {
        if (cardioUserId != null && hasPendingCardio) {
          void syncPendingCardio(cardioUserId).catch(() => {});
        }
        void (useAppStore.getState() as any).flushSyncQueue?.().catch(() => {});
      }
    };
    syncAll();
    const foreground = AppState.addEventListener('change', syncAll);
    const interval = setInterval(syncAll, 15_000);
    return () => {
      foreground.remove();
      clearInterval(interval);
    };
  }, [cardioUserId, hasPendingCardio, syncQueueLength, isAuthenticated, isReady]);

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

  // Consumir gamificationEvents en cola y mostrar toasts de XP / Retos / Insignias / Subida de Nivel
  useEffect(() => {
    if (!gamificationEvents || gamificationEvents.length === 0) return;
    const showToast = useToastStore.getState().showToast;
    let shouldRefreshProfile = false;

    const getLevelUnlockSuffix = (lvl: number) => {
      if (lvl === 5) return ' (¡Nuevos pasteles desbloqueados!)';
      if (lvl === 10) return ' (¡Nuevos pasteles vibrantes desbloqueados!)';
      if (lvl === 15) return ' (¡Nuevos degradados desbloqueados!)';
      if (lvl === 20) return ' (¡Nuevos acentos animados desbloqueados!)';
      return '';
    };

    gamificationEvents.forEach((event: any) => {
      if (event.type === 'xp' && Number(event.amount) > 0) {
        shouldRefreshProfile = true;
        showToast(`+${event.amount} XP: ${event.reason || 'Actividad completada'}`, 'success');
      } else if (event.type === 'workout_completed') {
        shouldRefreshProfile = true;
        const xpAmount = Number(event.xpAdded ?? event.amount ?? 0);
        if (xpAmount > 0) {
          showToast(`+${xpAmount} XP: ${event.message || 'Entrenamiento completado'}`, 'success');
        }
        if (event.leveledUp && event.newLevel) {
          showToast(
            `¡Felicidades! Has subido al Nivel ${event.newLevel}!${getLevelUnlockSuffix(event.newLevel)}`,
            'success',
            5500
          );
        }
      } else if (event.type === 'progressive_overload') {
        shouldRefreshProfile = true;
        const xpAmount = Number(event.xpAdded ?? event.amount ?? 0);
        showToast(
          xpAmount > 0
            ? `+${xpAmount} XP: Sobrecarga progresiva lograda`
            : event.message || '¡Sobrecarga progresiva lograda!',
          'success',
          4500
        );
      } else if (event.type === 'badge') {
        shouldRefreshProfile = true;
        showToast(`¡Insignia Desbloqueada! ${event.badge?.name || 'Nueva insignia'}`, 'success');
      } else if (event.type === 'level_up') {
        shouldRefreshProfile = true;
        showToast(
          `¡Felicidades! Has subido al Nivel ${event.newLevel}!${getLevelUnlockSuffix(event.newLevel)}`,
          'success',
          5500
        );
      } else if (event.type === 'challenge_completed') {
        shouldRefreshProfile = true;
        showToast(`¡Reto completado! ${event.message} (+${event.xpAdded} XP)`, 'success');
        if (event.leveledUp && event.newLevel) {
          showToast(
            `¡Felicidades! Has subido al Nivel ${event.newLevel}!${getLevelUnlockSuffix(event.newLevel)}`,
            'success',
            5500
          );
        }
      } else if (event.type === 'info' && event.message) {
        showToast(event.message, 'info');
      }
    });

    clearGamificationEvents?.();

    if (shouldRefreshProfile && isAuthenticated) {
      userService
        .getMyProfile()
        .then((profileData: any) => {
          const store: any = useAppStore.getState();
          if (profileData && store.setGamificationData) {
            store.setGamificationData({
              xp: profileData.xp,
              level: profileData.level,
              streak: profileData.streak,
              workouts_count: profileData.workouts_count,
              last_activity_date: profileData.last_activity_date,
              unlocked_badges: profileData.unlocked_badges,
            });
          }
        })
        .catch(() => {});
    }
  }, [gamificationEvents, clearGamificationEvents, isAuthenticated]);

  // Socket global para retos completados en tiempo real y notificaciones entrantes
  useEffect(() => {
    if (!isReady || !isAuthenticated || !userProfile?.id) return;

    let activeSocket: any = null;
    const handleGamificationSocket = async (data: any) => {
      if (!data) return;
      const showToast = useToastStore.getState().showToast;
      const state: any = useAppStore.getState();

      if (data.type === 'referral_success') {
        showToast(
          `¡Reto completado! ${data.message || 'Nuevo referido'} (+${data.xpAdded || 1000} XP)`,
          'success',
          5000
        );
      } else if (data.type === 'level_up') {
        let extraStr = '';
        if (data.newLevel === 5) extraStr = ' (¡Nuevos pasteles desbloqueados!)';
        if (data.newLevel === 10) extraStr = ' (¡Nuevos pasteles vibrantes desbloqueados!)';
        if (data.newLevel === 15) extraStr = ' (¡Nuevos degradados desbloqueados!)';
        if (data.newLevel === 20) extraStr = ' (¡Nuevos acentos animados desbloqueados!)';
        showToast(`¡Felicidades! Has subido al Nivel ${data.newLevel}!${extraStr}`, 'success', 5500);
      } else if (data.type === 'challenge_completed') {
        showToast(`¡Reto completado! ${data.message} (+${data.xpAdded} XP)`, 'success');
        if (data.leveledUp && data.newLevel) {
          showToast(`¡Felicidades! Has subido al Nivel ${data.newLevel}!`, 'success', 5500);
        }
      }

      if (data.type === 'challenge_completed' || data.type === 'referral_success' || data.type === 'level_up') {
        try {
          const profileData = await userService.getMyProfile();
          if (profileData && state.setGamificationData) {
            state.setGamificationData({
              xp: profileData.xp,
              level: profileData.level,
              streak: profileData.streak,
              last_activity_date: profileData.last_activity_date,
              unlocked_badges: profileData.unlocked_badges,
            });
          }
        } catch {}
      }
    };

    const handleNewNotification = () => {
      const store: any = useAppStore.getState();
      if (store.isAuthenticated) {
        store.incrementUnreadCount?.();
        void store.fetchNotifications?.(1);
      }
    };

    const timer = setTimeout(() => {
      activeSocket = initSocket();
      if (!activeSocket) return;
      activeSocket.on('GAMIFICATION_EVENT', handleGamificationSocket);
      activeSocket.on('new_notification', handleNewNotification);
    }, 450);

    return () => {
      clearTimeout(timer);
      if (activeSocket) {
        activeSocket.off('GAMIFICATION_EVENT', handleGamificationSocket);
        activeSocket.off('new_notification', handleNewNotification);
      }
    };
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

  // Promoción 2FA (1 vez si el usuario no tiene 2FA activo) y hitos de nivel (10, 20, ..., 100)
  useEffect(() => {
    if (!isReady || !isAuthenticated || !userProfile?.id) {
      setShow2FAPromo(false);
      setMilestoneLevel(null);
      return;
    }

    const uid = userProfile.id;
    const forceReset = Boolean((userProfile as any).force_password_reset);
    const needsVerify = userProfile.email_verified === false;
    const needsOnboarding = !userProfile.goal && userProfile.role !== 'trainee';
    const createdRaw = (userProfile as any).created_at || (userProfile as any).createdAt;
    const createdMs = createdRaw ? new Date(createdRaw).getTime() : NaN;
    const isAccountMature = Number.isFinite(createdMs) && Date.now() - createdMs >= 24 * 60 * 60 * 1000;
    const hasCompletedFirstWorkout = Array.isArray(workoutLog) && workoutLog.length > 0;
    const hasEngagedOrReturned = hasCompletedFirstWorkout || isAccountMature;
    const hasSeenPromoWeb =
      typeof localStorage !== 'undefined' && localStorage.getItem('has_seen_2fa_promo') === 'true';

    if (
      !forceReset &&
      !needsVerify &&
      !needsOnboarding &&
      hasEngagedOrReturned &&
      !hasSeenPromoWeb &&
      !userProfile.two_factor_enabled
    ) {
      AsyncStorage.getItem(`two_factor_promo_dismissed_${uid}`)
        .then(val => {
          if (val !== 'true') {
            setShow2FAPromo(true);
          }
        })
        .catch(() => {});
    } else {
      setShow2FAPromo(false);
    }

    const MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const currentLvl = Number(gamificationLevel) || 1;
    const highestMilestone = [...MILESTONES].reverse().find(m => currentLvl >= m);
    if (highestMilestone) {
      AsyncStorage.getItem(`seen_milestone_level_${uid}`)
        .then(raw => {
          const seen = Number(raw || '0');
          if (highestMilestone > seen) {
            setMilestoneLevel(highestMilestone);
          }
        })
        .catch(() => {});
    }
  }, [isReady, isAuthenticated, userProfile, workoutLog, gamificationLevel]);

  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const themePreference = useAppStore(state => state.themePreference);
  const previewTheme = useAppStore(state => state.themeTest?.name);
  const showWelcomeModal = useAppStore(state => Boolean((state as any).showWelcomeModal));
  const tourActive = useAppStore(state => Boolean((state as any).tourActive));
  const cookieConsent = useAppStore(state => (state as any).cookieConsent);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const needsOnboarding = Boolean(
    isAuthenticated && userProfile && !userProfile.goal && userProfile.role !== 'trainee'
  );
  const inAuthOrOnboarding =
    ['login', 'register', 'forgot-password', 'reset-password', 'onboarding'].includes(segments[0]) ||
    needsOnboarding;
  const inWorkoutFlow = ['workout', 'active-cardio', 'two-factor-setup'].includes(segments[0]);
  const cookieBannerPending = Platform.OS === 'web' && !cookieConsent;

  const forceResetVisible = Boolean(
    isReady &&
      isAuthenticated &&
      (userProfile as any)?.force_password_reset &&
      !['login', 'register', 'forgot-password', 'reset-password'].includes(segments[0])
  );
  const emailVerifyVisible = Boolean(
    isReady &&
      isAuthenticated &&
      userProfile &&
      !forceResetVisible &&
      !inAuthOrOnboarding &&
      !inWorkoutFlow &&
      userProfile.email_verified === false &&
      !dismissedEmailVerify
  );
  const welcomeVisible = Boolean(
    showWelcomeModal &&
      !forceResetVisible &&
      !emailVerifyVisible &&
      !inAuthOrOnboarding &&
      !inWorkoutFlow &&
      !cookieBannerPending &&
      !tourActive
  );
  const twoFactorVisible = Boolean(
    show2FAPromo &&
      !forceResetVisible &&
      !emailVerifyVisible &&
      !inAuthOrOnboarding &&
      !inWorkoutFlow &&
      !cookieBannerPending &&
      !welcomeVisible &&
      !tourActive
  );
  const milestoneVisible = Boolean(
    milestoneLevel !== null &&
      !forceResetVisible &&
      !emailVerifyVisible &&
      !inAuthOrOnboarding &&
      !inWorkoutFlow &&
      !cookieBannerPending &&
      !welcomeVisible &&
      !twoFactorVisible &&
      !tourActive
  );
  const isGlobalModalOpen =
    forceResetVisible ||
    emailVerifyVisible ||
    cookieBannerPending ||
    welcomeVisible ||
    twoFactorVisible ||
    milestoneVisible ||
    inAuthOrOnboarding ||
    inWorkoutFlow;

  useEffect(() => {
    useAppStore.setState({ isGlobalModalOpen } as any);
  }, [isGlobalModalOpen]);

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
        <WelcomeModal visible={welcomeVisible} />
        <DomainMigrationModal />
        <CookieConsentBanner />
        <ForcePasswordResetModal visible={forceResetVisible} />
        <EmailVerificationModal
          visible={emailVerifyVisible}
          currentEmail={userProfile?.email}
          onEmailUpdated={() => {
            void useAppStore.getState().fetchInitialData?.();
          }}
          onCodeSent={() => {
            setDismissedEmailVerify(true);
          }}
          onClose={() => setDismissedEmailVerify(true)}
        />
        <TwoFactorPromoModal
          visible={twoFactorVisible}
          onConfigure={() => {
            if (userProfile?.id) {
              AsyncStorage.setItem(`two_factor_promo_dismissed_${userProfile.id}`, 'true').catch(() => {});
            }
            try {
              localStorage?.setItem('has_seen_2fa_promo', 'true');
            } catch {}
            setShow2FAPromo(false);
            router.push('/two-factor-setup');
          }}
          onClose={() => {
            if (userProfile?.id) {
              AsyncStorage.setItem(`two_factor_promo_dismissed_${userProfile.id}`, 'true').catch(() => {});
            }
            try {
              localStorage?.setItem('has_seen_2fa_promo', 'true');
            } catch {}
            setShow2FAPromo(false);
          }}
        />
        <MilestoneLevelUpModal
          visible={milestoneVisible}
          level={milestoneLevel || 10}
          onClose={() => {
            if (userProfile?.id && milestoneLevel) {
              AsyncStorage.setItem(`seen_milestone_level_${userProfile.id}`, String(milestoneLevel)).catch(() => {});
              void useAppStore.getState().unlockMilestone?.(milestoneLevel);
            }
            setMilestoneLevel(null);
          }}
        />
        <TourOverlay />
        <ToastContainer />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
