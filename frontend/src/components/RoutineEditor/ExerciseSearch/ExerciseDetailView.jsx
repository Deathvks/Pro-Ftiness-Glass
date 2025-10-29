/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseDetailView.jsx */
import React, { useState } from 'react';
import { ChevronLeft, Plus, Check } from 'lucide-react';

// Componente para la vista de detalle
const ExerciseDetailView = ({ exercise, onBack, onAdd, isStaged, t }) => {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('8-12');
  const [rest, setRest] = useState(60);

  const handleAddClick = () => {
    // --- INICIO DE LA MODIFICACIÓN (FIX) ---
    // El nombre de la propiedad debe ser 'rest_seconds' para que 
    // ExerciseSearch.jsx (handleStageExercise) lo reconozca.
    // Antes era 'rest_time'.
    onAdd(exercise, { sets, reps, rest_seconds: rest });
    // --- FIN DE LA MODIFICACIÓN (FIX) ---
  };

  // --- INICIO DE LA MODIFICACIÓN ---

  // 1. Traducir el nombre (usando namespace 'exercise_names')
  const translatedName = t(exercise.name, {
    ns: 'exercise_names',
    defaultValue: exercise.name,
  });

  // 2. Traducir grupo muscular (usando 'exercise_muscles')
  const muscleGroup = exercise.category || exercise.muscle_group;
  const translatedMuscle = t(muscleGroup, { // Se traduce la clave "Chest", "Legs", etc.
    ns: 'exercise_muscles',
    defaultValue: muscleGroup,
  });

  // 3. Traducir equipamiento (usando 'exercise_equipment')
  // Tomamos el primer equipamiento si hay una lista (ej: "Dumbbell, Bench")
  const equipment = exercise.equipment || 'None'; // Asegurarse de que 'none' sea 'None'
  const equipmentKey = equipment.split(',')[0].trim();
  const translatedEquipment = t(equipmentKey, { // Se traduce la clave "Dumbbell", "Barbell", etc.
    ns: 'exercise_equipment',
    defaultValue: equipment, // Fallback a la lista completa si no hay traducción
  });
  
  // 4. Traducir la descripción
  // La clave en 'exercises.json' es la descripción original en inglés.
  // Usamos 'exercise.description' (ej: "The Bird Dog is...") como la clave.
  const descriptionKey = exercise.description;
  
  // El valor por defecto es la propia descripción en inglés (por si falla la búsqueda)
  const defaultDescription = exercise.description || t('exercise_ui:no_description_available', 'No hay descripción disponible.');
  
  // Buscamos la clave (la descripción en inglés) en el namespace 'exercise_descriptions'
  const translatedDescription = t(descriptionKey, {
    ns: 'exercise_descriptions',
    defaultValue: defaultDescription,
  });
  
  // --- FIN DE LA MODIFICACIÓN ---


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-glass-border">
        <button onClick={onBack} className="flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-white/10">
          <ChevronLeft size={24} />
          <span className="font-semibold">{t('exercise_ui:back', 'Volver')}</span>
        </button>
        <h2 className="text-xl font-bold truncate px-4">
          {translatedName} {/* Usar nombre traducido */}
        </h2>
        <div className="w-16"></div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Visor de medios */}
        <div className="mb-6 aspect-video bg-bg-primary rounded-xl border border-glass-border overflow-hidden flex items-center justify-center">
          {exercise.video_url ? (
            <video
              src={exercise.video_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex gap-4 w-full h-full p-4">
              <img
                src={exercise.image_url_start || '/logo.webp'}
                alt={`Inicio de ${translatedName}`}
                className="w-1/2 h-full object-contain"
              />
              <img
                src={exercise.image_url_end || exercise.image_url_start || '/logo.webp'}
                alt={`Fin de ${translatedName}`}
                className="w-1/2 h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Información */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-bg-secondary p-4 rounded-lg border border-glass-border">
            <p className="text-sm text-text-muted">{t('exercise_ui:muscle_group', 'Grupo Muscular')}</p>
            <p className="font-semibold capitalize">
              {translatedMuscle} {/* Usar músculo traducido */}
            </p>
          </div>
          <div className="bg-bg-secondary p-4 rounded-lg border border-glass-border">
            <p className="text-sm text-text-muted">{t('exercise_ui:equipment', 'Equipamiento')}</p>
            <p className="font-semibold capitalize">
              {translatedEquipment} {/* Usar equipamiento traducido */}
            </p>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <h3 className="text-lg font-semibold mb-2">{t('exercise_ui:description', 'Descripción')}</h3>
          <p className="text-text-secondary whitespace-pre-line leading-relaxed">
            {translatedDescription} {/* Usar descripción traducida */}
          </p>
        </div>
      </div>

      {/* Footer (Formulario y Añadir) */}
      <div className="flex-shrink-0 p-4 border-t border-glass-border bg-bg-primary/80 backdrop-blur-sm">
        {/* Inputs */}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="text-xs text-text-muted">{t('exercise_ui:sets', 'Series')}</label>
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              className="w-full text-center px-3 py-2 rounded-md bg-bg-secondary border border-glass-border"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted">{t('exercise_ui:reps', 'Reps')}</label>
            <input
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full text-center px-3 py-2 rounded-md bg-bg-secondary border border-glass-border"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted">{t('exercise_ui:rest_s', 'Desc. (s)')}</label>
            <input
              type="number"
              value={rest}
              onChange={(e) => setRest(Number(e.target.value))}
              className="w-full text-center px-3 py-2 rounded-md bg-bg-secondary border border-glass-border"
            />
          </div>
        </div>
        
        <button
          onClick={isStaged ? onBack : handleAddClick}
          disabled={false}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition ${
            isStaged
              ? 'bg-green/20 text-green'
              : 'bg-accent text-bg-secondary'
          }`}
_        >
          {isStaged ? (
            <>
              <Check size={24} />
              {t('exercise_ui:added_back_to_list', 'Añadido (Volver a la lista)')}
            </>
          ) : (
            <>
              <Plus size={24} />
              {t('exercise_ui:add_to_cart', 'Añadir al carrito')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExerciseDetailView;