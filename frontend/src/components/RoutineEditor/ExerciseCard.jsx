/* frontend/src/components/RoutineEditor/ExerciseCard.jsx */
import React from 'react';
import { Trash2, GripVertical, Repeat, Image as ImageIcon } from 'lucide-react';
import GlassCard from '../GlassCard';
import ExerciseSearchInput from '../ExerciseSearchInput';
import { useTranslation } from 'react-i18next';
// 1. Importamos el nuevo componente
import EditableMuscleGroup from './EditableMuscleGroup';

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
  // 2. Eliminamos 'tMuscle' y 'translatedMuscle' ya que no se usan más.
  const { t: tCommon } = useTranslation('translation');

  const translatedName = tName(exercise.name, { defaultValue: exercise.name });

  const handleExerciseSelected = (selectedExercise) => {
    onExerciseSelect(exercise.tempId, selectedExercise);
  };

  const videoUrl = exercise.video_url || (exercise.exercise && exercise.exercise.video_url);
  const imageUrl = exercise.image_url_start || (exercise.exercise && exercise.exercise.image_url_start);
  const mediaUrl = videoUrl || imageUrl;
  
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

        {/* --- INICIO DE LA MODIFICACIÓN (IMAGE BLOCK) --- */}
        {/* Bloque de Imagen/Video */}
        {/* En móvil: ocupa el ancho completo, h-40. 
            En sm: ocupa 40% (sm:w-2/5) y altura h-40 (misma que en móvil). */}
        <div className="flex-shrink-0 w-full h-40 sm:w-2/5 sm:h-40 rounded-md overflow-hidden bg-bg-primary border border-glass-border mb-3 sm:mb-0">
        {/* --- FIN DE LA MODIFICACIÓN (IMAGE BLOCK) --- */}
          {mediaUrl ? (
            (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm')) ? (
              <video
                src={mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                /* --- INICIO DE LA MODIFICACIÓN (Image fit) --- */
                // Cambiamos 'object-cover' a 'object-contain'
                className="w-full h-full object-contain"
                /* --- FIN DE LA MODIFICACIÓN (Image fit) --- */
              />
            ) : (
              <img
                src={mediaUrl}
                alt={`Vista previa de ${translatedName}`}
                /* --- INICIO DE LA MODIFICACIÓN (Image fit) --- */
                // Cambiamos 'object-cover' a 'object-contain'
                className="w-full h-full object-contain"
                /* --- FIN DE la MODIFICACIÓN (Image fit) --- */
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
        {/* Hacemos que este contenedor use flex-col y centre sus items en móvil,
            y que se estire (comportamiento normal) en 'sm' y más grande */}
        {/* Añadimos 'sm:w-3/5' para que ocupe el 60% restante en desktop */}
        <div className="flex-grow min-w-0 w-full sm:w-3/5 flex flex-col items-center sm:items-stretch">
        
          {/* Input de Búsqueda (sin cambios) */}
          <ExerciseSearchInput
            initialQuery={translatedName}
            onExerciseSelect={handleExerciseSelected}
            className="w-full" // Añadido para asegurar el stretch en desktop
          />
          
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          {/* Añadimos 'mt-2' para separación superior */}
          <div className="mt-2">
            {/* Cambiamos 'text-center' (de baseLabelClasses) a 'text-left' */}
            <label className="block text-xs font-medium text-text-muted mb-1 text-left">
              {tCommon('Grupo Muscular', { defaultValue: 'Grupo Muscular' })}
            </label>
            <EditableMuscleGroup
              initialValue={exercise.muscle_group || ''}
              onSave={(newValue) => onFieldChange(exercise.tempId, 'muscle_group', newValue)}
              isManual={exercise.is_manual}
            />
          </div>
          {/* --- FIN DE LA MODIFICACIÓN --- */}

          {/* Inputs (Series, Reps Y Descanso) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 w-full">
            
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
        <div className="absolute top-3 right-3 sm:static flex sm:flex-col justify-end sm:justify-center gap-1 sm:gap-2">
          <button
            // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
            // 2. Pasamos el 'tempId' (string) en lugar del 'exIndex' (number)
            onClick={() => onReplaceClick(exercise.tempId)}
            // --- FIN DE LA MODIFICACIÓN ---
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