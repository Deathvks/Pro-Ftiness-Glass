/* frontend/src/components/RoutineEditor/ExerciseGroup.jsx */
import React from 'react';
import { X, Link2 } from 'lucide-react';
import ExerciseCard from './ExerciseCard';

const ExerciseGroup = ({
  group,
  groupIndex,
  isLastGroup,
  editedExercises,
  // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
  // 1. Recibimos las props con el nombre actualizado
  activeDropdownTempId,
  // --- FIN DE LA MODIFICACIÓN ---
  errors,
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
  // 1. Recibimos la prop con el nombre actualizado
  setActiveDropdownTempId,
  // --- FIN DE LA MODIFICACIÓN ---
  unlinkGroup,
  linkWithNext,
  dragHandleProps,
  // --- INICIO MODIFICACIÓN ---
  onReplaceClick, // 1. Recibimos la nueva prop
  // --- FIN MODIFICACIÓN ---
}) => {
  return (
    <div
      className="relative"
      style={{ paddingBottom: !isLastGroup ? '1.5rem' : '0' }}
    >
      <div className={`p-3 rounded-2xl space-y-3 ${group.length > 1 ? 'border border-accent/50 bg-accent/10' : ''}`}>
        {group.length > 1 && (
          <div className="flex justify-between items-center px-1 pb-2">
            <h3 className="text-sm font-bold text-accent">Superserie</h3>
            <button
              onClick={() => unlinkGroup(group[0].superset_group_id)}
              className="p-1 rounded-full bg-red/20 text-red hover:bg-red/30 transition"
              title="Deshacer superserie"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {group.map(ex => {
          const exIndex = editedExercises.findIndex(e => e.tempId === ex.tempId);
          return (
            <ExerciseCard
              key={ex.tempId}
              exercise={ex}
              exIndex={exIndex}
              // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
              // 2. Comparamos string (tempId) con string (tempId)
              isActive={activeDropdownTempId === ex.tempId}
              // --- FIN DE LA MODIFICACIÓN ---
              errors={errors.exercises?.[exIndex]}
              onFieldChange={onFieldChange}
              onExerciseSelect={onExerciseSelect}
              removeExercise={removeExercise}
              // --- INICIO DE LA MODIFICACIÓN (FIX PROBLEMA 2) ---
              // 3. Pasamos el 'tempId' (string) al abrir
              onOpen={() => setActiveDropdownTempId(ex.tempId)}
              // 4. Llamamos a la función renombrada al cerrar
              onClose={() => setActiveDropdownTempId(null)}
              // --- FIN DE LA MODIFICACIÓN ---
              dragHandleProps={group.length === 1 ? dragHandleProps : null}
              // --- INICIO MODIFICACIÓN ---
              onReplaceClick={onReplaceClick} // 2. La pasamos al ExerciseCard
              // --- FIN MODIFICACIÓN ---
            />
          );
        })}
      </div>

      {!isLastGroup && (
        // --- INICIO DE LA MODIFICACIÓN (FIX Z-INDEX) ---
        // Eliminado 'z-10' para evitar que se solape con el header/navbar
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3">
          <button
            onClick={linkWithNext}
            className="p-2 rounded-full bg-bg-secondary border border-glass-border text-accent hover:bg-accent hover:text-bg-secondary hover:scale-110 transition"
            title="Crear superserie"
          >
            <Link2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExerciseGroup;