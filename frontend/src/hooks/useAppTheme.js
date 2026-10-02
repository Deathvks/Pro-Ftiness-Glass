/* frontend/src/hooks/useAppTheme.js */
import { useState, useLayoutEffect, useMemo, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { StatusBar, Style } from '@capacitor/status-bar';
import useAppStore from '../store/useAppStore';

// Paletas sincronizadas milimétricamente con index.html para evitar el parpadeo en el arranque
const THEME_COLORS = {
  galaxy: '#080814',
  oled: '#000000',
  dark: '#0f172a',
  light: '#f8fafc',
  desert: '#f0dec5',
  'desert-dark': '#2c1e16',
  ocean: '#e0f2fe',
  'ocean-dark': '#0f172a',
};

const HEADER_COLORS = {
  galaxy: '#080814',
  oled: '#000000',
  dark: '#0f172a',
  light: '#f8fafc',
  desert: '#f0dec5',
  'desert-dark': '#2c1e16',
  ocean: '#e0f2fe',
  'ocean-dark': '#0f172a',
};

// --- ESTADO GLOBAL PARA LA PRUEBA DE TEMAS ---
let testingThemeNameGlobal = null;
let isTestingGlobal = false;
let testTimeLeftGlobal = 0;
let testIntervalGlobal = null;
let listeners = [];

const notifyThemeListeners = () => {
  listeners.forEach(listener => listener());
};

const getSafeTextAccent = (hexColor, isLightTheme) => {
    let r = 0, g = 0, b = 0;
    if (hexColor.startsWith('#')) hexColor = hexColor.substring(1);
    if (hexColor.length === 6) {
        r = parseInt(hexColor.substring(0, 2), 16);
        g = parseInt(hexColor.substring(2, 4), 16);
        b = parseInt(hexColor.substring(4, 6), 16);
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (isLightTheme) {
        return luminance > 0.6 ? '#111827' : '#' + hexColor;
    } else {
        return luminance < 0.3 ? '#FFFFFF' : '#' + hexColor;
    }
};

const ACCENT_MAP = {
  'green': '#22c55e', 'blue': '#3b82f6', 'violet': '#8b5cf6', 'amber': '#f59e0b',
  'rose': '#f43f5e', 'teal': '#14b8a6', 'cyan': '#06b6d4', 'orange': '#f97316',
  'lime': '#84cc16', 'fuchsia': '#d946ef', 'emerald': '#10b981', 'indigo': '#6366f1',
  'purple': '#a855f7', 'pink': '#ec4899', 'red': '#ef4444', 'yellow': '#eab308',
  'sky': '#0ea5e9', 'slate': '#64748b', 'zinc': '#71717a', 'stone': '#78716c',
  'mint': '#a8e6cf', 'peach': '#ffd3b6', 'rose-water': '#ffaaa5', 'lavender': '#c5a3ff',
  'baby-blue': '#a2cffe', 'sunset-pink': '#ff9a9e', 'pistachio': '#c5e1a5', 'mango': '#ffbe76',
  'lemonade': '#fdfd96', 'cherry-blossom': '#fccbcf', 'neutral': '#737373'
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

  const [isTestingTheme, setIsTestingTheme] = useState(isTestingGlobal);
  const [testTimeLeft, setTestTimeLeft] = useState(testTimeLeftGlobal);
  const [testingThemeName, setTestingThemeName] = useState(testingThemeNameGlobal);
  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    const updateState = () => {
      setIsTestingTheme(isTestingGlobal);
      setTestTimeLeft(testTimeLeftGlobal);
      setTestingThemeName(testingThemeNameGlobal);
    };
    listeners.push(updateState);
    return () => {
      listeners = listeners.filter(l => l !== updateState);
    };
  }, []);

  useEffect(() => {
    const pendingTestStr = localStorage.getItem('pending_theme_test');
    if (pendingTestStr) {
      localStorage.removeItem('pending_theme_test');
      try {
        const pendingTest = JSON.parse(pendingTestStr);
        if (pendingTest.theme && pendingTest.duration) {
          startThemeTest(pendingTest.theme, parseInt(pendingTest.duration, 10), false);
        } else {
          startThemeTest('galaxy', parseInt(pendingTestStr, 10), false);
        }
      } catch (e) {
        startThemeTest('galaxy', parseInt(pendingTestStr, 10), false);
      }
    }
  }, []);

  const setTheme = (newTheme, forceReload = false) => {
    isTestingGlobal = false;
    testingThemeNameGlobal = null;
    testTimeLeftGlobal = 0;
    if (testIntervalGlobal) clearInterval(testIntervalGlobal);
    notifyThemeListeners();

    localStorage.removeItem('original_theme_before_test');
    localStorage.removeItem('pending_theme_test');

    if (cookieConsent) localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);

    if (forceReload) {
      window.location.reload();
    }
  };

  const setAccent = (newAccent) => {
    if (cookieConsent) localStorage.setItem('accent', newAccent);
    setAccentState(newAccent);
  };

  const startThemeTest = (themeName = 'galaxy', durationSecs = 10, forceReload = false) => {
    if (testIntervalGlobal) clearInterval(testIntervalGlobal);

    if (forceReload) {
      localStorage.setItem('original_theme_before_test', theme);
      localStorage.setItem('theme', themeName);
      localStorage.setItem('pending_theme_test', JSON.stringify({ theme: themeName, duration: durationSecs }));
      window.location.reload();
      return;
    }
    
    testingThemeNameGlobal = themeName;
    isTestingGlobal = true;
    testTimeLeftGlobal = durationSecs;
    notifyThemeListeners();

    testIntervalGlobal = setInterval(() => {
      testTimeLeftGlobal -= 1;
      if (testTimeLeftGlobal <= 0) {
        isTestingGlobal = false;
        testingThemeNameGlobal = null;
        clearInterval(testIntervalGlobal);
        
        const original = localStorage.getItem('original_theme_before_test');
        if (original) {
          localStorage.setItem('theme', original);
          localStorage.removeItem('original_theme_before_test');
          window.location.reload();
        }
      }
      notifyThemeListeners();
    }, 1000);
  };

  const cancelThemeTest = () => {
    isTestingGlobal = false;
    testingThemeNameGlobal = null;
    testTimeLeftGlobal = 0;
    if (testIntervalGlobal) clearInterval(testIntervalGlobal);
    notifyThemeListeners();
    
    const original = localStorage.getItem('original_theme_before_test');
    if (original) {
      localStorage.setItem('theme', original);
      localStorage.removeItem('original_theme_before_test');
      window.location.reload();
    }
  };

  const activeTheme = isTestingTheme && testingThemeName ? testingThemeName : theme;

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;
    const body = document.body;
    const appRootDiv = document.getElementById('root');

    const updateAppearance = () => {
      let effectiveTheme = activeTheme;
      if (activeTheme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      setResolvedTheme(effectiveTheme);
      const isDesertDark = effectiveTheme === 'desert-dark';

      let color = THEME_COLORS.dark;
      let headerColorStr = HEADER_COLORS.dark;
      
      if (effectiveTheme === 'galaxy') {
        color = THEME_COLORS.galaxy;
        headerColorStr = HEADER_COLORS.galaxy;
      } else if (effectiveTheme === 'desert' || effectiveTheme === 'desert-dark') {
        color = isDesertDark ? '#362423' : THEME_COLORS.desert;
        headerColorStr = isDesertDark ? '#362423' : HEADER_COLORS.desert;
      } else if (effectiveTheme === 'ocean' || effectiveTheme === 'ocean-dark') {
        color = THEME_COLORS[effectiveTheme];
        headerColorStr = HEADER_COLORS[effectiveTheme];
      } else if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
        headerColorStr = HEADER_COLORS.oled;
      } else if (effectiveTheme === 'light') {
        color = THEME_COLORS.light;
        headerColorStr = HEADER_COLORS.light;
      }

      root.classList.remove('light-theme', 'dark-theme', 'oled-theme', 'galaxy-theme', 'desert-theme', 'ocean-theme', 'dark');
      
      let classTheme = 'dark';
      if (effectiveTheme === 'galaxy') classTheme = 'galaxy';
      else if (effectiveTheme === 'desert' || effectiveTheme === 'desert-dark') classTheme = 'desert';
      else if (effectiveTheme === 'ocean' || effectiveTheme === 'ocean-dark') classTheme = 'ocean';
      else if (effectiveTheme === 'oled') classTheme = 'oled';
      else if (effectiveTheme === 'light') classTheme = 'light';

      root.classList.add(`${classTheme}-theme`);

      if (effectiveTheme !== 'light' && (effectiveTheme !== 'desert' || isDesertDark) && effectiveTheme !== 'ocean') {
        root.classList.add('dark');
      }

      // Dejamos que CSS (variables) controle el fondo del root y body. 
      // Modificar el style.backgroundColor del documentElement causa un bug en iOS PWA donde 
      // se pinta un bloque sólido en el notch inferior y "sube" el contenido.
      root.style.removeProperty('background-color');
      body.style.setProperty('background-color', 'var(--bg-primary)', 'important');
      if (appRootDiv) {
        appRootDiv.style.setProperty('background-color', 'var(--bg-primary)', 'important');
      }

      const metaColor = document.getElementById('dynamic-theme-color');
      if (metaColor) {
          metaColor.setAttribute('content', headerColorStr);
      }

       
      body.offsetHeight; 

      if (Capacitor.isNativePlatform()) {
        const isLight = effectiveTheme === 'light';
        
        NavigationBar.setNavigationBarColor({ 
            color: color, 
            darkButtons: isLight 
        }).catch((err) => console.warn("NavigationBar error:", err));

        StatusBar.setStyle({ 
            style: isLight ? Style.Light : Style.Dark 
        }).catch((err) => console.warn("StatusBar style error:", err));

        if (Capacitor.getPlatform() === 'android') {
            StatusBar.setBackgroundColor({ color: headerColorStr }).catch(() => {});
        }
      }
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
    let classes = root.className.split(' ').filter(c => !c.startsWith('accent-'));
    
    // Si el tema es estructural y tiene su propio acento, no aplicamos el acento personalizado
    const isSpecialTheme = ['galaxy', 'ocean', 'ocean-dark', 'desert', 'desert-dark'].includes(resolvedTheme);
    
    if (isSpecialTheme) {
      root.className = classes.join(' ').trim();
      root.style.removeProperty('--text-accent');
    } else {
      classes.push(`accent-${accent}`);
      root.className = classes.join(' ').trim();
      const isLightTheme = ['light'].includes(resolvedTheme);
      const hex = ACCENT_MAP[accent] || '#22c55e';
      root.style.setProperty('--text-accent', getSafeTextAccent(hex, isLightTheme));
    }
  }, [accent, resolvedTheme]);

  const themeColor = useMemo(() => {
    if (resolvedTheme === 'galaxy') return THEME_COLORS.galaxy;
    if (resolvedTheme === 'desert' || resolvedTheme === 'desert-dark') return resolvedTheme === 'desert-dark' ? '#362423' : THEME_COLORS.desert;
    if (resolvedTheme === 'ocean' || resolvedTheme === 'ocean-dark') return THEME_COLORS[resolvedTheme];
    if (resolvedTheme === 'oled') return THEME_COLORS.oled;
    if (resolvedTheme === 'light') return THEME_COLORS.light;
    return THEME_COLORS.dark;
  }, [resolvedTheme]);

  const headerColor = useMemo(() => {
    if (resolvedTheme === 'galaxy') return HEADER_COLORS.galaxy;
    if (resolvedTheme === 'desert' || resolvedTheme === 'desert-dark') return resolvedTheme === 'desert-dark' ? '#362423' : HEADER_COLORS.desert;
    if (resolvedTheme === 'ocean' || resolvedTheme === 'ocean-dark') return HEADER_COLORS[resolvedTheme];
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


