/* frontend/src/components/Workout/NoActiveWorkout.jsx */
import React, { useMemo } from 'react';
import { Dumbbell, HeartPulse, CloudOff, RefreshCw } from 'lucide-react';
import GlassCard from '../GlassCard';
import useAppStore from '../../store/useAppStore';

/**
 * Componente que se muestra cuando no hay ningún entrenamiento activo.
 */
const NoActiveWorkout = ({ setView, onStartQuickCardio }) => {
  const syncQueue = useAppStore((state) => state.syncQueue || []);
  const isSyncing = useAppStore((state) => state.isSyncing || false);

  const pendingWorkoutsCount = useMemo(() => {
    return syncQueue.filter(item => item.endpoint === '/workouts' || item.endpoint?.startsWith('/workouts')).length;
  }, [syncQueue]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 sm:p-6 animate-[fade-in_0.5s_ease-out]">
      {pendingWorkoutsCount > 0 && (
        <div className="w-full max-w-lg mb-4 p-3.5 sm:p-4 rounded-2xl glass border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 text-xs animate-[fade-in_0.3s_ease-out]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <CloudOff size={18} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-amber-600 dark:text-amber-400 block truncate text-xs sm:text-sm">
                {pendingWorkoutsCount === 1 ? '1 entrenamiento guardado en tu móvil' : `${pendingWorkoutsCount} entrenamientos guardados en tu móvil`}
              </span>
              <span className="text-[11px] text-text-secondary block">
                Se sincronizará con la nube al recuperar conexión
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('pfg-trigger-sync'))}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? 'Subiendo...' : 'Sincronizar'}</span>
          </button>
        </div>
      )}

      <GlassCard className="glass flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-lg w-full rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-xl transition-all">
        
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-bg-primary rounded-[24px] flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
          <Dumbbell size={40} className="text-text-muted opacity-50" strokeWidth={1.5} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-3 tracking-tight">
          Sin entrenamiento activo
        </h2>
        
        <p className="text-text-secondary text-sm sm:text-base font-medium max-w-xs mx-auto leading-relaxed mb-10">
          Empieza una rutina programada o registra una sesión de cardio rápida.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={() => setView('routines')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[20px] bg-accent text-accent-contrast font-bold text-base transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-accent/20"
          >
            <Dumbbell size={20} strokeWidth={2.5} />
            Ir a Rutinas
          </button>

          <button
            onClick={onStartQuickCardio}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[20px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary font-bold text-base transition-all hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 group"
          >
            <HeartPulse size={20} strokeWidth={2.5} className="text-red group-hover:scale-110 transition-transform" />
            Cardio Rápido
          </button>
        </div>
        
      </GlassCard>
    </div>
  );
};

export default NoActiveWorkout;
