/* frontend/src/components/RoutineEditor/ExerciseCard.jsx */
import React from 'react';
import { Trash2, GripVertical, Repeat, Image as ImageIcon } from 'lucide-react';
import GlassCard from '../GlassCard';
import ExerciseSearchInput from '../ExerciseSearchInput';
import { useTranslation } from 'react-i18next';

// Clases de input (sin cambios)
const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-3 py-2 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition text-center";

// --- INICIO MODIFICACIÓN ---
// Nuevas clases para las etiquetas de los inputs
const baseLabelClasses = "block text-xs font-medium text-text-muted mb-1 text-center";
// --- FIN MODIFICACIÓN ---

const ExerciseCard = ({
  exercise,
  exIndex,
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
    onExerciseSelect(exIndex, selectedExercise);
  };

  // --- INICIO MODIFICACIÓN (FIX IMAGEN) ---
  // Arreglado: Usamos 'image_url_start' en lugar de 'image_url'
  const mediaUrl = exercise.video_url || exercise.image_url_start;
  // --- FIN MODIFICACIÓN (FIX IMAGEN) ---

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

        {/* Columna de Imagen/Video (Lógica de renderizado sin cambios) */}
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
          )}
        </div>

        {/* Columna de Información (Nombre, Músculo, Inputs) */}
        <div className="flex-grow min-w-0">
          {/* Input de Búsqueda (Nombre) */}
          <ExerciseSearchInput
            initialQuery={translatedName}
            onExerciseSelect={handleExerciseSelected}
          />
          
          {/* Grupo Muscular */}
          <p className="text-sm text-text-secondary capitalize mt-1 truncate">
            {translatedMuscle || tCommon('Grupo Muscular', { defaultValue: 'Grupo Muscular' })}
          </p>

          {/* --- INICIO MODIFICACIÓN (LABELS Y TIEMPO) --- */}
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
                onChange={(e) => onFieldChange(exIndex, 'sets', e.target.value)}
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
                onChange={(e) => onFieldChange(exIndex, 'reps', e.target.value)}
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
                value={exercise.rest_time || ''}
                onChange={(e) => onFieldChange(exIndex, 'rest_time', e.target.value)}
                className={baseInputClasses}
              />
            </div>

          </div>
          {/* --- FIN MODIFICACIÓN (LABELS Y TIEMPO) --- */}
        </div>

        {/* Columna de Acciones (Reemplazar, Eliminar) */}
        <div className="flex-shrink-0 flex flex-col justify-center gap-2">
          <button
            onClick={() => onReplaceClick(exIndex)} // exIndex (del map)
            className="p-2 h-full rounded-md text-text-muted hover:bg-accent/20 hover:text-accent transition"
            title="Reemplazar ejercicio"
          >
            <Repeat size={18} />
          </button>
          <button
            onClick={() => removeExercise(exercise.tempId)} // tempId (del objeto)
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