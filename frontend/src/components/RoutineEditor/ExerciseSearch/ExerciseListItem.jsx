/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseListItem.jsx */
import React from 'react';
import { Plus, Check, Repeat } from 'lucide-react';
import { useAppTheme } from '../../../hooks/useAppTheme';
// --- INICIO DE LA MODIFICACIÓN ---
import { normalizeText } from '../../../utils/helpers';
// --- FIN DE LA MODIFICACIÓN ---

const ExerciseListItem = ({
  exercise,
  onAdd,
  onView,
  isStaged,
  t,
  isReplacing = false,
}) => {
  const { theme } = useAppTheme();

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

  // 3. Traducir la descripción (Normalizada con la función central)
  const defaultDescription = exercise.description || t('exercise_ui:no_description', 'Sin descripción');

  // --- INICIO DE LA MODIFICACIÓN ---
  // Usamos la función importada
  const descriptionKey = normalizeText(exercise.description);
  // --- FIN DE LA MODIFICACIÓN ---

  // --- INICIO DE LA MODIFICACIÓN (FIX I18N) ---
  const translatedDescription = t(descriptionKey, {
    ns: 'exercise_descriptions',
    defaultValue: defaultDescription,
    // FIX: Ignoramos separadores para que los puntos y dos puntos
    // en la descripción no rompan la búsqueda de la clave.
    nsSeparator: false,
    keySeparator: false
  });
  // --- FIN DE LA MODIFICACIÓN (FIX I18N) ---

  // Limpieza visual
  const cleanDescription = translatedDescription.replace(/<[^>]*>?/gm, '');

  const isOled = theme === 'oled';
  const imageBgClass = isOled ? 'bg-gray-200' : 'bg-bg-primary';

  return (
    <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-xl border border-glass-border">
      <button
        onClick={() => onView(exercise)}
        className={`shrink-0 rounded-md overflow-hidden w-16 h-16 ${imageBgClass} border border-glass-border`}
      >
        <img
          src={exercise.image_url_start || '/logo.webp'}
          alt={`Imagen de ${translatedName}`}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </button>
      <div className="flex-1 min-w-0" onClick={() => onView(exercise)}>
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