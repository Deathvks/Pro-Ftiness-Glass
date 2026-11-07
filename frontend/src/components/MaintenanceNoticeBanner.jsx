/* frontend/src/components/MaintenanceNoticeBanner.jsx */
import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

const DISMISS_KEY = 'pfg_dismiss_migration_success_banner_v1';

const MaintenanceNoticeBanner = ({
  className = '',
  rounded = false,
  borderBottom = true,
  withSafeArea = false,
  style = {}
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const isRounded = rounded || className.includes('rounded');
  const needsSafeArea = withSafeArea || className.includes('with-safe-area') || className.includes('safe-top');
  const isMaintenancePage = location?.pathname === '/mantenimiento' || location?.pathname === '/migracion';

  if (isDismissed) return null;

  const handleDismiss = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {}
    setIsDismissed(true);
  };

  const computedStyle = {
    ...(needsSafeArea ? { paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 0.35rem)' } : {}),
    ...style
  };

  return (
    <aside
      aria-label="Aviso de migración completada"
      style={computedStyle}
      className={`relative w-full bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-950 dark:text-emerald-100 ${
        needsSafeArea ? 'pb-2 pt-1' : 'py-1.5 sm:py-1.5'
      } px-3 sm:px-4 md:backdrop-blur-xl transition-all shrink-0 ${
        borderBottom && !isRounded ? 'border-b border-emerald-500/30' : ''
      } ${rounded ? 'rounded-2xl border border-emerald-500/30 shadow-sm' : ''} ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 w-full max-w-7xl mx-auto">
        {/* Cabecera en móvil (Badge a la izquierda, Botón X a la derecha) / Lado izquierdo en desktop */}
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="bg-emerald-500/25 dark:bg-emerald-500/30 border border-emerald-500/40 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-emerald-950 dark:text-emerald-100">
              {t('maintenance_tag', { defaultValue: 'Migración completada' })}
            </span>
          </div>

          {/* Botón X visible solo en móvil, integrado armónicamente en la barra superior */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar aviso definitivamente"
            title="No volver a mostrar este aviso"
            className="sm:hidden p-1 -mr-1 -my-0.5 rounded-full text-emerald-800/80 hover:text-emerald-950 dark:text-emerald-200/80 dark:hover:text-white hover:bg-emerald-500/20 active:scale-90 transition-all cursor-pointer"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Texto explicativo con enlace integrado: ancho completo en móvil, centrado en desktop */}
        <div className="text-[11px] sm:text-xs leading-snug sm:leading-normal font-semibold sm:font-bold text-emerald-950 dark:text-emerald-100 flex-1 min-w-0 sm:text-center">
          <span>{t('maintenance_banner_msg', { defaultValue: 'Todo ha salido perfecto: datos 100% seguros, nueva URL oficial y plataforma más rápida.' })}</span>
          {!isMaintenancePage && (
            <Link
              to="/mantenimiento"
              className="inline-flex items-center gap-0.5 font-black text-emerald-900 dark:text-emerald-200 underline underline-offset-2 hover:text-emerald-950 dark:hover:text-white transition-colors ml-1.5 shrink-0 whitespace-nowrap"
            >
              <span>{t('maintenance_more_info', { defaultValue: 'Más información' })}</span>
              <ArrowRight size={11} className="shrink-0" />
            </Link>
          )}
        </div>

        {/* Botón X visible solo en pantallas medianas y grandes */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso definitivamente"
          title="No volver a mostrar este aviso"
          className="hidden sm:inline-flex shrink-0 p-1 -mr-1 rounded-full text-emerald-800/80 hover:text-emerald-950 dark:text-emerald-200/80 dark:hover:text-white hover:bg-emerald-500/20 active:scale-90 transition-all cursor-pointer self-center"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>
    </aside>
  );
};

export default MaintenanceNoticeBanner;
