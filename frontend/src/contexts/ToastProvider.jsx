/* frontend/src/contexts/ToastProvider.jsx */
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext } from './ToastContext';
import { Toaster, sileo } from 'sileo';
import { useAppTheme } from '../hooks/useAppTheme';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

export const getToastThemePalette = (resolvedTheme) => {
  switch (resolvedTheme) {
    case 'galaxy':
      return {
        isDark: true,
        bgBase: 'rgba(12, 10, 29, 0.94)',
        bgGradient: 'linear-gradient(135deg, rgba(34, 21, 71, 0.96) 0%, rgba(12, 10, 29, 0.94) 60%, rgba(20, 32, 74, 0.92) 100%)',
        textColor: '#faf5ff',
        subtextColor: '#e2e8f0',
        borderColor: 'rgba(168, 85, 247, 0.42)',
        shadow: '0 16px 40px rgba(6, 5, 18, 0.75), 0 0 24px rgba(168, 85, 247, 0.20), inset 0 1px 1px rgba(216, 180, 254, 0.28)',
        accentBar: 'linear-gradient(180deg, #c084fc 0%, #60a5fa 100%)',
      };
    case 'desert':
      return {
        isDark: false,
        bgBase: 'rgba(253, 248, 243, 0.96)',
        bgGradient: 'linear-gradient(135deg, rgba(255, 251, 247, 0.98) 0%, rgba(245, 230, 213, 0.95) 100%)',
        textColor: '#3e2723',
        subtextColor: '#5d4037',
        borderColor: 'rgba(180, 130, 82, 0.42)',
        shadow: '0 14px 36px rgba(92, 64, 51, 0.20), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
        accentBar: 'linear-gradient(180deg, #b45309 0%, #d97706 100%)',
      };
    case 'desert-dark':
      return {
        isDark: true,
        bgBase: 'rgba(44, 30, 22, 0.95)',
        bgGradient: 'linear-gradient(135deg, rgba(66, 45, 33, 0.97) 0%, rgba(38, 25, 18, 0.95) 100%)',
        textColor: '#fff8ee',
        subtextColor: '#f3dcc0',
        borderColor: 'rgba(210, 180, 140, 0.40)',
        shadow: '0 16px 40px rgba(15, 8, 4, 0.75), inset 0 1px 1px rgba(245, 222, 179, 0.22)',
        accentBar: 'linear-gradient(180deg, #f5deb3 0%, #d2b48c 100%)',
      };
    case 'ocean':
      return {
        isDark: false,
        bgBase: 'rgba(240, 249, 255, 0.96)',
        bgGradient: 'linear-gradient(135deg, rgba(248, 253, 255, 0.98) 0%, rgba(224, 242, 254, 0.95) 100%)',
        textColor: '#082f49',
        subtextColor: '#0c4a6e',
        borderColor: 'rgba(14, 165, 233, 0.40)',
        shadow: '0 14px 36px rgba(8, 47, 73, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.92)',
        accentBar: 'linear-gradient(180deg, #0284c7 0%, #0ea5e9 100%)',
      };
    case 'ocean-dark':
      return {
        isDark: true,
        bgBase: 'rgba(8, 47, 73, 0.95)',
        bgGradient: 'linear-gradient(135deg, rgba(14, 78, 116, 0.97) 0%, rgba(8, 47, 73, 0.95) 100%)',
        textColor: '#f0f9ff',
        subtextColor: '#e0f2fe',
        borderColor: 'rgba(56, 189, 248, 0.40)',
        shadow: '0 16px 40px rgba(2, 18, 32, 0.75), inset 0 1px 1px rgba(186, 230, 253, 0.24)',
        accentBar: 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)',
      };
    case 'oled':
      return {
        isDark: true,
        bgBase: 'rgba(8, 8, 10, 0.96)',
        bgGradient: 'linear-gradient(135deg, rgba(22, 22, 26, 0.97) 0%, rgba(5, 5, 7, 0.96) 100%)',
        textColor: '#ffffff',
        subtextColor: '#e4e4e7',
        borderColor: 'rgba(255, 255, 255, 0.16)',
        shadow: '0 18px 44px rgba(0, 0, 0, 0.88), inset 0 1px 1px rgba(255, 255, 255, 0.10)',
        accentBar: null,
      };
    case 'light':
      return {
        isDark: false,
        bgBase: 'rgba(255, 255, 255, 0.95)',
        bgGradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 245, 249, 0.94) 100%)',
        textColor: '#0f172a',
        subtextColor: '#334155',
        borderColor: 'rgba(15, 23, 42, 0.10)',
        shadow: '0 14px 36px rgba(15, 23, 42, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
        accentBar: null,
      };
    case 'dark':
    default:
      return {
        isDark: true,
        bgBase: 'rgba(15, 23, 42, 0.94)',
        bgGradient: 'linear-gradient(135deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.94) 100%)',
        textColor: '#f8fafc',
        subtextColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.14)',
        shadow: '0 16px 40px rgba(0, 0, 0, 0.58), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
        accentBar: null,
      };
  }
};

