/* frontend/src/hooks/useAppNavigation.js */
import { useState, useCallback, useEffect, useRef } from 'react';

export const useAppNavigation = (externalPath) => {
  // 1. Inicialización de estado
  const [view, setView] = useState(() => {
    // PRIORIDAD 0: Recuperar sesión activa de cardio si existe en localStorage
    const savedSession = localStorage.getItem('active_cardio_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        // Solo restauramos si la sesión no ha finalizado
        if (parsed && parsed.status !== 'finished') {
          return 'active-cardio';
        }
      } catch (e) {
        console.error("Error parseando sesión guardada", e);
      }
    }

        const path = externalPath || window.location.pathname;

    const validPaths = [
      '/', '/login', '/register', '/forgot-password', '/forgotPassword', '/reset-password', '/privacy', '/terms',
      '/dashboard', '/progress', '/routines', '/workout', '/nutrition',
      '/social', '/hub', '/quickCardio', '/active-cardio', '/settings', '/appearance',
      '/support', '/socialLinks', '/challenges', '/physicalProfileEditor', '/profile',
      '/adminPanel', '/securityDashboard', '/trainerPanel', '/twoFactorSetup', '/notifications',
      '/asesoria', '/noticias'
    ];

    if (!validPaths.includes(path) && !path.match(/^\/profile\/\d+$/) && !path.startsWith('/share/routine/') && !path.startsWith('/noticias')) {
        return 'not-found';
    }

    // Rutas Deep Linking
    if (path.match(/^\/profile\/\d+$/)) return 'publicProfile';
    if (path === '/social') return 'social';
    if (path === '/nutrition') return 'nutrition';
    if (path === '/routines') return 'routines';
    if (path === '/progress') return 'progress';
    if (path === '/settings') return 'settings';
    if (path === '/notifications') return 'notifications';
    if (path === '/active-cardio') return 'active-cardio';
    if (path === '/asesoria') return 'asesoria';
    if (path === '/noticias') return 'noticias';

    const savedView = localStorage.getItem('lastView');
    return savedView || 'dashboard';
  });

  // 2. Estado para parámetros
  const [navParams, setNavParams] = useState(() => {
    // PRIORIDAD 0: Params de sesión activa
    const savedSession = localStorage.getItem('active_cardio_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.activityId) {
          return { activityId: parsed.activityId };
        }
      } catch (e) { /* ignore */ }
    }

    const path = externalPath || window.location.pathname;
    const profileMatch = path.match(/^\/profile\/(\d+)$/);
    if (profileMatch) {
      return { userId: profileMatch[1] };
    }

    if (window.history.state && window.history.state.params) {
      return window.history.state.params;
    }
    return {};
  });

  const [previousView, setPreviousView] = useState(null);
  const mainContentRef = useRef(null);

  // --- SEGURIDAD ANTI-REDIRECCIÓN ---
  useEffect(() => {
    const path = externalPath || window.location.pathname;
    const profileMatch = path.match(/^\/profile\/(\d+)$/);

    // Si detectamos que hay una sesión activa en localStorage pero no estamos en la vista, forzamos
    const savedSession = localStorage.getItem('active_cardio_session');
    if (savedSession && view !== 'active-cardio') {
      // Doble check por si acaso
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.status !== 'finished') {
          setView('active-cardio');
          setNavParams({ activityId: parsed.activityId });
          return;
        }
      } catch (e) { }
    }

    if (profileMatch) {
      if (view !== 'publicProfile' || navParams.userId !== profileMatch[1]) {
        setView('publicProfile');
        setNavParams({ userId: profileMatch[1] });
      }
    }
    else if (path === '/social' && view !== 'social') {
      setView('social');
    }
    else if (path === '/settings' && view !== 'settings') {
      setView('settings');
      const searchHighlight = new URLSearchParams(window.location.search).get('highlight');
      if (searchHighlight) {
        setNavParams(prev => ({ ...prev, highlight: searchHighlight }));
      }
    }
    else if (path === '/workout' && view !== 'workout') {
      setView('workout');
    }
    else if (path === '/asesoria' && view !== 'asesoria') {
      setView('asesoria');
    }
    else if (path === '/noticias' && view !== 'noticias') {
      setView('noticias');
    }
    else if ((path === '/' || path === '/dashboard') && view !== 'dashboard' && view !== 'active-cardio') {
      setView('dashboard');
    }
    else if (path === '/hub' && view !== 'hub') {
      setView('hub');
    }
    else if (path === '/progress' && view !== 'progress') {
      setView('progress');
    }
    else if (path === '/routines' && view !== 'routines') {
      setView('routines');
    }
    else if (path === '/nutrition' && view !== 'nutrition') {
      setView('nutrition');
    }
    else if (path === '/trainerPanel' && view !== 'trainerPanel') {
      setView('trainerPanel');
    }
    else if (path === '/adminPanel' && view !== 'adminPanel') {
      setView('adminPanel');
    }
  }, [view, navParams.userId, externalPath]);

  // Función de navegación principal
  const navigate = useCallback((viewName, options = {}) => {
    if (options.forceTab) {
      localStorage.setItem('routinesForceTab', options.forceTab);
    }

    setNavParams(options);

    if (view !== viewName || (viewName === 'publicProfile' && options.userId !== navParams.userId)) {
      setPreviousView(view);
      setView(viewName);

      let newPath = '/';
      switch (viewName) {
        case 'dashboard': newPath = '/'; break;
        case 'publicProfile':
          const targetId = options.userId || navParams.userId;
          if (targetId) newPath = `/profile/${targetId}`;
          break;
        case 'active-cardio':
          newPath = '/active-cardio';
          break;
        default: newPath = `/${viewName}`; break;
      }

      if (window.location.pathname !== newPath) {
        window.history.pushState({ view: viewName, params: options }, '', newPath);
      }
    }
  }, [view, navParams]);

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

  

  useEffect(() => {
    if (!isInitialLoad && view !== 'privacyPolicy' && view !== 'publicProfile' && view !== 'active-cardio') {
      localStorage.setItem('lastView', view);
    }
  }, [view, isInitialLoad]);

  // Manejo de botones Atrás/Adelante del navegador
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    const handlePopState = (event) => {
      const path = externalPath || window.location.pathname;
      const profileMatch = path.match(/^\/profile\/(\d+)$/);

      if (event.state && event.state.params) {
        setNavParams(event.state.params);
      }

      if (profileMatch) {
        setView('publicProfile');
        setNavParams(prev => ({ ...prev, userId: profileMatch[1] }));
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
        const searchHighlight = new URLSearchParams(window.location.search).get('highlight');
        if (searchHighlight) {
          setNavParams(prev => ({ ...prev, highlight: searchHighlight }));
        }
      } else if (path === '/notifications') {
        setView('notifications');
      } else if (path === '/active-cardio') {
        setView('active-cardio');
      } else if (path === '/workout') {
        setView('workout');
      } else if (path === '/asesoria') {
        setView('asesoria');
      } else if (path === '/noticias') {
        setView('noticias');
    }
    else if ((path === '/' || path === '/dashboard') && view !== 'dashboard' && view !== 'active-cardio') {
      setView('dashboard');
    }
    else if (path === '/hub' && view !== 'hub') {
      setView('hub');
    }
    else if (path === '/progress' && view !== 'progress') {
      setView('progress');
    }
    else if (path === '/routines' && view !== 'routines') {
      setView('routines');
    }
    else if (path === '/nutrition' && view !== 'nutrition') {
      setView('nutrition');
    }
    else if (path === '/trainerPanel' && view !== 'trainerPanel') {
      setView('trainerPanel');
    }
    else if (path === '/adminPanel' && view !== 'adminPanel') {
      setView('adminPanel');
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
