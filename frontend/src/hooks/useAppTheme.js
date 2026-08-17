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

      // Inyección obligatoria en los 3 nodos principales para evitar fragmentación visual
      root.style.setProperty('background-color', headerColorStr, 'important');
      body.style.setProperty('background-color', headerColorStr, 'important');
      if (appRootDiv) {
        appRootDiv.style.setProperty('background-color', headerColorStr, 'important');
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
    const classes = root.className.split(' ').filter(c => !c.startsWith('accent-'));
    root.className = classes.join(' ') + ` accent-${accent}`;
  }, [accent]);

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