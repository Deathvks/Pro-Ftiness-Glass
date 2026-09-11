import React, { useMemo } from "react";
import { Trash2, GripVertical, Repeat, Sparkles } from "lucide-react";
import GlassCard from "../GlassCard";
import ExerciseSearchInput from "../ExerciseSearchInput";
import { useTranslation } from "react-i18next";
import EditableMuscleGroup from "./EditableMuscleGroup";
import ExerciseMedia from "../ExerciseMedia";
import CustomSelect from "../CustomSelect";

const REP_OPTIONS = [
  { isHeader: true, label: "Repeticiones" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
  { value: "12", label: "12" },
  { value: "15", label: "15" },
  { value: "20", label: "20" },
  { value: "30", label: "30" },
  { isHeader: true, label: "Rangos" },
  { value: "1-3", label: "1-3" },
  { value: "3-5", label: "3-5" },
  { value: "5-8", label: "5-8" },
  { value: "8-10", label: "8-10" },
  { value: "8-12", label: "8-12" },
  { value: "10-12", label: "10-12" },
  { value: "10-15", label: "10-15" },
  { value: "12-15", label: "12-15" },
  { value: "15-20", label: "15-20" },
  { isHeader: true, label: "Especial" },
  { value: "Al fallo", label: "Al fallo" },
];

const REST_OPTIONS = [
  { value: "0", label: "0s" },
  { value: "15", label: "15s" },
  { value: "30", label: "30s" },
  { value: "45", label: "45s" },
  { value: "60", label: "1 min" },
  { value: "90", label: "1m 30s" },
  { value: "120", label: "2 min" },
  { value: "150", label: "2m 30s" },
  { value: "180", label: "3 min" },
  { value: "240", label: "4 min" },
  { value: "300", label: "5 min" },
];

const baseInputClasses =
  "w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[16px] px-3 py-3 text-text-primary focus:ring-2 focus:ring-accent/50 outline-none transition-all font-medium text-center placeholder:text-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
const baseLabelClasses =
  "block text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 text-center";

const ExerciseCard = ({
  exercise,
  errors,
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  dragHandleProps,
  onReplaceClick,
}) => {
  const { t: tName } = useTranslation("exercise_names");
  const { t: tMuscles } = useTranslation("exercise_muscles");
  const { t: tCommon } = useTranslation("translation");

  const identifier = exercise.tempId || exercise.id;
  const translatedName = tName(exercise.name, { defaultValue: exercise.name });

  const displayMuscleGroup = useMemo(() => {
    if (exercise.is_manual) return exercise.muscle_group;
    if (!exercise.muscle_group) return "";

    return exercise.muscle_group
      .split(",")
      .map((m) => tMuscles(m.trim(), { defaultValue: m.trim() }))
      .join(", ");
  }, [exercise.muscle_group, exercise.is_manual, tMuscles]);

  const currentReps = String(exercise.reps || "10");
  const hasCurrentRep = REP_OPTIONS.some((opt) => opt.value === currentReps);
  const repOptionsToUse = hasCurrentRep
    ? REP_OPTIONS
    : [{ value: currentReps, label: currentReps }, ...REP_OPTIONS];

  const currentRest = String(exercise.rest_seconds || "60");
  const hasCurrentRest = REST_OPTIONS.some((opt) => opt.value === currentRest);
  const restOptionsToUse = hasCurrentRest
    ? REST_OPTIONS
    : [{ value: currentRest, label: currentRest + "s" }, ...REST_OPTIONS];

  return (
    <GlassCard className="glass relative p-5 sm:p-6 rounded-[24px] border-none ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="shrink-0 text-text-muted cursor-grab self-start mt-2 hover:text-text-primary transition-colors"
            title="Reordenar"
          >
            <GripVertical size={20} />
          </div>
        )}

        <ExerciseMedia
          details={exercise}
          fitMode="cover"
          className="shrink-0 w-full sm:w-40 md:w-40 aspect-square rounded-[16px] overflow-hidden object-cover"
        />

        <div className="flex-1 min-w-0 w-full flex flex-col">
          <ExerciseSearchInput
            initialQuery={translatedName}
            onExerciseSelect={(ex) => onExerciseSelect(identifier, ex)}
            className="w-full pr-24 sm:pr-0"
          />

          <div className="mt-4">
            <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
              {tCommon("Grupo Muscular", { defaultValue: "Grupo Muscular" })}
            </label>
            <EditableMuscleGroup
              initialValue={displayMuscleGroup || ""}
              onSave={(newValue) =>
                onFieldChange(identifier, "muscle_group", newValue)
              }
              isManual={exercise.is_manual}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 relative z-50">
            <div>
              <label className={baseLabelClasses}>
                {tCommon("Series", { defaultValue: "Series" })}
              </label>
              <input
                type="number"
                min="1"
                placeholder="3"
                value={exercise.sets || ""}
                onChange={(e) =>
                  onFieldChange(identifier, "sets", e.target.value)
                }
                className={baseInputClasses}
              />
              {errors?.sets && (
                <p className="text-[#ef4444] text-[10px] mt-1.5 font-medium text-center">
                  {errors.sets}
                </p>
              )}
            </div>

            <div className="relative z-50">
              <label className={baseLabelClasses}>
                {tCommon("Reps", { defaultValue: "Reps" })}
              </label>
              <div>
                <CustomSelect
                  value={currentReps}
                  onChange={(val) => onFieldChange(identifier, "reps", val)}
                  options={repOptionsToUse}
                  className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[16px]"
                  triggerClassName="w-full py-3 bg-transparent px-3 flex items-center justify-between gap-1 focus:ring-2 focus:ring-accent/50 outline-none transition-all appearance-none rounded-[16px]"
                  textClassName="text-text-primary font-medium text-center truncate flex-1"
                  searchable={false}
                />
              </div>
              {errors?.reps && (
                <p className="text-[#ef4444] text-[10px] mt-1.5 font-medium text-center">
                  {errors.reps}
                </p>
              )}
            </div>

            <div className="relative z-50">
              <label className={baseLabelClasses}>
                {tCommon("Descanso (s)", { defaultValue: "Descanso" })}
              </label>
              <div>
                <CustomSelect
                  value={currentRest}
                  onChange={(val) => onFieldChange(identifier, "rest_seconds", val)}
                  options={restOptionsToUse}
                  className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[16px]"
                  triggerClassName="w-full py-3 bg-transparent px-3 flex items-center justify-between gap-1 focus:ring-2 focus:ring-accent/50 outline-none transition-all appearance-none rounded-[16px]"
                  textClassName="text-text-primary font-medium text-center truncate flex-1"
                  searchable={false}
                />
              </div>
            </div>
          </div>

          {exercise.ai_reason && (
            <div className="mt-5 p-4 rounded-[16px] bg-accent/5 ring-1 ring-accent/20 flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-accent shrink-0" />
              <p className="text-xs font-medium text-text-primary leading-relaxed">
                {exercise.ai_reason}
              </p>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 sm:static flex sm:flex-col justify-end sm:justify-start gap-2 shrink-0">
          <button
            onClick={() => onReplaceClick(identifier)}
            className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-accent/10 hover:text-accent transition-all active:scale-95"
            title="Reemplazar ejercicio"
          >
            <Repeat size={18} />
          </button>
          <button
            onClick={() => removeExercise(identifier)}
            className="p-2.5 rounded-[14px] bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-md shadow-[#ef4444]/20 transition-all active:scale-95"
            title="Eliminar ejercicio"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default ExerciseCard;

