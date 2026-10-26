/* frontend/src/hooks/useAppInitialization.js */
import { useState, useEffect, useCallback } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

const NativeTimer = Capacitor.isNativePlatform() ? registerPlugin('NativeTimer') : null;

export const useAppInitialization = ({ setView, setAuthView, view }) => {
  const [isInitialLoad, setIsInitialLoad] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (
        path.startsWith('/noticias') ||
        path === '/calculadora-1rm' ||
        path === '/calculadora-calorias-macros' ||
        path === '/privacy' ||
        path === '/terms' ||
        path.startsWith('/share/') ||
        path === '/reset-password'
      ) {
        return false;
      }
    }
    const state = useAppStore.getState();
    if (!state.isAuthenticated) return false;
    return !(state.userProfile && 'role' in state.userProfile);
  });
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showCodeVerificationModal, setShowCodeVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // --- NUEVO: Estados para el modal global de permisos ---
  const [showGlobalPermissionModal, setShowGlobalPermissionModal] = useState(false);
  const [missingPermissionName, setMissingPermissionName] = useState('');

  const {
    isAuthenticated,
    userProfile,
    isLoading,
    fetchInitialData,
    checkWelcomeModal,
    fetchDataForDate,
    checkCookieConsent,
  } = useAppStore(useShallow(state => ({
    isAuthenticated: state.isAuthenticated,
    userProfile: state.userProfile,
    isLoading: state.isLoading,
    fetchInitialData: state.fetchInitialData,
    checkWelcomeModal: state.checkWelcomeModal,
    fetchDataForDate: state.fetchDataForDate,
    checkCookieConsent: state.checkCookieConsent,
  })));

  useEffect(() => {
    checkCookieConsent();
  }, [checkCookieConsent]);

  // --- LÓGICA DE PERMISOS NO INTRUSIVA ---
  const checkAndRequestPermissions = useCallback(async () => {
    if (!isAuthenticated || Capacitor.getPlatform() !== 'android') return;

    // Solo pedimos las notificaciones nativas si el estado es 'prompt' (nunca preguntado).
    // Si el usuario las denegó, simplemente lo respetamos y NO bloqueamos la app.
    try {
      let notifStatus = await LocalNotifications.checkPermissions();
      if (notifStatus.display === 'prompt') {
        await LocalNotifications.requestPermissions();
      }
    } catch (e) { 
      console.warn("Error Notificaciones:", e); 
    }

    // Aseguramos que el modal bloqueante nunca atrape al usuario al inicio.
    // La cámara y el GPS deben pedirse de forma individual cuando vayan a usarse en su sección.
    setShowGlobalPermissionModal(false);
    setMissingPermissionName('');
  }, [isAuthenticated]);

  // Ejecutamos la comprobación al cargar si está autenticado
  useEffect(() => {
    checkAndRequestPermissions();
  }, [checkAndRequestPermissions]);

  useEffect(() => {
    const resolveTargetView = (profile, activeWorkout) => {
      if (activeWorkout) return 'workout';
      const lastView = localStorage.getItem('lastView');
      if (profile?.goal) {
        if (lastView === 'adminPanel' && profile?.role !== 'admin') {
          return 'dashboard';
        }
        if (
          lastView &&
          !['login', 'register', 'forgotPassword', 'resetPassword', 'onboarding', 'physicalProfileEditor'].includes(lastView)
        ) {
          return lastView;
        }
      } else if (lastView === 'onboarding') {
        return 'onboarding';
      }
      return 'dashboard';
    };

    const loadInitialDataAndSetView = async () => {
      let completed = false;
      // Timeout de seguridad: si tras 5 segundos la red o el backend tardan en responder,
      // desbloqueamos el skeleton para no congelar la pantalla del usuario.
      const safetyTimeout = setTimeout(() => {
        if (!completed) {
          console.warn("[useAppInitialization] Timeout de seguridad (5s) alcanzado. Desbloqueando skeleton.");
          setIsInitialLoad(false);
        }
      }, 5000);

      try {
        const initialState = useAppStore.getState();
        const cachedProfile = initialState.userProfile;
        const hasFullCachedProfile = Boolean(cachedProfile && "role" in cachedProfile);

        const isPublicPath = typeof window !== 'undefined' && (
          window.location.pathname.startsWith('/noticias') ||
          window.location.pathname === '/calculadora-1rm' ||
          window.location.pathname === '/calculadora-calorias-macros' ||
          window.location.pathname === '/privacy' ||
          window.location.pathname === '/terms' ||
          window.location.pathname.startsWith('/share/') ||
          window.location.pathname === '/reset-password' ||
          window.location.pathname.startsWith('/profile')
        );

        if (hasFullCachedProfile) {
          if (!isPublicPath) {
            const immediateTarget = resolveTargetView(cachedProfile, initialState.activeWorkout);
            setView(immediateTarget);
          }
          setIsInitialLoad(false);
          completed = true;
          clearTimeout(safetyTimeout);
          if (!isPublicPath) {
            fetchInitialData().catch(() => {});
          }
          return;
        }

        await fetchInitialData();
      } catch (err) {
        console.warn("[useAppInitialization] Error al cargar datos iniciales:", err);
      } finally {
        completed = true;
        clearTimeout(safetyTimeout);
        const loadedUserProfile = useAppStore.getState().userProfile;
        const loadedActiveWorkout = useAppStore.getState().activeWorkout;
        const targetView = resolveTargetView(loadedUserProfile, loadedActiveWorkout);
        
        const isPublicPath = typeof window !== 'undefined' && (
          window.location.pathname.startsWith('/noticias') ||
          window.location.pathname === '/calculadora-1rm' ||
          window.location.pathname === '/calculadora-calorias-macros' ||
          window.location.pathname === '/privacy' ||
          window.location.pathname === '/terms' ||
          window.location.pathname.startsWith('/share/') ||
          window.location.pathname === '/reset-password' ||
          window.location.pathname.startsWith('/profile')
        );
        if (!isPublicPath) {
          setView(targetView);
        }
        setIsInitialLoad(false);
      }
    };

    const isCurrentPublic = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/noticias') ||
          window.location.pathname === '/calculadora-1rm' ||
          window.location.pathname === '/calculadora-calorias-macros' ||
      window.location.pathname === '/privacy' ||
      window.location.pathname === '/terms' ||
      window.location.pathname.startsWith('/share/') ||
      window.location.pathname === '/reset-password'
    );

    if (isAuthenticated && !isCurrentPublic) {
      loadInitialDataAndSetView();
    } else {
      setIsInitialLoad(false); 
    }
  }, [isAuthenticated, fetchInitialData, setView]); 

  useEffect(() => {
    if (isAuthenticated && userProfile && !isLoading && !isInitialLoad) {
      // La aplicación ha cargado correctamente: limpiamos el contador de fallos recurrentes
      try {
        localStorage.removeItem('pfg_crash_loop_count');
      } catch {}

      const isVerifiedDefined = userProfile.is_verified !== undefined && userProfile.is_verified !== null;
      
      if (isVerifiedDefined && userProfile.is_verified === false) {
        setShowEmailVerificationModal(true);
        setVerificationEmail(userProfile.email);
      } else {
        setShowEmailVerificationModal(false);
      }
      
      checkWelcomeModal();
    }
  }, [isAuthenticated, userProfile, isLoading, checkWelcomeModal, isInitialLoad]);

  useEffect(() => {
      if (view === 'dashboard' && isAuthenticated) {
          const today = new Date().toISOString().split('T')[0];
          fetchDataForDate(today);
      }
  }, [view, isAuthenticated, fetchDataForDate]);

  useEffect(() => {
    const handleUrlChange = () => {
      if (window.location.pathname === '/reset-password' && !isAuthenticated) {
        setAuthView('resetPassword');
      }
    };
    handleUrlChange(); 
    window.addEventListener('popstate', handleUrlChange); 
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [isAuthenticated, setAuthView]); 

  // Gestión de notificación en segundo/primer plano
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleAppStateChange = async ({ isActive }) => {
      if (!isActive) {
        const state = useAppStore.getState();
        if (state.isResting && !state.isRestTimerPaused && state.restTimerEndTime) {
          if (NativeTimer) {
            NativeTimer.startTimer({
              title: 'Descanso en progreso',
              endTimeMs: state.restTimerEndTime
            }).catch(() => {});
          }
        }
      } else {
        // Al volver a la app, limpiamos la notificación
        if (NativeTimer) NativeTimer.stopTimer().catch(() => {});
        
        // Volvemos a comprobar los permisos (silenciosamente) por si los activó en ajustes
        if (isAuthenticated) {
            checkAndRequestPermissions();
            // Refetch unread counts just in case we received messages while in the background
            const state = useAppStore.getState();
            if (state.fetchUnreadChats) {
              state.fetchUnreadChats();
            }
        }
      }
    };

    const listener = CapApp.addListener('appStateChange', handleAppStateChange);

    return () => {
      listener.then(l => l.remove());
    };
  }, [isAuthenticated, checkAndRequestPermissions]);

  return {
    isInitialLoad,
    showEmailVerificationModal,
    setShowEmailVerificationModal,
    showCodeVerificationModal,
    setShowCodeVerificationModal,
    verificationEmail,
    setVerificationEmail,
    showGlobalPermissionModal,
    setShowGlobalPermissionModal,
    missingPermissionName,
  };
};