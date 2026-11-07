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
        needsSafeArea ? 'pb-1' : 'py-1 sm:py-1.5'
      } px-2 sm:px-4 md:backdrop-blur-xl transition-colors flex items-center justify-between shrink-0 ${
        borderBottom && !isRounded ? 'border-b border-emerald-500/30' : ''
      } ${rounded ? 'rounded-2xl border border-emerald-500/30 shadow-sm' : ''} ${className}`}
    >
      {/* Versión Móvil: ultracompacta con link y botón X */}
      <div className="flex sm:hidden items-center justify-between gap-1.5 w-full py-0.5">
        {!isMaintenancePage ? (
          <Link
            to="/mantenimiento"
            className="flex items-center gap-1.5 min-w-0 text-left leading-none text-[11px] font-semibold text-emerald-950 dark:text-emerald-100 hover:opacity-90 active:scale-[0.99] transition-opacity"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold truncate">
              {t('maintenance_banner_msg_mobile', { defaultValue: '¡Migración completada con éxito!' })}
            </span>
            <span className="inline-flex items-center gap-0.5 font-black text-emerald-900 dark:text-emerald-200 underline underline-offset-2 shrink-0 ml-0.5">
              <span>{t('maintenance_more_info_short', { defaultValue: '+Info' })}</span>
              <ArrowRight size={10} className="shrink-0" />
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0 text-left leading-none text-[11px] font-semibold text-emerald-950 dark:text-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold truncate">
              {t('maintenance_banner_msg_mobile', { defaultValue: '¡Migración completada con éxito!' })}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso definitivamente"
          title="No volver a mostrar este aviso"
          className="p-1 -mr-1 rounded-full text-emerald-800/80 hover:text-emerald-950 dark:text-emerald-200/80 dark:hover:text-white hover:bg-emerald-500/20 active:scale-90 transition-all shrink-0 cursor-pointer"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* Versión Desktop / Tablet: diseño completo con badge, texto extendido y botón X */}
      <div className="hidden sm:flex items-center justify-between gap-3 w-full max-w-7xl mx-auto leading-tight">
        <div className="w-5 shrink-0" aria-hidden="true" />
        <div className="flex items-center justify-center gap-2 text-center flex-1">
          <div className="inline-flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="bg-emerald-500/25 dark:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-emerald-950 dark:text-emerald-100">
              {t('maintenance_tag', { defaultValue: 'Migración completada' })}
            </span>
          </div>
          <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
            {t('maintenance_banner_msg', { defaultValue: 'Todo ha salido perfecto: datos 100% seguros, nueva URL oficial y plataforma más rápida.' })}
          </span>
          {!isMaintenancePage && (
            <Link
              to="/mantenimiento"
              className="inline-flex items-center gap-0.5 text-xs font-extrabold text-emerald-900 dark:text-emerald-200 underline underline-offset-2 hover:text-emerald-950 dark:hover:text-white transition-colors shrink-0 ml-1"
            >
              <span>{t('maintenance_more_info', { defaultValue: 'Más información' })}</span>
              <ArrowRight size={12} className="shrink-0" />
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso definitivamente"
          title="No volver a mostrar este aviso"
          className="p-1 -mr-1 rounded-full text-emerald-800/80 hover:text-emerald-950 dark:text-emerald-200/80 dark:hover:text-white hover:bg-emerald-500/20 active:scale-90 transition-all shrink-0 cursor-pointer"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </aside>
  );
};

export default MaintenanceNoticeBanner;
