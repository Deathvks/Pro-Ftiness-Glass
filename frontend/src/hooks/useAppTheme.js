/* frontend/src/hooks/useAppTheme.js */
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Hook para gestionar el tema (claro/oscuro/sistema) y el color de acento.
 * Sincroniza con localStorage (si el consentimiento de cookies está dado)
 * y aplica las clases CSS al elemento raíz (<html>).
 */
export const useAppTheme = () => {
  const cookieConsent = useAppStore(state => state.cookieConsent);

  // Estados locales para 'theme' y 'accent', inicializados desde localStorage
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');
  const [accent, setAccentState] = useState(() => localStorage.getItem('accent') || 'green');

  /**
   * Actualiza el tema y lo guarda en localStorage si hay consentimiento.
   */
  const setTheme = (newTheme) => {
    if (cookieConsent) {
      localStorage.setItem('theme', newTheme);
    }
    setThemeState(newTheme);
  };

  /**
   * Actualiza el acento y lo guarda en localStorage si hay consentimiento.
   */
  const setAccent = (newAccent) => {
    if (cookieConsent) {
      localStorage.setItem('accent', newAccent);
    }
    setAccentState(newAccent);
  };

  // Efecto para APLICAR EL TEMA (theme)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const applyTheme = (themeValue) => {
      // 1. Limpiar clases de tema anteriores
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');

      let effectiveTheme = themeValue;

      // Resolver tema del sistema
      if (themeValue === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.add(mediaQuery.matches ? 'dark-theme' : 'light-theme');
      } else {
        root.classList.add(`${themeValue}-theme`);
      }

      // 2. Gestionar Meta Tags para Status Bar (iOS/PWA y Android)

      // --- ESTRATEGIA SEGURA: COLORES SÓLIDOS Y ESTILO DEFAULT ---

      // Limpieza total de etiquetas previas
      const existingMetaTags = document.querySelectorAll('meta[name="theme-color"]');
      existingMetaTags.forEach(tag => tag.remove());

      // Crear nueva etiqueta
      const themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';

      const appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');

      // --- CONFIGURACIÓN DE COLORES (USANDO BACKGROUND/HEADER SÓLIDO) ---
      let metaColor = '#ffffff';

      // Siempre usamos 'default' para que el sistema elija el color de texto correcto (blanco/negro)
      const statusBarStyle = 'default';

      if (effectiveTheme === 'oled') {
        // OLED: Negro puro
        metaColor = '#000000';
      } else if (effectiveTheme === 'dark') {
        // DARK: Color de fondo base (#0c111b). 
        // Es la opción más segura si el header tiene transparencias.
        metaColor = '#0c111b';
      } else {
        // LIGHT: Blanco puro (#ffffff).
        metaColor = '#ffffff';
      }

      themeColorMeta.content = metaColor;
      document.head.appendChild(themeColorMeta);

      if (appleStatusMeta) {
        appleStatusMeta.setAttribute('content', statusBarStyle);
      }
    };

    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    applyTheme(theme);
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  // Efecto para APLICAR EL COLOR DE ACENTO (accent)
  useEffect(() => {
    const root = document.documentElement;

    // Limpiar clases de acento anteriores
    const toRemove = Array.from(root.classList).filter(c => c.startsWith('accent-'));
    toRemove.forEach(c => root.classList.remove(c));

    // Añadir la nueva clase de acento
    root.classList.add(`accent-${accent}`);
  }, [accent]);

  return {
    theme,
    setTheme,
    accent,
    setAccent,
  };
};