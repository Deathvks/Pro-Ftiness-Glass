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
    const body = document.body;

    const updateAppearance = () => {
      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      // 1. Determinar Color HEX
      let color = THEME_COLORS.dark;
      if (effectiveTheme === 'oled') {
        color = THEME_COLORS.oled;
      } else if (effectiveTheme === 'dark') {
        color = THEME_COLORS.dark;
      } else {
        color = THEME_COLORS.light;
      }

      // 2. TRUCO "iOS 26": Bloquear transiciones para evitar 'lag' en la UI del navegador
      // Si hay transición, Safari a veces captura el color 'antiguo' para la barra de estado.
      const originalTransition = body.style.transition;
      body.style.transition = 'none';
      root.style.transition = 'none';

      // 3. Aplicar Clases y Colores
      root.classList.remove('light-theme', 'dark-theme', 'oled-theme');
      if (theme === 'system') {
        root.classList.add(effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme');
      } else {
        root.classList.add(`${theme}-theme`);
      }

      // Sincronización agresiva del fondo
      root.style.backgroundColor = color;
      body.style.backgroundColor = color;

      // Forzar Reflow (Repintado) para que Safari note el cambio de 'none'
      // eslint-disable-next-line no-unused-expressions
      body.offsetHeight;

      // 4. META TAGS - ESTRATEGIA: DESTRUIR Y RECREAR
      // En versiones recientes de iOS, actualizar el atributo a veces no despierta al UI controller.
      // Reinsertar el nodo fuerza una re-evaluación.

      // A) theme-color
      const metaName = "theme-color";
      let metaTheme = document.querySelector(`meta[name="${metaName}"]`);
      if (metaTheme) {
        metaTheme.remove();
      }
      metaTheme = document.createElement('meta');
      metaTheme.name = metaName;
      metaTheme.content = color;
      document.head.appendChild(metaTheme);

      // B) apple-mobile-web-app-status-bar-style
      // 'default' = negro (fondo claro) | 'black-translucent' = blanco (fondo oscuro)
      const statusStyle = effectiveTheme === 'light' ? 'default' : 'black-translucent';
      const metaStatusName = "apple-mobile-web-app-status-bar-style";
      let metaStatus = document.querySelector(`meta[name="${metaStatusName}"]`);

      // Solo recreamos si cambia el valor para evitar parpadeos innecesarios en el contenido
      if (!metaStatus || metaStatus.getAttribute('content') !== statusStyle) {
        if (metaStatus) metaStatus.remove();
        metaStatus = document.createElement('meta');
        metaStatus.name = metaStatusName;
        metaStatus.content = statusStyle;
        document.head.appendChild(metaStatus);
      }

      // 5. Restaurar transiciones (breve delay para asegurar que el UI del navegador ya 'pescó' el color)
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

  // Efecto Acento
  useLayoutEffect(() => {
    const root = document.documentElement;
    const classes = root.className.split(' ').filter(c => !c.startsWith('accent-'));
    root.className = classes.join(' ') + ` accent-${accent}`;
  }, [accent]);

  return { theme, setTheme, accent, setAccent };
};