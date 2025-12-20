/* frontend/src/hooks/useAppNavigation.js */
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook para gestionar el estado de navegación principal de la aplicación.
 * Prioriza siempre la URL actual sobre el estado guardado para soportar recargas (F5).
 */
export const useAppNavigation = (isInitialLoad) => {
  // 1. Inicialización basada estrictamente en la URL
  const [view, setView] = useState(() => {
    const path = window.location.pathname;

    // Rutas Deep Linking (Prioridad Alta)
    if (path.match(/^\/profile\/\d+$/)) return 'publicProfile';
    if (path === '/social') return 'social';
    if (path === '/nutrition') return 'nutrition';
    if (path === '/routines') return 'routines';
    if (path === '/progress') return 'progress';
    if (path === '/settings') return 'settings';
    if (path === '/notifications') return 'notifications';

    // Fallback a LocalStorage solo si no hay ruta específica
    const savedView = localStorage.getItem('lastView');
    return savedView || 'dashboard';
  });

  // 2. Estado para parámetros (ej: ID de usuario)
  const [navParams, setNavParams] = useState(() => {
    const path = window.location.pathname;
    const profileMatch = path.match(/^\/profile\/(\d+)$/);
    if (profileMatch) {
      return { userId: profileMatch[1] };
    }
    return {};
  });

  const [previousView, setPreviousView] = useState(null);
  const mainContentRef = useRef(null);

  // --- SEGURIDAD ANTI-REDIRECCIÓN ---
  // Este efecto corrige la vista si la app intenta mandarte al dashboard 
  // pero la URL dice que deberías estar en un perfil o social.
  useEffect(() => {
    const path = window.location.pathname;

    // Caso: Estamos en perfil por URL, pero la vista interna cambió (ej: por auth)
    const profileMatch = path.match(/^\/profile\/(\d+)$/);
    if (profileMatch) {
      if (view !== 'publicProfile' || navParams.userId !== profileMatch[1]) {
        setView('publicProfile');
        setNavParams({ userId: profileMatch[1] });
      }
    }
    // Caso: Estamos en social por URL
    else if (path === '/social' && view !== 'social') {
      setView('social');
    }
  }, [view, navParams.userId]);
  // -----------------------------------

  // Función de navegación principal
  const navigate = useCallback((viewName, options = {}) => {
    if (options.forceTab) {
      localStorage.setItem('routinesForceTab', options.forceTab);
    }

    // Gestión de parámetros
    if (options.userId) {
      setNavParams({ userId: options.userId });
    } else if (viewName !== 'publicProfile') {
      // Limpiamos params si no los necesitamos
      setNavParams({});
    }

    if (view !== viewName || (viewName === 'publicProfile' && options.userId !== navParams.userId)) {
      setPreviousView(view);
      setView(viewName);

      // Actualización de URL (History API)
      let newPath = '/';
      switch (viewName) {
        case 'dashboard': newPath = '/'; break;
        case 'publicProfile':
          const targetId = options.userId || navParams.userId;
          if (targetId) newPath = `/profile/${targetId}`;
          break;
        default: newPath = `/${viewName}`; break;
      }

      if (window.location.pathname !== newPath) {
        window.history.pushState({ view: viewName }, '', newPath);
      }
    }
  }, [view, navParams]);

  // Handlers auxiliares
  const handleBackFromPolicy = useCallback(() => {
    setPreviousView(current => {
      const next = current || 'dashboard';
      navigate(next);
      return null;
    });
  }, [navigate]);

  const handleCancelProfile = useCallback(() => {
    setPreviousView(current => {
      const next = current || 'dashboard';
      navigate(next);
      return null;
    });
  }, [navigate]);

  const handleShowPolicy = useCallback(() => {
    navigate('privacyPolicy');
  }, [navigate]);

  // Scroll to top
  useEffect(() => {
    if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
  }, [view]);

  // Persistencia simple (excluyendo rutas dinámicas para evitar errores de estado obsoleto)
  useEffect(() => {
    if (!isInitialLoad && view !== 'privacyPolicy' && view !== 'publicProfile') {
      localStorage.setItem('lastView', view);
    }
  }, [view, isInitialLoad]);

  // Manejo de botones Atrás/Adelante del navegador
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const profileMatch = path.match(/^\/profile\/(\d+)$/);

      if (profileMatch) {
        setView('publicProfile');
        setNavParams({ userId: profileMatch[1] });
      } else if (path === '/social') {
        setView('social');
      } else if (path === '/nutrition') {
        setView('nutrition');
      } else if (path === '/routines') {
        setView('routines');
      } else if (path === '/progress') {
        setView('progress');
      } else if (path === '/settings') {
        setView('settings');
      } else if (path === '/notifications') {
        setView('notifications');
      } else {
        setView('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    view,
    setView,
    navParams,
    previousView,
    mainContentRef,
    navigate,
    handleBackFromPolicy,
    handleCancelProfile,
    handleShowPolicy,
  };
};