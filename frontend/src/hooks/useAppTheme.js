/* frontend/src/hooks/useAppTheme.js */
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Hook para gestionar el tema y el color de la barra de estado.
 */
export const useAppTheme = () => {
  const cookieConsent = useAppStore(state => state.cookieConsent);

  // Inicializar estado desde localStorage o default 'system'
  const [theme, setThemeState] = useState(() => {
    // Verificación de seguridad para SSR
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

  // Efecto Principal: Gestiona Clases CSS y Meta Tags
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const updateAppearance = () => {
      // 1. Determinar el tema efectivo (light/dark/oled)
      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      // 2. Aplicar Clases al Root (HTML)
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');

      if (theme === 'system') {
        // Si es sistema, aplicamos la clase específica resuelta
        root.classList.add(effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme');
      } else {
        // Si es manual (light, dark, oled), aplicamos esa clase
        root.classList.add(`${theme}-theme`);
      }

      // 3. Gestionar Meta Tag "theme-color" (Status Bar)
      // Usamos un ID específico para asegurar que controlamos ESTA etiqueta y no otra
      const META_ID = 'dynamic-theme-color-meta';
      let themeMeta = document.getElementById(META_ID);

      // Si no existe por ID, buscamos por nombre para limpiarlas y crear la nuestra
      if (!themeMeta) {
        const existingMetas = document.querySelectorAll('meta[name="theme-color"]');
        existingMetas.forEach(m => m.remove()); // Borrón y cuenta nueva

        themeMeta = document.createElement('meta');
        themeMeta.name = 'theme-color';
        themeMeta.id = META_ID; // Marcamos nuestra etiqueta
        document.head.appendChild(themeMeta);
      }

      // 4. Definir Colores Exactos
      let colorHex;
      if (effectiveTheme === 'oled') {
        colorHex = '#000000'; // Negro Absoluto
      } else if (effectiveTheme === 'dark') {
        colorHex = '#0c111b'; // Background Oscuro
      } else {
        colorHex = '#ffffff'; // Blanco Puro
      }

      // 5. Aplicar el color
      themeMeta.setAttribute('content', colorHex);

      // 6. Gestionar Estilo de Barra iOS (Texto blanco/negro)
      const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (appleMeta) {
        // 'default' permite que iOS decida el color del texto (negro en fondo claro, blanco en oscuro)
        appleMeta.setAttribute('content', 'default');
      }
    };

    // Ejecutar al inicio y cuando cambie el tema
    updateAppearance();

    // Listener para cambios en el sistema (solo si el tema es 'system')
    const handleSystemChange = () => {
      if (theme === 'system') {
        updateAppearance();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]); // Dependencia única: 'theme'

  // Efecto Secundario: Color de Acento
  useEffect(() => {
    const root = document.documentElement;
    // Limpiar clases de acento previas (accent-blue, accent-green, etc.)
    const classes = root.className.split(' ').filter(c => !c.startsWith('accent-'));
    root.className = classes.join(' ') + ` accent-${accent}`;
  }, [accent]);

  return { theme, setTheme, accent, setAccent };
};