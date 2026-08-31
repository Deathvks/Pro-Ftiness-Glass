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
  const translatedName = t(exercise.name || '', {
    ns: 'exercise_names',
    defaultValue: exercise.name || '',
  });

  // 2. Traducir músculos
  const rawMuscleGroup = exercise.muscle_group || exercise.category || 'Other';
  const translatedMusclesList = rawMuscleGroup
    .split(',')
    .map((m) => {
      const trimmed = m.trim();
      return t(trimmed, {
        ns: 'exercise_muscles',
        defaultValue: trimmed,
      });
    });

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
      className="flex flex-col bg-black/5 dark:bg-white/5 rounded-[24px] hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group cursor-pointer overflow-hidden shadow-sm"
      onClick={() => onView(exercise)}
    >
      
      {/* Imagen / Medio (Arriba, ancho completo) */}
      <div className="w-full aspect-square bg-transparent flex items-center justify-center transition-transform duration-500 group-hover:scale-105 overflow-hidden rounded-t-[24px]">
        <ExerciseMedia 
          details={exercise}
          fitMode="cover"
          disableAnimation={true}
          className="w-full h-full"
        />
      </div>
      
      {/* Zona de Textos y Botón (Abajo) */}
      <div className="flex flex-col p-4 bg-bg-primary/50 relative z-10 flex-1">
        
        {/* Textos */}
        <div className="flex-1 mb-4">
          <p className="font-bold text-lg text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-tight">
            {translatedName}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {translatedMusclesList.map((muscle, idx) => (
              <span key={idx} className="bg-black/10 dark:bg-white/10 text-text-secondary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px]">
                {muscle}
              </span>
            ))}
          </div>
          <p className="text-xs font-medium text-text-muted line-clamp-2 mt-2">
            {cleanDescription}
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="mt-auto">
          {isReplacing ? (
            <button
              onClick={handleAddClick}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-[16px] transition-all duration-300 bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-accent hover:text-white ring-1 ring-black/5 dark:ring-white/10 hover:ring-accent active:scale-95 shadow-sm font-bold"
              title={t('exercise_ui:replace_with_this', 'Reemplazar con este')}
            >
              <Repeat size={18} strokeWidth={2.5} />
              {t('exercise_ui:replace', 'Reemplazar')}
            </button>
          ) : (
            <button
              onClick={handleAddClick}
              disabled={isStaged}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-[16px] transition-all duration-300 active:scale-95 shadow-sm font-bold ${
                isStaged
                  ? 'bg-green-500/10 text-green-500 ring-1 ring-green-500/30'
                  : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10 hover:bg-accent hover:text-white hover:ring-accent'
              }`}
            >
              {isStaged ? (
                <>
                  <Check size={18} strokeWidth={3} />
                  {t('exercise_ui:added', 'Añadido')}
                </>
              ) : (
                <>
                  <Plus size={18} strokeWidth={2.5} />
                  {t('exercise_ui:add', 'Añadir')}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ExerciseListItem;