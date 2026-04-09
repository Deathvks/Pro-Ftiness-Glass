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
          border: '1px solid rgba(255, 255, 255, 0.15)',
          titleColor: '#ffffff',
          descColor: '#d1d5db',
          shadow: '0 4px 20px rgba(0,0,0,0.8)'
        };
      case 'dark':
        return {
          bg: '#1f2937', 
          border: '1px solid #374151', 
          titleColor: '#f9fafb', 
          descColor: '#9ca3af', 
          shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        };
      case 'light':
      default:
        return {
          bg: '#ffffff', 
          border: '1px solid #e5e7eb', 
          titleColor: '#111827', 
          descColor: '#4b5563', 
          shadow: '0 4px 12px rgba(0, 0, 0, 0.08)' 
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
      z-index: 2147483647 !important;
    }
    .custom-toast-root svg {
      display: none !important;
    }
    
    /* FIX DEFINITIVO PARA EL NOTCH: Atacamos el atributo exacto donde Sonner/Sileo se ancla */
    [data-sonner-toaster][data-y-position="top"],
    [data-sileo-toaster] {
      z-index: 2147483647 !important;
      /* Usamos max() para que coja el área segura, y si falla o es 0, coja 55px (que salva cualquier notch/Dynamic Island) */
      top: max(env(safe-area-inset-top), 55px) !important;
      margin-top: 10px !important;
    }

    [data-sonner-toast] {
      z-index: 2147483647 !important;
    }
  `;

  const addToast = useCallback((message, type = 'info') => {
    
    const titles = {
      success: 'Completado',
      error: 'Error',
      warning: 'Atención',
      info: 'Información'
    };
    const titleText = titles[type] || titles.info;

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
        minWidth: '250px',
        maxWidth: '350px',
        position: 'relative',
        zIndex: 2147483647
      }}>
        <span style={{ 
            color: currentThemeStyles.titleColor, 
            fontWeight: '700', 
            fontSize: '0.875rem' 
        }}>
          {titleText}
        </span>
        
        <span style={{ 
            color: currentThemeStyles.descColor, 
            fontSize: '0.75rem', 
            fontWeight: '500' 
        }}>
          {message}
        </span>
      </div>
    );

    const options = { 
      description: customContent,
      className: 'custom-toast-root !z-[2147483647]',
      duration: 3000,
      fill: 'transparent',
      styles: {
        title: 'hidden',
        description: 'p-0 m-0',
        view: { background: 'transparent', boxShadow: 'none', zIndex: 2147483647 } 
      }
    };

    const typeMap = {
      success: sileo.success,
      error: sileo.error,
      warning: sileo.warning || sileo.error,
      info: sileo.info || sileo.success
    };
    
    const method = typeMap[type] || sileo.info;
    method({ title: null, ...options }); 

  }, [currentThemeStyles]);

  const contextValue = useMemo(() => ({ showToast: addToast, addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      <style dangerouslySetInnerHTML={{ __html: globalCleanStyles }} />
      
      {mounted && createPortal(
        <Toaster 
          position="top-center" 
          offset="60px" /* Forzamos mediante la prop nativa que baje 60px desde el borde */
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