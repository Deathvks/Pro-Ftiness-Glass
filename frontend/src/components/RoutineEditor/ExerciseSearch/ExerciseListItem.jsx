/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseListItem.jsx */
import React from 'react';
import { Plus, Check, Repeat } from 'lucide-react';
import { normalizeText } from '../../../utils/helpers';
import ExerciseMedia from '../../ExerciseMedia'; // Importamos el componente inteligente

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
    <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-lg border border-glass-border">
      
      {/* Botón de la imagen delegando al componente inteligente */}
      <button
        onClick={() => onView(exercise)}
        className="shrink-0 rounded-md overflow-hidden w-16 h-16 border border-glass-border flex items-center justify-center bg-bg-primary"
      >
        <ExerciseMedia 
          details={exercise}
          className="w-full h-full object-cover"
        />
      </button>
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onView(exercise)}>
        <p className="font-semibold truncate">{translatedName}</p>
        <p className="text-sm text-text-muted truncate capitalize">
          {translatedMuscle}
        </p>
        <p className="text-sm text-text-secondary truncate">
          {cleanDescription}
        </p>
      </div>

      {isReplacing ? (
        <button
          onClick={handleAddClick}
          className="p-3 rounded-full transition bg-accent/10 text-accent hover:bg-accent/20 active:scale-95"
          title={t('exercise_ui:replace_with_this', 'Reemplazar con este')}
        >
          <Repeat size={20} />
        </button>
      ) : (
        <button
          onClick={handleAddClick}
          disabled={isStaged}
          className={`p-3 rounded-full transition active:scale-95 ${isStaged
            ? 'bg-green/20 text-green'
            : 'bg-accent/10 text-accent hover:bg-accent/20'
            }`}
          title={isStaged ? t('exercise_ui:added', 'Añadido') : t('exercise_ui:add_to_cart', 'Añadir al carrito')}
        >
          {isStaged ? <Check size={20} /> : <Plus size={20} />}
        </button>
      )}
    </div>
  );
};

export default ExerciseListItem;