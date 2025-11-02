/* frontend/src/hooks/useRoutineSaver.js */
import useAppStore from '../store/useAppStore';
import i18n from '../i18n';

// --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
const DRAFT_KEY = 'routineEditorDraft'; // La misma clave que usamos en useRoutineState
// --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---

/**
 * Hook para manejar la validación, guardado (crear/actualizar) y borrado de la rutina.
 *
 * @param {Object} params
 * (parámetros omitidos por brevedad)
 * @returns {Object} Funciones handleSave y handleDelete.
 */
export const useRoutineSaver = ({
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
}) => {

  const { createRoutine, updateRoutine, deleteRoutine } = useAppStore(state => ({
    createRoutine: state.createRoutine,
    updateRoutine: state.updateRoutine,
    deleteRoutine: state.deleteRoutine,
  }));

  /**
   * Valida los campos de la rutina antes de guardar.
   */
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
    
    // Validar cada ejercicio
    let exerciseError = false;
    exercises.forEach((ex) => {
      if (!ex.name || ex.name.trim() === '') exerciseError = true;
      
      // --- INICIO DE LA MODIFICACIÓN (Validación Lógica Mejorada) ---
      
      // 1. Validar Series:
      const setsNum = parseInt(ex.sets, 10);
      if (isNaN(setsNum) || setsNum <= 0) {
        exerciseError = true;
      }

      // 2. Validar Reps:
      const repsVal = String(ex.reps || '').trim();
      if (repsVal === '') {
        exerciseError = true; // Error si está vacío
      } else {
        const repsNum = parseInt(repsVal, 10);
        // Si es puramente un número (ej: "8", "0", "-1")
        if (String(repsNum) === repsVal) {
          if (repsNum <= 0) { // No puede ser 0 o negativo
            exerciseError = true; 
          }
        }
        // Si no (ej: "8-12"), es válido.
      }
      
      // 3. Validar Descanso:
      const restNum = parseInt(ex.rest_seconds, 10);
      // Permitimos que sea 0, pero no nulo/undefined, NaN, o negativo
      if (ex.rest_seconds === null || ex.rest_seconds === undefined || isNaN(restNum) || restNum < 0) {
         exerciseError = true;
      }
      // --- FIN DE LA MODIFICACIÓN (Validación Lógica Mejorada) ---
    });

    if (exerciseError) {
      // Mensaje de error actualizado para ser más claro
      setValidationError(getT('routine_editor:error_all_fields_required', 'Todos los ejercicios deben tener nombre. Las series y reps deben ser mayores a 0, y el descanso 0 o más.'));
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  /**
   * Prepara los datos y guarda (crea o actualiza) la rutina.
   */
  const handleSave = async () => {
    if (!validateRoutine()) return;
    setIsSaving(true);
    
    console.log('[useRoutineSaver] Iniciando guardado de rutina...');
    
    // 1. Preparamos los datos de la rutina para la API
    const routineData = {
      name: routineName,
      description: description,
      exercises: exercises.map((ex, index) => {
        // Normalizamos el 'rest_seconds'
        const rest = parseInt(ex.rest_seconds, 10);
        // La validación ya aseguró que restNum >= 0.
        const restValue = !isNaN(rest) ? rest : 0; // Default a 0 si algo falla (aunque la validación lo previene)

        // --- INICIO DE LA MODIFICACIÓN ---
        console.log(`[useRoutineSaver] Procesando Ejercicio: ${ex.name}`);
        console.log(`[useRoutineSaver] Valor muscle_group original: '${ex.muscle_group}' (Tipo: ${typeof ex.muscle_group})`);

        // 1. Limpiamos el valor (quitamos espacios) si no es null/undefined
        const trimmedMuscleGroup = ex.muscle_group ? String(ex.muscle_group).trim() : null;
        
        let muscleGroupValue;
        // 2. Comprobamos si el valor es nulo, vacío, 'N/A', o el string traducido 'Otro'.
        //    Si es así, lo normalizamos a la CLAVE 'Other'.
        if (!trimmedMuscleGroup || trimmedMuscleGroup === 'N/A' || trimmedMuscleGroup === 'Otro') {
          muscleGroupValue = 'Other'; // Usamos la CLAVE 'Other'
          console.log(`[useRoutineSaver] Valor detectado como nulo, vacío, 'N/A' o 'Otro'. Asignando: 'Other'.`);
        } else {
          // El valor ya es un key válido (ej: 'Chest', 'Back', o 'Other' del dropdown)
          muscleGroupValue = trimmedMuscleGroup;
          console.log(`[useRoutineSaver] Usando valor existente (es un key): '${muscleGroupValue}'`);
        }
        // --- FIN DE LA MODIFICACIÓN ---

        return {
          exercise_list_id: ex.id,
          name: ex.name,
          // --- INICIO DE LA MODIFICACIÓN ---
          muscle_group: muscleGroupValue, // Usamos el valor normalizado (la CLAVE)
          // --- FIN DE LA MODIFICACIÓN ---
          sets: parseInt(ex.sets, 10),
          reps: ex.reps,
          rest_seconds: restValue,
          superset_group_id: ex.superset_group_id || null,
          exercise_order: index,
          image_url_start: ex.image_url_start || null,
          video_url: ex.video_url || null,
        };
      })
    };
    
    console.log('[useRoutineSaver] Datos a enviar a la API:', routineData);

    try {
      let result;
      // 2. Decidimos si CREAR o ACTUALIZAR
      if (id) {
        console.log(`[useRoutineSaver] Actualizando rutina ID: ${id}`);
        result = await updateRoutine(id, routineData);
      } else {
        console.log('[useRoutineSaver] Creando nueva rutina...');
        result = await createRoutine(routineData);
      }
      
      // 3. Manejamos la respuesta
      if (result.success) {
        console.log('[useRoutineSaver] Guardado exitoso.');
        addToast(result.message, 'success');
        
        // --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
        localStorage.removeItem(DRAFT_KEY); // Limpiar el borrador
        // --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---
        
        handleSaveProp(); // Ejecutamos el callback (ej: navegar atrás)
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error('[useRoutineSaver] Error al guardar:', error);
      addToast(error.message || 'Error al guardar la rutina', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Maneja la eliminación de la rutina.
   */
  const handleDelete = async () => {
    if (!id) {
      // --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
      localStorage.removeItem(DRAFT_KEY); // Limpiar el borrador
      // --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---
      onCancel(); // Si no hay ID, simplemente cancela
      return;
    }
    
    setIsDeleting(true);
    console.log(`[useRoutineSaver] Eliminando rutina ID: ${id}`);
    try {
      const result = await deleteRoutine(id);
      
      if (result.success) {
        console.log('[useRoutineSaver] Eliminación exitosa.');
        addToast(result.message, 'success');
        
        // --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
        localStorage.removeItem(DRAFT_KEY); // Limpiar el borrador
        // --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---
        
        handleSaveProp(); // Ejecutamos el callback (ej: navegar atrás)
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error('[useRoutineSaver] Error al eliminar:', error);
      addToast(error.message || 'Error al eliminar la rutina', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false); // Cerramos el modal de confirmación
    }
  };

  return { handleSave, handleDelete };
};