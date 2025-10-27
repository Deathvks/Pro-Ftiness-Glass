/* frontend/src/pages/RoutineEditor.jsx */
import React, { useState, useEffect, useCallback } from 'react';
// Eliminamos useParams y useNavigate
// import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Save, Trash2, GripVertical, Info, Library, ChevronLeft } from 'lucide-react';
// --- INICIO MODIFICACIÓN ---
// Quitamos saveRoutine de aquí, ya estaba importado
import { getRoutineById, deleteRoutine, saveRoutine } from '../services/routineService';
// --- FIN MODIFICACIÓN ---
import ExerciseCard from '../components/RoutineEditor/ExerciseCard';
import ExerciseGroup from '../components/RoutineEditor/ExerciseGroup';
import ExerciseSearch from '../components/RoutineEditor/ExerciseSearch';
import ConfirmationModal from '../components/ConfirmationModal';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { v4 as uuidv4 } from 'uuid';

// Aceptamos 'routine', 'onSave', 'onCancel' como props
const RoutineEditor = ({ routine: initialRoutine, onSave: handleSaveProp, onCancel }) => {
    // Obtenemos el ID de la rutina inicial si existe
    const id = initialRoutine?.id;
    const { addToast } = useToast();
    // Inicializamos el estado con la rutina pasada por props
    const [routineName, setRoutineName] = useState(initialRoutine?.name || '');
    const [description, setDescription] = useState(initialRoutine?.description || '');
    const [exercises, setExercises] = useState([]); // Se inicializará en useEffect
    const [isLoading, setIsLoading] = useState(false); // Gestionamos la carga aquí
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const [showExerciseSearch, setShowExerciseSearch] = useState(false);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);

    // fetchRoutine ahora usa el 'id' local y maneja errores localmente
    const fetchRoutine = useCallback(async () => {
        if (id) {
            setIsLoading(true);
            try {
                let fetchedExercises = initialRoutine?.RoutineExercises || initialRoutine?.exercises; // Acepta ambos formatos
                if (!fetchedExercises) {
                  const fetchedRoutineData = await getRoutineById(id);
                  fetchedExercises = fetchedRoutineData.RoutineExercises || [];
                  setRoutineName(fetchedRoutineData.name || '');
                  setDescription(fetchedRoutineData.description || '');
                }

                const exercisesWithTempIds = (fetchedExercises || []).map(ex => ({
                    ...ex,
                    tempId: ex.tempId || uuidv4() // Asegurar tempId
                }));
                exercisesWithTempIds.sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));
                setExercises(exercisesWithTempIds);
            } catch (error) {
                addToast(error.message || 'Error al cargar la rutina', 'error');
                onCancel(); // Volvemos atrás si hay error
            } finally {
                setIsLoading(false);
            }
        } else {
            setRoutineName(initialRoutine?.name || '');
            setDescription(initialRoutine?.description || '');
            setExercises((initialRoutine?.exercises || []).map(ex => ({ ...ex, tempId: uuidv4() })));
        }
    }, [id, initialRoutine, addToast, onCancel]);

    useEffect(() => {
        fetchRoutine();
    }, [fetchRoutine]);

    const validateForm = () => {
        if (!routineName.trim()) {
            setValidationError('El nombre de la rutina es obligatorio.');
            return false;
        }
        if (exercises.length === 0) {
             setValidationError('La rutina debe tener al menos un ejercicio.');
             return false;
        }
        for (const ex of exercises) {
            if (!ex.name || !ex.name.trim()) {
                setValidationError('Todos los ejercicios deben tener un nombre.');
                return false;
            }
            const setsNum = parseInt(ex.sets, 10);
            if (isNaN(setsNum) || setsNum <= 0) {
                setValidationError(`El ejercicio "${ex.name}" debe tener al menos 1 serie.`);
                return false;
            }
             if (!ex.reps || !ex.reps.trim()) {
                 setValidationError(`El ejercicio "${ex.name}" debe tener repeticiones definidas.`);
                 return false;
             }
        }
        setValidationError(null);
        return true;
    };

    // handleSave ahora llama a saveRoutine del servicio y luego a la prop onSave
    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        const routineData = {
            id: id ? parseInt(id, 10) : undefined,
            name: routineName.trim(),
            description: description.trim(),
            exercises: exercises.map((ex, index) => ({
                id: ex.id && !String(ex.id).startsWith('temp-') ? ex.id : undefined,
                exercise_list_id: ex.exercise_list_id || null,
                name: ex.name.trim(),
                muscle_group: ex.muscle_group || null,
                sets: parseInt(ex.sets, 10) || 1,
                reps: ex.reps,
                superset_group_id: ex.superset_group_id || null,
                exercise_order: index
            }))
        };

        // --- INICIO MODIFICACIÓN ---
        try {
            // Llama a la función importada del servicio
            const savedRoutine = await saveRoutine(routineData);
            addToast(`Rutina ${id ? 'actualizada' : 'creada'} con éxito`, 'success');
            // Llama a la función del padre para notificar éxito
            handleSaveProp(savedRoutine);
        } catch (error) {
            addToast(error.message || `Error al ${id ? 'actualizar' : 'crear'} la rutina`, 'error');
            // No llamamos a handleSaveProp en caso de error
        } finally {
            setIsSaving(false);
        }
        // --- FIN MODIFICACIÓN ---
    };

    const handleDelete = async () => {
        if (!id) return;
        setIsDeleting(true);
        try {
            await deleteRoutine(id);
            addToast('Rutina eliminada con éxito', 'success');
            onCancel(); // Usamos onCancel para volver
        } catch (error) {
            addToast(error.message || 'Error al eliminar la rutina', 'error');
            setIsDeleting(false); // Mantener modal abierto en caso de error
        } finally {
          setShowDeleteConfirm(false);
        }
    };

    const addExercise = () => {
        const newExercise = {
            tempId: uuidv4(),
            exercise_list_id: null,
            name: '',
            muscle_group: '',
            sets: 3, // Default como número
            reps: '10',
            superset_group_id: null,
            exercise_order: exercises.length
        };
        setExercises([...exercises, newExercise]);
    };

    const updateExerciseField = (index, field, value) => {
        setExercises(prevExercises => {
            const newExercises = [...prevExercises];
            if (newExercises[index]) {
                newExercises[index] = { ...newExercises[index], [field]: value };
                if (field === 'name') {
                     newExercises[index].exercise_list_id = null;
                }
            }
            return newExercises;
        });
    };

     const linkExerciseFromList = (index, selectedExercise) => {
         setExercises(prevExercises => {
             const newExercises = [...prevExercises];
             if (newExercises[index]) {
                 newExercises[index] = {
                    ...newExercises[index],
                    exercise_list_id: selectedExercise.id,
                    name: selectedExercise.name,
                    muscle_group: selectedExercise.category || selectedExercise.muscle_group,
                 };
             }
             return newExercises;
         });
         setActiveDropdownIndex(null); // Cerrar dropdown después de seleccionar
     };

    const removeExercise = (indexToRemove) => {
        setExercises(prevExercises => {
            if (indexToRemove < 0 || indexToRemove >= prevExercises.length) return prevExercises;
            const exerciseToRemove = prevExercises[indexToRemove];
            const remainingExercises = prevExercises.filter((_, idx) => idx !== indexToRemove);

            if (exerciseToRemove.superset_group_id) {
                const remainingInGroup = remainingExercises.filter(ex => ex.superset_group_id === exerciseToRemove.superset_group_id);
                if (remainingInGroup.length === 1) {
                    return remainingExercises.map(ex =>
                        ex.superset_group_id === exerciseToRemove.superset_group_id
                            ? { ...ex, superset_group_id: null }
                            : ex
                    );
                }
            }
            return remainingExercises.map((ex, idx) => ({ ...ex, exercise_order: idx }));
        });
    };

     const createSuperset = (index) => {
         if (index < exercises.length - 1) {
             if (exercises[index].superset_group_id || exercises[index + 1].superset_group_id) {
                 addToast('Uno de los ejercicios ya pertenece a una superserie.', 'warning');
                 return;
             }
             const supersetId = uuidv4();
             setExercises(prev => prev.map((ex, idx) => {
                 if (idx === index || idx === index + 1) {
                     return { ...ex, superset_group_id: supersetId };
                 }
                 return ex;
             }));
         }
     };

     const unlinkGroup = (supersetId) => {
         setExercises(prev => prev.map(ex =>
             ex.superset_group_id === supersetId ? { ...ex, superset_group_id: null } : ex
         ));
     };


    const onDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(exercises);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Actualizar exercise_order y gestionar superseries al reordenar
        const updatedExercises = items.map((ex, index) => ({
            ...ex,
            exercise_order: index,
            // Romper superseries si los ejercicios ya no están juntos
            superset_group_id: (
                ex.superset_group_id &&
                (
                    (index > 0 && items[index - 1].superset_group_id === ex.superset_group_id) ||
                    (index < items.length - 1 && items[index + 1].superset_group_id === ex.superset_group_id)
                )
            ) ? ex.superset_group_id : null
        }));

        const supersetCounts = updatedExercises.reduce((acc, ex) => {
            if (ex.superset_group_id) {
                acc[ex.superset_group_id] = (acc[ex.superset_group_id] || 0) + 1;
            }
            return acc;
        }, {});

        const finalExercises = updatedExercises.map(ex =>
            ex.superset_group_id && supersetCounts[ex.superset_group_id] === 1
                ? { ...ex, superset_group_id: null }
                : ex
        );

        setExercises(finalExercises);
    };

    const handleAddExercisesFromSearch = (stagedItems) => {
        const newExercises = stagedItems.map((item, index) => ({
            tempId: uuidv4(),
            exercise_list_id: item.exercise.id,
            name: item.exercise.name,
            muscle_group: item.exercise.category || item.exercise.muscle_group, // Usar category si existe
            sets: item.sets, // Ya es número
            reps: item.reps, // Es string
            superset_group_id: null,
            exercise_order: exercises.length + index
        }));
        setExercises(prev => [...prev, ...newExercises]);
        setShowExerciseSearch(false);
        addToast(`${newExercises.length} ejercicio(s) añadido(s) a la rutina`, 'success');
    };


    if (isLoading && id) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    const groupedExercises = [];
    let i = 0;
    while (i < exercises.length) {
        const currentExercise = exercises[i];
        if (currentExercise.superset_group_id) {
            const group = [currentExercise];
            let j = i + 1;
            while (j < exercises.length && exercises[j].superset_group_id === currentExercise.superset_group_id) {
                group.push(exercises[j]);
                j++;
            }
            groupedExercises.push(group);
            i = j; // Avanzar el índice principal
        } else {
            groupedExercises.push([currentExercise]);
            i++;
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            <button onClick={onCancel} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
                <ChevronLeft size={20} />
                Volver a Rutinas
            </button>
            <h1 className="text-3xl font-bold mb-6 text-center">{id ? 'Editar Rutina' : 'Crear Nueva Rutina'}</h1>

            {validationError && (
                <div className="bg-red/20 border border-red text-red px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <Info size={18} />
                    <span>{validationError}</span>
                </div>
            )}

            <div className="mb-6 space-y-4">
                <input
                    type="text"
                    placeholder="Nombre de la rutina"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent text-lg"
                />
                <textarea
                    placeholder="Descripción (opcional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent"
                />
            </div>

            <h2 className="text-2xl font-semibold mb-4">Ejercicios</h2>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="exercises">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6 mb-6">
                            {groupedExercises.map((group, groupIndex) => {
                                const isSuperset = group.length > 1;
                                const firstExerciseIndex = exercises.findIndex(ex => ex.tempId === group[0].tempId);
                                const isLastGroup = groupIndex === groupedExercises.length - 1;

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
                                              groupIndex={groupIndex} // Índice del grupo en groupedExercises
                                              isLastGroup={isLastGroup}
                                              editedExercises={exercises}
                                              activeDropdownIndex={activeDropdownIndex}
                                              errors={{}} // Pasar errores si los hubiera (podríamos implementar validación por ejercicio)
                                              onFieldChange={(exerciseTempId, field, value) => {
                                                  const exIdx = exercises.findIndex(ex => ex.tempId === exerciseTempId);
                                                  if (exIdx !== -1) updateExerciseField(exIdx, field, value);
                                              }}
                                              onExerciseSelect={(exerciseTempId, selEx) => {
                                                  const exIdx = exercises.findIndex(ex => ex.tempId === exerciseTempId);
                                                  if (exIdx !== -1) linkExerciseFromList(exIdx, selEx);
                                              }}
                                              removeExercise={(exerciseTempId) => {
                                                  const exIdx = exercises.findIndex(ex => ex.tempId === exerciseTempId);
                                                  if (exIdx !== -1) removeExercise(exIdx);
                                              }}
                                              setActiveDropdownIndex={setActiveDropdownIndex}
                                              unlinkGroup={unlinkGroup}
                                              linkWithNext={() => createSuperset(exercises.findIndex(ex => ex.tempId === group[group.length - 1].tempId))}
                                              dragHandleProps={isSuperset ? null : providedDrag.dragHandleProps} // Pasar drag handle solo si no es superserie
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

             <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                    onClick={() => setShowExerciseSearch(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition border border-blue-500/30"
                >
                    <Library size={20} />
                    <span>Añadir desde Biblioteca</span>
                </button>
                 <button
                    onClick={addExercise} // Llama a la función simple
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition border border-accent/20"
                >
                    <Plus size={20} />
                    <span>Añadir Ejercicio Manual</span>
                </button>
            </div>


            <div className="flex justify-between items-center mt-8">
                {id && (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        className="px-6 py-3 rounded-xl bg-red/10 text-red hover:bg-red/20 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {isDeleting ? <Spinner size={20}/> : <Trash2 size={20} />}
                        <span>Eliminar Rutina</span>
                    </button>
                )}
                 {!id && <div></div>} {/* Placeholder para alinear el botón de guardar a la derecha */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-4 rounded-xl bg-accent text-white font-bold text-lg transition hover:scale-105 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-accent/30"
                >
                    {isSaving ? <Spinner size={24} /> : <Save size={24} />}
                    <span>{id ? 'Guardar Cambios' : 'Crear Rutina'}</span>
                </button>
            </div>

            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            {/* Limpiamos la llamada al ConfirmationModal */}
            {showDeleteConfirm && (
                <ConfirmationModal
                    message={`¿Estás seguro de que quieres eliminar la rutina "${routineName}"? Esta acción no se puede deshacer y borrará todo el historial de entrenamientos asociado.`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    isLoading={isDeleting}
                />
            )}
            {/* --- FIN DE LA MODIFICACIÓN --- */}

            {showExerciseSearch && (
                <ExerciseSearch
                    onClose={() => setShowExerciseSearch(false)}
                    onAddExercises={handleAddExercisesFromSearch}
                />
            )}

        </div>
    );
};

export default RoutineEditor;