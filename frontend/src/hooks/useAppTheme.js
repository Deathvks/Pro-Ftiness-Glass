/* frontend/src/hooks/useAppTheme.js */
import { useState, useLayoutEffect } from 'react';
import useAppStore from '../store/useAppStore';

const THEME_COLORS = {
  oled: '#000000',
  dark: '#0c111b',
  light: '#f7fafc',
};

export const useAppTheme = () => {
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

  // --- EFECTO PRINCIPAL ---
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const updateAppearance = () => {
      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      // 1. Clases CSS (Visuales)
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');
      if (theme === 'system') {
        root.classList.add(effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme');
      } else {
        root.classList.add(`${theme}-theme`);
      }

      // 2. LIMPIEZA DE ESTILOS INLINE (Mantenemos esto para que el CSS funcione bien)
      root.style.removeProperty('background-color');
      document.body.style.removeProperty('background-color');

      // 3. Determinar color exacto para la interfaz de iOS
      let color = THEME_COLORS.dark;
      if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
      } else if (effectiveTheme === 'dark') {
        color = THEME_COLORS.dark;
      } else {
        color = THEME_COLORS.light;
      }

      // 4. ACTUALIZACIÓN META TAGS (FIX IOS SAFARI & CHROME MOBILE)
      // En lugar de borrar y crear (que puede causar parpadeos o ser ignorado),
      // buscamos la etiqueta y actualizamos su atributo 'content' directamente.

      // A) theme-color (Barra de direcciones / Estado en navegador)
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = "theme-color";
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', color);

      // B) apple-mobile-web-app-status-bar-style (Standalone / PWA)
      // Ajustamos también este valor para mayor consistencia en iOS
      let metaStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!metaStatus) {
        metaStatus = document.createElement('meta');
        metaStatus.name = "apple-mobile-web-app-status-bar-style";
        document.head.appendChild(metaStatus);
      }
      // 'default' es blanco/gris (texto negro), 'black' es negro (texto blanco)
      metaStatus.setAttribute('content', effectiveTheme === 'light' ? 'default' : 'black');
    };

    updateAppearance();

    const handleSystemChange = () => {
      if (theme === 'system') updateAppearance();
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  // Efecto Acento
  useLayoutEffect(() => {
    const root = document.documentElement;
    const classes = root.className.split(' ').filter(c => !c.startsWith('accent-'));
    root.className = classes.join(' ') + ` accent-${accent}`;
  }, [accent]);

  return { theme, setTheme, accent, setAccent };
};