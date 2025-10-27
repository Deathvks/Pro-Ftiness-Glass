/* frontend/src/components/ExerciseSearchInput.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { getExerciseList } from '../services/exerciseService';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next'; // <-- Añadido

/**
 * Un componente de búsqueda que muestra resultados visuales y
 * devuelve el objeto de ejercicio completo al seleccionar.
 */
// --- Modificado ---
const ExerciseSearchInput = ({ onExerciseSelect, initialQuery = '', onBlur = () => {} }) => {
  // --- Fin Modificado ---
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [allExercises, setAllExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  
  // --- Añadido ---
  const { t } = useTranslation('exercises');
  const { t: tCommon } = useTranslation('translation');
  // --- Fin Añadido ---


  // Sincroniza el estado interno si la query inicial (prop) cambia
  // Esto es útil para que el input refleje el nombre actual del ejercicio
  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);
  // --- Fin Añadido ---

  // Carga todos los ejercicios al montar el componente
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        const data = await getExerciseList();
        setAllExercises(data);
        // --- INICIO DE LA MODIFICACIÓN ---
      } catch (error) { // Corregido: Añadido 'error'
        // --- FIN DE LA MODIFICACIÓN ---
        addToast(error.message || 'Error al cargar la lista de ejercicios.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercises();
  }, [addToast]);

  // Filtra los ejercicios basándose en la búsqueda
  const filteredExercises = useMemo(() => {
    // No mostrar resultados si la búsqueda es muy corta
    if (searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    return allExercises
      .filter(ex => {
        // --- Modificado ---
        // Buscar en el nombre original Y en el traducido
        const originalName = ex.name.toLowerCase();
        const translatedName = t(ex.name, { defaultValue: ex.name }).toLowerCase();
        const category = (ex.category || ex.muscle_group || '').toLowerCase();
        const translatedCategory = t(category, { defaultValue: category }).toLowerCase();

        return (
          originalName.includes(query) ||
          translatedName.includes(query) ||
          category.includes(query) ||
          translatedCategory.includes(query)
        );
        // --- Fin Modificado ---
      })
      .slice(0, 50); // Limitar a 50 resultados para no saturar
  }, [allExercises, searchQuery, t]); // <-- Añadido t

  const handleSelect = (exercise) => {
    onExerciseSelect(exercise); // Devuelve el objeto de ejercicio completo
    
    // --- Modificado ---
    // En lugar de limpiar, seteamos el query al nombre traducido
    // Esto es más consistente con lo que ve el usuario
    setSearchQuery(t(exercise.name, { defaultValue: exercise.name }));
    // --- Fin Modificado ---
  };

  return (
    <div className="relative w-full">
      {/* Barra de Búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          // --- Modificado ---
          onBlur={onBlur} // <-- Añadido
          placeholder={tCommon('Buscar ejercicio para reemplazar...', { defaultValue: 'Buscar ejercicio para reemplazar...' })}
          // --- Fin Modificado ---
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>

      {/* Estado de Carga */}
      {isLoading && searchQuery.length > 1 && (
        <div className="absolute z-10 w-full p-4 flex justify-center bg-bg-secondary border border-glass-border rounded-xl mt-2 shadow-lg">
          <Spinner size={24} />
        </div>
      )}

      {/* Lista de Resultados */}
      {!isLoading && filteredExercises.length > 0 && searchQuery.length > 1 && ( // <-- Añadido chequeo de searchQuery
        <div className="absolute z-10 w-full max-h-64 overflow-y-auto bg-bg-secondary border border-glass-border rounded-xl mt-2 shadow-lg">
          <ul className="divide-y divide-glass-border">
            {filteredExercises.map(exercise => (
              <li key={exercise.id}>
                <button
                  onClick={() => handleSelect(exercise)}
                  className="flex items-center w-full gap-3 p-3 text-left hover:bg-accent-transparent transition-colors"
                >
                  <img
                    src={exercise.image_url_start || '/logo.webp'}
                    alt={exercise.name}
                    className="w-12 h-12 rounded-md object-cover bg-bg-primary border border-glass-border shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    {/* --- Modificado --- */}
                    <p className="font-semibold truncate">{t(exercise.name, { defaultValue: exercise.name })}</p>
                    <p className="text-sm text-text-muted truncate capitalize">{t(exercise.category || exercise.muscle_group, { defaultValue: exercise.category || exercise.muscle_group })}</p>
                    {/* --- Fin Modificado --- */}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sin Resultados */}
      {!isLoading && searchQuery.length > 1 && filteredExercises.length === 0 && (
        <div className="absolute z-10 w-full p-4 bg-bg-secondary border border-glass-border rounded-xl mt-2 shadow-lg">
          {/* --- Modificado --- */}
          <p className="text-center text-text-muted">{tCommon('No se encontraron ejercicios.', { defaultValue: 'No se encontraron ejercicios.' })}</p>
          {/* --- Fin Modificado --- */}
        </div>
      )}
    </div>
  );
};

export default ExerciseSearchInput;