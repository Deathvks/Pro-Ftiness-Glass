/* frontend/src/hooks/useAppTheme.js */
import { useState, useLayoutEffect, useMemo, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { StatusBar, Style } from '@capacitor/status-bar';
import useAppStore from '../store/useAppStore';

const THEME_COLORS = {
  galaxy: '#080814',
  oled: '#000000',
  dark: '#0c111b',
  light: '#f7fafc',
};

// Colores matemáticos exactos del header glass superpuesto al background
const HEADER_COLORS = {
  galaxy: '#080814',
  oled: '#0d0d0d',
  dark: '#1b2335',
  light: '#f1f3f4',
};

// --- ESTADO GLOBAL PARA LA PRUEBA DE TEMAS ---
let isTestingGlobal = false;
let testTimeLeftGlobal = 0;
let testIntervalGlobal = null;
let listeners = [];

const notifyThemeListeners = () => {
  listeners.forEach(listener => listener());
};
// ----------------------------------------------

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

  // Estados locales sincronizados con el global para que la UI se actualice
  const [isTestingTheme, setIsTestingTheme] = useState(isTestingGlobal);
  const [testTimeLeft, setTestTimeLeft] = useState(testTimeLeftGlobal);
  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    const updateState = () => {
      setIsTestingTheme(isTestingGlobal);
      setTestTimeLeft(testTimeLeftGlobal);
    };
    listeners.push(updateState);
    return () => {
      listeners = listeners.filter(l => l !== updateState);
    };
  }, []);

  const setTheme = (newTheme) => {
    if (isTestingGlobal) {
      cancelThemeTest();
    }
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

  // --- LÓGICA DE PRUEBA DE TEMA ---
  const startThemeTest = (durationSecs = 10) => {
    if (testIntervalGlobal) clearInterval(testIntervalGlobal);
    
    isTestingGlobal = true;
    testTimeLeftGlobal = durationSecs;
    notifyThemeListeners();

    testIntervalGlobal = setInterval(() => {
      testTimeLeftGlobal -= 1;
      if (testTimeLeftGlobal <= 0) {
        isTestingGlobal = false;
        clearInterval(testIntervalGlobal);
      }
      notifyThemeListeners();
    }, 1000);
  };

  const cancelThemeTest = () => {
    isTestingGlobal = false;
    testTimeLeftGlobal = 0;
    if (testIntervalGlobal) clearInterval(testIntervalGlobal);
    notifyThemeListeners();
  };
  // --------------------------------

  const activeTheme = isTestingTheme ? 'galaxy' : theme;

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;
    const body = document.body;

    const updateAppearance = () => {
      let effectiveTheme = activeTheme;
      if (activeTheme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      setResolvedTheme(effectiveTheme);

      let color = THEME_COLORS.dark;
      let headerColorStr = HEADER_COLORS.dark;
      
      if (effectiveTheme === 'galaxy') {
        color = THEME_COLORS.galaxy;
        headerColorStr = HEADER_COLORS.galaxy;
      } else if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
        headerColorStr = HEADER_COLORS.oled;
      } else if (effectiveTheme === 'light') {
        color = THEME_COLORS.light;
        headerColorStr = HEADER_COLORS.light;
      }

      body.style.transition = 'none';
      root.style.transition = 'none';

      root.classList.remove('light-theme', 'dark-theme', 'oled-theme', 'galaxy-theme', 'dark');
      
      const classTheme = effectiveTheme === 'galaxy' ? 'galaxy' : (effectiveTheme === 'oled' ? 'oled' : (effectiveTheme === 'light' ? 'light' : 'dark'));
      root.classList.add(`${classTheme}-theme`);

      if (effectiveTheme !== 'light') {
        root.classList.add('dark');
      }

      // Forzar color de fondo base
      root.style.setProperty('background-color', headerColorStr, 'important');
      body.style.setProperty('background-color', headerColorStr, 'important');

      // --- FIX DEFINITIVO PARA EL NOTCH DE IOS ---
      // 1. Destruimos cualquier etiqueta theme-color previa (soluciona el conflicto de media queries)
      document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());
      
      // 2. Creamos una única etiqueta inamovible con el color exacto del tema
      const metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      metaThemeColor.setAttribute('content', headerColorStr);
      document.head.appendChild(metaThemeColor);
      // --------------------------------

      // eslint-disable-next-line no-unused-expressions
      body.offsetHeight; // Forzar el repintado de la pantalla (Reflow)

      if (Capacitor.isNativePlatform()) {
        const isLight = effectiveTheme === 'light';
        
        // 1. Barra de navegación inferior (Android)
        NavigationBar.setNavigationBarColor({ 
            color: color, 
            darkButtons: isLight 
        }).catch((err) => console.warn("NavigationBar error:", err));

        // 2. Status Bar superior (Color de los iconos en el Notch: Hora, batería, etc.)
        StatusBar.setStyle({ 
            style: isLight ? Style.Light : Style.Dark 
        }).catch((err) => console.warn("StatusBar style error:", err));

        // 3. Fondo del status bar (Exclusivo Android)
        if (Capacitor.getPlatform() === 'android') {
            StatusBar.setBackgroundColor({ color: headerColorStr }).catch(() => {});
        }
      }

      setTimeout(() => {
        body.style.transition = '';
        root.style.transition = '';
      }, 50);
    };

    updateAppearance();

    const handleSystemChange = () => {
      if (activeTheme === 'system') updateAppearance();
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [activeTheme]); 

  useLayoutEffect(() => {
    const root = document.documentElement;
    const classes = root.className.split(' ').filter(c => !c.startsWith('accent-'));
    root.className = classes.join(' ') + ` accent-${accent}`;
  }, [accent]);

  const themeColor = useMemo(() => {
    if (resolvedTheme === 'galaxy') return THEME_COLORS.galaxy;
    if (resolvedTheme === 'oled') return THEME_COLORS.oled;
    if (resolvedTheme === 'light') return THEME_COLORS.light;
    return THEME_COLORS.dark;
  }, [resolvedTheme]);

  const headerColor = useMemo(() => {
    if (resolvedTheme === 'galaxy') return HEADER_COLORS.galaxy;
    if (resolvedTheme === 'oled') return HEADER_COLORS.oled;
    if (resolvedTheme === 'light') return HEADER_COLORS.light;
    return HEADER_COLORS.dark;
  }, [resolvedTheme]);

  return { 
    theme, 
    activeTheme, 
    setTheme, 
    accent, 
    setAccent, 
    resolvedTheme, 
    themeColor,
    headerColor,
    startThemeTest,
    cancelThemeTest,
    isTestingTheme,
    testTimeLeft
  };
};