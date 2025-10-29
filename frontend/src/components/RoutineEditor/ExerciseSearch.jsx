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
const ExerciseSearch = ({ onClose, onAddExercises, initialSelectedExercises = [] }) => {
  
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
  }, [allExercises, initialSelectedExercises, t, cartInitialized]);


  // useEffect de CARGA DE DATOS (fix clave)
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

  const stagedIds = useMemo(() => new Set(stagedExercises.map(item => item.exercise.id)), [stagedExercises]);

  // --- HANDLERS DEL CARRITO (fix clave) ---
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
    
    // --- INICIO DE LA MODIFICACIÓN (FIX DEFINITIVO) ---
    // ¡NO LLAMAR A addToast() AQUÍ!
    // Esta llamada es la que causa que el componente se desmonte
    // y pierda el estado que acabamos de poner.
    
    // const exerciseName = t(exercise.name, { ns: 'exercise_names', defaultValue: exercise.name });
    // addToast(t('exercise_ui:added_toast', { exerciseName }), 'success');
    
    // --- FIN DE LA MODIFICACIÓN (FIX DEFINITIVO) ---
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


  // --- HANDLERS DE NAVEGACIÓN (Sin cambios) ---
  const handleViewDetail = (exercise) => {
    setSelectedExercise(exercise);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedExercise(null);
    setView('list');
  };

  const handleViewSummary = () => {
    setView('summary');
  };

  // --- FUNCIÓN MANUAL (Sin cambios) ---
  const handleAddManualExercise = () => {
    const exerciseName = searchQuery.trim();

    if (exerciseName === '') {
      addToast(t('exercise_ui:type_manual_name_toast', 'Escribe un nombre en el buscador para añadirlo manualmente.'), 'warning');
      return;
    }

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
    
    // Esta llamada es segura porque no usa addToast
    handleStageExercise(manualExercise, {
      sets: 3,
      reps: '10', 
      rest_seconds: 60,
    });
    
    setView('summary');
    setSearchQuery(''); 
  };


  // --- RENDERIZADO (Sin cambios) ---
  const renderContent = () => {
    if (view === 'detail' && selectedExercise) {
      return (
        <ExerciseDetailView
          exercise={selectedExercise}
          onBack={handleBackToList}
          onAdd={handleStageExercise}
          isStaged={stagedIds.has(selectedExercise.id)}
          t={t}
        />
      );
    }

    if (view === 'summary') {
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
    
    return (
      <ExerciseListView
        onClose={onClose}
        onViewSummary={handleViewSummary}
        stagedExercisesCount={stagedExercises.length}
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
        onAddExercise={handleStageExercise}
        stagedIds={stagedIds}
        onAddManual={handleAddManualExercise} 
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