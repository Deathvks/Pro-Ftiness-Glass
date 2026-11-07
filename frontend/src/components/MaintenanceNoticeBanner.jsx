/* frontend/src/components/MaintenanceNoticeBanner.jsx */
import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

const MaintenanceNoticeBanner = ({
  className = '',
  rounded = false,
  borderBottom = true,
  withSafeArea = false,
  style = {}
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const isRounded = rounded || className.includes('rounded');
  const needsSafeArea = withSafeArea || className.includes('with-safe-area') || className.includes('safe-top');
  const isMaintenancePage = location?.pathname === '/mantenimiento' || location?.pathname === '/migracion';

  const computedStyle = {
    ...(needsSafeArea ? { paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 0.35rem)' } : {}),
    ...style
  };

  return (
    <aside
      aria-label="Aviso de migración completada"
      style={computedStyle}
      className={`w-full bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-950 dark:text-emerald-100 ${
        needsSafeArea ? 'pb-1' : 'py-1 sm:py-1.5'
      } px-2.5 sm:px-4 md:backdrop-blur-xl transition-colors flex items-center justify-center shrink-0 ${
        borderBottom && !isRounded ? 'border-b border-emerald-500/30' : ''
      } ${rounded ? 'rounded-2xl border border-emerald-500/30 shadow-sm' : ''} ${className}`}
    >
      {/* Versión Móvil: 1 sola línea ultracompacta que no ocupa espacio vertical */}
      {!isMaintenancePage ? (
        <Link
          to="/mantenimiento"
          className="flex sm:hidden items-center justify-center gap-1.5 w-full text-center leading-none text-[11px] font-semibold text-emerald-950 dark:text-emerald-100 hover:opacity-90 active:scale-[0.99] transition-opacity py-0.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-bold whitespace-nowrap">
            {t('maintenance_banner_msg_mobile', { defaultValue: '¡Migración completada con éxito!' })}
          </span>
          <span className="inline-flex items-center gap-0.5 font-black text-emerald-900 dark:text-emerald-200 underline underline-offset-2 ml-0.5 shrink-0">
            <span>{t('maintenance_more_info_short', { defaultValue: '+Info' })}</span>
            <ArrowRight size={10} className="shrink-0" />
          </span>
        </Link>
      ) : (
        <div className="flex sm:hidden items-center justify-center gap-1.5 w-full text-center leading-none text-[11px] font-semibold text-emerald-950 dark:text-emerald-100 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-bold whitespace-nowrap">
            {t('maintenance_banner_msg_mobile', { defaultValue: '¡Migración completada con éxito!' })}
          </span>
        </div>
      )}

      {/* Versión Desktop / Tablet: diseño completo con badge y texto extendido */}
      <div className="hidden sm:flex items-center justify-center gap-2 max-w-7xl mx-auto text-center leading-tight">
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
    </aside>
  );
};

export default MaintenanceNoticeBanner;
