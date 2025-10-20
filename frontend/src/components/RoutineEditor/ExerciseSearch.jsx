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
  const muscleGroupOptions = useMemo(() => muscleGroups.map(g => ({ value: g, label: g })), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) onClose();
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
    const selectedGroup = exercise.filterGroup || 'Todos';
    const shouldSearch = searchTerm.trim().length >= 2 || selectedGroup !== 'Todos';

    if (!shouldSearch) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchExercises(searchTerm, selectedGroup);
        setResults(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [exercise.name, exercise.filterGroup, isOpen]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    onFieldChange(exIndex, 'name', value);
    const selectedGroup = exercise.filterGroup || 'Todos';
    const shouldBeOpen = value.trim().length >= 2 || selectedGroup !== 'Todos';
    if (shouldBeOpen) {
      if (!isOpen) onOpen();
    } else {
      if (isOpen) onClose();
    }
  };

  const handleFilterChange = (group) => {
    onFieldChange(exIndex, 'filterGroup', group);
    onOpen();
  };

  const shouldRenderDropdown = isOpen && (isLoading || results.length > 0 || ((exercise.name?.trim().length >= 2 || (exercise.filterGroup && exercise.filterGroup !== 'Todos'))));

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
        <CustomSelect
          value={exercise.filterGroup || 'Todos'}
          onChange={handleFilterChange}
          options={muscleGroupOptions}
          placeholder="Filtrar"
          className="flex-shrink-0 sm:w-40"
        />
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
              onClick={() => onSelect(exIndex, exResult)}
              className="block w-full text-left px-3 py-2 hover:bg-accent-transparent transition-colors rounded-md"
              role="option"
            >
              {exResult.name} <span className="text-xs text-text-muted">({exResult.muscle_group})</span>
            </button>
          ))}
          {!isLoading && results.length === 0 && ((exercise.name && exercise.name.length >= 2) || exercise.filterGroup !== 'Todos') && (
            <p className="text-center text-text-muted p-4 text-sm">No se encontraron resultados.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseSearch;