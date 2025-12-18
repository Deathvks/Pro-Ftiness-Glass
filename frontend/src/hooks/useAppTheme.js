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

      // --- CORRECCIÓN ---
      // Buscamos TODAS las etiquetas theme-color existentes (debido a las media queries del index.html)
      const existingMetaTags = document.querySelectorAll('meta[name="theme-color"]');

      // Eliminamos las etiquetas duplicadas o con atributos 'media' para tomar control total con JS
      // Mantenemos solo la primera (o creamos una nueva si no hay) y la limpiamos.
      let themeColorMeta;

      if (existingMetaTags.length > 0) {
        themeColorMeta = existingMetaTags[0];
        // Eliminamos el resto si existen
        for (let i = 1; i < existingMetaTags.length; i++) {
          existingMetaTags[i].remove();
        }
      } else {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
      }

      // CRUCIAL: Eliminamos el atributo media para que el navegador obedezca nuestro 'content' siempre
      themeColorMeta.removeAttribute('media');

      const appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');

      let metaColor = '#f7fafc'; // Default Light (coincide con bg-primary light)
      let statusBarStyle = 'default';

      if (effectiveTheme === 'oled') {
        // OLED: Negro puro y barra translúcida
        metaColor = '#000000';
        statusBarStyle = 'black-translucent';
      } else if (effectiveTheme === 'dark') {
        // DARK: Color exacto del header oscuro (#0c111b)
        metaColor = '#0c111b';
        statusBarStyle = 'default'; // default en oscuro pone letras blancas
      } else {
        // LIGHT: Color exacto del header claro (#f7fafc)
        metaColor = '#f7fafc';
        statusBarStyle = 'default'; // default en claro pone letras negras
      }

      themeColorMeta.setAttribute('content', metaColor);

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