/* frontend/src/components/RoutineEditor/EditableMuscleGroup.jsx */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import i18n from '../../i18n';
import CustomSelect from '../CustomSelect';

// Lista de claves disponibles
const MUSCLE_GROUP_KEYS = [
  'Abs', 'Abductors', 'Adductors', 'Forearms', 'Biceps', 'Cardio',
  'Quads', 'Neck', 'Full Body', 'Lats', 'Back', 'Upper Back',
  'Hamstrings', 'Calves', 'Glutes', 'Shoulders', 'Lower Back',
  'Obliques', 'Other', 'Chest', 'Traps', 'Triceps',
];

const EditableMuscleGroup = ({ initialValue, onSave, isManual }) => {
  const { t } = useTranslation(['exercise_muscles', 'exercise_ui']);
  const { addToast } = useToast();

  // --- LÓGICA DE NORMALIZACIÓN ---
  let currentValue = initialValue;

  if (initialValue) {
    const valLower = initialValue.toLowerCase();
    // Mapeos de compatibilidad
    if (valLower === 'pectoralis major' || valLower === 'pectoral mayor') currentValue = 'Chest';
    else if (valLower === 'biceps brachii' || valLower === 'bíceps braquial') currentValue = 'Biceps';
    else if (valLower === 'triceps brachii' || valLower === 'tríceps braquial') currentValue = 'Triceps';
    else if (valLower === 'latissimus dorsi' || valLower === 'dorsal ancho') currentValue = 'Lats';
    else if (valLower === 'trapezius' || valLower === 'trapecio') currentValue = 'Traps';
    else if (valLower === 'quadriceps femoris' || valLower === 'cuádriceps') currentValue = 'Quads';
    else if (valLower === 'rectus abdominis' || valLower === 'recto abdominal') currentValue = 'Abs';
    else if (valLower === 'gluteus maximus' || valLower === 'glúteo mayor') currentValue = 'Glutes';
    else if (valLower === 'biceps femoris' || valLower === 'femoral') currentValue = 'Hamstrings';
    else if (valLower === 'otro' || valLower === 'other' || valLower === 'n/a') currentValue = 'Other';
  }

  const handleSelectChange = (newValue) => {
    onSave(newValue);
    addToast(
      i18n.t(
        'exercise_ui:toast_muscle_group_updated',
        'Grupo muscular actualizado (se guardará con la rutina).',
      ),
      'success',
    );
  };

  // Generamos y ordenamos las opciones alfabéticamente según la traducción
  const sortedOptions = useMemo(() => {
    const options = MUSCLE_GROUP_KEYS.map((key) => ({
      value: key,
      label: t(key, { ns: 'exercise_muscles', defaultValue: key }),
    }));

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [t]);

  if (isManual) {
    return (
      <div className="w-full relative flex items-center min-w-[150px]">
        <CustomSelect
          value={currentValue}
          onChange={handleSelectChange}
          options={sortedOptions}
          placeholder={t('muscle_group_placeholder', {
            ns: 'exercise_ui',
            defaultValue: 'Selecciona grupo...',
          })}
          className="w-full capitalize"
        />
      </div>
    );
  }

  // Si NO es manual
  return (
    <div className="w-full px-1">
      <p className="font-bold text-sm sm:text-base text-text-primary capitalize truncate">
        {t(currentValue, { ns: 'exercise_muscles', defaultValue: currentValue })}
      </p>
    </div>
  );
};

export default EditableMuscleGroup;