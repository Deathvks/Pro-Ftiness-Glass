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

      // 1. Clases CSS
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');
      if (theme === 'system') {
        root.classList.add(effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme');
      } else {
        root.classList.add(`${theme}-theme`);
      }

      // 2. Determinar color exacto
      let color = THEME_COLORS.dark;
      if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
      } else if (effectiveTheme === 'dark') {
        color = THEME_COLORS.dark;
      } else {
        color = THEME_COLORS.light;
      }

      // 3. Aplicar color al fondo
      root.style.backgroundColor = color;
      document.body.style.backgroundColor = color;

      // 4. GESTIÓN DE META TAGS (FIX IOS SAFARI)
      // Usamos un pequeño timeout para dar tiempo a Safari a procesar el cambio de renderizado
      // del cuerpo antes de forzar la actualización de la interfaz del navegador.
      setTimeout(() => {
        const metaTags = document.querySelectorAll('meta[name="theme-color"]');
        metaTags.forEach(m => m.remove());

        const newMeta = document.createElement('meta');
        newMeta.name = "theme-color";
        newMeta.content = color;
        document.head.appendChild(newMeta);
      }, 50); // 50ms de delay
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