/* frontend/src/components/progress/ExerciseView.jsx */
import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { ExerciseChart } from './ProgressCharts';
import CustomSelect from '../CustomSelect';
import ModalPortal from '../ModalPortal';
import { Search, X, ChevronDown } from 'lucide-react';
import useModalLock from '../../hooks/useModalLock';
// --- INICIO DE LA MODIFICACIÓN ---
// 1. Importamos el hook de traducción
import { useTranslation } from 'react-i18next';
// --- FIN DE LA MODIFICACIÓN ---

const ExercisePickerModal = ({ isOpen, onClose, options, value, onChange, title }) => {
  useModalLock(isOpen);
  const [search, setSearch] = useState('');
  
  if (!isOpen) return null;

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out] p-0 sm:p-4 overscroll-none"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-md mt-auto sm:mt-0 rounded-t-[32px] sm:rounded-[24px] bg-bg-secondary p-0 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] sm:border border-t border-glass-border shadow-2xl flex flex-col h-[85vh] sm:h-[600px] animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.2s_ease-out] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto my-3 sm:hidden shrink-0" />
          
          <div className="flex items-center justify-between px-6 pb-4 border-b border-glass-border">
            <h3 className="text-xl font-extrabold text-text-primary">{title}</h3>
            <button onClick={onClose} className="p-2 -mr-2 bg-black/5 dark:bg-white/5 rounded-full text-text-secondary hover:text-text-primary transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-glass-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ejercicio..."
                className="w-full bg-black/5 dark:bg-white/5 text-text-primary rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder-text-tertiary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-2">
            {filtered.length > 0 ? (
              <div className="flex flex-col gap-1">
                {filtered.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); onClose(); }}
                    className={`w-full text-left px-4 py-3.5 rounded-xl transition-all flex items-center justify-between ${
                      value === opt.value 
                        ? 'bg-accent/10 text-accent font-bold ring-1 ring-accent/30' 
                        : 'text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary p-6 text-center">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>No se encontraron ejercicios</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

const ExerciseView = ({ allExercises, exerciseProgressData, axisColor, onShowHistory }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [showPicker, setShowPicker] = useState(false);

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
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full bg-bg-secondary border border-transparent dark:border dark:border-white/10 rounded-xl px-4 py-3 text-text-primary text-left outline-none transition flex items-center justify-between gap-2 shadow-sm focus:ring-2 focus:ring-accent/50"
          >
            <span className="truncate">{selectedExercise ? exerciseOptions.find(o => o.value === selectedExercise)?.label || selectedExercise : tCommon('Elige un ejercicio', { defaultValue: 'Elige un ejercicio' })}</span>
            <ChevronDown size={18} className="text-text-tertiary shrink-0" />
          </button>

          <ExercisePickerModal
            isOpen={showPicker}
            onClose={() => setShowPicker(false)}
            options={exerciseOptions}
            value={selectedExercise}
            onChange={setSelectedExercise}
            title={tCommon('Selecciona un ejercicio', { defaultValue: 'Selecciona un ejercicio' })}
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