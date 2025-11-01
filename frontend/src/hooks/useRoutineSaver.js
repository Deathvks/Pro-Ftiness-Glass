/* frontend/src/hooks/useRoutineSaver.js */
import useAppStore from '../store/useAppStore';
import i18n from '../i18n';

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
        const restValue = !isNaN(rest) ? rest : 60;

        // --- INICIO DE LA MODIFICACIÓN ---
        console.log(`[useRoutineSaver] Procesando Ejercicio: ${ex.name}`);
        console.log(`[useRoutineSaver] Valor muscle_group original: '${ex.muscle_group}' (Tipo: ${typeof ex.muscle_group})`);

        // 1. Limpiamos el valor (quitamos espacios) si no es null/undefined
        const trimmedMuscleGroup = ex.muscle_group ? String(ex.muscle_group).trim() : null;
        
        let muscleGroupValue;
        // 2. Comprobamos si el valor es nulo, vacío, 'N/A', o el string traducido 'Otro'.
        //    Si es así, lo normalizamos a la CLAVE 'Other'.
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