/* frontend/src/hooks/useAppTheme.js */
import { useState, useLayoutEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { NavigationBar } from '@capgo/capacitor-navigation-bar'; // <--- CORRECCIÓN IMPORT
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

  // Estado para el tema resuelto (el que realmente se ve: light/dark/oled)
  const [resolvedTheme, setResolvedTheme] = useState('dark');

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

  // --- EFECTO PRINCIPAL DE TEMA ---
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;
    const body = document.body;

    const updateAppearance = () => {
      // 1. Calcular Tema Efectivo (resolver 'system')
      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      // Actualizamos estado para consumidores
      setResolvedTheme(effectiveTheme);

      // 2. Determinar Color HEX
      let color = THEME_COLORS.dark;
      if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
      } else if (effectiveTheme === 'light') {
        color = THEME_COLORS.light;
      }

      // 3. Bloquear transiciones temporalmente
      body.style.transition = 'none';
      root.style.transition = 'none';

      // 4. Aplicar Clases CSS al ROOT
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme', 'dark');
      
      const classTheme = effectiveTheme === 'oled' ? 'oled' : (effectiveTheme === 'light' ? 'light' : 'dark');
      root.classList.add(`${classTheme}-theme`);

      if (effectiveTheme !== 'light') {
        root.classList.add('dark');
      }

      // 5. Sincronización de fondo
      root.style.backgroundColor = color;
      body.style.backgroundColor = color;

      // Force Reflow
      // eslint-disable-next-line no-unused-expressions
      body.offsetHeight;

      // 6. Meta Tags (PWA/Web)
      const metaName = "theme-color";
      let metaTheme = document.querySelector(`meta[name="${metaName}"]`);
      if (metaTheme) metaTheme.remove();
      metaTheme = document.createElement('meta');
      metaTheme.name = metaName;
      metaTheme.content = color;
      document.head.appendChild(metaTheme);

      const statusStyle = effectiveTheme === 'light' ? 'default' : 'black-translucent';
      const metaStatusName = "apple-mobile-web-app-status-bar-style";
      let metaStatus = document.querySelector(`meta[name="${metaStatusName}"]`);

      if (!metaStatus || metaStatus.getAttribute('content') !== statusStyle) {
        if (metaStatus) metaStatus.remove();
        metaStatus = document.createElement('meta');
        metaStatus.name = metaStatusName;
        metaStatus.content = statusStyle;
        document.head.appendChild(metaStatus);
      }

      // 7. Navigation Bar Nativa (Android) - SOLUCIÓN AL PROBLEMA DE FONDO BLANCO
      if (Capacitor.isNativePlatform()) {
        const isLight = effectiveTheme === 'light';
        // CORRECCIÓN: Llamamos a la función desde el objeto importado
        NavigationBar.setNavigationBarColor({ 
            color: color, 
            darkButtons: isLight 
        }).catch((err) => {
            console.warn("Error setting NavigationBar color:", err);
        });
      }

      // 8. Restaurar transiciones
      setTimeout(() => {
        body.style.transition = '';
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
    const classes = root.className.split(' ').filter(c => !c.startsWith('accent-'));
    root.className = classes.join(' ') + ` accent-${accent}`;
  }, [accent]);

  // Memorizamos el color actual para exportarlo
  const themeColor = useMemo(() => {
    if (resolvedTheme === 'oled') return THEME_COLORS.oled;
    if (resolvedTheme === 'light') return THEME_COLORS.light;
    return THEME_COLORS.dark;
  }, [resolvedTheme]);

  return { 
    theme, 
    setTheme, 
    accent, 
    setAccent, 
    resolvedTheme, 
    themeColor     
  };
};