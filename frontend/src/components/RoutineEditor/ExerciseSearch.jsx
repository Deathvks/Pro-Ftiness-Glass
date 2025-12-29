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

const CART_DRAFT_KEY = 'exerciseSearchCartDraft';

// --- Componente Principal (Contenedor) ---
const ExerciseSearch = ({
  onClose,
  onAddExercises,
  initialSelectedExercises = [],
  isReplacing = false, // Por defecto, estamos en modo "Añadir"
  onExerciseSelectForReplace, // Función para reemplazar un ejercicio de la biblioteca
  onAddCustomExercise, // Función para reemplazar con un ejercicio manual
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
  const [filterMuscle, setFilterMuscle] = useState([]); // Ahora es un array
  const [filterEquipment, setFilterEquipment] = useState([]); // Ahora es un array

  // Persistencia del Carrito
  const [stagedExercises, setStagedExercises] = useState(() => {
    // El modo "Reemplazar" nunca usa un borrador, siempre empieza vacío
    if (isReplacing) {
      return [];
    }
    // Intentamos cargar el borrador del carrito
    const savedCart = localStorage.getItem(CART_DRAFT_KEY);
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        localStorage.removeItem(CART_DRAFT_KEY);
      }
    }
    return [];
  });

  // Estado para saber si el borrador del carrito fue cargado
  const [draftLoaded, setDraftLoaded] = useState(() => {
    return !isReplacing && !!localStorage.getItem(CART_DRAFT_KEY);
  });

  // El carrito se considera "inicializado" si cargamos un borrador
  const [cartInitialized, setCartInitialized] = useState(draftLoaded);

  // useEffect de INICIALIZACIÓN
  useEffect(() => {
    if (isReplacing) {
      setCartInitialized(true);
      return;
    }

    if (draftLoaded) {
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
              category: routineExercise.category || 'Other',
              equipment: routineExercise.equipment || 'Other',
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
  }, [allExercises, initialSelectedExercises, t, cartInitialized, isReplacing, draftLoaded]);


  // useEffect de CARGA DE DATOS
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
  }, []);

  // useEffect para GUARDAR el carrito
  useEffect(() => {
    if (!isReplacing) {
      localStorage.setItem(CART_DRAFT_KEY, JSON.stringify(stagedExercises));
    }
  }, [stagedExercises, isReplacing]);


  // --- LÓGICA DE FILTROS (Generación de Opciones Unificadas) ---
  const { muscleOptions, equipmentOptions } = useMemo(() => {
    if (!ready) {
      return { muscleOptions: [], equipmentOptions: [] };
    }

    // Sets para guardar nombres ya TRADUCIDOS y evitar duplicados en el selector
    const muscleLabelSet = new Set();
    const equipmentLabelSet = new Set();

    allExercises.forEach(ex => {
      // --- Músculos ---
      const rawMuscles = ex.muscle_group
        ? ex.muscle_group.split(',')
        : [ex.category || 'Other'];

      rawMuscles.forEach(m => {
        // Obtenemos la traducción (ej: "Chest" -> "Pecho", "Pectoralis major" -> "Pecho")
        const label = t(m.trim(), { ns: 'exercise_muscles', defaultValue: m.trim() });
        muscleLabelSet.add(label);
      });

      // --- Equipamiento ---
      const rawEquipment = ex.equipment
        ? ex.equipment.split(',')
        : ['None'];

      rawEquipment.forEach(e => {
        const label = t(e.trim(), { ns: 'exercise_equipment', defaultValue: e.trim() });
        equipmentLabelSet.add(label);
      });
    });

    const sortedMuscleLabels = Array.from(muscleLabelSet).sort();
    const sortedEquipmentLabels = Array.from(equipmentLabelSet).sort();

    // Construimos las opciones usando el Label traducido como valor
    const muscleOpts = sortedMuscleLabels.map(label => ({
      value: label,
      label: label,
    }));

    const equipmentOpts = sortedEquipmentLabels.map(label => ({
      value: label,
      label: label,
    }));

    return {
      muscleOptions: muscleOpts,
      equipmentOptions: equipmentOpts,
    };
  }, [allExercises, t, ready]);

  // --- LÓGICA DE FILTROS (Filtrado de Ejercicios por Label) ---
  const filteredExercises = useMemo(() => {
    if (!ready) {
      return [];
    }
    const query = searchQuery.toLowerCase();

    // Obtenemos las etiquetas traducidas para la lógica especial de Biceps/Triceps
    const armsLabel = t('Arms', { ns: 'exercise_muscles', defaultValue: 'Arms' });
    const bicepsLabel = t('Biceps', { ns: 'exercise_muscles', defaultValue: 'Biceps' });
    const tricepsLabel = t('Triceps', { ns: 'exercise_muscles', defaultValue: 'Triceps' });

    return allExercises.filter(ex => {
      // 1. Filtro Texto (Nombre)
      const originalName = ex.name.toLowerCase();
      const translatedName = t(ex.name, { ns: 'exercise_names', defaultValue: ex.name }).toLowerCase();
      const nameMatch = originalName.includes(query) || translatedName.includes(query);

      // 2. Filtro Músculo (Comparando Labels Traducidos)
      const rawMuscles = ex.muscle_group
        ? ex.muscle_group.split(',').map(m => m.trim())
        : [ex.category || 'Other'];

      // Traducimos los músculos del ejercicio actual
      const translatedMuscles = rawMuscles.map(m =>
        t(m, { ns: 'exercise_muscles', defaultValue: m })
      );

      // Coincide si NO hay filtro activo O si alguno de los músculos traducidos está en la lista de filtros seleccionados
      // --- INICIO DE LA MODIFICACIÓN (Lógica especial Brazos) ---
      const muscleMatch = filterMuscle.length === 0 || filterMuscle.some(filterLabel => {
        // Coincidencia exacta
        if (translatedMuscles.includes(filterLabel)) return true;

        // Lógica especial 1: Si filtro por Bíceps o Tríceps, mostrar también ejercicios de "Brazos"
        if ((filterLabel === bicepsLabel || filterLabel === tricepsLabel) && translatedMuscles.includes(armsLabel)) {
          return true;
        }

        // Lógica especial 2: Si filtro por "Brazos", mostrar también ejercicios de "Bíceps" o "Tríceps"
        if (filterLabel === armsLabel && (translatedMuscles.includes(bicepsLabel) || translatedMuscles.includes(tricepsLabel))) {
          return true;
        }

        return false;
      });
      // --- FIN DE LA MODIFICACIÓN ---

      // 3. Filtro Equipamiento (Comparando Labels Traducidos)
      const rawEquipment = ex.equipment
        ? ex.equipment.split(',').map(e => e.trim())
        : ['None'];

      const translatedEquipment = rawEquipment.map(e =>
        t(e, { ns: 'exercise_equipment', defaultValue: e })
      );

      const equipmentMatch = filterEquipment.length === 0 || filterEquipment.some(filterLabel => translatedEquipment.includes(filterLabel));

      return nameMatch && muscleMatch && equipmentMatch;
    });
  }, [allExercises, searchQuery, filterMuscle, filterEquipment, t, ready]);

  // (stagedIds, sin cambios)
  const stagedIds = useMemo(() =>
    isReplacing ? new Set() : new Set(stagedExercises.map(item => item.exercise.id)),
    [stagedExercises, isReplacing]
  );

  // --- HANDLERS DEL CARRITO ---
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

    localStorage.removeItem(CART_DRAFT_KEY);
    onClose();
  };


  // --- HANDLERS DE NAVEGACIÓN ---
  const handleViewDetail = (exercise) => {
    setSelectedExercise(exercise);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedExercise(null);
    setView('list');
  };

  const handleViewSummary = () => {
    if (isReplacing) return;
    setView('summary');
  };

  // --- FUNCIÓN MANUAL ---
  const handleAddManualExercise = () => {
    const exerciseName = searchQuery.trim();

    if (exerciseName === '') {
      addToast(t('exercise_ui:type_manual_name_toast', 'Escribe un nombre en el buscador para añadirlo manualmente.'), 'warning');
      return;
    }

    if (isReplacing) {
      if (onAddCustomExercise) {
        onAddCustomExercise(exerciseName);
      }
    } else {
      const manualExercise = {
        id: `manual_${uuidv4()}`,
        name: exerciseName,
        category: 'Other',
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
  };


  // --- RENDERIZADO ---
  const renderContent = () => {
    if (view === 'detail' && selectedExercise) {
      return (
        <ExerciseDetailView
          exercise={selectedExercise}
          onBack={handleBackToList}
          onAdd={isReplacing ? onExerciseSelectForReplace : handleStageExercise}
          isStaged={isReplacing ? false : stagedIds.has(selectedExercise.id)}
          isReplacing={isReplacing}
          t={t}
        />
      );
    }

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

    if (view === 'summary' && isReplacing) {
      setView('list');
    }

    return (
      <ExerciseListView
        onClose={onClose}
        onViewSummary={handleViewSummary}
        stagedExercisesCount={isReplacing ? 0 : stagedExercises.length}
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
        onAddExercise={isReplacing ? onExerciseSelectForReplace : handleStageExercise}
        stagedIds={stagedIds}
        onAddManual={handleAddManualExercise}
        isReplacing={isReplacing}
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