/* frontend/src/components/RoutineEditor/ExerciseSearch.jsx */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { searchExercises } from '../../services/exerciseService';
import Spinner from '../Spinner';
import CustomSelect from '../CustomSelect';

const muscleGroups = [
  'Todos', 'Pecho', 'Espalda', 'Piernas', 'Glúteos', 'Hombros',
  'Brazos', 'Core', 'Cardio', 'Antebrazo', 'Trapecio'
];

const ExerciseSearch = ({ exercise, exIndex, onFieldChange, onSelect, isOpen, onOpen, onClose }) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const selectButtonRef = useRef(null);
  const muscleGroupOptions = useMemo(() => muscleGroups.map(g => ({ value: g, label: g })), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (selectButtonRef.current && selectButtonRef.current.contains(event.target)) {
        onClose(); 
        return; 
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setResults([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const searchTerm = exercise.name || '';
    const filterGroup = exercise.filterGroup || 'Todos';
    
    const selectedGroupForSearch = filterGroup === 'Todos' ? '' : filterGroup;
    const shouldSearch = isOpen && (searchTerm.trim().length >= 2 || filterGroup);

    if (!shouldSearch) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchExercises(searchTerm, selectedGroupForSearch);
        if (isOpen) setResults(data);
      } catch (error) {
        console.error(error);
        if (isOpen) setResults([]);
      } finally {
        if (isOpen) setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [exercise.name, exercise.filterGroup, isOpen]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    onFieldChange(exIndex, 'name', value);
    
    // --- INICIO DE LA MODIFICACIÓN (BUG FIX "Todos") ---
    // Corregimos la lógica que faltaba de la corrección anterior
    const shouldBeOpen = value.trim().length >= 2 || (exercise.filterGroup && exercise.filterGroup);
    // --- FIN DE LA MODIFICACIÓN (BUG FIX "Todos") ---

    if (shouldBeOpen && !isOpen) {
      onOpen();
    } else if (!shouldBeOpen && isOpen) {
      onClose();
    }
  };

  const handleFilterChange = (group) => {
    onFieldChange(exIndex, 'filterGroup', group);

    // --- INICIO DE LA MODIFICACIÓN (NUEVA FUNCIÓN) ---
    // Si el 'name' actual pertenece a un ejercicio ya seleccionado (tiene ID),
    // y el usuario cambia el filtro, asumimos que quiere iniciar una nueva búsqueda
    // en ese grupo, así que limpiamos el nombre y el ID.
    if (exercise.exercise_list_id) {
      onFieldChange(exIndex, 'name', '');
      onFieldChange(exIndex, 'exercise_list_id', null);
      // También limpiamos el grupo muscular del ejercicio, si lo tuviera
      onFieldChange(exIndex, 'muscle_group', null);
    }
    // Si no hay ID, 'exercise.name' es solo un término de búsqueda (ej: "Press"),
    // y el useEffect (que se disparará) lo usará para filtrar en el nuevo 'group'.
    // --- FIN DE LA MODIFICACIÓN (NUEVA FUNCIÓN) ---

    // Forzamos la apertura al cambiar el filtro si no está abierto ya
    if (!isOpen) {
      onOpen();
    }
  };


  const searchConditionsMet = (exercise.name?.trim().length >= 2 || (exercise.filterGroup && exercise.filterGroup));
  const shouldRenderDropdown = isOpen && (isLoading || results.length > 0 || searchConditionsMet);

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          autoComplete="off"
          value={exercise.name || ''}
          onChange={handleNameChange}
          onFocus={onOpen}
          placeholder="Buscar o escribir ejercicio..."
          className="flex-grow w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
        />
        <div ref={selectButtonRef} className="flex-shrink-0 sm:w-40">
           <CustomSelect
              value={exercise.filterGroup || 'Todos'}
              onChange={handleFilterChange}
              options={muscleGroupOptions}
              placeholder="Filtrar"
           />
        </div>
      </div>

      {shouldRenderDropdown && (
        <div
          className="absolute top-full mt-2 w-full bg-bg-secondary border border-glass-border rounded-xl shadow-lg max-h-40 overflow-y-auto z-50 p-2"
          role="listbox"
          aria-expanded={isOpen}
        >
          {isLoading && <div className="flex justify-center p-4"><Spinner /></div>}
          {!isLoading && results.length > 0 && results.map(exResult => (
            <button
              key={exResult.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(exIndex, exResult);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-accent-transparent transition-colors rounded-md"
              role="option"
            >
              {exResult.name} <span className="text-xs text-text-muted">({exResult.muscle_group})</span>
            </button>
          ))}
          {!isLoading && results.length === 0 && searchConditionsMet && (
            <p className="text-center text-text-muted p-4 text-sm">No se encontraron resultados.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseSearch;