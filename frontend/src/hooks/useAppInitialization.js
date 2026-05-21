/* frontend/src/hooks/useAppInitialization.js */
import { useState, useEffect, useCallback } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import useAppStore from '../store/useAppStore';

const NativeTimer = Capacitor.isNativePlatform() ? registerPlugin('NativeTimer') : null;

export const useAppInitialization = ({ setView, setAuthView, view }) => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
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
  } = useAppStore(state => ({
    isAuthenticated: state.isAuthenticated,
    userProfile: state.userProfile,
    isLoading: state.isLoading,
    fetchInitialData: state.fetchInitialData,
    checkWelcomeModal: state.checkWelcomeModal,
    fetchDataForDate: state.fetchDataForDate,
    checkCookieConsent: state.checkCookieConsent,
  }));

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
    const loadInitialDataAndSetView = async () => {
      await fetchInitialData(); 
      
      const loadedUserProfile = useAppStore.getState().userProfile;
      const loadedActiveWorkout = useAppStore.getState().activeWorkout;
      
      let targetView = 'dashboard'; 
      
      if (loadedActiveWorkout) {
        targetView = 'workout'; 
      } else {
        const lastView = localStorage.getItem('lastView');
        
        if (loadedUserProfile?.goal) {
          if (lastView === 'adminPanel' && loadedUserProfile?.role !== 'admin') {
            targetView = 'dashboard'; 
          } else if (
            lastView &&
            !['login', 'register', 'forgotPassword', 'resetPassword', 'onboarding', 'physicalProfileEditor'].includes(lastView)
          ) {
            targetView = lastView;
          }
        } else {
            if (lastView === 'onboarding') targetView = 'onboarding';
        }
      }
      
      setView(targetView);
      setIsInitialLoad(false);
    };

    if (isAuthenticated) {
      loadInitialDataAndSetView();
    } else {
      setIsInitialLoad(false); 
    }
  }, [isAuthenticated, fetchInitialData, setView]); 

  useEffect(() => {
    if (isAuthenticated && userProfile && !isLoading && !isInitialLoad) {
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