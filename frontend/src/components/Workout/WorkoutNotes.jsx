/* frontend/src/components/Workout/WorkoutNotes.jsx */
import React from 'react';
import { FileText } from 'lucide-react';
import GlassCard from '../GlassCard';

/**
 * Componente para la sección de "Notas de la Sesión" en la página de Workout.
 * Rediseñado con estética Glass premium.
 */
const WorkoutNotes = ({ notes, setNotes, hasWorkoutStarted, previousNote }) => {
  return (
    <GlassCard className="glass p-6 sm:p-8 mt-6 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 transition-all shadow-md">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
          <div className="p-2.5 bg-accent/10 rounded-[16px] ring-1 ring-accent/30 text-accent shadow-sm shrink-0">
            <FileText size={22} strokeWidth={2.5} />
          </div>
          Notas de la Sesión
        </h2>

        {previousNote?.note && hasWorkoutStarted && (
          <button
            type="button"
            onClick={() => {
              setNotes(prev => prev ? `${prev}\n${previousNote.note}` : previousNote.note);
            }}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 bg-accent/10 px-3 py-1 rounded-full transition-colors active:scale-95"
            title="Copiar nota de la sesión anterior"
          >
            📋 Pegar nota anterior
          </button>
        )}
      </div>
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={
          hasWorkoutStarted
            ? '¿Cómo te sentiste hoy? ¿Algún récord o molestia?...'
            : 'Inicia el cronómetro para añadir notas...'
        }
        className={`w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] px-5 py-4 text-text-primary focus:ring-2 focus:ring-accent/50 outline-none transition-all resize-none font-medium placeholder:text-text-muted shadow-inner ${
          !hasWorkoutStarted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/10 dark:hover:bg-white/10'
        }`}
        rows={4}
        disabled={!hasWorkoutStarted}
        readOnly={!hasWorkoutStarted}
      />
    </GlassCard>
  );
};

export default WorkoutNotes;