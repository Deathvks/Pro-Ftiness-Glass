/* frontend/src/components/ExerciseSearchInput.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus } from 'lucide-react'; 
import { getExerciseList } from '../services/exerciseService';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';
import ExerciseMedia from './ExerciseMedia'; // <-- Importamos ExerciseMedia

/**
 * Un componente de búsqueda que muestra resultados visuales y
 * devuelve el objeto de ejercicio completo al seleccionar.
 */
const ExerciseSearchInput = ({ onExerciseSelect, initialQuery = '' }) => {
  
  const [inputValue, setInputValue] = useState(String(initialQuery || ''));
  const [isSearching, setIsSearching] = useState(false);

  const [allExercises, setAllExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  
  const { t: tName } = useTranslation('exercise_names');
  const { t: tMuscle } = useTranslation('exercise_muscles');
  const { t: tCommon } = useTranslation('translation');
  const { t: tUi } = useTranslation('exercise_ui');

  // Sincroniza el estado interno si la query inicial (prop) cambia
  useEffect(() => {
    if (!isSearching) {
      setInputValue(String(initialQuery || ''));
    }
  }, [initialQuery, isSearching]);

  // Carga todos los ejercicios al montar el componente
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        const data = await getExerciseList();
        setAllExercises(data);
      } catch (error) {
        addToast(error.message || 'Error al cargar la lista de ejercicios.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercises();
  }, [addToast]);

  // Filtra los ejercicios basándose en la búsqueda
  const filteredExercises = useMemo(() => {
    const safeInputValue = String(inputValue || '');
    const safeInitialQuery = String(initialQuery || '');

    if (safeInputValue.length < 2 || !isSearching) return [];
    if (safeInputValue.toLowerCase() === safeInitialQuery.toLowerCase()) return [];

    const query = safeInputValue.toLowerCase(); 
    return allExercises
      .filter(ex => {
        const originalName = ex.name.toLowerCase();
        const translatedName = tName(ex.name, { defaultValue: ex.name }).toLowerCase();
        const category = (ex.category || ex.muscle_group || '').toLowerCase();
        const translatedCategory = tMuscle(category, { defaultValue: category }).toLowerCase();

        return (
          originalName.includes(query) ||
          translatedName.includes(query) ||
          category.includes(query) ||
          translatedCategory.includes(query)
        );
      })
      .slice(0, 50);
  }, [allExercises, inputValue, isSearching, tName, tMuscle, initialQuery]);

  const handleSelect = (exercise) => {
    // Normalizamos el ejercicio antes de enviarlo
    const normalizedExercise = {
        ...exercise,
        image_url: exercise.image_url_start || exercise.image_url || null, 
        video_url: exercise.video_url || null, 
        image_url_start: exercise.image_url_start || null,
        image_url_end: exercise.image_url_end || null,
    };

    onExerciseSelect(normalizedExercise); 
    setInputValue('');
    setIsSearching(false); 
  };

  const handleAddManualClick = () => {
    const exerciseName = inputValue.trim();
    if (exerciseName === '') return;

    // Creamos un objeto "falso" de ejercicio que simula uno real
    const fakeExercise = {
      id: null, 
      name: exerciseName,
      muscle_group: tMuscle('unknown', { defaultValue: 'N/A' }), 
      image_url: null, 
      video_url: null,
      image_url_start: null,
      image_url_end: null,
      is_manual: true 
    };
    
    handleSelect(fakeExercise);
  };

  // Componente reutilizable para el botón "Añadir Manual"
  const ManualAddButton = () => {
    const query = inputValue.trim();
    if (query.length === 0) return null; 

    return (
      <div className="border-t border-black/5 dark:border-white/10 mt-1">
        <button
          onMouseDown={(e) => {
            e.preventDefault(); 
            handleAddManualClick();
          }}
          className="flex items-center w-full gap-3 p-4 text-left text-accent font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="p-2 bg-accent/10 rounded-full">
            <Plus size={18} />
          </div>
          <span className="flex-1 min-w-0 break-words text-sm">
            {tUi('add_as_manual', 'Añadir "{{query}}" como manual', { query })}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="w-full relative z-50">

      {/* Barra de Búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          onFocus={() => setIsSearching(true)} 
          onBlur={() => {
            setTimeout(() => {
              if (isSearching) {
                setIsSearching(false);
                setInputValue(String(initialQuery || '')); 
              }
            }, 150); 
          }}
          placeholder={tCommon('Buscar ejercicio...', { defaultValue: 'Buscar ejercicio...' })}
          className="w-full pl-12 pr-5 py-4 rounded-[20px] bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold text-text-primary placeholder:text-text-muted shadow-inner"
        />
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>

      {/* Estado de Carga */}
      {isLoading && isSearching && String(inputValue || '').length > 1 && (
        <div className="absolute top-full left-0 right-0 p-6 flex justify-center bg-bg-primary border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] mt-2 shadow-2xl z-50">
          <Spinner size={28} />
        </div>
      )}

      {/* Lista de Resultados */}
      {!isLoading && filteredExercises.length > 0 && isSearching && (
        <div className="absolute top-full left-0 right-0 max-h-72 overflow-y-auto custom-scrollbar bg-bg-primary border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] mt-2 shadow-2xl z-50">
          <ul className="flex flex-col py-2">
            {filteredExercises.map(exercise => (
              <li key={exercise.id}>
                <button
                  onMouseDown={() => handleSelect(exercise)}
                  className="flex items-center w-full gap-4 px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm bg-black/5 dark:bg-white/5 p-1">
                    {/* AÑADIDO: Usa ExerciseMedia para las previews */}
                    <ExerciseMedia 
                      details={exercise}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-text-primary truncate text-sm sm:text-base group-hover:text-accent transition-colors">
                      {tName(exercise.name, { defaultValue: exercise.name })}
                    </p>
                    <p className="text-[11px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider truncate mt-0.5">
                      {tMuscle(exercise.category || exercise.muscle_group, { defaultValue: exercise.category || exercise.muscle_group })}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <ManualAddButton />
        </div>
      )}

      {/* Sin Resultados */}
      {!isLoading && isSearching && String(inputValue || '').length > 1 && filteredExercises.length === 0 && (
        <div className="absolute top-full left-0 right-0 bg-bg-primary border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] mt-2 shadow-2xl z-50 overflow-hidden">
          <div className="p-6 text-center">
            <p className="text-text-secondary font-medium">{tCommon('No se encontraron ejercicios.', { defaultValue: 'No se encontraron ejercicios.' })}</p>
          </div>
          <ManualAddButton />
        </div>
      )}
    </div>
  );
};

export default ExerciseSearchInput;