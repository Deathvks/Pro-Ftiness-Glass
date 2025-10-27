/* frontend/src/components/RoutineEditor/ExerciseList.jsx */
import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ExerciseGroup from '../RoutineEditor/ExerciseGroup';

const ExerciseList = ({
  groupedExercises,
  exercises, // Pasamos 'exercises' completos para encontrar el índice
  onDragEnd,
  activeDropdownIndex,
  setActiveDropdownIndex,
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  unlinkGroup,
  createSuperset,
}) => {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Ejercicios</h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="exercises">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6 mb-6">
              {groupedExercises.map((group, groupIndex) => {
                const isSuperset = group.length > 1;
                // Encontrar el índice real del primer ejercicio del grupo en la lista 'exercises'
                const firstExerciseIndex = exercises.findIndex(ex => ex.tempId === group[0].tempId);
                const isLastGroup = groupIndex === groupedExercises.length - 1;

                // Si no se encuentra el ejercicio (no debería pasar), no renderizar
                if (firstExerciseIndex === -1) return null; 

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
                      >
                        <ExerciseGroup
                          group={group}
                          groupIndex={groupIndex}
                          isLastGroup={isLastGroup}
                          editedExercises={exercises}
                          activeDropdownIndex={activeDropdownIndex}
                          errors={{}} // Pasar errores si los hubiera
                          
                          // Pasamos las funciones de manejo
                          onFieldChange={(exerciseTempId, field, value) => {
                            const exIdx = exercises.findIndex(ex => ex.tempId === exerciseTempId);
                            if (exIdx !== -1) onFieldChange(exIdx, field, value);
                          }}
                          onExerciseSelect={(exerciseTempId, selEx) => {
                            const exIdx = exercises.findIndex(ex => ex.tempId === exerciseTempId);
                            if (exIdx !== -1) onExerciseSelect(exIdx, selEx);
                          }}
                          removeExercise={(exerciseTempId) => {
                            const exIdx = exercises.findIndex(ex => ex.tempId === exerciseTempId);
                            if (exIdx !== -1) removeExercise(exIdx);
                          }}
                          unlinkGroup={unlinkGroup}
                          linkWithNext={() => createSuperset(exercises.findIndex(ex => ex.tempId === group[group.length - 1].tempId))}
                          
                          setActiveDropdownIndex={setActiveDropdownIndex}
                          dragHandleProps={isSuperset ? null : providedDrag.dragHandleProps}
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