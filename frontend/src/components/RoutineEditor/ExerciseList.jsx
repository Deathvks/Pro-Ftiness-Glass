/* frontend/src/components/RoutineEditor/ExerciseList.jsx */
import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ExerciseGroup from '../RoutineEditor/ExerciseGroup';

const ExerciseList = ({
  groupedExercises,
  exercises, // Pasamos 'exercises' completos para encontrar el índice
  onDragEnd,
  // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
  // 1. Aceptamos las props con los nombres actualizados
  activeDropdownTempId,
  setActiveDropdownTempId,
  // --- FIN DE LA MODIFICACIÓN ---
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  unlinkGroup,
  createSuperset,
  onReplaceClick,
}) => {

  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Ejercicios</h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="exercises">
          {(provided) => (
            // --- INICIO DE LA MODIFICACIÓN (Revertir a Lista) ---
            // Volvemos a usar `space-y-6` en lugar de un grid
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6 mb-6">
            {/* --- FIN DE LA MODIFICACIÓN (Revertir a Lista) --- */}
              {groupedExercises.map((group, groupIndex) => {
                const isSuperset = group.length > 1;
                const firstExerciseIndex = exercises.findIndex(ex => ex.tempId === group[0].tempId);
                const isLastGroup = groupIndex === groupedExercises.length - 1;

                if (firstExerciseIndex === -1) {
                  return null; 
                }

                return (
                  <Draggable
                    key={group[0].superset_group_id || group[0].tempId}
                    draggableId={group[0].superset_group_id || group[0].tempId}
                    index={firstExerciseIndex} // Índice del primer elemento del grupo
                    isDragDisabled={isSuperset} // Deshabilitar drag para superseries
                  >
                    {(providedDrag) => (
                      <div
                        ref={providedDrag.innerRef}
                        {...providedDrag.draggableProps}
                        // --- INICIO DE LA MODIFICACIÓN (Revertir a Lista) ---
                        // Eliminamos el `h-full` que era para el grid
                        // --- FIN DE LA MODIFICACIÓN (Revertir a Lista) ---
                      >
                        <ExerciseGroup
                          group={group}
                          groupIndex={groupIndex}
                          isLastGroup={isLastGroup}
                          editedExercises={exercises}
                          // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
                          // 2. Pasamos las props con los nombres actualizados
                          activeDropdownTempId={activeDropdownTempId}
                          // --- FIN DE LA MODIFICACIÓN ---
                          errors={{}} // Pasar errores si los hubiera
                          
                          // Pasamos las funciones de manejo
                          // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
                          // 3. Pasamos el tempId (string) directamente al hook.
                          // Ya no convertimos a 'index' (number)
                          onFieldChange={(exerciseTempId, field, value) => {
                            onFieldChange(exerciseTempId, field, value);
                          }}
                          onExerciseSelect={(exerciseTempId, selEx) => {
                            onExerciseSelect(exerciseTempId, selEx);
                          }}
                          removeExercise={(exerciseTempId) => {
                            removeExercise(exerciseTempId);
                          }}
                          unlinkGroup={unlinkGroup}
                          linkWithNext={() => createSuperset(group[group.length - 1].tempId)}
                          
                          setActiveDropdownIndex={setActiveDropdownTempId} // <- 2. (Continuación)
                          // --- FIN DE LA MODIFICACIÓN ---
                          dragHandleProps={isSuperset ? null : providedDrag.dragHandleProps}
                          onReplaceClick={onReplaceClick}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

export default ExerciseList;