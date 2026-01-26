/* frontend/src/components/progress/ExerciseView.jsx */
import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { ExerciseChart } from './ProgressCharts';
import CustomSelect from '../CustomSelect';
// --- INICIO DE LA MODIFICACIÓN ---
// 1. Importamos el hook de traducción
import { useTranslation } from 'react-i18next';
// --- FIN DE LA MODIFICACIÓN ---

const ExerciseView = ({ allExercises, exerciseProgressData, axisColor, onShowHistory }) => {
  const [selectedExercise, setSelectedExercise] = useState('');

  // --- INICIO DE LA MODIFICACIÓN ---
  // 2. Inicializamos el traductor para 'exercise_names' (para los ejercicios)
  //    y 'translation' (para la UI general)
  const { t } = useTranslation('exercise_names');
  const { t: tCommon } = useTranslation('translation'); // Asumiendo 'translation' para la UI general
  // --- FIN DE LA MODIFICACIÓN ---

  useEffect(() => {
    // Selecciona el primer ejercicio de la lista por defecto
    if (allExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(allExercises[0]);
    }
  }, [allExercises, selectedExercise]);
  
  // --- INICIO DE LA MODIFICACIÓN ---
  // 3. Adaptamos las 'labels' para que se traduzcan
  const exerciseOptions = allExercises.map(ex => ({
    value: ex, // El 'value' sigue siendo la clave (ej: "Bankdrücken (Langhantel)")
    label: t(ex, { ns: 'exercise_names', defaultValue: ex }) // La 'label' es la traducción
  }));
  // --- FIN DE LA MODIFICACIÓN ---

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end gap-4">
        <div className="relative w-full max-w-xs z-10">
          
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          {/* 4. Traducimos la etiqueta y el placeholder del select */}
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {tCommon('Selecciona un ejercicio', { defaultValue: 'Selecciona un ejercicio' })}
          </label>
          <CustomSelect
            value={selectedExercise}
            onChange={setSelectedExercise}
            options={exerciseOptions}
            placeholder={tCommon('Elige un ejercicio', { defaultValue: 'Elige un ejercicio' })}
          />
          {/* --- FIN DE LA MODIFICACIÓN --- */}

        </div>
        <button
          onClick={() => onShowHistory(selectedExercise)}
          disabled={!selectedExercise}
          className="p-3 rounded-md bg-bg-secondary border border-transparent dark:border dark:border-white/10 text-text-secondary transition enabled:hover:text-accent enabled:hover:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
          title={tCommon('Ver historial detallado', { defaultValue: 'Ver historial detallado' })}>
          <BookOpen size={20} />
        </button>
      </div>
      
      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/* 5. Traducimos el nombre que se pasa al gráfico */}
      <ExerciseChart
        data={exerciseProgressData[selectedExercise]}
        axisColor={axisColor}
        exerciseName={t(selectedExercise, { ns: 'exercise_names', defaultValue: selectedExercise })}
      />
      {/* --- FIN DE LA MODIFICACIÓN --- */}

    </div>
  );
};

export default ExerciseView;