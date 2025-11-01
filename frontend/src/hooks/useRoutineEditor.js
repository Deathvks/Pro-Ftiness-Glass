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
    replacingExerciseTempId, setReplacingExerciseTempId, // <-- El estado clave
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
    handleSearchModalClose, // <-- La función de cierre
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
    linkExerciseFromList, // <-- La función que queremos llamar
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
    handleSearchModalClose,  // Usado en add/replace
    setActiveDropdownTempId,  // Usado en linkExerciseFromList
  });

  // 6. Hook de Estado Derivado (Agrupación de ejercicios)
  const groupedExercises = useRoutineGrouping(exercises);

  // --- INICIO DE LA MODIFICACIÓN (FIX STALE STATE) ---
  // 7. Creamos las funciones "wrapper" AQUÍ
  // Estas funciones se re-crearán CADA VEZ que el estado cambie,
  // (incluyendo 'replacingExerciseTempId'), por lo que NUNCA estarán obsoletas.

  /**
   * Reemplaza el ejercicio (seleccionado de la biblioteca)
   */
  const handleSelectExerciseForReplace = (selectedExercise) => {
    console.log('[useRoutineEditor] handleSelectExerciseForReplace CALLED');
    console.log('==> Current replacingExerciseTempId:', replacingExerciseTempId);
    
    if (replacingExerciseTempId) {
      linkExerciseFromList(replacingExerciseTempId, selectedExercise);
    } else {
      console.error('ERROR: Se intentó reemplazar, ¡pero replacingExerciseTempId era null!');
    }
    handleSearchModalClose(); // Cierra el modal
  };

  /**
   * Reemplaza el ejercicio (con uno manual)
   */
  const handleAddCustomExerciseForReplace = (exerciseName) => {
    console.log('[useRoutineEditor] handleAddCustomExerciseForReplace CALLED');
    console.log('==> Current replacingExerciseTempId:', replacingExerciseTempId);

    if (replacingExerciseTempId && exerciseName.trim() !== "") {
      const manualExercise = {
        id: null,
        name: exerciseName.trim(),
        muscle_group: 'other',
        category: 'other',
        equipment: 'other',
        is_manual: true,
        image_url_start: null,
        video_url: null,
      };
      linkExerciseFromList(replacingExerciseTempId, manualExercise);
    } else {
        console.error('ERROR: Se intentó reemplazar (manual), ¡pero replacingExerciseTempId era null o el nombre estaba vacío!');
    }
    handleSearchModalClose(); // Cierra el modal
  };
  // --- FIN DE LA MODIFICACIÓN (FIX STALE STATE) ---


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
    replacingExerciseTempId, // <-- Devolvemos el estado (para el 'isReplacing' del modal)
    
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

    // --- INICIO DE LA MODIFICACIÓN (FIX STALE STATE) ---
    // Devolvemos las nuevas funciones wrapper
    handleSelectExerciseForReplace,
    handleAddCustomExerciseForReplace,
    // --- FIN DE LA MODIFICACIÓN (FIX STALE STATE) ---
  };
};