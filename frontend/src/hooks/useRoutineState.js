/* frontend/src/hooks/useRoutineState.js */
import { useState } from 'react';

/**
 * Hook para gestionar el estado base del editor de rutinas.
 * Contiene todos los useState.
 */
export const useRoutineState = (initialRoutine) => {
  // Estado principal de la rutina
  const [routineName, setRoutineName] = useState(initialRoutine?.name || '');
  const [description, setDescription] = useState(initialRoutine?.description || '');
  const [exercises, setExercises] = useState([]);

  // Estados de carga y guardado
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados de UI (modales, validación)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);

  // Estados de UI (ejercicios específicos)
  const [activeDropdownTempId, setActiveDropdownTempId] = useState(null);
  const [replacingExerciseTempId, setReplacingExerciseTempId] = useState(null);

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