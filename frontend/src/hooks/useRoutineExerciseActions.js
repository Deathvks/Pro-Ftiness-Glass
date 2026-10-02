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
 * @param {string|number} params.replacingExerciseTempId - ID temporal o real del ejercicio a reemplazar.
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

  // Función de seguridad: Garantiza que el ejercicio siempre tenga un identificador único en el frontend
  // Esto evita que si dos ejercicios tienen el mismo ID de base de datos (o ninguno), se modifiquen a la vez.
  const secureTempId = (ex) => ex.tempId || uuidv4();

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
      image_url: null, // Aseguramos el campo estándar
      image_url_start: null,
      video_url: null,
      is_manual: true, // Se asume manual hasta que se enlace
    };
    setExercises(prev => [...prev, newExercise]);
  };

  /**
   * Elimina un ejercicio de la lista por su tempId o id.
   */
  const removeExercise = (identifier) => {
    setExercises(prev => prev.filter(ex => (ex.tempId || ex.id) !== identifier));
  };

  /**
   * Actualiza un campo específico de un ejercicio.
   * @param {string|number} identifier - ID temporal o real del ejercicio.
   * @param {string} field - Nombre del campo a actualizar.
   * @param {*} value - Nuevo valor.
   */
  const updateExerciseField = (identifier, field, value) => {
    setExercises(prev =>
      prev.map(ex => {
        if ((ex.tempId || ex.id) === identifier) {
          // Si lo editamos, le inyectamos un tempId seguro por si venía de BD sin él
          return { ...ex, tempId: secureTempId(ex), [field]: value };
        }
        return ex;
      })
    );
  };

  /**
   * Enlaza un ejercicio de la lista (dropdown) a un ejercicio existente.
   * @param {string|number} identifier - ID temporal o real del ejercicio a actualizar.
   * @param {Object} selectedExercise - El ejercicio de la BD seleccionado.
   */
  const linkExerciseFromList = (identifier, selectedExercise) => {
    setExercises(prev => {
      const newExercises = prev.map(ex => {
        if ((ex.tempId || ex.id) === identifier) {
          return {
            ...ex, // Mantiene sets, reps, rest_seconds
            tempId: secureTempId(ex), // ¡CLAVE! Asegura que no dependamos del ID de la BD para la key de React
            id: selectedExercise.id,
            name: selectedExercise.name,
            
            // Priorizamos muscle_group sobre category.
            muscle_group: selectedExercise.muscle_group || selectedExercise.category || '',
            
            // Cubrimos todos los frentes posibles de las imágenes para que nunca falle la foto
            image_url: selectedExercise.image_url || selectedExercise.image_url_start || null,
            image_url_start: selectedExercise.image_url_start || selectedExercise.image_url || null,
            image_url_end: selectedExercise.image_url_end || null,
            video_url: selectedExercise.video_url || null,
            
            is_manual: selectedExercise.is_manual || false,
          };
        }
        return ex;
      });
      return newExercises;
    });

    // Cierra el dropdown (si se llamó desde el dropdown de la tarjeta)
    setActiveDropdownTempId(null);
  };

  /**
   * Crea una superserie entre un ejercicio (por tempId o id) y el siguiente.
   */
  const createSuperset = (identifier) => {
    const index = exercises.findIndex(ex => (ex.tempId || ex.id) === identifier);
    // No se puede crear superserie si es el último ejercicio
    if (index === -1 || index >= exercises.length - 1) return;

    const supersetId = uuidv4();
    setExercises(prev =>
      prev.map((ex, i) => {
        if (i === index || i === index + 1) {
          return { ...ex, tempId: secureTempId(ex), superset_group_id: supersetId };
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
        ex.superset_group_id === supersetId 
          ? { ...ex, tempId: secureTempId(ex), superset_group_id: null } 
          : ex
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

    // Actualizamos el 'exercise_order' basado en el nuevo índice y blindamos tempId
    setExercises(
      reorderedExercises.map((ex, index) => ({
        ...ex,
        tempId: secureTempId(ex),
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
          // Conservamos el tempId si viene del carrito, si no, generamos uno nuevo
          tempId: item.exercise.tempId || uuidv4(), 
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

    // Reemplazamos la lista con la nueva que proviene del carrito
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
      image_url: null,
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