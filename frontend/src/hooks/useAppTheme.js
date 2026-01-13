/* frontend/src/hooks/useAppTheme.js */
import { useState, useLayoutEffect } from 'react';
import useAppStore from '../store/useAppStore';

const THEME_COLORS = {
  oled: '#000000',
  dark: '#0c111b',
  light: '#f7fafc',
};

export const useAppTheme = () => {
  // Asumimos que cookieConsent está disponible en el store
  const cookieConsent = useAppStore(state => state.cookieConsent);

  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'system';
    }
    return 'system';
  });

  const [accent, setAccentState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accent') || 'green';
    }
    return 'green';
  });

  const setTheme = (newTheme) => {
    if (cookieConsent) {
      localStorage.setItem('theme', newTheme);
    }
    setThemeState(newTheme);
  };

  const setAccent = (newAccent) => {
    if (cookieConsent) {
      localStorage.setItem('accent', newAccent);
    }
    setAccentState(newAccent);
  };

  // --- EFECTO PRINCIPAL DE TEMA (Lógica iOS/Android) ---
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;
    const body = document.body;

    const updateAppearance = () => {
      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      // 1. Determinar Color HEX exacto
      let color = THEME_COLORS.dark;
      if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
      } else if (effectiveTheme === 'dark') {
        color = THEME_COLORS.dark;
      } else {
        color = THEME_COLORS.light;
      }

      // 2. FIX CRÍTICO: Bloquear transiciones temporalmente
      // Evita que Safari/Chrome capturen el color 'intermedio' de la transición CSS en la barra de estado.
      const originalTransitionBody = body.style.transition;
      const originalTransitionRoot = root.style.transition;

      body.style.transition = 'none';
      root.style.transition = 'none';

      // 3. Aplicar Clases CSS al ROOT
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');
      if (theme === 'system') {
        root.classList.add(effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme');
      } else {
        root.classList.add(`${theme}-theme`);
      }

      // 4. Sincronización agresiva del fondo (Background)
      root.style.backgroundColor = color;
      body.style.backgroundColor = color;

      // Forzar Reflow (Repintado) para asegurar que el navegador procese el cambio 'sin transición'
      // eslint-disable-next-line no-unused-expressions
      body.offsetHeight;

      // 5. GESTIÓN DE META TAGS (Estrategia de Destrucción/Recreación)
      // Esta estrategia fuerza a Safari y WebViews de Android a repintar la barra de estado/navegación.

      // A) theme-color (Color de la barra de navegación en Android y barra de estado en nuevos iOS)
      const metaName = "theme-color";
      let metaTheme = document.querySelector(`meta[name="${metaName}"]`);
      if (metaTheme) {
        metaTheme.remove();
      }
      metaTheme = document.createElement('meta');
      metaTheme.name = metaName;
      metaTheme.content = color;
      document.head.appendChild(metaTheme);

      // B) apple-mobile-web-app-status-bar-style (iOS Legacy y PWA)
      // 'default' = texto negro (para fondos claros)
      // 'black-translucent' = texto blanco sobre fondo (para oscuros/oled)
      const statusStyle = effectiveTheme === 'light' ? 'default' : 'black-translucent';
      const metaStatusName = "apple-mobile-web-app-status-bar-style";
      let metaStatus = document.querySelector(`meta[name="${metaStatusName}"]`);

      // Solo recreamos si el valor cambia para evitar parpadeos innecesarios en algunos dispositivos
      if (!metaStatus || metaStatus.getAttribute('content') !== statusStyle) {
        if (metaStatus) metaStatus.remove();
        metaStatus = document.createElement('meta');
        metaStatus.name = metaStatusName;
        metaStatus.content = statusStyle;
        document.head.appendChild(metaStatus);
      }

      // 6. Restaurar transiciones (breve delay para permitir que el motor de renderizado termine)
      setTimeout(() => {
        body.style.transition = ''; // Volver al CSS definido en index.css
        root.style.transition = '';
      }, 50);
    };

    updateAppearance();

    const handleSystemChange = () => {
      if (theme === 'system') updateAppearance();
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  // --- EFECTO DE ACENTO ---
  useLayoutEffect(() => {
    const root = document.documentElement;
    // Reemplaza cualquier clase accent-* existente
    const classes = root.className.split(' ').filter(c => !c.startsWith('accent-'));
    root.className = classes.join(' ') + ` accent-${accent}`;
  }, [accent]);

  return { theme, setTheme, accent, setAccent };
};