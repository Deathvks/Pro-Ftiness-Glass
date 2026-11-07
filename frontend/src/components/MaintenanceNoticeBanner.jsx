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
    ...(needsSafeArea ? { paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 0.25rem)' } : {}),
    ...style
  };

  return (
    <aside
      aria-label="Aviso de migración completada"
      style={computedStyle}
      className={`relative w-full bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-950 dark:text-emerald-100 py-1 sm:py-1.5 px-2.5 sm:px-4 md:backdrop-blur-xl transition-all shrink-0 ${
        borderBottom && !isRounded ? 'border-b border-emerald-500/30' : ''
      } ${rounded ? 'rounded-2xl border border-emerald-500/30 shadow-sm' : ''} ${className}`}
    >
      {/* Contenedor: en PC todo agrupado y centrado; en móvil ultracompacto en 2 líneas fluidas */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between sm:justify-center gap-2">
        {/* Contenido principal: en móvil badge inline con el texto; en PC fila horizontal centrada */}
        <div className="text-[11px] sm:text-xs leading-tight sm:leading-normal font-semibold sm:font-bold text-emerald-950 dark:text-emerald-100 flex-1 min-w-0 sm:flex-initial sm:flex sm:items-center sm:justify-center sm:gap-2 text-left sm:text-center">
          {/* Badge de estado con pulso verde: inline para ahorrar líneas verticales en móvil */}
          <span className="inline-flex items-center gap-1 bg-emerald-500/25 dark:bg-emerald-500/30 border border-emerald-500/40 text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mr-1.5 sm:mr-0 shrink-0 align-middle">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500" />
            </span>
            <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0 sm:w-3.5 sm:h-3.5" />
            <span>{t('maintenance_tag', { defaultValue: 'Migración completada' })}</span>
          </span>

          {/* Texto explicativo */}
          <span className="align-middle">
            {t('maintenance_banner_msg', { defaultValue: 'Todo ha salido perfecto: datos 100% seguros, nueva URL oficial y plataforma más rápida.' })}
          </span>

          {/* Enlace Más información */}
          {!isMaintenancePage && (
            <Link
              to="/mantenimiento"
              className="inline-flex items-center gap-0.5 font-black text-emerald-900 dark:text-emerald-200 underline underline-offset-2 hover:text-emerald-950 dark:hover:text-white transition-colors ml-1.5 shrink-0 whitespace-nowrap align-middle"
            >
              <span>{t('maintenance_more_info', { defaultValue: 'Más información' })}</span>
              <ArrowRight size={11} className="shrink-0" />
            </Link>
          )}
        </div>

        {/* Botón X de cierre: agrupado inmediatamente al lado del enlace en PC, a la derecha en móvil */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso definitivamente"
          title="No volver a mostrar este aviso"
          className="shrink-0 p-1 -mr-1 rounded-full text-emerald-800/80 hover:text-emerald-950 dark:text-emerald-200/80 dark:hover:text-white hover:bg-emerald-500/20 active:scale-90 transition-all cursor-pointer self-center sm:ml-2"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </aside>
  );
};

export default MaintenanceNoticeBanner;
