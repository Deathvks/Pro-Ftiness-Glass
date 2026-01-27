/* frontend/src/hooks/useAppInitialization.js */
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Hook para gestionar la carga inicial de datos de la aplicación,
 * la redirección de vistas (ej. al workout activo o última vista),
 * y la comprobación de modales (verificación de email, bienvenida).
 * @param {object} props
 * @param {function} props.setView - Función para establecer la vista principal (de useAppNavigation).
 * @param {function} props.setAuthView - Función para establecer la vista de autenticación.
 * @param {string} props.view - La vista actual (para cargar datos del dashboard).
 * @returns {object} - Estados y setters para los modales de verificación y el estado de carga.
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

  // Efecto 0: Sincronizar estado de cookies al montar el hook (inicio de la app)
  useEffect(() => {
    checkCookieConsent();
  }, [checkCookieConsent]);

  // Efecto 1: Carga de datos iniciales y redirección de vista
  useEffect(() => {
    const loadInitialDataAndSetView = async () => {
      await fetchInitialData(); 
      
      // Obtener los datos más frescos *después* del fetch
      const loadedUserProfile = useAppStore.getState().userProfile;
      const loadedActiveWorkout = useAppStore.getState().activeWorkout;
      
      let targetView = 'dashboard'; 
      if (loadedActiveWorkout) {
        targetView = 'workout'; 
      } else {
        const lastView = localStorage.getItem('lastView');
        if (lastView && loadedUserProfile?.goal) {
          if (lastView === 'adminPanel' && loadedUserProfile?.role !== 'admin') {
            targetView = 'dashboard'; 
          } else if (lastView !== 'login' && lastView !== 'register' && lastView !== 'forgotPassword' && lastView !== 'resetPassword') {
            targetView = lastView;
          }
        }
      }
      
      setView(targetView); // Establecer la vista inicial
      setIsInitialLoad(false); // Marcar la carga inicial como completada
    };

    if (isAuthenticated) {
      loadInitialDataAndSetView();
    } else {
      setIsInitialLoad(false); // Si no está auth, solo marcar la carga como completada
    }
  }, [isAuthenticated, fetchInitialData, setView]); 

  // Efecto 2: Comprobar verificación de email y modal de bienvenida
  useEffect(() => {
    if (isAuthenticated && userProfile && !isLoading) {
      // Esperar a que termine la carga inicial para verificar el estado del email.
      if (!isInitialLoad) {
        // CORRECCIÓN: Comprobación estricta para evitar el parpadeo.
        // Solo mostramos el modal si el campo existe y es explícitamente false.
        // Si es undefined (aún no cargado del todo), asumimos que está bien por ahora.
        const isVerifiedDefined = userProfile.is_verified !== undefined && userProfile.is_verified !== null;
        
        if (isVerifiedDefined && userProfile.is_verified === false) {
          setShowEmailVerificationModal(true);
          setVerificationEmail(userProfile.email);
        } else {
          // Si es true, o undefined, aseguramos que el modal esté cerrado
          setShowEmailVerificationModal(false);
        }
        
        // Comprobar si se debe mostrar el modal de bienvenida
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
    handleUrlChange(); // Comprobar al cargar
    window.addEventListener('popstate', handleUrlChange); // Escuchar cambios de historial
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [isAuthenticated, setAuthView]); 

  // Retornar los estados y setters que App.jsx necesitará
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