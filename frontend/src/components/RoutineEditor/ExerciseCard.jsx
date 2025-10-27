/* frontend/src/components/RoutineEditor/ExerciseCard.jsx */
import React from 'react';
import { Trash2 } from 'lucide-react';
import GlassCard from '../GlassCard';
// --- INICIO DE LA MODIFICACIÓN ---
// Cambiamos ExerciseSearch por ExerciseSearchInput
import ExerciseSearchInput from '../ExerciseSearchInput';
import { useTranslation } from 'react-i18next'; // <-- Añadido
// --- FIN DE LA MODIFICACIÓN ---

const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

const ExerciseCard = ({
  exercise,
  exIndex,
  // Ya no necesitamos isActive, onOpen, onClose
  errors,
  onFieldChange,
  onExerciseSelect,
  onRemove,
}) => {

  // --- INICIO DE LA MODIFICACIÓN ---
  // Añadimos hooks de traducción
  const { t } = useTranslation('exercises'); // Para datos (ej. 'Chest')
  const { t: tCommon } = useTranslation('translation'); // Para UI (ej. 'Grupo Muscular')
  // --- FIN DE LA MODIFICACIÓN ---


  // --- INICIO DE LA MODIFICACIÓN ---
  // Adaptamos el handler para que funcione con ExerciseSearchInput
  const handleExerciseSelected = (selectedExercise) => {
      onExerciseSelect(exIndex, selectedExercise);
  };
  // --- FIN DE LA MODIFICACIÓN ---

  return (
    // --- INICIO DE LA MODIFICACIÓN ---
    // Añadimos 'relative' y 'pb-64' al contenedor para dar espacio al dropdown
    <GlassCard className="p-4 bg-bg-secondary/50 relative pb-64">
    {/* --- FIN DE LA MODIFICACIÓN --- */}
      <div className="flex items-start gap-2 mb-4">
        <div className="flex-grow">
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          {/* Usamos ExerciseSearchInput en lugar de ExerciseSearch */}
          <ExerciseSearchInput
              // Traducimos el nombre inicial
              initialQuery={t(exercise.name, { defaultValue: exercise.name })} // <-- Modificado
              onExerciseSelect={handleExerciseSelected}
              // También necesitamos un handler para cuando se escribe manualmente
              // sin seleccionar de la lista. Podríamos usar onBlur o onChange.
              // Por ahora, usamos onBlur para actualizar el nombre manual.
              onBlur={(e) => {
                  // Si el valor actual del input es diferente al nombre guardado
                  // Y no se ha seleccionado un ejercicio de la lista (exercise_list_id es null)
                  
                  // --- Modificado ---
                  // Comparamos con el valor traducido y el original por si acaso
                  const translatedName = t(exercise.name, { defaultValue: exercise.name });
                  if (e.target.value !== translatedName && e.target.value !== exercise.name && !exercise.exercise_list_id) {
                     // Guardamos el valor *sin traducir* que el usuario escribió
                     onFieldChange(exIndex, 'name', e.target.value);
                  }
                  // --- Fin Modificado ---
              }}
          />
          {/* --- FIN DE LA MODIFICACIÓN --- */}
        </div>
        <div className="flex-shrink-0 pt-1">
          <button
            onClick={() => onRemove(exIndex)} // Pasamos solo el índice
            className="p-2 h-full rounded-md text-text-muted hover:bg-red/20 hover:text-red transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <input
            type="number"
            // --- Modificado ---
            placeholder={tCommon('Series', { defaultValue: 'Series' })}
            // --- Fin Modificado ---
            value={exercise.sets || ''}
            onChange={(e) => onFieldChange(exIndex, 'sets', e.target.value)}
            className={baseInputClasses}
          />
          {errors?.sets && <p className="text-red text-xs mt-1">{errors.sets}</p>}
        </div>
        <div>
          <input
            type="text"
            // --- Modificado ---
            placeholder={tCommon('Reps (ej: 8-12)', { defaultValue: 'Reps (ej: 8-12)' })}
            // --- Fin Modificado ---
            value={exercise.reps || ''}
            onChange={(e) => onFieldChange(exIndex, 'reps', e.target.value)}
            className={baseInputClasses}
          />
          {errors?.reps && <p className="text-red text-xs mt-1">{errors.reps}</p>}
        </div>
        <input
          type="text"
          // --- Modificado ---
          placeholder={tCommon('Grupo Muscular', { defaultValue: 'Grupo Muscular' })}
          // Traducimos el valor que viene de la BD
          value={t(exercise.muscle_group, { defaultValue: exercise.muscle_group || '' })}
          // --- Fin Modificado ---
          onChange={(e) => onFieldChange(exIndex, 'muscle_group', e.target.value)}
          className={baseInputClasses}
        />
      </div>
    </GlassCard>
  );
};

export default ExerciseCard;