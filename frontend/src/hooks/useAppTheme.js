/* frontend/src/hooks/useAppTheme.js */
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Hook para gestionar el tema (claro/oscuro/sistema) y el color de acento.
 * Sincroniza con localStorage (si el consentimiento de cookies está dado)
 * y aplica las clases CSS al <body>.
 */
export const useAppTheme = () => {
  // Suscribirse al estado de cookieConsent.
  // Esto asegura que las funciones 'setTheme' y 'setAccent'
  // se re-creen con el valor actualizado si 'cookieConsent' cambia.
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

  // Efecto para APLICAR EL TEMA (theme) al <body>
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (themeValue) => {
      document.body.classList.remove('light-theme', 'dark-theme');
      if (themeValue === 'system') {
        document.body.classList.add(mediaQuery.matches ? 'dark-theme' : 'light-theme');
      } else {
        document.body.classList.add(`${themeValue}-theme`);
      }
    };

    // Callback para cuando el 'prefers-color-scheme' del S.O. cambia
    const handleSystemThemeChange = () => {
      // Usamos el valor 'theme' del estado de React
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    applyTheme(theme); // Aplicar al cargar o al cambiar 'theme'
    mediaQuery.addEventListener('change', handleSystemThemeChange); // Escuchar cambios del S.O.
    
    // Limpieza
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]); // Se re-ejecuta solo si 'theme' cambia

  // Efecto para APLICAR EL COLOR DE ACENTO (accent) al <body>
  useEffect(() => {
    // Limpiar clases de acento anteriores
    const toRemove = Array.from(document.body.classList).filter(c => c.startsWith('accent-'));
    toRemove.forEach(c => document.body.classList.remove(c));
    
    // Añadir la nueva clase de acento
    document.body.classList.add(`accent-${accent}`);
  }, [accent]); // Se re-ejecuta solo si 'accent' cambia

  // Retornar la API del hook
  return {
    theme,
    setTheme,
    accent,
    setAccent,
  };
};