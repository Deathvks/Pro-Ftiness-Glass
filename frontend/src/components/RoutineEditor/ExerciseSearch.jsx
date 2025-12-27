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

// --- INICIO DE LA MODIFICACIÓN (Persistencia del Carrito) ---
const CART_DRAFT_KEY = 'exerciseSearchCartDraft';
// --- FIN DE LA MODIFICACIÓN (Persistencia del Carrito) ---


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
  const [filterMuscle, setFilterMuscle] = useState([]); // Ahora es un array
  const [filterEquipment, setFilterEquipment] = useState([]); // Ahora es un array

  // --- INICIO DE LA MODIFICACIÓN (Persistencia del Carrito) ---
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
        // Si el borrador está corrupto, lo limpiamos
        localStorage.removeItem(CART_DRAFT_KEY);
      }
    }
    // Si no hay borrador, el carrito empieza vacío
    return [];
  });

  // Estado para saber si el borrador del carrito fue cargado
  const [draftLoaded, setDraftLoaded] = useState(() => {
    return !isReplacing && !!localStorage.getItem(CART_DRAFT_KEY);
  });

  // El carrito se considera "inicializado" si cargamos un borrador
  const [cartInitialized, setCartInitialized] = useState(draftLoaded);
  // --- FIN DE LA MODIFICACIÓN (Persistencia del Carrito) ---


  // useEffect de INICIALIZACIÓN (ahora respeta el borrador del carrito)
  useEffect(() => {
    // No inicializar el carrito si estamos en modo reemplazo
    if (isReplacing) {
      setCartInitialized(true); // Marcamos como "inicializado" para que no se ejecute
      return;
    }

    // --- INICIO DE LA MODIFICACIÓN (Persistencia del Carrito) ---
    // Si ya cargamos ejercicios desde un borrador, no ejecutamos esta lógica.
    // Esta lógica es solo para la *primera vez* que se abre el modal,
    // para poblar el carrito con los ejercicios que ya están en la rutina.
    if (draftLoaded) {
      return;
    }
    // --- FIN DE LA MODIFICACIÓN (Persistencia del Carrito) ---

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
  }, [allExercises, initialSelectedExercises, t, cartInitialized, isReplacing, draftLoaded]); // Añadido 'draftLoaded'


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
  }, []); // Dependencia vacía (correcto)

  // --- INICIO DE LA MODIFICACIÓN (Persistencia del Carrito) ---
  // useEffect para GUARDAR el carrito en localStorage en cada cambio
  useEffect(() => {
    // No guardar el carrito si estamos en modo "Reemplazar"
    if (!isReplacing) {
      localStorage.setItem(CART_DRAFT_KEY, JSON.stringify(stagedExercises));
    }
  }, [stagedExercises, isReplacing]);
  // --- FIN DE LA MODIFICACIÓN (Persistencia del Carrito) ---


  // --- LÓGICA DE FILTROS (Generación de Opciones) ---
  const { muscleOptions, equipmentOptions } = useMemo(() => {
    if (!ready) {
      return { muscleOptions: [], equipmentOptions: [] };
    }
    const muscleSet = new Set();
    const equipmentSet = new Set();

    allExercises.forEach(ex => {
      // --- MODIFICACIÓN: Soporte para múltiples músculos (separados por coma) ---
      if (ex.muscle_group) {
        // Si viene "Cuádriceps, Femorales", separamos y añadimos ambos
        ex.muscle_group.split(',').forEach(m => muscleSet.add(m.trim()));
      } else if (ex.category) {
        // Fallback a categoría si no hay muscle_group
        muscleSet.add(ex.category);
      } else {
        muscleSet.add('Other');
      }

      if (ex.equipment) {
        ex.equipment.split(',').forEach(eq => equipmentSet.add(eq.trim()));
      } else {
        equipmentSet.add('None');
      }
    });

    const sortedMuscles = Array.from(muscleSet).sort();
    const sortedEquipment = ['None', ...Array.from(equipmentSet).filter(e => e !== 'None').sort()];

    const muscleOpts = sortedMuscles.map(group => ({
      value: group,
      // Intentamos traducir usando el namespace 'exercise_muscles'.
      label: t(group, { ns: 'exercise_muscles', defaultValue: group }),
    }));

    const equipmentOpts = sortedEquipment.map(eq => ({
      value: eq,
      label: t(eq, { ns: 'exercise_equipment', defaultValue: eq }),
    }));
    return {
      muscleOptions: muscleOpts,
      equipmentOptions: equipmentOpts,
    };
  }, [allExercises, t, ready]);

  // --- LÓGICA DE FILTROS (Filtrado de Ejercicios) ---
  const filteredExercises = useMemo(() => {
    if (!ready) {
      return [];
    }
    const query = searchQuery.toLowerCase();

    return allExercises.filter(ex => {
      const originalName = ex.name.toLowerCase();
      const translatedName = t(ex.name, { ns: 'exercise_names', defaultValue: ex.name }).toLowerCase();
      const nameMatch = originalName.includes(query) || translatedName.includes(query);

      // --- MODIFICACIÓN: Comprobación contra lista de músculos ---
      const exerciseMuscles = ex.muscle_group
        ? ex.muscle_group.split(',').map(m => m.trim())
        : [ex.category || 'Other'];

      // Coincide si NO hay filtro o si ALGUNO de los músculos del ejercicio está en el filtro seleccionado
      const muscleMatch = filterMuscle.length === 0 || filterMuscle.some(filter => exerciseMuscles.includes(filter));

      const exerciseEquipment = ex.equipment
        ? ex.equipment.split(',').map(e => e.trim())
        : ['None'];

      const equipmentMatch = filterEquipment.length === 0 || filterEquipment.some(feq => exerciseEquipment.includes(feq));

      return nameMatch && muscleMatch && equipmentMatch;
    });
  }, [allExercises, searchQuery, filterMuscle, filterEquipment, t, ready]);

  // (stagedIds, sin cambios)
  const stagedIds = useMemo(() =>
    isReplacing ? new Set() : new Set(stagedExercises.map(item => item.exercise.id)),
    [stagedExercises, isReplacing]
  );

  // --- HANDLERS DEL CARRITO (Sin cambios) ---
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

  // handleFinalize
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

    // --- INICIO DE LA MODIFICACIÓN (Persistencia del Carrito) ---
    // Limpiamos el borrador del carrito al finalizar
    localStorage.removeItem(CART_DRAFT_KEY);
    // --- FIN DE LA MODIFICACIÓN (Persistencia del Carrito) ---

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
    if (isReplacing) return;
    setView('summary');
  };

  // --- FUNCIÓN MANUAL (Sin cambios) ---
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
        category: 'Other', // Por defecto mayúscula
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


  // --- RENDERIZADO (Sin cambios) ---
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