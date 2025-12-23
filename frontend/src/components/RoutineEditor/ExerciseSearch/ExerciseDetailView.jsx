/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseDetailView.jsx */
import React, { useState } from 'react';
import { ChevronLeft, Plus, Check, Repeat } from 'lucide-react';
import { useAppTheme } from '../../../hooks/useAppTheme';

// Componente para la vista de detalle
const ExerciseDetailView = ({
  exercise,
  onBack,
  onAdd,
  isStaged,
  t,
  isReplacing = false,
}) => {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('8-12');
  const [rest, setRest] = useState(60);
  const { theme } = useAppTheme();

  const handleAddClick = () => {
    if (isReplacing) {
      onAdd(exercise);
    } else {
      onAdd(exercise, { sets, reps, rest_seconds: rest });
    }
  };

  // 1. Traducir el nombre
  const translatedName = t(exercise.name, {
    ns: 'exercise_names',
    defaultValue: exercise.name,
  });

  // 2. Traducir grupo muscular
  const muscleGroup = exercise.category || exercise.muscle_group;
  const translatedMuscle = t(muscleGroup, {
    ns: 'exercise_muscles',
    defaultValue: muscleGroup,
  });

  // 3. Traducir equipamiento
  const equipment = exercise.equipment || 'None';
  const equipmentKey = equipment.split(',')[0].trim();
  const translatedEquipment = t(equipmentKey, {
    ns: 'exercise_equipment',
    defaultValue: equipment,
  });

  // 4. Traducir la descripción
  const descriptionKey = exercise.description;
  const defaultDescription = exercise.description || t('exercise_ui:no_description_available', 'No hay descripción disponible.');

  const translatedDescription = t(descriptionKey, {
    ns: 'exercise_descriptions',
    defaultValue: defaultDescription,
  });

  // Lógica de contraste para OLED:
  const isOled = theme === 'oled';
  const hasVideo = !!exercise.video_url;
  const mediaBgClass = (!hasVideo && isOled) ? 'bg-gray-200' : 'bg-bg-primary';

  return (
    // MODIFICACIÓN: Añadido overflow-hidden
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-glass-border">
        <button onClick={onBack} className="flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-white/10">
          <ChevronLeft size={24} />
          <span className="font-semibold">{t('exercise_ui:back', 'Volver')}</span>
        </button>
        <h2 className="text-xl font-bold truncate px-4">
          {translatedName}
        </h2>
        <div className="w-16"></div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Visor de medios */}
        <div className={`mb-6 aspect-video ${mediaBgClass} rounded-xl border border-glass-border overflow-hidden flex items-center justify-center`}>
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
              {translatedMuscle}
            </p>
          </div>
          <div className="bg-bg-secondary p-4 rounded-lg border border-glass-border">
            <p className="text-sm text-text-muted">{t('exercise_ui:equipment', 'Equipamiento')}</p>
            <p className="font-semibold capitalize">
              {translatedEquipment}
            </p>
          </div>
        </div>

        {/* Descripción */}
        <div className="pb-4">
          <h3 className="text-lg font-semibold mb-2">{t('exercise_ui:description', 'Descripción')}</h3>
          <p className="text-text-secondary whitespace-pre-line leading-relaxed">
            {translatedDescription}
          </p>
        </div>
      </div>

      {/* Footer (Formulario y Añadir) */}
      {/* MODIFICACIÓN: Ajuste de padding inferior para móvil (pb-[calc(6rem+env...)]) */}
      <div className="flex-shrink-0 p-4 border-t border-glass-border bg-bg-primary/80 backdrop-blur-sm pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">

        {/* 5. Ocultar inputs en modo reemplazo */}
        {!isReplacing && (
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
        )}

        {/* 6. Lógica de botón dinámica */}
        {isReplacing ? (
          // 7. Botón MODO REEMPLAZO
          <button
            onClick={handleAddClick}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition bg-accent text-bg-secondary"
          >
            <Repeat size={24} />
            {t('exercise_ui:replace_exercise', 'Reemplazar Ejercicio')}
          </button>
        ) : (
          // 8. Botón MODO AÑADIR (Original)
          <button
            onClick={isStaged ? onBack : handleAddClick}
            disabled={false}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition ${isStaged
              ? 'bg-green/20 text-green'
              : 'bg-accent text-bg-secondary'
              }`}
          >
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
        )}

      </div>
    </div>
  );
};

export default ExerciseDetailView;