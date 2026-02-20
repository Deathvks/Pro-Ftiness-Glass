/* frontend/src/contexts/ToastProvider.jsx */
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext } from './ToastContext';
import { Toaster, sileo } from 'sileo';
import { useAppTheme } from '../hooks/useAppTheme';

const ToastProvider = ({ children }) => {
  const { resolvedTheme } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  // Aseguramos que el componente esté montado antes de usar el Portal (evita errores SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- CONFIGURACIÓN DE ESTILOS POR TEMA ---
  const currentThemeStyles = useMemo(() => {
    switch (resolvedTheme) {
      case 'oled':
        return {
          bg: '#000000',
          border: '1px solid rgba(255, 255, 255, 0.15)', // Borde blanco sutil
          titleColor: '#ffffff',
          descColor: '#d1d5db',
          shadow: '0 4px 20px rgba(0,0,0,0.8)'
        };
      case 'dark':
        return {
          bg: '#1f2937', // Gris oscuro (Tailwind gray-800)
          border: '1px solid #374151', // Borde gris medio (gray-700)
          titleColor: '#f9fafb', // Blanco roto
          descColor: '#9ca3af', // Gris claro
          shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        };
      case 'light':
      default:
        return {
          bg: '#ffffff', // Blanco puro
          border: '1px solid #e5e7eb', // Borde gris muy suave (gray-200)
          titleColor: '#111827', // Negro casi puro
          descColor: '#4b5563', // Gris medio
          shadow: '0 4px 12px rgba(0, 0, 0, 0.08)' // Sombra suave elegante
        };
    }
  }, [resolvedTheme]);

  // --- ESTILOS GLOBALES DE LIMPIEZA Y Z-INDEX SUPREMO ---
  const globalCleanStyles = `
    .custom-toast-root {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      z-index: 2147483647 !important; /* Capa altísima individual */
    }
    .custom-toast-root svg {
      display: none !important; /* Adiós al SVG deforme de Sileo */
    }
    
    /* REGLA AGRESIVA PARA ASEGURAR QUE FLOTE SOBRE TODO (Modales en z-[80]) */
    [data-sonner-toaster], 
    [data-sileo-toaster], 
    [data-sonner-toast],
    .sileo-toaster,
    .sonner-toaster {
      z-index: 2147483647 !important; /* El valor máximo posible en CSS */
    }
  `;

  const addToast = useCallback((message, type = 'info') => {
    
    // Títulos automáticos según tipo
    const titles = {
      success: 'Completado',
      error: 'Error',
      warning: 'Atención',
      info: 'Información'
    };
    const titleText = titles[type] || titles.info;

    // Construimos el HTML Manual para TODOS los temas
    const customContent = (
      <div style={{
        backgroundColor: currentThemeStyles.bg,
        border: currentThemeStyles.border,
        borderRadius: '16px',
        padding: '12px 16px',
        boxShadow: currentThemeStyles.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: '250px', // Ancho consistente
        maxWidth: '350px',
        position: 'relative',
        zIndex: 2147483647
      }}>
        {/* Título */}
        <span style={{ 
            color: currentThemeStyles.titleColor, 
            fontWeight: '700', 
            fontSize: '0.875rem' 
        }}>
          {titleText}
        </span>
        
        {/* Mensaje */}
        <span style={{ 
            color: currentThemeStyles.descColor, 
            fontSize: '0.75rem', 
            fontWeight: '500' 
        }}>
          {message}
        </span>
      </div>
    );

    // Opciones para Sileo
    const options = { 
      description: customContent,
      className: 'custom-toast-root !z-[2147483647]', // Aplicamos limpieza y z-index tailwind
      duration: 3000,
      
      // Props "dummy" para que Sileo no pinte nada extra
      fill: 'transparent',
      styles: {
        title: 'hidden',
        description: 'p-0 m-0',
        view: { background: 'transparent', boxShadow: 'none', zIndex: 2147483647 } 
      }
    };

    // Ejecución
    const typeMap = {
      success: sileo.success,
      error: sileo.error,
      warning: sileo.warning || sileo.error,
      info: sileo.info || sileo.success
    };
    
    const method = typeMap[type] || sileo.info;
    method({ title: null, ...options }); // Pasamos null al título nativo

  }, [currentThemeStyles]);

  const contextValue = useMemo(() => ({ showToast: addToast, addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Inyectamos los estilos de limpieza y el z-index supremo siempre */}
      <style dangerouslySetInnerHTML={{ __html: globalCleanStyles }} />
      
      {/* El Portal asegura que el Toaster se inyecte directamente en el body,
        escapando de cualquier "stacking context" (capas ocultas) que tenga la aplicación
      */}
      {mounted && createPortal(
        <Toaster 
          position="top-center" 
          className="!z-[2147483647]"
          style={{ zIndex: 2147483647 }} 
          toastOptions={{ className: '!z-[2147483647]', style: { zIndex: 2147483647 } }} 
        />,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;