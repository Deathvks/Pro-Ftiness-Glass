/* frontend/src/hooks/useAppTheme.js */
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Hook para gestionar el tema y calcular los colores de la interfaz.
 * Delega la renderización de meta tags a App.jsx (Helmet).
 */
export const useAppTheme = () => {
  const cookieConsent = useAppStore(state => state.cookieConsent);

  // Inicialización de estado
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

  // Estados calculados para Helmet (Meta Tags)
  // Inicializamos con un valor seguro (Dark por defecto)
  const [themeColor, setThemeColor] = useState('#0c111b');
  const [statusBarStyle, setStatusBarStyle] = useState('default');

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

  // Efecto Principal: Clases CSS y Cálculo de Colores
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const updateAppearance = () => {
      let effectiveTheme = theme;

      // Resolver tema del sistema
      if (theme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      // 1. Aplicar Clases CSS al Root
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');

      if (theme === 'system') {
        root.classList.add(effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme');
      } else {
        root.classList.add(`${theme}-theme`);
      }

      // 2. Calcular valores para Helmet (Meta Tags)
      // Ajustamos los colores HEX para que coincidan EXACTAMENTE con las variables --bg-primary de index.css
      if (effectiveTheme === 'oled') {
        // OLED: Negro puro (#000000)
        setThemeColor('#000000');
        setStatusBarStyle('black-translucent');
      } else if (effectiveTheme === 'dark') {
        // DARK: Color de fondo primario (#0c111b)
        // Antes estaba #121826, que es gris azulado. Ahora coincide con el fondo.
        setThemeColor('#0c111b');
        setStatusBarStyle('default');
      } else {
        // LIGHT: Color de fondo primario (#f7fafc)
        // Antes estaba #ffffff. Ahora coincide con el fondo real.
        setThemeColor('#f7fafc');
        setStatusBarStyle('default');
      }
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