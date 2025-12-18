/* frontend/src/hooks/useAppTheme.js */
import { useState, useLayoutEffect } from 'react'; // Usamos useLayoutEffect para cambios visuales inmediatos
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

  // --- EFECTO PRINCIPAL: Gestión de DOM y Meta Tags ---
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

      // 2. Determinar color
      let color = THEME_COLORS.dark;
      if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
      } else if (effectiveTheme === 'dark') {
        color = THEME_COLORS.dark;
      } else {
        color = THEME_COLORS.light;
      }

      // 3. Aplicar color al fondo del HTML (Cubre el rebote de iOS)
      root.style.backgroundColor = color;

      // 4. GESTIÓN DIRECTA DE META TAGS
      // Eliminamos cualquier etiqueta existente para forzar al navegador a leer la nueva
      const oldMetas = document.querySelectorAll('meta[name="theme-color"]');
      oldMetas.forEach(m => m.remove());

      const metaTheme = document.createElement('meta');
      metaTheme.name = "theme-color";
      metaTheme.content = color;
      document.head.appendChild(metaTheme);

      // IMPORTANTE: NO cambiamos 'apple-mobile-web-app-status-bar-style' dinámicamente.
      // Dejamos que iOS decida el color del texto (blanco/negro) basándose en el 'theme-color' de arriba.
      // Esto evita el bug de que la barra se quede "congelada" al cambiar de tema.
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