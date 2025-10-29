/* frontend/src/hooks/useRoutineSaver.js */
import useAppStore from '../store/useAppStore';
import i18n from '../i18n';

/**
 * Hook para manejar la validación, guardado (crear/actualizar) y borrado de la rutina.
 *
 * @param {Object} params
 * @param {string} params.id - El ID de la rutina (si existe).
 * @param {string} params.routineName - Nombre de la rutina.
 * @param {string} params.description - Descripción de la rutina.
 * @param {Array} params.exercises - Lista de ejercicios.
 * @param {function} params.addToast - Función para mostrar notificaciones.
 * @param {function} params.handleSaveProp - Callback a ejecutar tras guardar/borrar.
 * @param {function} params.onCancel - Callback a ejecutar si se cancela (ej. borrado).
 * @param {function} params.setIsSaving - Setter para el estado de guardado.
 * @param {function} params.setIsDeleting - Setter para el estado de borrado.
 * @param {function} params.setValidationError - Setter para el error de validación.
 * @param {function} params.setShowDeleteConfirm - Setter para el modal de confirmación.
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

  // Obtenemos las acciones C.R.U.D. del store (Zustand)
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
    
    // 1. Preparamos los datos de la rutina para la API
    const routineData = {
      name: routineName,
      description: description,
      exercises: exercises.map((ex, index) => {
        // Normalizamos el 'rest_seconds'
        // Si es un número válido (incluido 0), se guarda.
        // Si es NaN (ej: un string vacío ""), se guarda 60 por defecto.
        const rest = parseInt(ex.rest_seconds, 10);
        const restValue = !isNaN(rest) ? rest : 60;

        return {
          exercise_list_id: ex.id,
          name: ex.name,
          muscle_group: ex.muscle_group,
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
    
    try {
      let result;
      // 2. Decidimos si CREAR o ACTUALIZAR
      if (id) {
        result = await updateRoutine(id, routineData);
      } else {
        result = await createRoutine(routineData);
      }
      
      // 3. Manejamos la respuesta
      if (result.success) {
        addToast(result.message, 'success');
        handleSaveProp(); // Ejecutamos el callback (ej: navegar atrás)
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
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
    try {
      const result = await deleteRoutine(id);
      
      if (result.success) {
        addToast(result.message, 'success');
        handleSaveProp(); // Ejecutamos el callback (ej: navegar atrás)
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      addToast(error.message || 'Error al eliminar la rutina', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false); // Cerramos el modal de confirmación
    }
  };

  return { handleSave, handleDelete };
};