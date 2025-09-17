import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, Save, Plus } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import ExerciseGroup from '../components/RoutineEditor/ExerciseGroup';

// --- EDITOR PRINCIPAL ---
const RoutineEditor = ({ routine, onSave, onCancel, isLoading }) => {
  const [editedRoutine, setEditedRoutine] = useState(() => {
    // Inicializa el estado de la rutina, asegurando que los ejercicios tengan un ID temporal.
    const initialExercises = (routine.RoutineExercises || routine.exercises || []).map(ex => ({
      ...ex,
      tempId: `ex-${Math.random()}`,
      filterGroup: 'Todos'
    }));
    // Si no hay ejercicios, añade uno vacío para empezar.
    if (initialExercises.length === 0) {
      initialExercises.push({
        tempId: `ex-${Math.random()}`, name: '', muscle_group: '', sets: '', reps: '', filterGroup: 'Todos'
      });
    }
    return {
      id: routine.id || null,
      name: routine.name || '',
      description: routine.description || '',
      exercises: initialExercises
    };
  });

  const [errors, setErrors] = useState({});
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const { addToast } = useToast();
  const descriptionRef = useRef(null);

  // Ajusta la altura del textarea de descripción automáticamente.
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  }, [editedRoutine.description]);

  // --- MANEJO DE EJERCICIOS ---

  const handleFieldChange = (exIndex, field, value) => {
    // Procesa el valor para eliminar caracteres no deseados.
    let processedValue = value;
    if ((field === 'name' || field === 'muscle_group') && typeof value === 'string') {
        processedValue = value.replace(/[0-9]/g, '');
    } 

    setEditedRoutine(prev => {
      const newExercises = [...prev.exercises];
      newExercises[exIndex] = { ...newExercises[exIndex], [field]: processedValue };
      // Si el nombre cambia, resetea el ID del ejercicio de la lista.
      if (field === 'name') {
        newExercises[exIndex].exercise_list_id = null;
      }
      return { ...prev, exercises: newExercises };
    });
  };

  const handleExerciseSelect = (exIndex, selectedExercise) => {
    // Actualiza el ejercicio con los datos del ejercicio seleccionado.
    setEditedRoutine(prev => {
      const newExercises = [...prev.exercises];
      newExercises[exIndex] = {
        ...newExercises[exIndex],
        exercise_list_id: selectedExercise.id,
        name: selectedExercise.name,
        muscle_group: selectedExercise.muscle_group,
      };
      return { ...prev, exercises: newExercises };
    });
    setActiveDropdownIndex(null); // Cierra el dropdown.
  };

  const addExercise = () => {
    // Añade un nuevo ejercicio en blanco a la lista.
    setEditedRoutine(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { tempId: `ex-${Math.random()}`, name: '', muscle_group: '', sets: '', reps: '', filterGroup: 'Todos' }
      ]
    }));
  };

  const removeExercise = (index) => {
    // Elimina un ejercicio y reordena los grupos de superseries.
    const exercisesAfterRemove = editedRoutine.exercises.filter((_, i) => i !== index);
    setEditedRoutine(prev => ({ ...prev, exercises: reorderAndGroup(exercisesAfterRemove) }));
  };

  // --- MANEJO DE SUPERSERIES ---

  const reorderAndGroup = (exercises) => {
    // Lógica para reordenar y validar los grupos de superseries.
    const processed = [...exercises];
    const groups = {};
    processed.forEach(ex => {
      if (ex.superset_group_id) {
        if (!groups[ex.superset_group_id]) groups[ex.superset_group_id] = [];
        groups[ex.superset_group_id].push(ex);
      }
    });
    Object.keys(groups).forEach(groupId => {
      if (groups[groupId].length < 2) {
        processed.forEach(ex => {
          if (ex.superset_group_id === groupId) {
            delete ex.superset_group_id;
            delete ex.exercise_order;
          }
        });
      }
    });
    let currentGroupId = null;
    let orderInGroup = 0;
    return processed.map(ex => {
      if (ex.superset_group_id) {
        if (ex.superset_group_id === currentGroupId) {
          orderInGroup++;
        } else {
          currentGroupId = ex.superset_group_id;
          orderInGroup = 0;
        }
        return { ...ex, exercise_order: orderInGroup };
      }
      return { ...ex, exercise_order: 0 };
    });
  };
  
  const linkWithPrevious = (index) => {
    // Crea una superserie entre un ejercicio y el anterior.
    if (index === 0) return;
    setEditedRoutine(prev => {
      let newExercises = [...prev.exercises];
      const prevEx = newExercises[index - 1];
      const currEx = newExercises[index];
      const groupId = prevEx.superset_group_id || `group_${prevEx.tempId}`;
      prevEx.superset_group_id = groupId;
      currEx.superset_group_id = groupId;
      return { ...prev, exercises: reorderAndGroup(newExercises) };
    });
  };

  const unlinkGroup = (groupId) => {
    // Deshace una superserie.
    setEditedRoutine(prev => {
      const newExercises = prev.exercises.map(ex => {
        if (ex.superset_group_id === groupId) {
          const newEx = { ...ex };
          delete newEx.superset_group_id;
          delete newEx.exercise_order;
          return newEx;
        }
        return ex;
      });
      return { ...prev, exercises: newExercises };
    });
  };
  
  // Agrupa los ejercicios por superseries para renderizarlos juntos.
  const exerciseGroups = useMemo(() => {
    const exercises = editedRoutine.exercises;
    if (exercises.length === 0) return [];
    const groups = [];
    const processedIndexes = new Set();
    for (let i = 0; i < exercises.length; i++) {
      if (processedIndexes.has(i)) continue;
      const currentEx = exercises[i];
      if (currentEx.superset_group_id) {
        const group = exercises.filter((ex) => ex.superset_group_id === currentEx.superset_group_id);
        group.forEach(ex => processedIndexes.add(exercises.indexOf(ex)));
        groups.push(group);
      } else {
        groups.push([currentEx]);
        processedIndexes.add(i);
      }
    }
    return groups;
  }, [editedRoutine.exercises]);

  // --- VALIDACIÓN Y GUARDADO ---

  const validateRoutine = () => {
    // Valida que la rutina y sus ejercicios tengan los campos necesarios.
    const newErrors = { exercises: [] };
    let isValid = true;
    if (!editedRoutine.name.trim()) {
      newErrors.name = 'El nombre de la rutina es obligatorio.';
      isValid = false;
    }
    const nonEmptyExercises = editedRoutine.exercises.filter(ex => ex.name && ex.name.trim() !== '');
    if (nonEmptyExercises.length === 0) {
      addToast('La rutina debe tener al menos un ejercicio.', 'error');
      isValid = false;
    }
    editedRoutine.exercises.forEach((ex, index) => {
      const exerciseErrors = {};
      if (ex.name && ex.name.trim()) {
        if (!ex.sets || parseInt(ex.sets, 10) <= 0) {
          exerciseErrors.sets = 'Debe ser > 0';
          isValid = false;
        }
        if (!ex.reps || !String(ex.reps).trim()) {
          exerciseErrors.reps = 'Requerido';
          isValid = false;
        }
      }
      newErrors.exercises[index] = exerciseErrors;
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSave = () => {
    // Valida y prepara la rutina para enviarla a la API.
    if (!validateRoutine()) {
      if (editedRoutine.exercises.filter(ex => ex.name && ex.name.trim() !== '').length > 0) {
        addToast('Por favor, corrige los errores antes de guardar.', 'error');
      }
      return;
    }
    const validExercises = editedRoutine.exercises.filter(ex => ex.name && ex.name.trim());
    const finalExercises = reorderAndGroup(validExercises);
    
    // Asigna IDs numéricos a los grupos de superseries para la base de datos.
    let groupCounter = 1;
    const finalGroupedExercises = [];
    const processedGroupIds = {};
    finalExercises.forEach(ex => {
      if (ex.superset_group_id) {
        if (!processedGroupIds[ex.superset_group_id]) {
          processedGroupIds[ex.superset_group_id] = groupCounter++;
        }
        finalGroupedExercises.push({ ...ex, superset_group_id: processedGroupIds[ex.superset_group_id] });
      } else {
        finalGroupedExercises.push(ex);
      }
    });
    
    const routineToSave = { ...editedRoutine, exercises: finalGroupedExercises };
    onSave(routineToSave);
  };

  const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

  // --- RENDERIZADO DEL COMPONENTE ---

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
      <button onClick={onCancel} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
        <ChevronLeft size={20} />
        Volver a Rutinas
      </button>
      <h1 className="text-4xl font-extrabold mb-8">{routine.id ? 'Editar Rutina' : 'Crear Rutina'}</h1>

      <GlassCard className="p-6 flex flex-col gap-6">
        {/* Campos de Nombre y Descripción */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Nombre de la Rutina</label>
            <input
              type="text"
              value={editedRoutine.name}
              onChange={(e) => setEditedRoutine({ ...editedRoutine, name: e.target.value })}
              className={baseInputClasses}
            />
            {errors.name && <p className="text-red text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Descripción (Opcional)</label>
            <textarea
              ref={descriptionRef}
              value={editedRoutine.description || ''}
              onChange={(e) => setEditedRoutine({ ...editedRoutine, description: e.target.value })}
              className={`${baseInputClasses} resize-none overflow-hidden`}
              rows="1"
              maxLength={250}
            ></textarea>
          </div>
        </div>

        {/* Lista de Ejercicios */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Ejercicios</h2>
          {exerciseGroups.map((group, groupIndex) => (
            <ExerciseGroup
              key={group[0].tempId}
              group={group}
              groupIndex={groupIndex}
              isLastGroup={groupIndex === exerciseGroups.length - 1}
              editedExercises={editedRoutine.exercises}
              activeDropdownIndex={activeDropdownIndex}
              errors={errors}
              onFieldChange={handleFieldChange}
              onExerciseSelect={handleExerciseSelect}
              removeExercise={removeExercise}
              setActiveDropdownIndex={setActiveDropdownIndex}
              unlinkGroup={unlinkGroup}
              linkWithNext={() => {
                  const nextGroupFirstExercise = exerciseGroups[groupIndex + 1][0];
                  const nextExerciseIndex = editedRoutine.exercises.findIndex(e => e.tempId === nextGroupFirstExercise.tempId);
                  linkWithPrevious(nextExerciseIndex);
              }}
            />
          ))}
        </div>
        
        {/* Botones de Acción */}
        <button
          onClick={addExercise}
          className="w-full py-3 rounded-md bg-accent/10 text-accent font-semibold border border-accent/20 hover:bg-accent/20 transition flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Añadir Ejercicio
        </button>

        <div className="flex justify-end items-center gap-4 pt-6 border-t border-glass-border">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2 rounded-full font-semibold text-text-secondary hover:text-text-primary transition disabled:opacity-70"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-2 w-32 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 disabled:opacity-70"
          >
            {isLoading ? <Spinner size={18} /> : (<><Save size={18} /><span>Guardar</span></>)}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default RoutineEditor;