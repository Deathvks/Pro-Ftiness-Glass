/* frontend/src/hooks/useAppInitialization.js */
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useRestTimerCompletion } from './useRestTimerCompletion';
import { getPushView } from '../config/pushRoutes';

export const useAppInitialization = ({ setView, setAuthView, view }) => {
  useRestTimerCompletion();
  const [isInitialLoad, setIsInitialLoad] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (
        path.startsWith('/noticias') ||
        path === '/calculadora-1rm' ||
        path === '/calculadora-calorias-macros' ||
        path === '/ejercicios' ||
        path === '/sobre-nosotros' ||
        path === '/faq' ||
        path === '/privacy' ||
        path === '/cookies' ||
        path === '/politica-cookies' ||
        path === '/politica-de-cookies' ||
        path === '/terms' ||
        path === '/aviso-legal' ||
        path === '/legal' ||
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
  const [missingPermissionName] = useState('');

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

  useEffect(() => {
    const resolveTargetView = (profile, activeWorkout) => {
      const explicitView = getPushView(window.location.pathname);
      if (explicitView) return explicitView;
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
      // Timeout de seguridad: si tras 3.5 segundos la red o el backend tardan en responder,
      // desbloqueamos el skeleton de inmediato para no congelar la pantalla del usuario.
      const safetyTimeout = setTimeout(() => {
        if (!completed) {
          console.warn("[useAppInitialization] Timeout de seguridad (3.5s) alcanzado. Desbloqueando skeleton e interfaz.");
          setIsInitialLoad(false);
          useAppStore.setState({ isLoading: false });
        }
      }, 3500);

      try {
        const initialState = useAppStore.getState();
        const cachedProfile = initialState.userProfile;
        const hasFullCachedProfile = Boolean(cachedProfile && "role" in cachedProfile);

        const isPublicPath = typeof window !== 'undefined' && (
          window.location.pathname.startsWith('/noticias') ||
          window.location.pathname === '/calculadora-1rm' ||
          window.location.pathname === '/calculadora-calorias-macros' ||
          window.location.pathname === '/ejercicios' ||
          window.location.pathname === '/sobre-nosotros' ||
          window.location.pathname === '/faq' ||
          window.location.pathname === '/privacy' ||
          window.location.pathname === '/cookies' ||
          window.location.pathname === '/politica-cookies' ||
          window.location.pathname === '/politica-de-cookies' ||
          window.location.pathname === '/terms' ||
          window.location.pathname === '/aviso-legal' ||
          window.location.pathname === '/legal' ||
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
          fetchInitialData().catch(() => {});
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
          window.location.pathname === '/ejercicios' ||
          window.location.pathname === '/sobre-nosotros' ||
          window.location.pathname === '/faq' ||
          window.location.pathname === '/privacy' ||
          window.location.pathname === '/cookies' ||
          window.location.pathname === '/politica-cookies' ||
          window.location.pathname === '/politica-de-cookies' ||
          window.location.pathname === '/terms' ||
          window.location.pathname === '/aviso-legal' ||
          window.location.pathname === '/legal' ||
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
          window.location.pathname === '/ejercicios' ||
          window.location.pathname === '/sobre-nosotros' ||
          window.location.pathname === '/faq' ||
      window.location.pathname === '/privacy' ||
      window.location.pathname === '/cookies' ||
      window.location.pathname === '/politica-cookies' ||
      window.location.pathname === '/politica-de-cookies' ||
      window.location.pathname === '/terms' ||
      window.location.pathname === '/aviso-legal' ||
      window.location.pathname === '/legal' ||
      window.location.pathname.startsWith('/share/') ||
      window.location.pathname === '/reset-password'
    );

    if (isAuthenticated) {
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

  // Actualizar el chat al regresar a la app sin interrumpir la alarma de descanso.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleAppStateChange = ({ isActive }) => {
      if (isActive && isAuthenticated) useAppStore.getState().fetchUnreadChats?.();
    };

    const listener = CapApp.addListener('appStateChange', handleAppStateChange);

    return () => {
      listener.then(l => l.remove());
    };
  }, [isAuthenticated]);

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
