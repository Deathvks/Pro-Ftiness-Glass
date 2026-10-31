/* frontend/src/components/MaintenanceNoticeBanner.jsx */
import React from 'react';
import { Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MaintenanceNoticeBanner = ({ className = '', rounded = false, borderBottom = true }) => {
  const { t } = useTranslation();

  return (
    <aside
      aria-label="Aviso de mantenimiento programado"
      className={`w-full bg-amber-500/15 dark:bg-amber-400/15 text-amber-950 dark:text-amber-100 py-1.5 px-3 sm:px-4 backdrop-blur-xl transition-all z-40 flex items-center justify-center ${
        borderBottom ? 'border-b border-amber-500/30' : ''
      } ${rounded ? 'rounded-2xl border border-amber-500/30 shadow-sm' : ''} ${className}`}
    >
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 max-w-7xl mx-auto text-center flex-wrap sm:flex-nowrap leading-tight">
        <div className="inline-flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <Wrench size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="bg-amber-500/25 dark:bg-amber-500/30 border border-amber-500/40 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-amber-950 dark:text-amber-100">
            {t('maintenance_tag', { defaultValue: 'Mantenimiento programado' })}
          </span>
        </div>
        <span className="text-[11px] sm:text-xs font-bold text-amber-950 dark:text-amber-100">
          {t('maintenance_banner_msg', { defaultValue: 'El sábado 7 la web estará fuera de servicio entre 24 a 48 horas.' })}
        </span>
      </div>
    </aside>
  );
};

export default MaintenanceNoticeBanner;
