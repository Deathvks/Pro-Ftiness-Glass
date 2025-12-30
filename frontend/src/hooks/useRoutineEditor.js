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
import { uploadRoutineImage } from '../services/routineService';

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
    imageUrl, setImageUrl, // <-- Estado de la imagen
    exercises, setExercises,
    isLoading, setIsLoading,
    isSaving, setIsSaving,
    isDeleting, setIsDeleting,
    isUploadingImage, setIsUploadingImage, // <-- Estado de carga de subida
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
    setImageUrl, // <-- Pasamos el setter para cargar la imagen existente
    setExercises,
    exercises,
  });

  // 3. Hook de Acciones de Modal
  const {
    handleOpenSearchForAdd,
    handleReplaceClick,
    handleSearchModalClose: originalHandleSearchModalClose,
  } = useRoutineModalActions({
    setShowExerciseSearch,
    setReplacingExerciseTempId,
  });

  // --- INICIO DE LA MODIFICACIÓN (Persistencia del Carrito) ---
  const handleSearchModalClose = () => {
    localStorage.removeItem(CART_DRAFT_KEY);
    originalHandleSearchModalClose();
  };
  // --- FIN DE LA MODIFICACIÓN (Persistencia del Carrito) ---

  // 4. Hook de Guardado/Borrado (Zustand, Validación)
  const { handleSave, handleDelete } = useRoutineSaver({
    id,
    routineName,
    description,
    imageUrl, // <-- Pasamos la URL de la imagen para guardar
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
    replacingExerciseTempId,
    addToast,
    handleSearchModalClose,
    setActiveDropdownTempId,
  });

  // 6. Hook de Estado Derivado (Agrupación de ejercicios)
  const groupedExercises = useRoutineGrouping(exercises);

  // 7. Funciones auxiliares
  const handleSelectExerciseForReplace = (selectedExercise) => {
    if (replacingExerciseTempId) {
      linkExerciseFromList(replacingExerciseTempId, selectedExercise);
    } else {
      console.error('ERROR: Se intentó reemplazar, ¡pero replacingExerciseTempId era null!');
    }
    handleSearchModalClose();
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
    handleSearchModalClose();
  };

  const handleCancelWrapper = () => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(CART_DRAFT_KEY);
    onCancel();
  };

  // --- NUEVA FUNCIÓN: Manejo de subida de imagen ---
  const handleImageUpload = async (file) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const response = await uploadRoutineImage(file);
      setImageUrl(response.imageUrl); // Guardamos la ruta relativa devuelta por el backend
      addToast('Imagen subida correctamente', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      addToast('Error al subir la imagen', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };


  // --- RETURNED VALUES ---
  return {
    id,
    // Estados y Setters
    routineName, setRoutineName,
    description, setDescription,
    imageUrl, setImageUrl, // <-- Exportamos estado de imagen
    exercises,
    isLoading,
    isSaving,
    isDeleting,
    isUploadingImage, // <-- Exportamos estado de subida
    showDeleteConfirm, setShowDeleteConfirm,
    validationError,
    showExerciseSearch, setShowExerciseSearch,
    activeDropdownTempId,
    setActiveDropdownTempId,
    replacingExerciseTempId,

    // Funciones
    handleSave,
    handleDelete,
    handleCancel: handleCancelWrapper,
    handleImageUpload, // <-- Exportamos función de subida

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
    handleSearchModalClose,

    // Wrappers de reemplazo
    handleSelectExerciseForReplace,
    handleAddCustomExerciseForReplace,
  };
};