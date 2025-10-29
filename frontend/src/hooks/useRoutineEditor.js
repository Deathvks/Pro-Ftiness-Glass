/* frontend/src/hooks/useRoutineEditor.js */
// Importamos los hooks modulares
import { useRoutineState } from './useRoutineState';
import { useRoutineLoader } from './useRoutineLoader';
import { useRoutineSaver } from './useRoutineSaver';
import { useRoutineExerciseActions } from './useRoutineExerciseActions';
import { useRoutineModalActions } from './useRoutineModalActions';
import { useRoutineGrouping } from './useRoutineGrouping';

// Importamos los hooks de utilidades
import { useToast } from '../hooks/useToast';

/**
 * Hook principal (orquestador) para el editor de rutinas.
 * Combina todos los sub-hooks (estado, carga, guardado, acciones)
 * para proporcionar la funcionalidad completa al componente.
 *
 * @param {Object} params
 * @param {Object} params.initialRoutine - La rutina inicial (si se edita).
 * @param {function} params.onSave - Callback a ejecutar tras guardar/borrar.
 * @param {function} params.onCancel - Callback a ejecutar al cancelar.
 * @returns {Object} Todo el estado y funciones necesarias para el editor.
 */
export const useRoutineEditor = ({ initialRoutine, onSave: handleSaveProp, onCancel }) => {
  const id = initialRoutine?.id;
  const { addToast } = useToast();

  // 1. Hook de Estado (useState)
  const {
    routineName, setRoutineName,
    description, setDescription,
    exercises, setExercises,
    isLoading, setIsLoading,
    isSaving, setIsSaving,
    isDeleting, setIsDeleting,
    showDeleteConfirm, setShowDeleteConfirm,
    validationError, setValidationError,
    showExerciseSearch, setShowExerciseSearch,
    activeDropdownTempId, setActiveDropdownTempId,
    replacingExerciseTempId, setReplacingExerciseTempId,
  } = useRoutineState(initialRoutine);

  // 2. Hook de Carga (useEffect)
  useRoutineLoader({
    id,
    addToast,
    onCancel,
    setIsLoading,
    setRoutineName,
    setDescription,
    setExercises,
  });

  // 3. Hook de Acciones de Modal
  const {
    handleOpenSearchForAdd,
    handleReplaceClick,
    handleSearchModalClose,
  } = useRoutineModalActions({
    setShowExerciseSearch,
    setReplacingExerciseTempId,
  });

  // 4. Hook de Guardado/Borrado (Zustand, Validación)
  const { handleSave, handleDelete } = useRoutineSaver({
    id,
    routineName,
    description,
    exercises,
    addToast,
    handleSaveProp,
    onCancel,
    setIsSaving,
    setIsDeleting,
    setValidationError,
    setShowDeleteConfirm,
  });

  // 5. Hook de Acciones de Ejercicios (CRUD, Drag&Drop, Superseries)
  const {
    addExercise,
    removeExercise,
    updateExerciseField,
    linkExerciseFromList,
    createSuperset,
    unlinkGroup,
    onDragEnd,
    handleAddExercisesFromSearch,
    addCustomExercise,
  } = useRoutineExerciseActions({
    exercises,
    setExercises,
    replacingExerciseTempId, // Usado en handleAddExercisesFromSearch
    addToast,
    handleSearchModalClose,   // Usado en add/replace
    setActiveDropdownTempId,  // Usado en linkExerciseFromList
  });

  // 6. Hook de Estado Derivado (Agrupación de ejercicios)
  const groupedExercises = useRoutineGrouping(exercises);


  // --- RETURNED VALUES ---
  // Devolvemos la misma "API" que el hook original
  return {
    id,
    // Estados y Setters (de useRoutineState)
    routineName, setRoutineName,
    description, setDescription,
    exercises,
    isLoading,
    isSaving,
    isDeleting,
    showDeleteConfirm, setShowDeleteConfirm,
    validationError,
    showExerciseSearch, setShowExerciseSearch,
    activeDropdownTempId, 
    setActiveDropdownTempId,
    
    // Funciones de Guardado/Borrado (de useRoutineSaver)
    handleSave,
    handleDelete,
    
    // Acciones de Ejercicios (de useRoutineExerciseActions)
    addExercise,
    updateExerciseField,
    linkExerciseFromList,
    removeExercise,
    createSuperset,
    unlinkGroup,
    onDragEnd,
    handleAddExercisesFromSearch,
    addCustomExercise, 
    
    // Estado Derivado (de useRoutineGrouping)
    groupedExercises,
    
    // Acciones de Modal (de useRoutineModalActions)
    handleOpenSearchForAdd,
    handleReplaceClick,
    handleSearchModalClose,
  };
};