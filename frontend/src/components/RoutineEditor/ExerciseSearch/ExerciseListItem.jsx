/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseListItem.jsx */
import React from 'react';
import { Plus, Check } from 'lucide-react';

// Componente de la tarjeta de ejercicio en la lista
const ExerciseListItem = ({ exercise, onAdd, onView, isStaged, t }) => {
  const handleAddClick = (e) => {
    e.stopPropagation();
    onAdd(exercise);
  };

  const muscleGroup = exercise.category || exercise.muscle_group;

  // --- INICIO DE LA MODIFICACIÓN ---

  // 1. Traducir el nombre del ejercicio
  const translatedName = t(exercise.name, {
    ns: 'exercise_names',
    defaultValue: exercise.name,
  });

  // 2. Traducir la descripción
  
  // La clave en 'exercises.json' es la descripción original en inglés.
  // Usamos 'exercise.description' (ej: "The Bird Dog is...") como la clave.
  const descriptionKey = exercise.description;
  
  // El valor por defecto es la propia descripción en inglés (por si falla la búsqueda)
  const defaultDescription = exercise.description || t('exercise_ui:no_description', 'Sin descripción');
  
  // Buscamos la clave (la descripción en inglés) en el namespace 'exercise_descriptions'
  // (Asumiendo que tienes un namespace 'exercise_descriptions'. Si no, ajusta 'ns')
  const translatedDescription = t(descriptionKey, {
    ns: 'exercise_descriptions', // Asegúrate de que este namespace exista en tu i18n.js
    defaultValue: defaultDescription,
  });
  // --- FIN DE LA MODIFICACIÓN ---


  return (
    <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-xl border border-glass-border">
      <button
        onClick={() => onView(exercise)}
        className="shrink-0 rounded-md overflow-hidden w-16 h-16 bg-bg-primary border border-glass-border"
      >
        <img
          src={exercise.image_url_start || '/logo.webp'}
          alt={`Imagen de ${translatedName}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>
      <div className="flex-1 min-w-0" onClick={() => onView(exercise)}>
        <p className="font-semibold truncate">{translatedName}</p> {/* Usar nombre traducido */}
        <p className="text-sm text-text-muted truncate capitalize">
          {/* Esto ya funcionaba: usa el namespace 'exercise_muscles' */}
          {t(`exercise_muscles:${muscleGroup}`, { defaultValue: muscleGroup })}
        </p>
        <p className="text-sm text-text-secondary truncate">
          {translatedDescription} {/* Usar descripción traducida */}
        </p>
      </div>
      <button
        onClick={handleAddClick}
        disabled={isStaged}
        className={`p-3 rounded-full transition ${
          isStaged
            ? 'bg-green/20 text-green'
            : 'bg-accent/10 text-accent hover:bg-accent/20'
        }`}
        title={isStaged ? t('exercise_ui:added', 'Añadido') : t('exercise_ui:add_to_cart', 'Añadir al carrito')}
      >
        {isStaged ? <Check size={20} /> : <Plus size={20} />}
      </button>
    </div>
  );
};

export default ExerciseListItem;