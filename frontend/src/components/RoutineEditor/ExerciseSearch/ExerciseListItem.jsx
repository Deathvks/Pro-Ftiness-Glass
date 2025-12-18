/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseListItem.jsx */
import React from 'react';
import { Plus, Check, Repeat } from 'lucide-react';
import { useAppTheme } from '../../../hooks/useAppTheme'; // Importar hook de tema

// Componente de la tarjeta de ejercicio en la lista
const ExerciseListItem = ({
  exercise,
  onAdd,
  onView,
  isStaged,
  t,
  isReplacing = false,
}) => {
  const { theme } = useAppTheme(); // Usar hook

  const handleAddClick = (e) => {
    e.stopPropagation();
    onAdd(exercise);
  };

  const muscleGroup = exercise.category || exercise.muscle_group;

  // 1. Traducir el nombre del ejercicio
  const translatedName = t(exercise.name, {
    ns: 'exercise_names',
    defaultValue: exercise.name,
  });

  // 2. Traducir la descripción
  const descriptionKey = exercise.description;
  const defaultDescription = exercise.description || t('exercise_ui:no_description', 'Sin descripción');

  const translatedDescription = t(descriptionKey, {
    ns: 'exercise_descriptions',
    defaultValue: defaultDescription,
  });

  // Lógica OLED para la miniatura
  const isOled = theme === 'oled';
  const imageBgClass = isOled ? 'bg-gray-200' : 'bg-bg-primary';

  return (
    <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-xl border border-glass-border">
      <button
        onClick={() => onView(exercise)}
        // Aplicar clase de fondo dinámica
        className={`shrink-0 rounded-md overflow-hidden w-16 h-16 ${imageBgClass} border border-glass-border`}
      >
        <img
          src={exercise.image_url_start || '/logo.webp'}
          alt={`Imagen de ${translatedName}`}
          // Cambiamos a object-contain para asegurar que la silueta se vea entera
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </button>
      <div className="flex-1 min-w-0" onClick={() => onView(exercise)}>
        <p className="font-semibold truncate">{translatedName}</p>
        <p className="text-sm text-text-muted truncate capitalize">
          {t(`exercise_muscles:${muscleGroup}`, { defaultValue: muscleGroup })}
        </p>
        <p className="text-sm text-text-secondary truncate">
          {translatedDescription}
        </p>
      </div>

      {isReplacing ? (
        <button
          onClick={handleAddClick}
          className="p-3 rounded-full transition bg-accent/10 text-accent hover:bg-accent/20"
          title={t('exercise_ui:replace_with_this', 'Reemplazar con este')}
        >
          <Repeat size={20} />
        </button>
      ) : (
        <button
          onClick={handleAddClick}
          disabled={isStaged}
          className={`p-3 rounded-full transition ${isStaged
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