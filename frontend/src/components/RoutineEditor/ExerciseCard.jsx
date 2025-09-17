import React from 'react';
import { Trash2 } from 'lucide-react';
import GlassCard from '../GlassCard';
import ExerciseSearch from './ExerciseSearch';

const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

const ExerciseCard = ({
  exercise,
  exIndex,
  isActive,
  errors,
  onFieldChange,
  onExerciseSelect,
  onRemove,
  onOpen,
  onClose
}) => {
  return (
    <GlassCard className="p-4 bg-bg-secondary/50 relative">
      <div className="flex items-start gap-2 mb-4">
        <div className="flex-grow">
          <ExerciseSearch
            exercise={exercise}
            exIndex={exIndex}
            onFieldChange={onFieldChange}
            onSelect={onExerciseSelect}
            isOpen={isActive}
            onOpen={onOpen}
            onClose={onClose}
          />
        </div>
        <div className="flex-shrink-0 pt-1">
          <button
            onClick={() => onRemove(exIndex)}
            className="p-2 h-full rounded-md text-text-muted hover:bg-red/20 hover:text-red transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <input
            type="number"
            placeholder="Series"
            value={exercise.sets || ''}
            onChange={(e) => onFieldChange(exIndex, 'sets', e.target.value)}
            className={baseInputClasses}
          />
          {errors?.sets && <p className="text-red text-xs mt-1">{errors.sets}</p>}
        </div>
        <div>
          <input
            type="text"
            placeholder="Reps (ej: 8-12)"
            value={exercise.reps || ''}
            onChange={(e) => onFieldChange(exIndex, 'reps', e.target.value)}
            className={baseInputClasses}
          />
          {errors?.reps && <p className="text-red text-xs mt-1">{errors.reps}</p>}
        </div>
        <input
          type="text"
          placeholder="Grupo Muscular"
          value={exercise.muscle_group || ''}
          onChange={(e) => onFieldChange(exIndex, 'muscle_group', e.target.value)}
          className={baseInputClasses}
        />
      </div>
    </GlassCard>
  );
};

export default ExerciseCard;