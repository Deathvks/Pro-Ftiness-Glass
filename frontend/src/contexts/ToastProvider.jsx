/* frontend/src/contexts/ToastProvider.jsx */
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext } from './ToastContext';
import { Toaster, sileo } from 'sileo';
import { useAppTheme } from '../hooks/useAppTheme';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

const ToastProvider = ({ children }) => {
  const { resolvedTheme } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- ESTILOS GLOBALES DE LIMPIEZA Y Z-INDEX SUPREMO ---
  const globalCleanStyles = `
    .custom-toast-root {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      z-index: 2147483647 !important;
      overflow: visible !important;
    }
    .custom-toast-root > svg {
      display: none !important; /* Oculta los iconos por defecto de Sileo */
    }
    
    /* FIX DEFINITIVO PARA EL NOTCH */
    [data-sonner-toaster][data-y-position="top"],
    [data-sileo-toaster] {
      z-index: 2147483647 !important;
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
    
    // Iconos y colores basados en el tipo
    const typeConfig = {
      success: { icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      error: { icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      warning: { icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      info: { icon: Info, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
    };

    const titleText = titles[type] || titles.info;
    const config = typeConfig[type] || typeConfig.info;
    const IconComponent = config.icon;

    // Colores base (adaptables a oscuro/claro de forma genérica)
    const isDark = resolvedTheme === 'dark' || resolvedTheme === 'oled';
    const bgBase = isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)';
    const textColor = isDark ? '#ffffff' : '#111827';
    const subtextColor = isDark ? '#9ca3af' : '#4b5563';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const shadowClass = isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.1)';

    const customContent = (
      <div style={{
        backgroundColor: bgBase,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${borderColor}`,
        borderRadius: '24px',
        padding: '16px',
        boxShadow: shadowClass,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '350px',
        position: 'relative',
        zIndex: 2147483647
      }}>
        {/* Icono con fondo de color suave */}
        <div style={{
          backgroundColor: config.bg,
          color: config.color,
          padding: '10px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <IconComponent size={24} strokeWidth={2.5} />
        </div>

        {/* Textos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <span style={{ 
            color: textColor, 
            fontWeight: '800', 
            fontSize: '14px',
            letterSpacing: '-0.02em'
          }}>
            {titleText}
          </span>
          <span style={{ 
            color: subtextColor, 
            fontSize: '12px', 
            fontWeight: '600',
            lineHeight: '1.4'
          }}>
            {message}
          </span>
        </div>
      </div>
    );

    const options = { 
      description: customContent,
      className: 'custom-toast-root !z-[2147483647]',
      duration: 3000,
      fill: 'transparent',
      styles: {
        title: 'hidden',
        description: 'p-0 m-0 w-full',
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

  }, [resolvedTheme]);

  const contextValue = useMemo(() => ({ showToast: addToast, addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      <style dangerouslySetInnerHTML={{ __html: globalCleanStyles }} />
      
      {mounted && createPortal(
        <Toaster 
          position="top-center" 
          offset="60px" 
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