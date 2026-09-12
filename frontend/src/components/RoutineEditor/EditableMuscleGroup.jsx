/* frontend/src/components/RoutineEditor/EditableMuscleGroup.jsx */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import i18n from '../../i18n';
import CustomSelect from '../CustomSelect';

// Lista de grupos musculares idéntica al panel de administración
const MUSCLE_GROUP_KEYS = [
  'Pecho', 'Espalda', 'Dorsales', 'Trapecios', 'Lumbares',
  'Hombros', 'Deltoides Anterior', 'Deltoides Medio', 'Deltoides Posterior',
  'Bíceps', 'Bíceps Cabeza Corta', 'Bíceps Cabeza Larga',
  'Tríceps', 'Tríceps Cabeza Larga', 'Tríceps Cabeza Lateral', 'Tríceps Cabeza Medial',
  'Antebrazos', 'Cuádriceps', 'Isquiotibiales', 'Glúteos', 
  'Abductores', 'Aductores', 'Pantorrillas', 'Abdominales', 
  'Oblicuos', 'Cardio', 'Cuerpo completo', 'Otro'
];

const EditableMuscleGroup = ({ initialValue, onSave, isManual }) => {
  const { t } = useTranslation(['exercise_muscles', 'exercise_ui']);
  const { addToast } = useToast();

  // --- LÓGICA DE NORMALIZACIÓN ---
  let currentValue = initialValue;

  if (initialValue) {
    const valLower = initialValue.toLowerCase();
    // Mapeos de compatibilidad heredados a las nuevas claves en español
    if (valLower === 'pectoralis major' || valLower === 'pectoral mayor' || valLower === 'chest') currentValue = 'Pecho';
    else if (valLower === 'biceps brachii' || valLower === 'bíceps braquial' || valLower === 'biceps') currentValue = 'Bíceps';
    else if (valLower === 'triceps brachii' || valLower === 'tríceps braquial' || valLower === 'triceps') currentValue = 'Tríceps';
    else if (valLower === 'latissimus dorsi' || valLower === 'dorsal ancho' || valLower === 'lats') currentValue = 'Dorsales';
    else if (valLower === 'trapezius' || valLower === 'trapecio' || valLower === 'traps') currentValue = 'Trapecios';
    else if (valLower === 'quadriceps femoris' || valLower === 'cuádriceps' || valLower === 'quads') currentValue = 'Cuádriceps';
    else if (valLower === 'rectus abdominis' || valLower === 'recto abdominal' || valLower === 'abs') currentValue = 'Abdominales';
    else if (valLower === 'gluteus maximus' || valLower === 'glúteo mayor' || valLower === 'glutes') currentValue = 'Glúteos';
    else if (valLower === 'biceps femoris' || valLower === 'femoral' || valLower === 'hamstrings') currentValue = 'Isquiotibiales';
    else if (valLower === 'back') currentValue = 'Espalda';
    else if (valLower === 'shoulders') currentValue = 'Hombros';
    else if (valLower === 'calves') currentValue = 'Pantorrillas';
    else if (valLower === 'forearms') currentValue = 'Antebrazos';
    else if (valLower === 'otro' || valLower === 'other' || valLower === 'n/a' || valLower === 'unknown') currentValue = 'Otro';
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