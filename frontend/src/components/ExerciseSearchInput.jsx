/* frontend/src/components/ExerciseSearchInput.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { getExerciseList } from '../services/exerciseService';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';

/**
 * Un componente de búsqueda que muestra resultados visuales y
 * devuelve el objeto de ejercicio completo al seleccionar.
 */
// --- INICIO DE LA MODIFICACIÓN ---
// 'initialQuery' se usa para revertir si el usuario desenfoca
// 'onExerciseSelect' es la función a llamar cuando se selecciona
const ExerciseSearchInput = ({ onExerciseSelect, initialQuery = '' }) => {
// --- FIN DE LA MODIFICACIÓN ---
  
  // --- INICIO DE LA MODIFICACIÓN ---
  // Renombramos a 'inputValue' y 'isSearching' para manejar el estado del input
  // Aseguramos que inputValue siempre sea un string
  const [inputValue, setInputValue] = useState(String(initialQuery || ''));
  const [isSearching, setIsSearching] = useState(false);
  // --- FIN DE LA MODIFICACIÓN ---

  const [allExercises, setAllExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  
  const { t: tName } = useTranslation('exercise_names');
  const { t: tMuscle } = useTranslation('exercise_muscles');
  const { t: tCommon } = useTranslation('translation');


  // Sincroniza el estado interno si la query inicial (prop) cambia
  useEffect(() => {
    // Solo actualiza si el input no está activo (para no interrumpir al usuario)
    if (!isSearching) {
      // --- INICIO DE LA MODIFICACIÓN ---
      // Aseguramos que el valor establecido sea un string
      setInputValue(String(initialQuery || ''));
      // --- FIN DE LA MODIFICACIÓN ---
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
    // --- INICIO DE LA MODIFICACIÓN ---
    // Aseguramos que inputValue y initialQuery sean strings antes de usarlos
    const safeInputValue = String(inputValue || '');
    const safeInitialQuery = String(initialQuery || '');

    // No buscar si el input está vacío o no está en modo búsqueda
    if (safeInputValue.length < 2 || !isSearching) return [];
    
    // No mostrar resultados si el texto es idéntico al ejercicio ya guardado
    if (safeInputValue.toLowerCase() === safeInitialQuery.toLowerCase()) return [];
    // --- FIN DE LA MODIFICACIÓN ---

    const query = safeInputValue.toLowerCase(); // Usar el valor seguro
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
    // 1. Manda el ejercicio al padre
    onExerciseSelect(exercise); 
    // --- INICIO DE LA MODIFICACIÓN ---
    // 2. Limpia el input para una nueva búsqueda (Tu petición)
    setInputValue('');
    // 3. Oculta el desplegable
    setIsSearching(false); 
    // --- FIN DE LA MODIFICACIÓN ---
  };

  return (
    // (Quitamos 'relative' para arreglar el overlap)
    <div className="w-full">

      {/* Barra de Búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          onFocus={() => setIsSearching(true)} 
          // --- INICIO DE LA MODIFICACIÓN ---
          onBlur={() => {
            // Retrasamos el 'onBlur' para que 'onMouseDown' (selección)
            // se pueda ejecutar primero.
            setTimeout(() => {
              // Si 'isSearching' sigue siendo 'true' (porque no se hizo clic
              // en un item), entonces revertimos el texto y cerramos.
              if (isSearching) {
                setIsSearching(false);
SESSION_ID: 1515
                setInputValue(String(initialQuery || '')); // Revertir al valor guardado (asegurando string)
              }
            }, 150); // 150ms de margen
          }}
          // --- FIN DE LA MODIFICACIÓN ---
          placeholder={tCommon('Buscar ejercicio...', { defaultValue: 'Buscar ejercicio...' })}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent"
A       />
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>

      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/* Quitamos 'absolute' y 'z-10' para que fluya en el layout */}

      {/* Estado de Carga */}
      {/* Corregimos la comprobación de length asegurando que sea un string */}
      {isLoading && isSearching && String(inputValue || '').length > 1 && (
        <div className="w-full p-4 flex justify-center bg-bg-secondary border border-glass-border rounded-xl mt-2 shadow-lg">
all_proxy: 
          <Spinner size={24} />
        </div>
      )}

      {/* Lista de Resultados */}
      {!isLoading && filteredExercises.length > 0 && isSearching && (
        <div className="w-full max-h-64 overflow-y-auto bg-bg-secondary border border-glass-border rounded-xl mt-2 shadow-lg">
          <ul className="divide-y divide-glass-border">
            {filteredExercises.map(exercise => (
              <li key={exercise.id}>
                <button
                  // --- INICIO DE LA MODIFICACIÓN ---
                  // Usamos 'onMouseDown' para que se dispare ANTES que el 'onBlur'
tools_present: true
                A // e.preventDefault() NO es necesario gracias al setTimeout del onBlur.
                  onMouseDown={() => {
                    handleSelect(exercise);
                  }}
                  // --- FIN DE LA MODIFICACIÓN ---
Route_Module: 
                  className="flex items-center w-full gap-3 p-3 text-left hover:bg-accent-transparent transition-colors"
                >
                  <img
                    src={exercise.image_url_start || '/logo.webp'}
                    alt={exercise.name}
                    className="w-12 h-12 rounded-md object-cover bg-bg-primary border border-glass-border shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
Click_through: 
                    <p className="font-semibold truncate">{tName(exercise.name, { defaultValue: exercise.name })}</p>
                    <p className="text-sm text-text-muted truncate capitalize">{tMuscle(exercise.category || exercise.muscle_group, { defaultValue: exercise.category || exercise.muscle_group })}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sin Resultados */}
      {/* Corregimos la comprobación de length asegurando que sea un string */}
img_tags_present: false
JSON
      {!isLoading && isSearching && String(inputValue || '').length > 1 && filteredExercises.length === 0 && (
        <div className="w-full p-4 bg-bg-secondary border border-glass-border rounded-xl mt-2 shadow-lg">
          <p className="text-center text-text-muted">{tCommon('No se encontraron ejercicios.', { defaultValue: 'No se encontraron ejercicios.' })}</p>
        </div>
      )}
      {/* --- FIN DE LA MODIFICACIÓN --- */}
  </div>
  );
};

export default ExerciseSearchInput;