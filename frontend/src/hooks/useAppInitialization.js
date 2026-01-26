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
    checkCookieConsent, // --- AÑADIDO: Acción para sincronizar cookies
  } = useAppStore(state => ({
    isAuthenticated: state.isAuthenticated,
    userProfile: state.userProfile,
    isLoading: state.isLoading,
    fetchInitialData: state.fetchInitialData,
    checkWelcomeModal: state.checkWelcomeModal,
    fetchDataForDate: state.fetchDataForDate,
    checkCookieConsent: state.checkCookieConsent, // --- AÑADIDO
  }));

  // Efecto 0: Sincronizar estado de cookies al montar el hook (inicio de la app)
  // Esto asegura que el banner se muestre o no correctamente según localStorage
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
        // Verificación de seguridad: si hay lastView pero el usuario no tiene objetivo (nuevo usuario),
        // la lógica en App.jsx se encargará de mostrar Onboarding, aquí solo definimos el target por defecto.
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
  }, [isAuthenticated, fetchInitialData, setView]); // Dependencias

  // Efecto 2: Comprobar verificación de email y modal de bienvenida
  useEffect(() => {
    if (isAuthenticated && userProfile && !isLoading) {
      // Comprobar si el email está verificado
      if (!userProfile.is_verified) {
        setShowEmailVerificationModal(true);
        setVerificationEmail(userProfile.email);
      }
      // Comprobar si se debe mostrar el modal de bienvenida
      if (!isInitialLoad) { 
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
  }, [isAuthenticated, setAuthView]); // Dependencias

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