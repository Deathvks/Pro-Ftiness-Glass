/* frontend/src/components/RoutineEditor/ExerciseCard.jsx */
import React from 'react';
import { Trash2, GripVertical, Repeat, Image as ImageIcon } from 'lucide-react';
import GlassCard from '../GlassCard';
import ExerciseSearchInput from '../ExerciseSearchInput';
import { useTranslation } from 'react-i18next';

// Clases de input (sin cambios)
const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-3 py-2 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition text-center";

// Nuevas clases para las etiquetas de los inputs (sin cambios)
const baseLabelClasses = "block text-xs font-medium text-text-muted mb-1 text-center";

const ExerciseCard = ({
  exercise,
  // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
  // 1. Eliminamos 'exIndex', ya no se usa en este componente.
  // --- FIN DE LA MODIFICACIÓN ---
  errors,
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  dragHandleProps,
  onReplaceClick,
}) => {

  const { t: tName } = useTranslation('exercise_names');
  const { t: tMuscle } = useTranslation('exercise_muscles');
  const { t: tCommon } = useTranslation('translation');

  const translatedName = tName(exercise.name, { defaultValue: exercise.name });
  const translatedMuscle = tMuscle(exercise.muscle_group, { defaultValue: exercise.muscle_group || '' });

  const handleExerciseSelected = (selectedExercise) => {
    onExerciseSelect(exercise.tempId, selectedExercise);
  };

  const videoUrl = exercise.video_url || (exercise.exercise && exercise.exercise.video_url);
  const imageUrl = exercise.image_url_start || (exercise.exercise && exercise.exercise.image_url_start);
  const mediaUrl = videoUrl || imageUrl;
  
  return (
    <GlassCard className="p-3 bg-bg-secondary/50 relative">
      <div className="flex items-center gap-3">
        
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="flex-shrink-0 text-text-muted cursor-grab"
            title="Arrastrar para reordenar"
          >
            <GripVertical size={18} />
          </div>
        )}

        {/* Columna de Imagen/Video (sin cambios) */}
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-bg-primary border border-glass-border">
          {mediaUrl ? (
            (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm')) ? (
              <video
                src={mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={mediaUrl}
                alt={`Vista previa de ${translatedName}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
              <ImageIcon size={32} />
            </div>
          )
        }
        </div>

        {/* Columna de Información (Nombre, Músculo, Inputs) */}
        <div className="flex-grow min-w-0">
          {/* Input de Búsqueda (sin cambios) */}
          <ExerciseSearchInput
            initialQuery={translatedName}
            onExerciseSelect={handleExerciseSelected}
          />
          
          {/* Grupo Muscular (Input) */}
          <input
            type="text"
            placeholder={tCommon('Grupo Muscular', { defaultValue: 'Grupo Muscular' })}
            value={translatedMuscle}
            // --- INICIO DE LA MODIFICACIÓN ---
            onChange={(e) => onFieldChange(exercise.tempId, 'muscle_group', e.target.value)}
            // --- FIN DE LA MODIFICACIÓN ---
            className="w-full text-sm text-text-secondary capitalize mt-1 truncate bg-transparent border-none p-0 focus:outline-none focus:ring-0"
          />

          {/* Inputs (Series, Reps Y Descanso) */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            
            {/* Series */}
            <div>
              <label className={baseLabelClasses}>
                {tCommon('Series', { defaultValue: 'Series' })}
              </label>
              <input
                type="number"
                placeholder="3"
                value={exercise.sets || ''}
                // --- INICIO DE LA MODIFICACIÓN ---
                onChange={(e) => onFieldChange(exercise.tempId, 'sets', e.target.value)}
                // --- FIN DE LA MODIFICACIÓN ---
                className={baseInputClasses}
              />
              {errors?.sets && <p className="text-red text-xs mt-1">{errors.sets}</p>}
            </div>
            
            {/* Repeticiones */}
            <div>
              <label className={baseLabelClasses}>
                {tCommon('Reps', { defaultValue: 'Reps' })}
              </label>
              <input
                type="text"
                placeholder="8-12"
                value={exercise.reps || ''}
                // --- INICIO DE LA MODIFICACIÓN ---
                onChange={(e) => onFieldChange(exercise.tempId, 'reps', e.target.value)}
                // --- FIN DE LA MODIFICACIÓN ---
                className={baseInputClasses}
              />
              {errors?.reps && <p className="text-red text-xs mt-1">{errors.reps}</p>}
            </div>

            {/* Tiempo de Descanso */}
            <div>
              <label className={baseLabelClasses}>
                {tCommon('Descanso (s)', { defaultValue: 'Descanso (s)' })}
              </label>
              <input
                type="number"
                placeholder="60"
                value={exercise.rest_seconds || ''}
                // --- INICIO DE LA MODIFICACIÓN ---
                onChange={(e) => onFieldChange(exercise.tempId, 'rest_seconds', e.target.value)}
                // --- FIN DE LA MODIFICACIÓN ---
                className={baseInputClasses}
              />
            </div>

          </div>
        </div>

        {/* Columna de Acciones (Reemplazar, Eliminar) (sin cambios) */}
        <div className="flex-shrink-0 flex flex-col justify-center gap-2">
          <button
            // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
            // 2. Pasamos el 'tempId' (string) en lugar del 'exIndex' (number)
            onClick={() => onReplaceClick(exercise.tempId)}
            // --- FIN DE LA MODIFICACIÓN ---
            className="p-2 h-full rounded-md text-text-muted hover:bg-accent/20 hover:text-accent transition"
            title="Reemplazar ejercicio"
          >
            <Repeat size={18} />
          </button>
          <button
            onClick={() => removeExercise(exercise.tempId)}
            className="p-2 h-full rounded-md text-text-muted hover:bg-red/20 hover:text-red transition"
            title="Eliminar ejercicio"
          >
            <Trash2 size={18} />
          </button>
        </div>

      </div>
    </GlassCard>
  );
};

export default ExerciseCard;