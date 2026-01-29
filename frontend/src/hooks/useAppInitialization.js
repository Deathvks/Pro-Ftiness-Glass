/* frontend/src/hooks/useAppInitialization.js */
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import useAppStore from '../store/useAppStore';

/**
 * Hook para gestionar la carga inicial de datos de la aplicación,
 * la redirección de vistas (ej. al workout activo o última vista),
 * la comprobación de modales y permisos nativos.
 * @param {object} props
 * @param {function} props.setView - Función para establecer la vista principal.
 * @param {function} props.setAuthView - Función para establecer la vista de autenticación.
 * @param {string} props.view - La vista actual.
 * @returns {object} - Estados y setters para los modales.
 */
export const useAppInitialization = ({ setView, setAuthView, view }) => {
  // Estado para la carga inicial
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Estado para los modales de verificación
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showCodeVerificationModal, setShowCodeVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Obtener estados y acciones de Zustand
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

  // Efecto 0: Sincronizar estado de cookies al montar
  useEffect(() => {
    checkCookieConsent();
  }, [checkCookieConsent]);

  // Efecto: Solicitar permisos de Cámara/Galería en Android al iniciar sesión
  useEffect(() => {
    const requestAndroidPermissions = async () => {
      // Solo ejecutar en plataforma nativa Android
      if (isAuthenticated && Capacitor.getPlatform() === 'android') {
        try {
          // Solicitamos permisos de cámara y lectura/escritura de fotos
          await Camera.requestPermissions();
        } catch (error) {
          console.warn('Error solicitando permisos de cámara en Android:', error);
        }
      }
    };

    requestAndroidPermissions();
  }, [isAuthenticated]);

  // Efecto 1: Carga de datos iniciales y redirección de vista
  useEffect(() => {
    const loadInitialDataAndSetView = async () => {
      await fetchInitialData(); 
      
      // Obtener los datos más frescos directamente del store
      const loadedUserProfile = useAppStore.getState().userProfile;
      const loadedActiveWorkout = useAppStore.getState().activeWorkout;
      
      let targetView = 'dashboard'; 
      
      if (loadedActiveWorkout) {
        targetView = 'workout'; 
      } else {
        const lastView = localStorage.getItem('lastView');
        
        // Si el usuario ya tiene perfil configurado (tiene 'goal'), evitamos restaurar vistas de onboarding
        if (loadedUserProfile?.goal) {
          if (lastView === 'adminPanel' && loadedUserProfile?.role !== 'admin') {
            targetView = 'dashboard'; 
          } else if (
            lastView &&
            lastView !== 'login' && 
            lastView !== 'register' && 
            lastView !== 'forgotPassword' && 
            lastView !== 'resetPassword' &&
            // FIX: Evitamos que lastView restaure el onboarding si ya completó el perfil
            lastView !== 'onboarding' &&
            lastView !== 'physicalProfileEditor'
          ) {
            targetView = lastView;
          }
        } else {
            // Si NO tiene goal, quizás sí deberíamos dejar que vaya a onboarding, 
            // o dejar que App.jsx maneje la redirección por falta de datos.
            // Por defecto dejamos dashboard y que el componente decida, o si lastView era onboarding.
            if (lastView === 'onboarding') targetView = 'onboarding';
        }
      }
      
      setView(targetView); // Establecer la vista inicial
      setIsInitialLoad(false); // Marcar la carga inicial como completada
    };

    if (isAuthenticated) {
      loadInitialDataAndSetView();
    } else {
      setIsInitialLoad(false); 
    }
  }, [isAuthenticated, fetchInitialData, setView]); 

  // Efecto 2: Comprobar verificación de email y modal de bienvenida
  useEffect(() => {
    if (isAuthenticated && userProfile && !isLoading) {
      if (!isInitialLoad) {
        const isVerifiedDefined = userProfile.is_verified !== undefined && userProfile.is_verified !== null;
        
        if (isVerifiedDefined && userProfile.is_verified === false) {
          setShowEmailVerificationModal(true);
          setVerificationEmail(userProfile.email);
        } else {
          setShowEmailVerificationModal(false);
        }
        
        checkWelcomeModal();
      }
    }
  }, [isAuthenticated, userProfile, isLoading, checkWelcomeModal, isInitialLoad]);

  // Efecto 3: Cargar datos del dashboard si la vista es 'dashboard'
  useEffect(() => {
      if (view === 'dashboard' && isAuthenticated) {
          const today = new Date().toISOString().split('T')[0];
          fetchDataForDate(today);
      }
  }, [view, isAuthenticated, fetchDataForDate]);

  // Efecto 4: Manejar la URL de /reset-password
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

  return {
    isInitialLoad,
    showEmailVerificationModal,
    setShowEmailVerificationModal,
    showCodeVerificationModal,
    setShowCodeVerificationModal,
    verificationEmail,
    setVerificationEmail,
  };
};