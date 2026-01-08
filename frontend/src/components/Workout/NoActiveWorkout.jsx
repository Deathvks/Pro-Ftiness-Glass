/* frontend/src/components/Workout/NoActiveWorkout.jsx */
import React from 'react';
import { Dumbbell, HeartPulse } from 'lucide-react';

/**
 * Componente que se muestra cuando no hay ningún entrenamiento activo.
 */
const NoActiveWorkout = ({ setView, onStartQuickCardio }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-[fade-in_0.5s_ease-out]">
      <div className="bg-bg-secondary/50 p-6 rounded-full mb-6 border border-white/5">
        <Dumbbell size={48} className="text-text-muted opacity-50" />
      </div>

      <h2 className="text-2xl font-bold text-text-primary">No hay entrenamiento activo</h2>
      <p className="text-text-secondary mt-2 max-w-xs mx-auto">
        Empieza una rutina programada o registra una sesión de cardio rápida.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
        <button
          onClick={() => setView('routines')}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-accent text-bg-secondary font-bold text-lg transition-transform active:scale-[0.98] shadow-lg shadow-accent/20"
        >
          <Dumbbell size={20} />
          Ir a Rutinas
        </button>

        <button
          onClick={onStartQuickCardio}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-bg-secondary border border-white/10 text-text-primary font-bold text-lg transition-all active:scale-[0.98] hover:bg-white/5 hover:border-accent/30 group"
        >
          <HeartPulse size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
          Cardio Rápido
        </button>
      </div>
    </div>
  );
};

export default NoActiveWorkout;