const getToastTypeConfig = (type, isDark) => {
  const configs = {
    success: {
      icon: CheckCircle2,
      color: isDark ? '#34d399' : '#059669',
      bg: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.14)',
      border: isDark ? 'rgba(52, 211, 153, 0.30)' : 'rgba(5, 150, 105, 0.24)',
    },
    error: {
      icon: XCircle,
      color: isDark ? '#f87171' : '#dc2626',
      bg: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.14)',
      border: isDark ? 'rgba(248, 113, 113, 0.30)' : 'rgba(220, 38, 38, 0.24)',
    },
    warning: {
      icon: AlertCircle,
      color: isDark ? '#fbbf24' : '#d97706',
      bg: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.15)',
      border: isDark ? 'rgba(251, 191, 36, 0.30)' : 'rgba(217, 119, 6, 0.26)',
    },
    info: {
      icon: Info,
      color: isDark ? '#60a5fa' : '#2563eb',
      bg: isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.14)',
      border: isDark ? 'rgba(96, 165, 250, 0.30)' : 'rgba(37, 99, 235, 0.24)',
    },
  };
  return configs[type] || configs.info;
};

const ThemedToastCard = ({ titleText, message, type }) => {
  const { resolvedTheme } = useAppTheme();
  const palette = getToastThemePalette(resolvedTheme);
  const config = getToastTypeConfig(type, palette.isDark);
  const IconComponent = config.icon;

  return (
    <div
      style={{
        backgroundColor: palette.bgBase,
        backgroundImage: palette.bgGradient,
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: `1px solid ${palette.borderColor}`,
        borderRadius: '24px',
        padding: '14px 16px',
        boxShadow: palette.shadow,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '355px',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 2147483647,
      }}
    >
      {/* Icono con fondo y borde adaptados al contraste del tema */}
      <div
        style={{
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          padding: '10px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconComponent size={22} strokeWidth={2.5} />
      </div>

      {/* Textos con alto contraste garantizado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
        <span
          style={{
            color: palette.textColor,
            fontWeight: '800',
            fontSize: '14px',
            letterSpacing: '-0.02em',
            lineHeight: '1.25',
          }}
        >
          {titleText}
        </span>
        <span
          style={{
            color: palette.subtextColor,
            fontSize: '12.5px',
            fontWeight: '600',
            lineHeight: '1.4',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </span>
      </div>
    </div>
  );
};

const ToastProvider = ({ children }) => {
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
      top: max(var(--safe-top), 55px) !important;
      margin-top: 10px !important;
    }

    [data-sonner-toast] {
      z-index: 2147483647 !important;
    }
  `;

  const addToast = useCallback((rawMessage, type = 'info') => {
    // Interceptar mensajes raw de fetch para evitar asustar al usuario
    let message = rawMessage || '';
    if (typeof message === 'string') {
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('failed to fetch') || 
          lowerMsg.includes('load failed') || 
          lowerMsg.includes('networkerror') || 
          lowerMsg.includes('network error')) {
        message = 'Error de conexión. Revisa tu internet.';
      }
    }

    const titles = {
      success: 'Completado',
      error: 'Error',
      warning: 'Atención',
      info: 'Información'
    };

    const titleText = titles[type] || titles.info;
    const customContent = (
      <ThemedToastCard titleText={titleText} message={message} type={type} />
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

  }, []);

  const contextValue = useMemo(() => ({ showToast: addToast, addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      <style dangerouslySetInnerHTML={{ __html: globalCleanStyles }} />
      
      {mounted && createPortal(
        <div style={{ position: 'relative', zIndex: 999999 }}>
          <Toaster 
            position="top-center" 
            offset="60px" 
            className="!z-[999999]"
            style={{ zIndex: 999999 }} 
            toastOptions={{ className: '!z-[999999]', style: { zIndex: 999999 } }} 
          />
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;