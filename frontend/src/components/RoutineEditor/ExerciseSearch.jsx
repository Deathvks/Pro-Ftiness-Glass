/* frontend/src/components/RoutineEditor/ExerciseSearch.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import Spinner from '../Spinner';
import { getExerciseList } from '../../services/exerciseService';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid'; 

// Importar los nuevos componentes modulares
import ExerciseListView from './ExerciseSearch/ExerciseListView';
import ExerciseDetailView from './ExerciseSearch/ExerciseDetailView';
import ExerciseSummaryView from './ExerciseSearch/ExerciseSummaryView';


// --- Componente Principal (Contenedor) ---
const ExerciseSearch = ({
  onClose,
  onAddExercises,
  initialSelectedExercises = [],
  // --- INICIO DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
  isReplacing = false, // Por defecto, estamos en modo "Añadir"
  onExerciseSelectForReplace, // Función para reemplazar un ejercicio de la biblioteca
  onAddCustomExercise, // Función para reemplazar con un ejercicio manual
  // --- FIN DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
}) => {
  
  // Obtenemos 'ready' del hook
  const { t, i18n, ready } = useTranslation(['exercise_descriptions', 'exercise_names', 'exercise_ui', 'exercise_muscles', 'exercise_equipment']);

  // --- STATE ---
  const [view, setView] = useState('list'); 
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [allExercises, setAllExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState('all');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [stagedExercises, setStagedExercises] = useState([]);
  const [cartInitialized, setCartInitialized] = useState(false); // Mantenemos la bandera


  // useEffect de INICIALIZACIÓN (sin cambios, usa la bandera)
  useEffect(() => {
    // No inicializar el carrito si estamos en modo reemplazo
    if (isReplacing) {
      setCartInitialized(true); // Marcamos como "inicializado" para que no se ejecute
      return;
    }

    if (
      allExercises.length > 0 &&
      initialSelectedExercises &&
      initialSelectedExercises.length > 0 &&
      !cartInitialized
    ) {
      
      const initialStaged = initialSelectedExercises
        .map(routineExercise => {
          
          const exerciseId = routineExercise.exercise_id || routineExercise.id;
          let fullExercise = allExercises.find(ex => ex.id === exerciseId);

          if (!fullExercise) {
            const isManual = !routineExercise.exercise_id; 
            fullExercise = {
              id: exerciseId,
              name: routineExercise.name,
              category: routineExercise.category || 'other',
              equipment: routineExercise.equipment || 'other',
              is_manual: isManual,
              image_url_start: routineExercise.image_url_start || null,
              image_url_end: routineExercise.image_url_end || null,
              description: routineExercise.description || t('exercise_ui:manual_exercise_desc', 'Ejercicio añadido manualmente.'),
              muscle_group_image_url: routineExercise.muscle_group_image_url || '/muscle_groups/other.webp',
            };
          }

          return {
            exercise: fullExercise,
            sets: routineExercise.sets || 3,
            reps: routineExercise.reps || '8-12',
            rest_seconds: routineExercise.rest_seconds || 60,
          };
        })
        .filter(Boolean); 

      setStagedExercises(initialStaged);
      setCartInitialized(true); 
    }
  }, [allExercises, initialSelectedExercises, t, cartInitialized, isReplacing]); // Añadido 'isReplacing'


  // useEffect de CARGA DE DATOS (sin cambios)
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        const data = await getExerciseList();
        setAllExercises(data);
      } catch (error) {
        addToast(error.message || 'Error al cargar los ejercicios.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercises();
  // --- INICIO DE LA MODIFICACIÓN (FIX DEFINITIVO) ---
  // El array de dependencias DEBE estar vacío.
  // Esto asegura que el fetch SÓLO se ejecute una vez
  // cuando el componente se monta, y NUNCA MÁS,
  // aunque el ToastProvider cause un re-render.
  }, []); 
  // --- FIN DE LA MODIFICACIÓN (FIX DEFINITIVO) ---


  // --- LÓGICA DE FILTROS (Sin cambios) ---
  const { muscleOptions, equipmentOptions } = useMemo(() => {
    if (!ready) {
      return { muscleOptions: [], equipmentOptions: [] };
    }
    const muscleSet = new Set();
    const equipmentSet = new Set();
    allExercises.forEach(ex => {
      const muscle = ex.category || 'all';
      muscleSet.add(muscle);
      if (ex.equipment) {
        ex.equipment.split(',').forEach(eq => equipmentSet.add(eq.trim()));
      } else {
        equipmentSet.add('None');
      }
    });
    const sortedMuscles = ['all', ...Array.from(muscleSet).filter(m => m !== 'all').sort()];
    const sortedEquipment = ['all', 'None', ...Array.from(equipmentSet).filter(e => e !== 'all' && e !== 'None').sort()];
    const muscleOpts = sortedMuscles.map(group => ({
      value: group,
      label: group === 'all'
        ? t('exercise_ui:all_muscles', 'Todos los Músculos')
        : t(group, { ns: 'exercise_muscles', defaultValue: group }),
    }));
    const equipmentOpts = sortedEquipment.map(eq => ({
      value: eq,
      label: eq === 'all'
        ? t('exercise_ui:all_equipment', 'Todo el Equipamiento')
        : t(eq, { ns: 'exercise_equipment', defaultValue: eq }),
    }));
    return {
      muscleOptions: muscleOpts,
      equipmentOptions: equipmentOpts,
    };
  }, [allExercises, t, ready]);

  // --- LÓGICA DE FILTROS (Sin cambios) ---
  const filteredExercises = useMemo(() => {
    if (!ready) {
      return [];
    }
    const query = searchQuery.toLowerCase();
    return allExercises.filter(ex => {
      const originalName = ex.name.toLowerCase();
      const translatedName = t(ex.name, { ns: 'exercise_names', defaultValue: ex.name }).toLowerCase();
      const nameMatch = originalName.includes(query) || translatedName.includes(query);
      const muscleMatch = filterMuscle === 'all' || (ex.category || 'all') === filterMuscle;
      const exerciseEquipment = ex.equipment
        ? ex.equipment.split(',').map(e => e.trim())
        : ['None'];
      const equipmentMatch = filterEquipment === 'all' || exerciseEquipment.includes(filterEquipment);
      return nameMatch && muscleMatch && equipmentMatch;
    });
  }, [allExercises, searchQuery, filterMuscle, filterEquipment, t, ready]);

  // Si estamos reemplazando, el "stagedId" es irrelevante, todos se pueden seleccionar
  const stagedIds = useMemo(() =>
    isReplacing ? new Set() : new Set(stagedExercises.map(item => item.exercise.id)),
    [stagedExercises, isReplacing]
  );

  // --- HANDLERS DEL CARRITO (Sin cambios, solo se usan en modo "Añadir") ---
  const handleStageExercise = (exercise, details = {}) => {
    if (stagedIds.has(exercise.id)) {
      return;
    }
    
    const newItem = {
      exercise: exercise,
      sets: details.sets || 3,
      reps: details.reps || '8-12',
      rest_seconds: details.rest_seconds || 60,
    };
    
    setStagedExercises(prev => [...prev, newItem]);
  };

  const handleRemoveStaged = (exerciseId) => {
    setStagedExercises(prev => prev.filter(item => item.exercise.id !== exerciseId));
  };

  const handleUpdateStaged = (exerciseId, field, value) => {
    setStagedExercises(prev =>
      prev.map(item =>
        item.exercise.id === exerciseId ? { ...item, [field]: value } : item
      )
    );
  };

  // handleFinalize SÍ puede (y debe) llamar a addToast
  const handleFinalize = () => {
    if (stagedExercises.length === 0) {
      addToast(t('exercise_ui:cart_empty_toast', 'El carrito está vacío.'), 'warning');
      return;
    }
    onAddExercises(stagedExercises); 
    addToast(
      t('exercise_ui:added_to_routine_toast', {
        count: stagedExercises.length,
        defaultValue: '{{count}} ejercicio(s) añadido(s) a la rutina.',
      }),
      'success'
    );
    onClose(); 
  };


  // --- HANDLERS DE NAVEGACIÓN (Modificados) ---
  const handleViewDetail = (exercise) => {
    setSelectedExercise(exercise);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedExercise(null);
    setView('list');
  };

  // --- INICIO DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
  // Si estamos en modo reemplazo, no vamos al resumen/carrito
  const handleViewSummary = () => {
    if (isReplacing) return;
    setView('summary');
  };
  // --- FIN DE LA MODIFICACIÓN (FIX REEMPLAZO) ---

  // --- FUNCIÓN MANUAL (Modificada) ---
  const handleAddManualExercise = () => {
    const exerciseName = searchQuery.trim();

    if (exerciseName === '') {
      addToast(t('exercise_ui:type_manual_name_toast', 'Escribe un nombre en el buscador para añadirlo manualmente.'), 'warning');
      return;
    }

    // --- INICIO DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
    if (isReplacing) {
      // MODO REEMPLAZO: Llama a la función del hook que añade/reemplaza en la rutina principal
      if (onAddCustomExercise) {
        onAddCustomExercise(exerciseName);
      }
      // NOTA: 'onAddCustomExercise' (del hook) se encarga de cerrar el modal
    } else {
      // MODO AÑADIR (antiguo): Añade al carrito local
      const manualExercise = {
        id: `manual_${uuidv4()}`,
        name: exerciseName, 
        category: 'other', 
        equipment: 'other', 
        is_manual: true,
        image_url_start: null, 
        image_url_end: null,
        description: t('exercise_ui:manual_exercise_desc', 'Ejercicio añadido manualmente.'),
        muscle_group_image_url: '/muscle_groups/other.webp', 
      };
      
      handleStageExercise(manualExercise, {
        sets: 3,
        reps: '10', 
        rest_seconds: 60,
      });
      
      setView('summary');
      setSearchQuery(''); 
    }
    // --- FIN DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
  };


  // --- RENDERIZADO (Modificado) ---
  const renderContent = () => {
    if (view === 'detail' && selectedExercise) {
      return (
        <ExerciseDetailView
          exercise={selectedExercise}
          onBack={handleBackToList}
          // --- INICIO DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
          // Si reemplazamos, llamamos a 'onExerciseSelectForReplace'
          // Si no, llamamos a 'handleStageExercise' (añadir al carrito)
          onAdd={isReplacing ? onExerciseSelectForReplace : handleStageExercise}
          // Si reemplazamos, no está "staged". Si no, comprobamos el Set.
          isStaged={isReplacing ? false : stagedIds.has(selectedExercise.id)}
          // Pasamos el modo para que el botón cambie de "Añadir" a "Reemplazar"
          isReplacing={isReplacing}
          // --- FIN DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
          t={t}
        />
      );
    }

    // No mostrar el resumen si estamos reemplazando
    if (view === 'summary' && !isReplacing) {
      return (
        <ExerciseSummaryView
          stagedExercises={stagedExercises}
          onBack={handleBackToList}
          onUpdate={handleUpdateStaged}
          onRemove={handleRemoveStaged}
          onFinalize={handleFinalize}
          t={t}
        />
      );
    }
    
    // Si la vista es 'summary' pero estamos reemplazando, volvemos a 'list'
    if (view === 'summary' && isReplacing) {
      setView('list');
    }

    return (
      <ExerciseListView
        onClose={onClose}
        onViewSummary={handleViewSummary} // (Ahora está guardado para no hacer nada si 'isReplacing')
        // --- INICIO DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
        // Si reemplazamos, el contador es 0 (oculta el botón del carrito)
        stagedExercisesCount={isReplacing ? 0 : stagedExercises.length}
        // --- FIN DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
        isLoading={isLoading || !ready}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filterMuscle={filterMuscle}
        setFilterMuscle={setFilterMuscle}
        muscleOptions={muscleOptions}
        filterEquipment={filterEquipment}
        setFilterEquipment={setFilterEquipment}
        equipmentOptions={equipmentOptions}
        filteredExercises={filteredExercises}
        onViewDetail={handleViewDetail}
        // --- INICIO DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
        // Si reemplazamos, llamamos a 'onExerciseSelectForReplace'
        // Si no, llamamos a 'handleStageExercise' (añadir al carrito)
        onAddExercise={isReplacing ? onExerciseSelectForReplace : handleStageExercise}
        // stagedIds ya está controlado por 'isReplacing' (ver useMemo)
        stagedIds={stagedIds}
        onAddManual={handleAddManualExercise} // (Ahora está guardado para hacer lo correcto)
        // Pasamos el modo para que el botón cambie de "Añadir" a "Reemplazar"
        isReplacing={isReplacing}
        // --- FIN DE LA MODIFICACIÓN (FIX REEMPLAZO) ---
        t={t}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex justify-center items-center animate-[fade-in_0.2s_ease_out]">
      <div className="relative w-full h-full md:max-w-2xl md:max-h-[90vh] md:rounded-lg overflow-hidden bg-bg-primary md:border md:border-glass-border md:shadow-2xl">
        {renderContent()}
      </div>
    </div>
  );
};

export default ExerciseSearch;