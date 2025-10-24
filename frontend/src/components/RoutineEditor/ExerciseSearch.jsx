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
  // --- INICIO DE LA MODIFICACIÓN ---
  // Añadimos una referencia para el botón del CustomSelect
  const selectButtonRef = useRef(null);
  // --- FIN DE LA MODIFICACIÓN ---
  const muscleGroupOptions = useMemo(() => muscleGroups.map(g => ({ value: g, label: g })), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      // --- INICIO DE LA MODIFICACIÓN ---
      // Si el clic fue DENTRO del botón del CustomSelect, cerramos la lista de ejercicios.
      if (selectButtonRef.current && selectButtonRef.current.contains(event.target)) {
        onClose(); // Cerrar la lista de ejercicios
        return; // No hacer nada más, el CustomSelect se abrirá solo
      }
      // Si el clic fue FUERA de todo el componente ExerciseSearch, cerramos.
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
      // --- FIN DE LA MODIFICACIÓN ---
    };
    // Usamos 'mousedown' para que se ejecute antes que el 'click' del CustomSelect
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]); // Dependencias correctas

  // ... (otros useEffects sin cambios) ...
  useEffect(() => {
    if (!isOpen) setResults([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const searchTerm = exercise.name || '';
    const selectedGroup = exercise.filterGroup || 'Todos';
    const shouldSearch = isOpen && (searchTerm.trim().length >= 2 || selectedGroup !== 'Todos');

    if (!shouldSearch) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchExercises(searchTerm, selectedGroup);
        if (isOpen) setResults(data);
      } catch (error) {
        console.error(error);
        if (isOpen) setResults([]);
      } finally {
        if (isOpen) setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [exercise.name, exercise.filterGroup, isOpen]); // Removido onOpen

  const handleNameChange = (e) => {
    const value = e.target.value;
    onFieldChange(exIndex, 'name', value);
    const shouldBeOpen = value.trim().length >= 2 || (exercise.filterGroup && exercise.filterGroup !== 'Todos');
    if (shouldBeOpen && !isOpen) {
      onOpen();
    } else if (!shouldBeOpen && isOpen) {
      onClose();
    }
  };

  const handleFilterChange = (group) => {
    onFieldChange(exIndex, 'filterGroup', group);
    // Forzamos la apertura al cambiar el filtro si no está abierto ya
    if (!isOpen) {
      onOpen();
    }
    // Si ya estaba abierto, el useEffect de búsqueda se encargará
  };


  const shouldRenderDropdown = isOpen && (isLoading || results.length > 0 || ((exercise.name?.trim().length >= 2 || (exercise.filterGroup && exercise.filterGroup !== 'Todos'))));

  return (
    // Asignamos la ref principal a este div
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
        {/* --- INICIO DE LA MODIFICACIÓN --- */}
        {/* Usamos un div intermedio para asignar la ref al botón del CustomSelect */}
        <div ref={selectButtonRef} className="flex-shrink-0 sm:w-40">
           <CustomSelect
              value={exercise.filterGroup || 'Todos'}
              onChange={handleFilterChange}
              options={muscleGroupOptions}
              placeholder="Filtrar"
           />
        </div>
        {/* --- FIN DE LA MODIFICACIÓN --- */}
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
          {!isLoading && results.length === 0 && ((exercise.name && exercise.name.length >= 2) || (exercise.filterGroup && exercise.filterGroup !== 'Todos')) && (
            <p className="text-center text-text-muted p-4 text-sm">No se encontraron resultados.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseSearch;