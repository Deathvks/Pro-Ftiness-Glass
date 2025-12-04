/* frontend/src/hooks/useAppNavigation.js */
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook para gestionar el estado de navegación principal de la aplicación.
 * @param {boolean} isInitialLoad - Estado que indica si es la carga inicial de la app.
 */
export const useAppNavigation = (isInitialLoad) => {
  // Estado para la vista actual (ej: 'dashboard', 'routines')
  // Inicializamos el estado leyendo de localStorage para persistir la vista al recargar.
  // Si no hay nada guardado, usamos 'dashboard' por defecto.
  const [view, setView] = useState(() => {
    const savedView = localStorage.getItem('lastView');
    return savedView || 'dashboard';
  });

  // Estado para guardar la vista anterior (ej: para el botón 'atrás' de Perfil o Política)
  const [previousView, setPreviousView] = useState(null);

  // Referencia al contenedor principal para hacer scroll-to-top
  const mainContentRef = useRef(null);

  /**
   * Función de navegación estable (Callback).
   * Cambia la vista actual y guarda la anterior.
   */
  // --- INICIO DE LA MODIFICACIÓN ---
  // Corregimos la lógica de navigate para guardar correctamente la 'view' actual en 'previousView'.
  // Añadimos 'view' a las dependencias para tener acceso al valor actual.
  const navigate = useCallback((viewName, options = {}) => {
    // Opción para forzar una pestaña en la vista de Rutinas
    if (options.forceTab) {
      localStorage.setItem('routinesForceTab', options.forceTab);
    }

    // Solo actualizamos si la vista cambia
    if (view !== viewName) {
      setPreviousView(view); // Guardamos la vista actual (origen) antes de cambiar
      setView(viewName);     // Vamos a la nueva vista (destino)
    }
  }, [view]);
  // --- FIN DE LA MODIFICACIÓN ---

  /**
   * Callback para volver desde la Política de Privacidad a la vista anterior.
   */
  const handleBackFromPolicy = useCallback(() => {
    setPreviousView(currentPreviousView => {
      setView(currentPreviousView || 'dashboard'); // Vuelve a la anterior o a dashboard
      return null; // Limpia previousView
    });
  }, []);

  /**
   * Callback para volver desde el Perfil a la vista anterior.
   */
  const handleCancelProfile = useCallback(() => {
    setPreviousView(currentPreviousView => {
      setView(currentPreviousView || 'dashboard'); // Vuelve a la anterior o a dashboard
      return null; // Limpia previousView
    });
  }, []);

  /**
   * Callback para mostrar la Política de Privacidad.
   */
  const handleShowPolicy = useCallback(() => {
    navigate('privacyPolicy');
  }, [navigate]);

  // Efecto: Hacer scroll al inicio del contenido al cambiar de vista
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [view]);

  // Efecto: Guardar la última vista en localStorage
  useEffect(() => {
    // Guardamos la vista actual salvo si es la política de privacidad (para no recargar ahí)
    if (!isInitialLoad && view !== 'privacyPolicy') {
      localStorage.setItem('lastView', view);
    }
  }, [view, isInitialLoad]);

  return {
    view,
    setView,
    previousView,
    mainContentRef,
    navigate,
    handleBackFromPolicy,
    handleCancelProfile,
    handleShowPolicy,
  };
};