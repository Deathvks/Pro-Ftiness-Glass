/* frontend/src/hooks/useRoutineEditor.js */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getRoutineById, deleteRoutine, saveRoutine } from '../services/routineService';
// --- INICIO DE LA MODIFICACIÓN ---
// Importamos el servicio para obtener la lista completa de ejercicios
import { getExerciseList } from '../services/exerciseService';
// --- FIN DE LA MODIFICACIÓN ---
import { useToast } from '../hooks/useToast';
import { v4 as uuidv4 } from 'uuid';
import i18n from '../i18n';

export const useRoutineEditor = ({ initialRoutine, onSave: handleSaveProp, onCancel }) => {
  const id = initialRoutine?.id;
  const { addToast } = useToast();
  
  // --- STATE (Sin cambios) ---
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

  // --- INICIO DE LA MODIFICACIÓN ---
  // Reescribimos este useEffect para que "hidrate" los ejercicios
  useEffect(() => {
    const loadRoutine = async () => {
      // Si no hay ID (es una rutina nueva), terminamos
      if (!id) {
        setExercises([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 1. Obtenemos la lista completa de ejercicios de la BD
        const allExercisesData = await getExerciseList();
        
        // 2. Obtenemos la rutina específica
        const routine = await getRoutineById(id);

        setRoutineName(routine.name);
        setDescription(routine.description);

        // 3. "Hidratamos" los ejercicios de la rutina
        const formattedExercises = routine.exercises.map((ex, index) => {
          // Buscamos el ejercicio completo en la lista
          const fullExercise = allExercisesData.find(e => e.id === ex.exercise_id);

          // Si no se encuentra (ej: ejercicio manual borrado o antiguo),
          // creamos un objeto parcial para que no se rompa
          if (!fullExercise) {
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
              is_manual: true, // Asumimos que es manual si no está en la BD
              image_url_start: null // No tendrá imagen
            };
          }

          // Si se encuentra, combinamos el objeto "completo" (con imagen)
          // con los datos guardados de la rutina (series, reps)
          return {
            ...fullExercise, // <-- Esto añade image_url_start, etc.
            tempId: uuidv4(),
            id: ex.exercise_id, // Mantenemos el ID original
            name: ex.name, // Mantenemos el nombre guardado (por si se editó)
            muscle_group: ex.muscle_group, // Mantenemos el músculo guardado
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
  }, [id, addToast, onCancel]); // Dependencias correctas
  // --- FIN DE LA MODIFICACIÓN ---


  // --- VALIDACIÓN (Sin cambios) ---
  const validateRoutine = () => {
    // ... (código existente)
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
      if (!ex.name || ex.name.trim() === '') {
        // ... (código existente)
        exerciseError = true;
      }
      if (!ex.sets || isNaN(parseInt(ex.sets, 10)) || parseInt(ex.sets, 10) <= 0) {
        // ... (código existente)
        exerciseError = true;
      }
      if (!ex.reps || ex.reps.trim() === '') {
        // ... (código existente)
        exerciseError = true;
      }
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
    // ... (código existente)
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
      handleSaveProp(savedRoutine); // Llama al callback del padre
    } catch (error) {
      addToast(error.message || 'Error al guardar la rutina', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    // ... (código existente)
    if (!id) {
      onCancel();
      return;
    }
    setIsDeleting(true);
    try {
      await deleteRoutine(id);
      addToast('Rutina eliminada', 'success');
      handleSaveProp(null, true); // Llama al callback (routine=null, isDeleted=true)
    } catch (error) {
      addToast(error.message || 'Error al eliminar la rutina', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // --- EXERCISE ACTIONS (Sin cambios) ---
  const addExercise = (name = 'Nuevo Ejercicio') => {
    // ... (código existente)
    // ESTA FUNCIÓN ES PARA EL BOTÓN "MANUAL" DE LA PÁGINA PRINCIPAL, NO DEL MODAL
    const newExercise = {
      tempId: uuidv4(),
      id: null,
      name: name,
      sets: 3,
      reps: '10',
      rest_time: 60,
      muscle_group: '',
      superset_group_id: null,
      exercise_order: exercises.length,
      image_url_start: null,
      image_url_end: null
    };
    setExercises(prev => [...prev, newExercise]);
  };

  const removeExercise = (index) => {
    // ... (código existente)
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExerciseField = (index, field, value) => {
    // ... (código existente)
    setExercises(prev =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const linkExerciseFromList = (index, selectedExercise) => {
    // ... (código existente)
    setExercises(prev =>
      prev.map((ex, i) =>
        i === index
          ? {
              ...ex, // Mantiene sets, reps, etc.
              id: selectedExercise.id,
              name: selectedExercise.name,
              muscle_group: selectedExercise.category || selectedExercise.muscle_group,
              image_url_start: selectedExercise.image_url_start,
              image_url_end: selectedExercise.image_url_end
            }
          : ex
      )
    );
    setActiveDropdownIndex(null); // Cierra el dropdown
  };

  // --- SUPERSET ACTIONS (Sin cambios) ---
  const createSuperset = (index) => {
    // ... (código existente)
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
    // ... (código existente)
    setExercises(prev =>
      prev.map(ex =>
        ex.superset_group_id === supersetId ? { ...ex, superset_group_id: null } : ex
      )
    );
  };

  // --- DRAG & DROP (Sin cambios) ---
  const onDragEnd = (result) => {
    // ... (código existente)
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
  
  // --- INICIO DE LA MODIFICACIÓN ---
  // Modificamos esta función para que guarde el objeto "completo"
  const handleAddExercisesFromSearch = (stagedExercises) => {
    setExercises(prev => {
      const newExercises = stagedExercises.map((item, index) => ({
        // 1. Esparcimos el objeto "completo" del ejercicio
        ...item.exercise, // <-- ESTO AÑADE image_url_start, etc.
        
        // 2. Añadimos/Sobrescribimos los detalles de la rutina
        tempId: uuidv4(),
        id: item.exercise.id, // ID del ejercicio (o manual_id)
        sets: item.sets,
        reps: item.reps,
        rest_time: item.rest_time,
        superset_group_id: null,
        exercise_order: prev.length + index
      }));
      return [...prev, ...newExercises];
    });
    setShowExerciseSearch(false);
  };
  // --- FIN DE LA MODIFICACIÓN ---

  // --- DERIVED STATE (GROUPING) (Sin cambios) ---
  const groupedExercises = useMemo(() => {
    // ... (código existente)
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

  // --- RETURNED VALUES (Sin cambios) ---
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
    
    groupedExercises
  };
};