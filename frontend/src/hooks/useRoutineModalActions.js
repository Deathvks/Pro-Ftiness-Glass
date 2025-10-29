/* frontend/src/hooks/useRoutineModalActions.js */

/**
 * Hook para gestionar las acciones de apertura y cierre
 * del modal de búsqueda de ejercicios.
 *
 * @param {Object} params
 * @param {function} params.setShowExerciseSearch - Setter para la visibilidad del modal.
 * @param {function} params.setReplacingExerciseTempId - Setter para el ID del ejercicio a reemplazar.
 * @returns {Object} Funciones para manejar el modal.
 */
export const useRoutineModalActions = ({
  setShowExerciseSearch,
  setReplacingExerciseTempId,
}) => {

  /**
   * Abre el modal para AÑADIR (no reemplazar) ejercicios.
   */
  const handleOpenSearchForAdd = () => {
    // Nos aseguramos de que no esté en modo "reemplazar"
    setReplacingExerciseTempId(null); 
    setShowExerciseSearch(true);
  };

  /**
   * Abre el modal en modo REEMPLAZAR.
   * @param {string} tempId - El ID temporal del ejercicio a reemplazar.
   */
  const handleReplaceClick = (tempId) => {
    setReplacingExerciseTempId(tempId);
    setShowExerciseSearch(true); 
  };

  /**
   * Cierra el modal de búsqueda y resetea el estado de reemplazo.
   */
  const handleSearchModalClose = () => {
    setShowExerciseSearch(false);
    setReplacingExerciseTempId(null); // Reseteamos en cualquier caso
  };

  return {
    handleOpenSearchForAdd,
    handleReplaceClick,
    handleSearchModalClose,
  };
};