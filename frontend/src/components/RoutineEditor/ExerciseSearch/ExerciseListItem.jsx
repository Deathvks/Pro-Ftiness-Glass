/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseListItem.jsx */
import React from 'react';
import { Plus, Check, Repeat } from 'lucide-react';
import { normalizeText } from '../../../utils/helpers';
import ExerciseMedia from '../../ExerciseMedia';

const ExerciseListItem = ({
  exercise,
  onAdd,
  onView,
  isStaged,
  t,
  isReplacing = false,
}) => {
  const handleAddClick = (e) => {
    e.stopPropagation();
    onAdd(exercise);
  };

  // 1. Traducir el nombre
  const translatedName = t(exercise.name, {
    ns: 'exercise_names',
    defaultValue: exercise.name,
  });

  // 2. Traducir músculos
  const rawMuscleGroup = exercise.muscle_group || exercise.category || 'Other';
  const translatedMuscle = rawMuscleGroup
    .split(',')
    .map((m) => {
      const trimmed = m.trim();
      return t(trimmed, {
        ns: 'exercise_muscles',
        defaultValue: trimmed,
      });
    })
    .join(', ');

  // 3. Traducir la descripción
  const defaultDescription = exercise.description || t('exercise_ui:no_description', 'Sin descripción');
  const descriptionKey = normalizeText(exercise.description);

  const translatedDescription = t(descriptionKey, {
    ns: 'exercise_descriptions',
    defaultValue: defaultDescription,
    nsSeparator: false,
    keySeparator: false
  });

  const cleanDescription = translatedDescription.replace(/<[^>]*>?/gm, '');

  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-[24px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group cursor-pointer"
      onClick={() => onView(exercise)}
    >
      
      {/* Imagen / Medio */}
      <div className="shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-[16px] overflow-hidden bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center shadow-sm p-1.5 transition-transform duration-300 group-hover:scale-105">
        <ExerciseMedia 
          details={exercise}
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Textos */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-base text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-tight">
          {translatedName}
        </p>
        <p className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider truncate mt-1">
          {translatedMuscle}
        </p>
        <p className="text-xs font-medium text-text-muted truncate mt-0.5">
          {cleanDescription}
        </p>
      </div>

      {/* Botones de Acción */}
      <div className="shrink-0 ml-2">
        {isReplacing ? (
          <button
            onClick={handleAddClick}
            className="p-3.5 rounded-[16px] transition-all duration-300 bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-accent hover:text-white ring-1 ring-black/5 dark:ring-white/10 hover:ring-accent active:scale-95 shadow-sm"
            title={t('exercise_ui:replace_with_this', 'Reemplazar con este')}
          >
            <Repeat size={20} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onClick={handleAddClick}
            disabled={isStaged}
            className={`p-3.5 rounded-[16px] transition-all duration-300 active:scale-95 shadow-sm ${
              isStaged
                ? 'bg-green-500/10 text-green-500 ring-1 ring-green-500/30'
                : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10 hover:bg-accent hover:text-white hover:ring-accent'
            }`}
            title={isStaged ? t('exercise_ui:added', 'Añadido') : t('exercise_ui:add_to_cart', 'Añadir al carrito')}
          >
            {isStaged ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={2.5} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExerciseListItem;