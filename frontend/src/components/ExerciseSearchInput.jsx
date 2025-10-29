/* frontend/src/components/ExerciseSearchInput.jsx */
import React, { useState, useEffect, useMemo } from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
import { Search, Plus } from 'lucide-react'; // Importamos Plus
// --- FIN DE LA MODIFICACIÓN ---
import { getExerciseList } from '../services/exerciseService';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';

/**
 * Un componente de búsqueda que muestra resultados visuales y
 * devuelve el objeto de ejercicio completo al seleccionar.
 */
// 'initialQuery' se usa para revertir si el usuario desenfoca
// 'onExerciseSelect' es la función a llamar cuando se selecciona
const ExerciseSearchInput = ({ onExerciseSelect, initialQuery = '' }) => {
  
  // Renombramos a 'inputValue' y 'isSearching' para manejar el estado del input
  // Aseguramos que inputValue siempre sea un string
  const [inputValue, setInputValue] = useState(String(initialQuery || ''));
  const [isSearching, setIsSearching] = useState(false);

  const [allExercises, setAllExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  
  const { t: tName } = useTranslation('exercise_names');
  const { t: tMuscle } = useTranslation('exercise_muscles');
  const { t: tCommon } = useTranslation('translation');
  // --- INICIO DE LA MODIFICACIÓN ---
  // 1. Añadimos el namespace 'exercise_ui' para el texto del nuevo botón
  const { t: tUi } = useTranslation('exercise_ui');
  // --- FIN DE LA MODIFICACIÓN ---


  // Sincroniza el estado interno si la query inicial (prop) cambia
  useEffect(() => {
    // Solo actualiza si el input no está activo (para no interrumpir al usuario)
    if (!isSearching) {
      // Aseguramos que el valor establecido sea un string
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
    // Aseguramos que inputValue y initialQuery sean strings antes de usarlos
    const safeInputValue = String(inputValue || '');
    const safeInitialQuery = String(initialQuery || '');

    // No buscar si el input está vacío o no está en modo búsqueda
    if (safeInputValue.length < 2 || !isSearching) return [];
    
    // No mostrar resultados si el texto es idéntico al ejercicio ya guardado
    if (safeInputValue.toLowerCase() === safeInitialQuery.toLowerCase()) return [];

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
    // 2. Limpia el input para una nueva búsqueda (Tu petición)
    setInputValue('');
    // 3. Oculta el desplegable
    setIsSearching(false); 
  };

  // --- INICIO DE LA MODIFICACIÓN ---
  // 2. Creamos la función para el botón "Añadir Manual"
  const handleAddManualClick = () => {
    const exerciseName = inputValue.trim();
    if (exerciseName === '') return;

    // Creamos un objeto "falso" de ejercicio que simula uno real
    const fakeExercise = {
      id: null, // Sin ID de la base de datos
      name: exerciseName,
      muscle_group: tMuscle('unknown', { defaultValue: 'N/A' }), // Grupo por defecto
      image_url_start: null,
      image_url_end: null,
      video_url: null,
      is_manual: true // Lo marcamos como manual
    };
    
    // Usamos la misma función 'handleSelect' para
    // enviar el objeto falso y limpiar el estado.
    handleSelect(fakeExercise);
  };

  // 3. Creamos un componente reutilizable para el botón
  const ManualAddButton = () => {
    const query = inputValue.trim();
    if (query.length === 0) return null; // No mostrar si el input está vacío

    return (
      <div className="border-t border-glass-border">
        <button
          // Usamos onMouseDown para ganar al onBlur del input
          onMouseDown={(e) => {
            e.preventDefault(); // Previene que el input pierda el foco
            handleAddManualClick();
          }}
          className="flex items-center w-full gap-3 p-3 text-left text-accent font-semibold hover:bg-accent-transparent transition-colors"
        >
          <Plus size={20} />
          {/* Usamos 'break-words' por si el nombre es muy largo */}
          <span className="flex-1 min-w-0 break-words">
            {tUi('add_as_manual', 'Añadir "{{query}}" como manual', { query })}
          </span>
        </button>
      </div>
    );
  };
  // --- FIN DE LA MODIFICACIÓN ---

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
          onBlur={() => {
            // Retrasamos el 'onBlur' para que 'onMouseDown' (selección)
            // se pueda ejecutar primero.
            setTimeout(() => {
              // Si 'isSearching' sigue siendo 'true' (porque no se hizo clic
              // en un item), entonces revertimos el texto y cerramos.
              if (isSearching) {
                setIsSearching(false);
                setInputValue(String(initialQuery || '')); // Revertir al valor guardado (asegurando string)
              }
            }, 150); // 150ms de margen
          }}
          placeholder={tCommon('Buscar ejercicio...', { defaultValue: 'Buscar ejercicio...' })}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>

      {/* Quitamos 'absolute' y 'z-10' para que fluya en el layout */}

      {/* Estado de Carga */}
      {/* Corregimos la comprobación de length asegurando que sea un string */}
      {isLoading && isSearching && String(inputValue || '').length > 1 && (
        <div className="w-full p-4 flex justify-center bg-bg-secondary border border-glass-border rounded-xl mt-2 shadow-lg">
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
                  // Usamos 'onMouseDown' para que se dispare ANTES que el 'onBlur'
                  // e.preventDefault() NO es necesario gracias al setTimeout del onBlur.
                  onMouseDown={() => {
                    handleSelect(exercise);
                  }}
                  className="flex items-center w-full gap-3 p-3 text-left hover:bg-accent-transparent transition-colors"
                >
                  <img
                    src={exercise.image_url_start || '/logo.webp'}
                    alt={exercise.name}
                    className="w-12 h-12 rounded-md object-cover bg-bg-primary border border-glass-border shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{tName(exercise.name, { defaultValue: exercise.name })}</p>
                    <p className="text-sm text-text-muted truncate capitalize">{tMuscle(exercise.category || exercise.muscle_group, { defaultValue: exercise.category || exercise.muscle_group })}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          {/* 4. Añadimos el botón manual al final de la lista de resultados */}
          <ManualAddButton />
          {/* --- FIN DE LA MODIFICACIÓN --- */}
        </div>
      )}

      {/* Sin Resultados */}
      {/* Corregimos la comprobación de length asegurando que sea un string */}
      {!isLoading && isSearching && String(inputValue || '').length > 1 && filteredExercises.length === 0 && (
        <div className="w-full bg-bg-secondary border border-glass-border rounded-xl mt-2 shadow-lg">
          <div className="p-4">
            <p className="text-center text-text-muted">{tCommon('No se encontraron ejercicios.', { defaultValue: 'No se encontraron ejercicios.' })}</p>
          </div>
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          {/* 5. Añadimos el botón manual también al cuadro de "Sin Resultados" */}
          <ManualAddButton />
          {/* --- FIN DE LA MODIFICACIÓN --- */}
        </div>
      )}
    </div>
  );
};

export default ExerciseSearchInput;