/* frontend/src/hooks/useAppTheme.js */
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

// Definimos los colores fuera para reutilizarlos y asegurar consistencia con index.html/css
const THEME_COLORS = {
  oled: '#000000',
  dark: '#0c111b',
  light: '#f7fafc',
};

export const useAppTheme = () => {
  const cookieConsent = useAppStore(state => state.cookieConsent);

  // 1. Inicialización de estado del tema (desde localStorage o system)
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

  // Helper para resolver el tema efectivo (system -> light/dark)
  const getEffectiveTheme = (currentTheme) => {
    if (currentTheme === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return currentTheme;
  };

  // 2. Estados calculados para Helmet (Meta Tags)
  const [themeColor, setThemeColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'system';
      const effective = getEffectiveTheme(savedTheme);
      return THEME_COLORS[effective] || THEME_COLORS.dark;
    }
    return THEME_COLORS.dark;
  });

  const [statusBarStyle, setStatusBarStyle] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'system';
      const effective = getEffectiveTheme(savedTheme);

      // CORRECCIÓN: Usar 'black-translucent' también para modo Dark.
      // Esto hace que la barra sea transparente y se vea el fondo azulado (#0c111b)
      // en lugar de forzar una barra negra sólida.
      if (effective === 'oled' || effective === 'dark') {
        return 'black-translucent';
      }
      return 'default'; // Light mode se queda en default (texto negro)
    }
    return 'default';
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

  // Efecto Principal: Clases CSS, Inline Styles y Meta Tags
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const updateAppearance = () => {
      const effectiveTheme = getEffectiveTheme(theme);

      // 1. Aplicar Clases CSS al Root
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');

      if (theme === 'system') {
        root.classList.add(effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme');
      } else {
        root.classList.add(`${theme}-theme`);
      }

      // 2. Calcular valores
      let color = THEME_COLORS.dark;
      let barStyle = 'default';

      if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
        barStyle = 'black-translucent';
      } else if (effectiveTheme === 'dark') {
        color = THEME_COLORS.dark;
        // FIX: Dark también usa black-translucent para ver el fondo real
        barStyle = 'black-translucent';
      } else {
        // Light
        color = THEME_COLORS.light;
        barStyle = 'default';
      }

      // 3. Actualizar estado (Helmet se encarga de las meta tags)
      setThemeColor(color);
      setStatusBarStyle(barStyle);

      // 4. Actualizar el inline-style background-color
      root.style.backgroundColor = color;
    };

    updateAppearance();

    const handleSystemChange = () => {
      if (theme === 'system') {
        updateAppearance();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  // Efecto Secundario: Color de Acento
  useEffect(() => {
    const root = document.documentElement;
    const classes = root.className.split(' ').filter(c => !c.startsWith('accent-'));
    root.className = classes.join(' ') + ` accent-${accent}`;
  }, [accent]);

  return { theme, setTheme, accent, setAccent, themeColor, statusBarStyle };
};