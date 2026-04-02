/* frontend/src/hooks/useAppInitialization.js */
import { useState, useEffect, useCallback } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
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

  // --- LÓGICA DE PERMISOS SECUENCIAL ---
  const checkAndRequestPermissions = useCallback(async () => {
    if (!isAuthenticated || Capacitor.getPlatform() !== 'android') return;

    let missing = '';

    // 1. Verificamos Cámara / Galería
    try {
      let camStatus = await Camera.checkPermissions();
      if (camStatus.camera === 'prompt' || camStatus.photos === 'prompt') {
        camStatus = await Camera.requestPermissions();
      }
      if (camStatus.camera === 'denied' || camStatus.photos === 'denied') {
        missing = 'Cámara / Galería';
      }
    } catch (e) { console.warn("Error cámara:", e); }

    // 2. Si la cámara está OK, verificamos Ubicación
    if (!missing) {
      try {
        let geoStatus = await Geolocation.checkPermissions();
        if (geoStatus.location === 'prompt') {
          geoStatus = await Geolocation.requestPermissions();
        }
        if (geoStatus.location === 'denied') {
          missing = 'Ubicación';
        }
      } catch (e) { console.warn("Error GPS:", e); }
    }

    // 3. Si ubicación está OK, verificamos Notificaciones
    if (!missing) {
      try {
        let notifStatus = await LocalNotifications.checkPermissions();
        if (notifStatus.display === 'prompt') {
          notifStatus = await LocalNotifications.requestPermissions();
        }
        if (notifStatus.display === 'denied') {
          missing = 'Notificaciones';
        }
      } catch (e) { console.warn("Error Notificaciones:", e); }
    }

    // Finalmente comprobamos si faltó alguno
    if (missing) {
      setMissingPermissionName(missing);
      setShowGlobalPermissionModal(true);
    } else {
      setShowGlobalPermissionModal(false);
      setMissingPermissionName('');
    }
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
        
        // Volvemos a comprobar los permisos por si el usuario viene de los ajustes de Android
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