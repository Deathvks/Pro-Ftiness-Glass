/* frontend/src/hooks/useRoutineExerciseActions.js */
import { v4 as uuidv4 } from 'uuid';
import i18n from '../i18n';

/**
 * Hook para gestionar todas las acciones de manipulación de ejercicios
 * (añadir, quitar, actualizar, enlazar, superseries, etc.).
 *
 * @param {Object} params
 * @param {Array} params.exercises - La lista actual de ejercicios.
 * @param {function} params.setExercises - Setter para la lista de ejercicios.
 * @param {string} params.replacingExerciseTempId - ID temporal del ejercicio a reemplazar.
 * @param {function} params.addToast - Función para mostrar notificaciones.
 * @param {function} params.handleSearchModalClose - Función para cerrar el modal de búsqueda.
 * @param {function} params.setActiveDropdownTempId - Setter para el dropdown activo.
 * @returns {Object} Funciones de manipulación de ejercicios.
 */
export const useRoutineExerciseActions = ({
  exercises,
  setExercises,
  replacingExerciseTempId,
  addToast,
  handleSearchModalClose,
  setActiveDropdownTempId,
}) => {

  /**
   * Añade un nuevo ejercicio manual vacío a la lista.
   */
  const addExercise = () => {
    const newExercise = {
      tempId: uuidv4(),
      id: null,
      name: '',
      sets: '', // Vacío para que el placeholder se muestre
      reps: '', // Vacío
      rest_seconds: '', // Vacío (mantiene el placeholder)
      muscle_group: '',
      superset_group_id: null,
      exercise_order: exercises.length,
      image_url_start: null,
      video_url: null,
      is_manual: true, // Se asume manual hasta que se enlace
    };
    setExercises(prev => [...prev, newExercise]);
  };

  /**
   * Elimina un ejercicio de la lista por su tempId.
   */
  const removeExercise = (tempIdToRemove) => {
    setExercises(prev => prev.filter(ex => ex.tempId !== tempIdToRemove));
  };

  /**
   * Actualiza un campo específico de un ejercicio.
   * @param {string} tempId - ID temporal del ejercicio.
   * @param {string} field - Nombre del campo a actualizar.
   * @param {*} value - Nuevo valor.
   */
  const updateExerciseField = (tempId, field, value) => {
    setExercises(prev =>
      prev.map(ex => (ex.tempId === tempId ? { ...ex, [field]: value } : ex))
    );
  };

  /**
   * Enlaza un ejercicio de la lista (dropdown) a un ejercicio existente.
   * @param {string} tempId - ID temporal del ejercicio a actualizar.
   * @param {Object} selectedExercise - El ejercicio de la BD seleccionado.
   */
  const linkExerciseFromList = (tempId, selectedExercise) => {
    setExercises(prev => {
      const newExercises = prev.map(ex =>
        ex.tempId === tempId
          ? {
            ...ex, // Mantiene sets, reps, rest_seconds
            id: selectedExercise.id,
            name: selectedExercise.name,
            // --- INICIO DE LA MODIFICACIÓN ---
            // Priorizamos muscle_group sobre category.
            // Antes estaba al revés (category || muscle_group), lo que hacía que
            // se guardara la categoría general (ej. "Espalda") en lugar del músculo específico (ej. "Dorsal Ancho").
            muscle_group: selectedExercise.muscle_group || selectedExercise.category,
            // --- FIN DE LA MODIFICACIÓN ---
            image_url_start: selectedExercise.image_url_start,
            image_url_end: selectedExercise.image_url_end,
            video_url: selectedExercise.video_url,
            is_manual: selectedExercise.is_manual || false,
          }
          : ex
      );
      return newExercises;
    });

    // Cierra el dropdown (si se llamó desde el dropdown de la tarjeta)
    setActiveDropdownTempId(null);
  };

  /**
   * Crea una superserie entre un ejercicio (por tempId) y el siguiente.
   */
  const createSuperset = (tempId) => {
    const index = exercises.findIndex(ex => ex.tempId === tempId);
    // No se puede crear superserie si es el último ejercicio
    if (index === -1 || index >= exercises.length - 1) return;

    const supersetId = uuidv4();
    setExercises(prev =>
      prev.map((ex, i) => {
        if (i === index || i === index + 1) {
          return { ...ex, superset_group_id: supersetId };
        }
        return ex;
      })
    );
  };

  /**
   * Desvincula una superserie (elimina el superset_group_id).
   */
  const unlinkGroup = (supersetId) => {
    setExercises(prev =>
      prev.map(ex =>
        ex.superset_group_id === supersetId ? { ...ex, superset_group_id: null } : ex
      )
    );
  };

  /**
   * Maneja el reordenamiento (Drag & Drop) de los ejercicios.
   */
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const reorderedExercises = Array.from(exercises);
    const [movedExercise] = reorderedExercises.splice(source.index, 1);
    reorderedExercises.splice(destination.index, 0, movedExercise);

    // Actualizamos el 'exercise_order' basado en el nuevo índice
    setExercises(
      reorderedExercises.map((ex, index) => ({
        ...ex,
        exercise_order: index
      }))
    );
  };

  /**
   * Maneja la adición de ejercicios desde el modal de búsqueda (carrito).
   * También maneja el reemplazo si 'replacingExerciseTempId' está seteado.
   */
  const handleAddExercisesFromSearch = (stagedExercises) => {

    // CASO 1: Reemplazar ejercicio
    if (replacingExerciseTempId !== null) {
      if (stagedExercises.length === 0) {
        handleSearchModalClose(); // No se seleccionó nada, solo cerrar
        return;
      }
      const selectedExercise = stagedExercises[0].exercise;

      // Reutilizamos la lógica de 'link' pero para reemplazar
      linkExerciseFromList(replacingExerciseTempId, selectedExercise);
      handleSearchModalClose();
      return;
    }

    // CASO 2: Añadir/Actualizar ejercicios del carrito
    // La lista 'stagedExercises' es la NUEVA lista completa de ejercicios.

    let newExerciseList = [];
    try {
      newExerciseList = stagedExercises.map((item, index) => {
        if (!item || !item.exercise) {
          return null;
        }

        // Respetamos el 'rest_seconds' del carrito (0, "99", o "" = 60)
        const rest = (item.rest_seconds === 0) ? 0 : (item.rest_seconds || 60);

        return {
          ...item.exercise,
          tempId: uuidv4(), // Asignamos nuevo tempId para React
          id: item.exercise.id,
          sets: item.sets,
          reps: item.reps,
          rest_seconds: rest,
          superset_group_id: null, // Las superseries se rompen al importar (de momento)
          exercise_order: index
        };
      }).filter(Boolean); // Filtramos nulos si los hubiera

    } catch (e) {
      addToast("Error al procesar los ejercicios.", 'error');
      return;
    }

    setExercises(newExerciseList);

    // Cerramos el modal de búsqueda después de añadir
    handleSearchModalClose();
  };

  /**
   * Añade un ejercicio "manual" (personalizado) desde el modal de búsqueda.
   */
  const addCustomExercise = (exerciseName) => {
    if (!exerciseName || exerciseName.trim() === "") {
      addToast(i18n.t('routine_editor:error_custom_exercise_name', 'El nombre del ejercicio manual no puede estar vacío.'), 'error');
      return;
    }

    const newExercise = {
      tempId: uuidv4(),
      id: null, // Sin ID de la BD
      name: exerciseName.trim(),
      sets: 3, // Valores por defecto
      reps: '10',
      rest_seconds: 60,
      muscle_group: i18n.t('exercise_ui:muscle_groups.unknown', 'N/A'),
      superset_group_id: null,
      exercise_order: exercises.length,
      image_url_start: null,
      video_url: null,
      is_manual: true,
    };

    setExercises(prev => [...prev, newExercise]);

    handleSearchModalClose(); // Cerramos el modal de búsqueda
    addToast(i18n.t('routine_editor:toast_custom_exercise_added', 'Ejercicio manual añadido: {{name}}', { name: newExercise.name }), 'success');
  };

  return {
    addExercise,
    removeExercise,
    updateExerciseField,
    linkExerciseFromList,
    createSuperset,
    unlinkGroup,
    onDragEnd,
    handleAddExercisesFromSearch,
    addCustomExercise,
  };
};