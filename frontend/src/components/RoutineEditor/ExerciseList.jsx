import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ExerciseGroup from '../RoutineEditor/ExerciseGroup';

const ExerciseList = ({
  groupedExercises,
  exercises, 
  onDragEnd,
  activeDropdownTempId,
  setActiveDropdownTempId,
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  unlinkGroup,
  createSuperset,
  onReplaceClick,
}) => {

  return (
    <>
      <h2 className="text-2xl font-extrabold mb-6 text-text-primary tracking-tight">Ejercicios</h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="exercises">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6 mb-6 pb-28 md:pb-8">
              {groupedExercises.map((group, groupIndex) => {
                if (!group || group.length === 0) return null;

                const isSuperset = group.length > 1;
                const firstExerciseIndex = exercises.findIndex(ex => ex.tempId === group[0].tempId);
                const isLastGroup = groupIndex === groupedExercises.length - 1;

                if (firstExerciseIndex === -1) {
                  return null; 
                }

                const dragId = group[0].superset_group_id 
                  ? `superset-${group[0].superset_group_id}` 
                  : `exercise-${group[0].tempId || groupIndex}`;

                return (
                  <Draggable
                    key={dragId}
                    draggableId={dragId}
                    index={firstExerciseIndex} 
                    isDragDisabled={isSuperset} 
                  >
                    {(providedDrag, snapshot) => (
                      <div
                        ref={providedDrag.innerRef}
                        {...providedDrag.draggableProps}
                        className={`transition-all duration-300 ${snapshot.isDragging ? 'z-50 scale-[1.02] shadow-2xl opacity-90' : ''}`}
                      >
                        <ExerciseGroup
                          group={group}
                          groupIndex={groupIndex}
                          isLastGroup={isLastGroup}
                          editedExercises={exercises}
                          activeDropdownTempId={activeDropdownTempId}
                          errors={{}} 
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
                          setActiveDropdownIndex={setActiveDropdownTempId}
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