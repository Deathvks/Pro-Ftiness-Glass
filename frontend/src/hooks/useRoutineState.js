/* frontend/src/hooks/useRoutineState.js */
import { useState, useEffect } from 'react';

// --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
const DRAFT_KEY = 'routineEditorDraft';

/**
 * Carga el estado inicial.
 * Intenta cargar un borrador desde localStorage si coincide con la rutina
 * que se intenta editar (por ID) o si es una nueva rutina.
 */
const getInitialState = (initialRoutine) => {
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  
  if (savedDraft) {
    try {
      const draft = JSON.parse(savedDraft);
      const draftId = draft.id || null;
      const routineId = initialRoutine?.id || null;
      
      // Si el ID del borrador coincide con el de la rutina, o si ambos son 'null' (Nueva Rutina)
      if (draftId === routineId) {
        // Cargar el borrador guardado
        return {
          ...draft,
          // Asegurarnos de que los estados de carga no se queden "atascados"
          isLoading: false, 
          isSaving: false,
          isDeleting: false,
        };
      }
    } catch (e) {
      console.error("Error al parsear el borrador de la rutina, limpiando.", e);
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  // Si no hay borrador o no coincide, empezar de cero
  return {
    id: initialRoutine?.id || null, // Guardar el ID de lo que estamos editando
    routineName: initialRoutine?.name || '',
    description: initialRoutine?.description || '',
    exercises: [], // Empezar vacío. useRoutineLoader lo llenará si no hay borrador
    isLoading: false,
    isSaving: false,
    isDeleting: false,
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
  const [exercises, setExercises] = useState(initialState.exercises); // <-- Se carga desde el borrador

  // Estados de carga y guardado
  const [isLoading, setIsLoading] = useState(initialState.isLoading);
  const [isSaving, setIsSaving] = useState(initialState.isSaving);
  const [isDeleting, setIsDeleting] = useState(initialState.isDeleting);

  // Estados de UI (modales, validación)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialState.showDeleteConfirm);
  const [validationError, setValidationError] = useState(initialState.validationError);
  const [showExerciseSearch, setShowExerciseSearch] = useState(initialState.showExerciseSearch); // <-- Se carga desde el borrador

  // Estados de UI (ejercicios específicos)
  const [activeDropdownTempId, setActiveDropdownTempId] = useState(initialState.activeDropdownTempId);
  const [replacingExerciseTempId, setReplacingExerciseTempId] = useState(initialState.replacingExerciseTempId); // <-- Se carga desde el borrador

  // 3. Efecto para guardar el borrador en CADA cambio de estado
  useEffect(() => {
    const draftState = {
      id: initialRoutine?.id || null,
      routineName,
      description,
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
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftState));
  }, [
    initialRoutine?.id,
    routineName,
    description,
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
    exercises, setExercises,
    // Estado y setters de carga
    isLoading, setIsLoading,
    isSaving, setIsSaving,
    isDeleting, setIsDeleting,
    // Estado y setters de UI
    showDeleteConfirm, setShowDeleteConfirm,
    validationError, setValidationError,
    showExerciseSearch, setShowExerciseSearch,
    activeDropdownTempId, setActiveDropdownTempId,
    replacingExerciseTempId, setReplacingExerciseTempId,
  };
};