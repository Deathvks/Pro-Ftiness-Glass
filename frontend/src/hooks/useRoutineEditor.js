/* frontend/src/hooks/useRoutineEditor.js */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getRoutineById, deleteRoutine, saveRoutine } from '../services/routineService';
import { getExerciseList } from '../services/exerciseService';
import { useToast } from '../hooks/useToast';
import { v4 as uuidv4 } from 'uuid';
import i18n from '../i18n';

export const useRoutineEditor = ({ initialRoutine, onSave: handleSaveProp, onCancel }) => {
  const id = initialRoutine?.id;
  const { addToast } = useToast();
  
  // --- STATE ---
  const [routineName, setRoutineName] = useState(initialRoutine?.name || '');
  const [description, setDescription] = useState(initialRoutine?.description || '');
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);

  const [replacingExerciseIndex, setReplacingExerciseIndex] = useState(null);

  // --- useEffect (Hidratación de ejercicios) ---
  useEffect(() => {
    const loadRoutine = async () => {
      
      // FIX: No resetear la lista si es una rutina nueva
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const allExercisesData = await getExerciseList();
        const routine = await getRoutineById(id);
        setRoutineName(routine.name);
        setDescription(routine.description);

        const formattedExercises = routine.exercises.map((ex, index) => {
          const fullExercise = allExercisesData.find(e => e.id === ex.exercise_id);
          
          if (!fullExercise) {
            // Ejercicio manual o no encontrado
            return {
              tempId: uuidv4(),
              id: ex.exercise_id,
              name: ex.name,
              muscle_group: ex.muscle_group,
              sets: ex.sets,
              reps: ex.reps,
              rest_time: ex.rest_time,
              superset_group_id: ex.superset_group_id,
              exercise_order: ex.exercise_order,
              is_manual: true,
              image_url_start: null,
              video_url: null,
            };
          }

          // Ejercicio encontrado
          return {
            ...fullExercise,
            tempId: uuidv4(),
            id: ex.exercise_id,
            name: ex.name,
            muscle_group: ex.muscle_group,
            sets: ex.sets,
            reps: ex.reps,
            rest_time: ex.rest_time,
            superset_group_id: ex.superset_group_id,
            exercise_order: ex.exercise_order
          };
        });
        
        setExercises(formattedExercises);
      } catch (error) {
        addToast(error.message || 'Error al cargar la rutina', 'error');
        onCancel();
      } finally {
        setIsLoading(false);
      }
    };
    loadRoutine();
  }, [id, addToast, onCancel]);

  // --- VALIDACIÓN (Sin cambios) ---
  const validateRoutine = () => {
    const getT = (key, defaultVal) => i18n.t(key, { defaultValue: defaultVal });

    if (!routineName.trim()) {
      setValidationError(getT('routine_editor:error_routine_name_required', 'El nombre de la rutina es obligatorio.'));
      return false;
    }
    if (exercises.length === 0) {
      setValidationError(getT('routine_editor:error_min_one_exercise', 'La rutina debe tener al menos un ejercicio.'));
      return false;
    }
    let exerciseError = false;
    exercises.forEach((ex, index) => {
      if (!ex.name || ex.name.trim() === '') exerciseError = true;
      if (!ex.sets || isNaN(parseInt(ex.sets, 10)) || parseInt(ex.sets, 10) <= 0) exerciseError = true;
      if (!ex.reps || ex.reps.trim() === '') exerciseError = true;
    });

    if (exerciseError) {
      setValidationError(getT('routine_editor:error_all_fields_required', 'Todos los ejercicios deben tener nombre, series y repeticiones válidos.'));
      return false;
    }
    setValidationError(null);
    return true;
  };

  // --- SAVE & DELETE (Sin cambios) ---
  const handleSave = async () => {
    if (!validateRoutine()) return;
    setIsSaving(true);
    const routineData = {
      name: routineName,
      description: description,
      exercises: exercises.map((ex, index) => ({
        exercise_id: ex.id,
        name: ex.name,
        muscle_group: ex.muscle_group,
        sets: parseInt(ex.sets, 10),
        reps: ex.reps,
        rest_time: ex.rest_time ? parseInt(ex.rest_time, 10) : 60,
        superset_group_id: ex.superset_group_id || null,
        exercise_order: index
      }))
    };
    try {
      const savedRoutine = await saveRoutine(id, routineData);
      addToast(id ? 'Rutina actualizada' : 'Rutina creada', 'success');
      handleSaveProp(savedRoutine);
    } catch (error) {
      addToast(error.message || 'Error al guardar la rutina', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) {
      onCancel();
      return;
    }
    setIsDeleting(true);
    try {
      await deleteRoutine(id);
      addToast('Rutina eliminada', 'success');
      handleSaveProp(null, true);
    } catch (error) {
      addToast(error.message || 'Error al eliminar la rutina', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // --- EXERCISE ACTIONS ---

  // --- INICIO DE LA MODIFICACIÓN (FIX BUG Manual) ---
  const addExercise = () => { // Quitamos el parámetro
    
    const newExercise = {
      tempId: uuidv4(),
      id: null,
      name: '', // <-- Se establece a vacío para que el input de búsqueda esté libre
      sets: 3,
      reps: '10',
      rest_time: 60,
      muscle_group: '',
      superset_group_id: null,
      exercise_order: exercises.length,
      image_url_start: null,
      video_url: null,
    };
    setExercises(prev => [...prev, newExercise]);
  };
  // --- FIN DE LA MODIFICACIÓN (FIX BUG Manual) ---

  const removeExercise = (tempIdToRemove) => {
    setExercises(prev => prev.filter(ex => ex.tempId !== tempIdToRemove));
  };

  const updateExerciseField = (index, field, value) => {
    setExercises(prev =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const linkExerciseFromList = (index, selectedExercise) => {
    setExercises(prev =>
      prev.map((ex, i) =>
        i === index
          ? {
              ...ex, // Mantiene sets, reps, superset_id, etc.
              id: selectedExercise.id,
              name: selectedExercise.name,
              muscle_group: selectedExercise.category || selectedExercise.muscle_group,
              image_url_start: selectedExercise.image_url_start,
              image_url_end: selectedExercise.image_url_end,
              video_url: selectedExercise.video_url,
              is_manual: selectedExercise.is_manual || false,
            }
          : ex
      )
    );
    setActiveDropdownIndex(null);
  };
  
  // 1. Función para REEMPLAZAR
  const handleReplaceClick = (index) => {
    setReplacingExerciseIndex(index);
    setShowExerciseSearch(true); 
  };
  
  // 2. Función para AÑADIR
  const handleOpenSearchForAdd = () => {
    setReplacingExerciseIndex(null); 
    setShowExerciseSearch(true);
  };

  // 3. Función para CERRAR
  const handleSearchModalClose = () => {
    setShowExerciseSearch(false);
    setReplacingExerciseIndex(null); 
  };


  // --- SUPERSET ACTIONS (Sin cambios) ---
  const createSuperset = (index) => {
    if (index >= exercises.length - 1) return;
    const supersetId = uuidv4();
    setExercises(prev =>
      prev.map((ex, i) => {
        if (i === index || i === index + 1) {
          return { ...ex, superset_group_id: supersetId };
        }
        return ex;
      })
    );
  };

  const unlinkGroup = (supersetId) => {
    setExercises(prev =>
      prev.map(ex =>
        ex.superset_group_id === supersetId ? { ...ex, superset_group_id: null } : ex
      )
    );
  };

  // --- DRAG & DROP (Sin cambios) ---
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const reorderedExercises = Array.from(exercises);
    const [movedExercise] = reorderedExercises.splice(source.index, 1);
    reorderedExercises.splice(destination.index, 0, movedExercise);

    setExercises(
      reorderedExercises.map((ex, index) => ({
        ...ex,
        exercise_order: index
      }))
    );
  };

  // --- MODAL ACTIONS ---
  
  const handleAddExercisesFromSearch = (stagedExercises) => {
    
    // CASO 1: Estamos en modo "Reemplazar"
    if (replacingExerciseIndex !== null) {
      if (stagedExercises.length === 0) {
        handleSearchModalClose();
        return;
      }
      const selectedExercise = stagedExercises[0].exercise;
      linkExerciseFromList(replacingExerciseIndex, selectedExercise);
      handleSearchModalClose();

    } else {
      // CASO 2: Estamos en modo "Añadir"
      let newExercises = [];
      try {
        newExercises = stagedExercises.map((item, index) => {
          if (!item || !item.exercise) {
             return null;
          }
          return {
            ...item.exercise, // Objeto completo (con imagen/video)
            tempId: uuidv4(),
            id: item.exercise.id,
            sets: item.sets,
            reps: item.reps,
            rest_time: item.rest_time,
            superset_group_id: null,
            exercise_order: exercises.length + index // Usamos state 'exercises'
          };
        }).filter(Boolean);

      } catch (e) {
        addToast("Error al procesar los ejercicios.", 'error');
        return;
      }

      if (newExercises.length > 0) {
        setExercises(prev => {
          const finalState = [...prev, ...newExercises];
          return finalState;
        });
      }
      
      setShowExerciseSearch(false);
    }
  };


  // --- DERIVED STATE (GROUPING) (Sin cambios) ---
  const groupedExercises = useMemo(() => {
    const groups = [];
    let i = 0;
    while (i < exercises.length) {
      const currentExercise = exercises[i];
      if (currentExercise.superset_group_id) {
        const group = [currentExercise];
        let j = i + 1;
        while (j < exercises.length && exercises[j].superset_group_id === currentExercise.superset_group_id) {
          group.push(exercises[j]);
          j++;
        }
        groups.push(group);
        i = j;
      } else {
        groups.push([currentExercise]);
        i++;
      }
    }
    return groups;
  }, [exercises]);

  // --- RETURNED VALUES ---
  return {
    id,
    routineName, setRoutineName,
    description, setDescription,
    exercises,
    isLoading,
    isSaving,
    isDeleting,
    showDeleteConfirm, setShowDeleteConfirm,
    validationError,
    showExerciseSearch, setShowExerciseSearch,
    activeDropdownIndex, setActiveDropdownIndex,
    
    handleSave,
    handleDelete,
    addExercise,
    updateExerciseField,
    linkExerciseFromList,
    removeExercise,
    createSuperset,
    unlinkGroup,
    onDragEnd,
    handleAddExercisesFromSearch,
    
    groupedExercises,
    
    handleOpenSearchForAdd,
    handleReplaceClick,
    handleSearchModalClose,
  };
};