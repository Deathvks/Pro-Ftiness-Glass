import React from 'react';
import { X, Link2 } from 'lucide-react';
import ExerciseCard from './ExerciseCard';

const ExerciseGroup = ({
  group,
  groupIndex,
  isLastGroup,
  editedExercises,
  activeDropdownIndex,
  errors,
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  setActiveDropdownIndex,
  unlinkGroup,
  linkWithNext,
}) => {
  // --- INICIO DE LA CORRECCIÓN ---
  // Ya no es necesario calcular si el grupo está activo para aplicar un z-index,
  // porque la solución del Portal en CustomSelect lo resuelve de forma global.
  return (
    <div
      className="relative" // Se elimina el z-index condicional.
      style={{ paddingBottom: !isLastGroup ? '1.5rem' : '0' }}
    >
  {/* --- FIN DE LA CORRECCIÓN --- */}
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
              isActive={activeDropdownIndex === exIndex}
              errors={errors.exercises?.[exIndex]}
              onFieldChange={onFieldChange}
              onExerciseSelect={onExerciseSelect}
              onRemove={removeExercise}
              onOpen={() => setActiveDropdownIndex(exIndex)}
              onClose={() => setActiveDropdownIndex(null)}
            />
          );
        })}
      </div>

      {!isLastGroup && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 z-10">
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