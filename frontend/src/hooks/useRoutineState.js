/* frontend/src/hooks/useRoutineState.js */
import { useState, useEffect } from 'react';

// --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
const DRAFT_KEY = 'routineEditorDraft';

/**
 * Carga el estado inicial.
 * Intenta cargar un borrador desde localStorage si coincide con la rutina
 * que se intenta editar (por ID) o si es una nueva rutina.
 * * FIX: Si initialRoutine ya trae 'exercises' (ej: generado por IA o al duplicar),
 * esos ejercicios deben ser la prioridad absoluta sobre cualquier borrador.
 */
const getInitialState = (initialRoutine) => {
  const savedDraft = localStorage.getItem(DRAFT_KEY);

  // 1. Verificamos si la rutina inicial ya trae ejercicios (ej: de la IA o de Duplicar)
  const hasInitialExercises = initialRoutine?.exercises && initialRoutine.exercises.length > 0;

  if (savedDraft) {
    try {
      const draft = JSON.parse(savedDraft);
      const draftId = draft.id || null;
      const routineId = initialRoutine?.id || null;

      // Si el ID del borrador coincide con el de la rutina, y NO nos están forzando ejercicios nuevos por props
      if (draftId === routineId && !hasInitialExercises) {
        // Cargar el borrador guardado
        return {
          ...draft,
          // Asegurarnos de que los estados de carga no se queden "atascados"
          isLoading: false,
          isSaving: false,
          isDeleting: false,
          isUploadingImage: false, // Asegurar que empieza en false
        };
      }
    } catch (e) {
      console.error("Error al parsear el borrador de la rutina, limpiando.", e);
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  // Si no hay borrador o no coincide, o tenemos ejercicios forzados (IA)
  return {
    id: initialRoutine?.id || null, // Guardar el ID de lo que estamos editando
    routineName: initialRoutine?.name || '',
    description: initialRoutine?.description || '',
    // FIX: Manejar ambos formatos de image_url por si acaso
    imageUrl: initialRoutine?.image_url || initialRoutine?.imageUrl || null,
    // FIX: Cargamos los ejercicios que mandó la IA o el duplicado
    exercises: initialRoutine?.exercises || [], 
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    isUploadingImage: false,
    showDeleteConfirm: false,
    validationError: null,
    showExerciseSearch: false,
    activeDropdownTempId: null,
    replacingExerciseTempId: null,
  };
};
// --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---

/**
 * Hook para gestionar el estado base del editor de rutinas.
 * Contiene todos los useState.
 */
export const useRoutineState = (initialRoutine) => {
  // --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---

  // 1. Obtener el estado inicial (desde el borrador o la rutina)
  // Usamos useState con una función para que getInitialState solo se ejecute una vez
  const [initialState] = useState(() => getInitialState(initialRoutine));

  // 2. Inicializar todos los estados desde initialState
  const [routineName, setRoutineName] = useState(initialState.routineName);
  const [description, setDescription] = useState(initialState.description);
  const [imageUrl, setImageUrl] = useState(initialState.imageUrl); 
  // FIX: Ahora initialState.exercises contendrá los de la IA si están presentes
  const [exercises, setExercises] = useState(initialState.exercises); 

  // Estados de carga y guardado
  const [isLoading, setIsLoading] = useState(initialState.isLoading);
  const [isSaving, setIsSaving] = useState(initialState.isSaving);
  const [isDeleting, setIsDeleting] = useState(initialState.isDeleting);
  const [isUploadingImage, setIsUploadingImage] = useState(initialState.isUploadingImage);

  // Estados de UI (modales, validación)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialState.showDeleteConfirm);
  const [validationError, setValidationError] = useState(initialState.validationError);
  const [showExerciseSearch, setShowExerciseSearch] = useState(initialState.showExerciseSearch);

  // Estados de UI (ejercicios específicos)
  const [activeDropdownTempId, setActiveDropdownTempId] = useState(initialState.activeDropdownTempId);
  const [replacingExerciseTempId, setReplacingExerciseTempId] = useState(initialState.replacingExerciseTempId);

  // 3. Efecto para guardar el borrador en CADA cambio de estado
  useEffect(() => {
    const draftState = {
      id: initialRoutine?.id || null,
      routineName,
      description,
      imageUrl, // Guardamos la URL de la imagen en el borrador
      exercises,
      showDeleteConfirm,
      validationError,
      showExerciseSearch,
      activeDropdownTempId,
      replacingExerciseTempId,
      // Los estados de carga no se guardan como true
      isLoading: false,
      isSaving: false,
      isDeleting: false,
      isUploadingImage: false,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftState));
  }, [
    initialRoutine?.id,
    routineName,
    description,
    imageUrl, // Añadido a dependencias
    exercises,
    showDeleteConfirm,
    validationError,
    showExerciseSearch,
    activeDropdownTempId,
    replacingExerciseTempId
  ]);
  // --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---

  return {
    // Estado y setters de la rutina
    routineName, setRoutineName,
    description, setDescription,
    imageUrl, setImageUrl,
    exercises, setExercises,
    // Estado y setters de carga
    isLoading, setIsLoading,
    isSaving, setIsSaving,
    isDeleting, setIsDeleting,
    isUploadingImage, setIsUploadingImage,
    // Estado y setters de UI
    showDeleteConfirm, setShowDeleteConfirm,
    validationError, setValidationError,
    showExerciseSearch, setShowExerciseSearch,
    activeDropdownTempId, setActiveDropdownTempId,
    replacingExerciseTempId, setReplacingExerciseTempId,
  };
};