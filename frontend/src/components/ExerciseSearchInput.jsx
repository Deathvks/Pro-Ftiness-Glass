/* frontend/src/components/ExerciseSearchInput.jsx */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus } from 'lucide-react'; 
import { getExerciseList } from '../services/exerciseService';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';
import ExerciseMedia from './ExerciseMedia';

/**
 * Un componente de búsqueda que muestra resultados visuales y
 * devuelve el objeto de ejercicio completo al seleccionar.
 * 
 * El dropdown se renderiza mediante un Portal para escapar del
 * stacking context creado por backdrop-filter en GlassCard.
 */
const ExerciseSearchInput = ({ onExerciseSelect, initialQuery = '', className = '', inputClassName = '', disableManualAdd = false }) => {
  
  const [inputValue, setInputValue] = useState(String(initialQuery || ''));
  const [isSearching, setIsSearching] = useState(false);
  const [allExercises, setAllExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownPos, setDropdownPos] = useState(null);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const { addToast } = useToast();
  
  const { t: tUi } = useTranslation('exercise_ui');

  // Sincroniza el estado interno si la query inicial (prop) cambia y no estamos buscando activamente
  useEffect(() => {
    if (!isSearching) {
      setInputValue(String(initialQuery || ''));
    }
  }, [initialQuery, isSearching]);

  // Maneja el clic fuera para cerrar el dropdown y confirmar ejercicio manual si hay texto escrito
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSearching && 
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target))
      ) {
        setIsSearching(false);
        const currentVal = inputValue.trim();
        const initialVal = String(initialQuery || '').trim();

        if (currentVal && currentVal !== initialVal && !disableManualAdd) {
          const fakeExercise = {
            id: null, 
            name: currentVal,
            muscle_group: 'N/A', 
            image_url: null, 
            video_url: null,
            image_url_start: null,
            image_url_end: null,
            is_manual: true 
          };
          onExerciseSelect(fakeExercise);
          setInputValue(currentVal);
        } else if (!currentVal && initialVal && !disableManualAdd) {
          setInputValue('');
        } else {
          setInputValue(String(initialQuery || ''));
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSearching, initialQuery, inputValue, disableManualAdd, onExerciseSelect]);

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
  }, []);

  // Calcula la posición del dropdown basándose en el input
  const updateDropdownPos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    setDropdownPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Recalcular posición cuando el dropdown está visible
  useEffect(() => {
    if (!isSearching) return;
    updateDropdownPos();

    const onScrollOrResize = () => updateDropdownPos();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isSearching, updateDropdownPos]);

  // Filtra los ejercicios basándose en la búsqueda
  const filteredExercises = useMemo(() => {
    const safeInputValue = String(inputValue || '').trim();
    const safeInitialQuery = String(initialQuery || '').trim();

    if (safeInputValue.length < 1 || !isSearching) return [];
    if (safeInputValue.toLowerCase() === safeInitialQuery.toLowerCase()) return [];

    const query = safeInputValue.toLowerCase(); 
    return allExercises
      .filter(ex => {
        const originalName = (ex.name || '').toLowerCase();
        const category = (ex.category || ex.muscle_group || '').toLowerCase();

        return (
          originalName.includes(query) ||
          category.includes(query)
        );
      })
      .slice(0, 50);
  }, [allExercises, inputValue, isSearching, initialQuery]);

  const handleSelect = (exercise) => {
    const normalizedExercise = {
        ...exercise,
        image_url: exercise.image_url_start || exercise.image_url || null, 
        video_url: exercise.video_url || null, 
        image_url_start: exercise.image_url_start || null,
        image_url_end: exercise.image_url_end || null,
    };

    onExerciseSelect(normalizedExercise); 
    setInputValue(exercise.name || '');
    setIsSearching(false); 
    inputRef.current?.blur();
  };

  const handleAddManualClick = () => {
    const exerciseName = inputValue.trim();
    if (exerciseName === '') return;

    const fakeExercise = {
      id: null, 
      name: exerciseName,
      muscle_group: 'N/A', 
      image_url: null, 
      video_url: null,
      image_url_start: null,
      image_url_end: null,
      is_manual: true 
    };
    
    handleSelect(fakeExercise);
  };

  // Componente para el botón "Añadir Manual", SIEMPRE visible y anclado abajo
  const ManualAddButton = () => {
    if (disableManualAdd) return null;
    const query = inputValue.trim();
    if (query.length === 0) return null; 

    return (
      <div className="border-t border-black/5 dark:border-white/10 bg-bg-secondary/95 backdrop-blur-md shrink-0">
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleAddManualClick(); }}
          className="flex items-center w-full gap-3 p-4 text-left text-accent font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="p-2 bg-accent/10 rounded-full shrink-0">
            <Plus size={18} />
          </div>
          <span className="flex-1 min-w-0 break-words text-sm">
            {tUi('add_as_manual', 'Añadir "{{query}}" como manual', { query })}
          </span>
        </button>
      </div>
    );
  };

  // Determinar si hay algo que mostrar en el dropdown
  const hasInput = String(inputValue || '').trim().length > 0;
  const showLoading = isLoading && isSearching && hasInput;
  const showResults = !isLoading && isSearching && filteredExercises.length > 0;
  const showNoResults = !isLoading && isSearching && hasInput && filteredExercises.length === 0;
  const showDropdown = isSearching && hasInput;

  // Contenido del dropdown renderizado via Portal
  const dropdownContent = showDropdown && dropdownPos ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 99999,
      }}
    >
      <div className="bg-bg-secondary border border-glass-border ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-80">
        {/* Estado de Carga */}
        {showLoading && (
          <div className="p-6 flex justify-center items-center">
            <Spinner size={28} />
          </div>
        )}

        {/* Lista de Resultados con scroll */}
        {showResults && (
          <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
            <ul className="flex flex-col py-2">
              {filteredExercises.map(exercise => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(exercise); }}
                    className="flex items-center w-full gap-4 px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm bg-black/5 dark:bg-white/5 p-1">
                      <ExerciseMedia 
                        details={exercise} 
                        fitMode="cover"
                        disableAnimation={true}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-text-primary truncate text-sm sm:text-base group-hover:text-accent transition-colors">
                        {exercise.name}
                      </p>
                      <p className="text-[11px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider truncate mt-0.5">
                        {exercise.category || exercise.muscle_group}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sin Resultados */}
        {showNoResults && (
          <div className="p-6 text-center">
            <p className="text-text-secondary font-medium">No se encontraron ejercicios.</p>
          </div>
        )}

        {/* Botón Añadir Manual (Siempre anclado al fondo del dropdown) */}
        <ManualAddButton />
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className={`w-full relative ${className}`}>

      {/* Barra de Búsqueda */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue} 
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isSearching) setIsSearching(true);
            updateDropdownPos();
          }} 
          onFocus={() => {
            setIsSearching(true);
            updateDropdownPos();
          }} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              const currentVal = inputValue.trim();
              const initialVal = String(initialQuery || '').trim();
              if (currentVal && currentVal !== initialVal && !disableManualAdd) {
                if (e.key === 'Enter') e.preventDefault();
                const fakeExercise = {
                  id: null, 
                  name: currentVal,
                  muscle_group: 'N/A', 
                  image_url: null, 
                  video_url: null,
                  image_url_start: null,
                  image_url_end: null,
                  is_manual: true 
                };
                onExerciseSelect(fakeExercise);
                setInputValue(currentVal);
                setIsSearching(false);
                if (e.key === 'Enter') inputRef.current?.blur();
              }
            }
          }}
          placeholder="Buscar ejercicio..."
          className={`w-full pl-12 pr-5 py-4 rounded-[20px] bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold text-text-primary placeholder:text-text-muted shadow-inner ${inputClassName}`}
        />
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>

      {dropdownContent}
    </div>
  );
};

export default ExerciseSearchInput;

