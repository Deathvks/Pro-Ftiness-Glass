/* frontend/src/hooks/useRoutineGrouping.js */
import { useMemo } from 'react';

/**
 * Hook para calcular el estado derivado (groupedExercises).
 * @param {Array} exercises - La lista plana de ejercicios.
 * @returns {Array} La lista de ejercicios agrupados por superseries.
 */
export const useRoutineGrouping = (exercises) => {
  const groupedExercises = useMemo(() => {
    const groups = [];
    let i = 0;
    while (i < exercises.length) {
      const currentExercise = exercises[i];
      if (!currentExercise) {
        i++;
        continue;
      }

      // Si tiene superset_group_id, agrupar
      if (currentExercise.superset_group_id) {
        const group = [currentExercise];
        let j = i + 1;
        // Buscar siguientes ejercicios con el mismo ID de grupo
        while (
          j < exercises.length &&
          exercises[j]?.superset_group_id === currentExercise.superset_group_id
        ) {
          group.push(exercises[j]);
          j++;
        }
        groups.push(group);
        i = j; // Saltar al siguiente índice después del grupo
      } else {
        // Ejercicio individual
        groups.push([currentExercise]);
        i++;
      }
    }
    return groups;
  }, [exercises]); // Dependencia: se recalcula solo si 'exercises' cambia

  return groupedExercises;
};