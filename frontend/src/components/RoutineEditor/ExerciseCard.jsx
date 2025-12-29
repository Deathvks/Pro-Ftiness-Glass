/* frontend/src/components/RoutineEditor/ExerciseCard.jsx */
import React from 'react';
import { Trash2, GripVertical, Repeat, Image as ImageIcon } from 'lucide-react';
import GlassCard from '../GlassCard';
import ExerciseSearchInput from '../ExerciseSearchInput';
import { useTranslation } from 'react-i18next';
// 1. Importamos el nuevo componente
import EditableMuscleGroup from './EditableMuscleGroup';
// Importamos el hook de tema para detectar OLED
import { useAppTheme } from '../../hooks/useAppTheme';

// Clases de input (sin cambios)
const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-3 py-2 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition text-center";

// Nuevas clases para las etiquetas de los inputs (sin cambios)
const baseLabelClasses = "block text-xs font-medium text-text-muted mb-1 text-center";

const ExerciseCard = ({
  exercise,
  // 1. Eliminamos 'exIndex', ya no se usa en este componente.
  errors,
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  dragHandleProps,
  onReplaceClick,
}) => {

  const { t: tName } = useTranslation('exercise_names');
  // --- INICIO MODIFICACIÓN: Importamos traducción de músculos ---
  const { t: tMuscles } = useTranslation('exercise_muscles');
  // --- FIN MODIFICACIÓN ---
  const { t: tCommon } = useTranslation('translation');
  const { theme } = useAppTheme();

  const translatedName = tName(exercise.name, { defaultValue: exercise.name });

  // --- INICIO DE LA MODIFICACIÓN (Traducción de Músculos Múltiples) ---
  // Si el ejercicio no es manual (viene de la BD), puede tener múltiples músculos (ej: "Arms, Forearms").
  // Los separamos y traducimos individualmente para evitar que salga "Arms, Forearms" sin traducir.
  const displayMuscleGroup = React.useMemo(() => {
    if (exercise.is_manual) return exercise.muscle_group; // Si es manual, se usa la clave tal cual
    if (!exercise.muscle_group) return '';

    return exercise.muscle_group
      .split(',')
      .map(m => {
        const key = m.trim();
        // Traducimos cada parte individualmente
        return tMuscles(key, { defaultValue: key });
      })
      .join(', ');
  }, [exercise.muscle_group, exercise.is_manual, tMuscles]);
  // --- FIN DE LA MODIFICACIÓN ---

  const handleExerciseSelected = (selectedExercise) => {
    onExerciseSelect(exercise.tempId, selectedExercise);
  };

  const videoUrl = exercise.video_url || (exercise.exercise && exercise.exercise.video_url);
  const imageUrl = exercise.image_url_start || (exercise.exercise && exercise.exercise.image_url_start);
  const mediaUrl = videoUrl || imageUrl;

  // Lógica de contraste para OLED:
  const isOled = theme === 'oled';
  const isVideo = mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm'));
  const containerBgClass = (!isVideo && isOled) ? 'bg-gray-200' : 'bg-bg-primary';

  return (
    <GlassCard className="p-3 bg-bg-secondary/50 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-start gap-3">

        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="flex-shrink-0 text-text-muted cursor-grab self-start sm:self-start mt-1 sm:mt-0 sm:pt-2"
            title="Arrastrar para reordenar"
          >
            <GripVertical size={18} />
          </div>
        )}

        {/* Bloque de Imagen/Video */}
        <div className={`flex-shrink-0 w-full h-40 sm:w-2/5 sm:h-40 rounded-md overflow-hidden ${containerBgClass} border border-glass-border mb-3 sm:mb-0`}>
          {mediaUrl ? (
            (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm')) ? (
              <video
                src={mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={mediaUrl}
                alt={`Vista previa de ${translatedName}`}
                className="w-full h-full object-contain"
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
        <div className="flex-grow min-w-0 w-full sm:w-3/5 flex flex-col items-center sm:items-stretch">

          {/* Input de Búsqueda */}
          <ExerciseSearchInput
            initialQuery={translatedName}
            onExerciseSelect={handleExerciseSelected}
            className="w-full"
          />

          {/* Grupo Muscular */}
          <div className="mt-2">
            <label className="block text-xs font-medium text-text-muted mb-1 text-left">
              {tCommon('Grupo Muscular', { defaultValue: 'Grupo Muscular' })}
            </label>
            <EditableMuscleGroup
              // --- INICIO MODIFICACIÓN: Pasamos el string ya traducido ---
              initialValue={displayMuscleGroup || ''}
              // --- FIN MODIFICACIÓN ---
              onSave={(newValue) => onFieldChange(exercise.tempId, 'muscle_group', newValue)}
              isManual={exercise.is_manual}
            />
          </div>

          {/* Inputs (Series, Reps Y Descanso) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 w-full">

            {/* Series */}
            <div>
              <label className={baseLabelClasses}>
                {tCommon('Series', { defaultValue: 'Series' })}
              </label>
              <input
                type="number"
                min="1"
                placeholder="3"
                value={exercise.sets || ''}
                onChange={(e) => onFieldChange(exercise.tempId, 'sets', e.target.value)}
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
                onChange={(e) => onFieldChange(exercise.tempId, 'reps', e.target.value)}
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
                min="0"
                placeholder="60"
                value={exercise.rest_seconds || ''}
                onChange={(e) => onFieldChange(exercise.tempId, 'rest_seconds', e.target.value)}
                className={baseInputClasses}
              />
            </div>

          </div>
        </div>

        {/* Columna de Acciones (Reemplazar, Eliminar) */}
        <div className="absolute top-3 right-3 sm:static flex sm:flex-col justify-end sm:justify-center gap-1 sm:gap-2">
          <button
            onClick={() => onReplaceClick(exercise.tempId)}
            className="p-1 sm:p-2 rounded-md text-text-muted hover:bg-accent/20 hover:text-accent transition"
            title="Reemplazar ejercicio"
          >
            <Repeat size={18} />
          </button>
          <button
            onClick={() => removeExercise(exercise.tempId)}
            className="p-1 sm:p-2 rounded-md text-text-muted hover:bg-red/20 hover:text-red transition"
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