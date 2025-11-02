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

// Claves de borrador (deben coincidir)
const DRAFT_KEY = 'routineEditorDraft'; // Borrador de la rutina
// --- INICIO DE LA MODIFICACIÓN (Persistencia del Carrito) ---
const CART_DRAFT_KEY = 'exerciseSearchCartDraft'; // Borrador del carrito
// --- FIN DE LA MODIFICACIÓN (Persistencia del Carrito) ---

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
    exercises, setExercises, // <-- 'exercises' ahora puede venir del borrador
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
    // Le pasamos el array de ejercicios. Si tiene > 0 (del borrador),
    // el loader sabrá que no debe fetchear la rutina.
    exercises,
  });

  // 3. Hook de Acciones de Modal
  const {
    handleOpenSearchForAdd,
    handleReplaceClick,
    handleSearchModalClose: originalHandleSearchModalClose, // <-- Renombramos el original
  } = useRoutineModalActions({
    setShowExerciseSearch,
    setReplacingExerciseTempId,
  });

  // --- INICIO DE LA MODIFICACIÓN (Persistencia del Carrito) ---
  // Envolvemos 'handleSearchModalClose' para limpiar también el borrador del carrito
  const handleSearchModalClose = () => {
    localStorage.removeItem(CART_DRAFT_KEY);
    originalHandleSearchModalClose(); // Llamar a la función original
  };
  // --- FIN DE LA MODIFICACIÓN (Persistencia del Carrito) ---

  // 4. Hook de Guardado/Borrado (Zustand, Validación)
  // (Este hook ya limpia el DRAFT_KEY de la rutina al guardar/borrar)
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

  // 7. Funciones "wrapper"
  // (Wrappers para el fix de "stale state" de reemplazo)
  const handleSelectExerciseForReplace = (selectedExercise) => {
    if (replacingExerciseTempId) {
      linkExerciseFromList(replacingExerciseTempId, selectedExercise);
    } else {
      console.error('ERROR: Se intentó reemplazar, ¡pero replacingExerciseTempId era null!');
    }
    handleSearchModalClose(); // Cierra el modal (y limpia el borrador del carrito)
  };

  const handleAddCustomExerciseForReplace = (exerciseName) => {
    if (replacingExerciseTempId && exerciseName.trim() !== "") {
      const manualExercise = {
        id: null, name: exerciseName.trim(), muscle_group: 'other',
        category: 'other', equipment: 'other', is_manual: true,
        image_url_start: null, video_url: null,
      };
      linkExerciseFromList(replacingExerciseTempId, manualExercise);
    } else {
        console.error('ERROR: Se intentó reemplazar (manual), ¡pero replacingExerciseTempId era null o el nombre estaba vacío!');
    }
    handleSearchModalClose(); // Cierra el modal (y limpia el borrador del carrito)
  };
  
  // Wrapper para 'onCancel' (de la tarea anterior)
  const handleCancelWrapper = () => {
    localStorage.removeItem(DRAFT_KEY); // Limpiar borrador de rutina
    // --- INICIO DE LA MODIFICACIÓN (Persistencia del Carrito) ---
    localStorage.removeItem(CART_DRAFT_KEY); // Limpiar también el borrador del carrito
    // --- FIN DE LA MODIFICACIÓN (Persistencia del Carrito) ---
    onCancel(); // Llama a la función original (ej: setEditingRoutine(null))
  };


  // --- RETURNED VALUES ---
  return {
    id,
    // Estados y Setters
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
    replacingExerciseTempId,
    
    // Funciones de Guardado/Borrado
    handleSave,
    handleDelete,
    handleCancel: handleCancelWrapper, // Devolvemos el wrapper de cancelar
    
    // Acciones de Ejercicios
    addExercise,
    updateExerciseField,
    linkExerciseFromList,
    removeExercise,
    createSuperset,
    unlinkGroup,
    onDragEnd,
    handleAddExercisesFromSearch,
    addCustomExercise, 
    
    // Estado Derivado
    groupedExercises,
    
    // Acciones de Modal
    handleOpenSearchForAdd,
    handleReplaceClick,
    handleSearchModalClose, // Devolvemos el wrapper de cerrar modal

    // Wrappers de reemplazo
    handleSelectExerciseForReplace,
    handleAddCustomExerciseForReplace,
  };
};