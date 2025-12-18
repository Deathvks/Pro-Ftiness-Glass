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

      // 1. Determinar el color HEX exacto
      let color = THEME_COLORS.dark;
      if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
      } else if (effectiveTheme === 'dark') {
        color = THEME_COLORS.dark;
      } else {
        color = THEME_COLORS.light;
      }

      // 2. Clases CSS
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');
      if (theme === 'system') {
        root.classList.add(effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme');
      } else {
        root.classList.add(`${theme}-theme`);
      }

      // 3. FIX CRÍTICO SAFARI IOS: Sincronización de fondo
      // Es vital actualizar el background del body y root para que Safari
      // recoja el color correcto en los rebotes de scroll y áreas seguras.
      root.style.backgroundColor = color;
      document.body.style.backgroundColor = color;

      // 4. ACTUALIZACIÓN META TAGS (SIN RECREAR DOM)
      // En lugar de eliminar y crear elementos (que puede desconectar el binding del navegador),
      // actualizamos los atributos existentes. Esto es más estable y rápido.

      // A) theme-color (Barra de direcciones / Estado)
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = "theme-color";
        document.head.appendChild(metaTheme);
      }
      if (metaTheme.getAttribute('content') !== color) {
        metaTheme.setAttribute('content', color);
      }

      // B) apple-mobile-web-app-status-bar-style (PWA / Standalone)
      let metaStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!metaStatus) {
        metaStatus = document.createElement('meta');
        metaStatus.name = "apple-mobile-web-app-status-bar-style";
        document.head.appendChild(metaStatus);
      }

      // 'default' = Texto negro (fondo claro)
      // 'black-translucent' = Texto blanco sobre fondo del body (dark/oled)
      const statusStyle = effectiveTheme === 'light' ? 'default' : 'black-translucent';
      if (metaStatus.getAttribute('content') !== statusStyle) {
        metaStatus.setAttribute('content', statusStyle);
      }
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