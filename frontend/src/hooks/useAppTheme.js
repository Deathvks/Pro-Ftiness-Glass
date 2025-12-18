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

      // 1. Determinar el color HEX exacto ANTES de aplicarlo.
      // iOS 26 necesita el valor hexadecimal preciso para la barra de estado.
      let color = THEME_COLORS.dark;
      if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
      } else if (effectiveTheme === 'dark') {
        color = THEME_COLORS.dark;
      } else {
        color = THEME_COLORS.light;
      }

      // 2. Clases CSS (Para el estilo interno de la app)
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');
      if (theme === 'system') {
        root.classList.add(effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme');
      } else {
        root.classList.add(`${theme}-theme`);
      }

      // 3. FIX CRÍTICO IOS 26.2 (SAFARI LIQUID GLASS)
      // Safari usa el 'background-color' del body para calcular el tinte de la barra inferior
      // cuando es transparente. Si solo cambiamos la clase CSS, el motor de renderizado
      // a veces no repinta la interfaz del navegador ("chrome") inmediatamente.
      // Forzamos el estilo inline para asegurar la sincronización.
      root.style.backgroundColor = color;
      document.body.style.backgroundColor = color;

      // 4. FORZAR RE-RENDER DE META TAGS (ISLA DINÁMICA)
      // En lugar de actualizar el atributo 'content', borramos y recreamos las etiquetas.
      // Esto obliga a Safari a leer de nuevo la configuración de color.

      // A) theme-color (Barra de direcciones / Estado)
      const existingMetaTheme = document.querySelector('meta[name="theme-color"]');
      if (existingMetaTheme) {
        existingMetaTheme.remove();
      }

      const newMetaTheme = document.createElement('meta');
      newMetaTheme.name = "theme-color";
      newMetaTheme.content = color;
      document.head.appendChild(newMetaTheme);

      // B) apple-mobile-web-app-status-bar-style (PWA / Standalone)
      // iOS 26 maneja esto de forma distinta para el modo oscuro/oled.
      const existingMetaStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (existingMetaStatus) {
        existingMetaStatus.remove();
      }

      const newMetaStatus = document.createElement('meta');
      newMetaStatus.name = "apple-mobile-web-app-status-bar-style";
      // 'default' = Texto negro (para fondo claro)
      // 'black-translucent' = Texto blanco y fondo que permite ver el color del body (para dark/oled)
      newMetaStatus.content = effectiveTheme === 'light' ? 'default' : 'black-translucent';
      document.head.appendChild(newMetaStatus);
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