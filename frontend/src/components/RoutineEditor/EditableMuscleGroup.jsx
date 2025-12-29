/* frontend/src/components/RoutineEditor/EditableMuscleGroup.jsx */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import i18n from '../../i18n';
import CustomSelect from '../CustomSelect';

// Lista de claves disponibles
const MUSCLE_GROUP_KEYS = [
  'Abs',            // Abdominales
  'Abductors',      // Abductores
  'Adductors',      // Aductores
  'Forearms',       // Antebrazos
  'Biceps',         // Bíceps
  'Cardio',         // Cardio
  'Quads',          // Cuádriceps
  'Neck',           // Cuello
  'Full Body',      // Cuerpo completo
  'Lats',           // Dorsales
  'Back',           // Espalda (General)
  'Upper Back',     // Espalda Alta
  'Hamstrings',     // Femorales/Isquios
  'Calves',         // Gemelos
  'Glutes',         // Glúteos
  'Shoulders',      // Hombros
  'Lower Back',     // Lumbares
  'Obliques',       // Oblicuos
  'Other',          // Otro
  'Chest',          // Pecho
  'Traps',          // Trapecios
  'Triceps',        // Tríceps
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

  const commonStyles = 'w-full capitalize text-center sm:text-left';
  // Añadimos h-12 para altura fija y max-w-full para evitar desbordamiento
  const wrapperStyles = 'mt-1 w-full max-w-full';

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
      // Contenedor con altura fija para evitar saltos de layout
      <div className={`${wrapperStyles} h-12 relative flex items-center`}>
        <CustomSelect
          value={currentValue}
          onChange={handleSelectChange}
          options={sortedOptions}
          placeholder={t('muscle_group_placeholder', {
            ns: 'exercise_ui',
            defaultValue: 'Selecciona grupo...',
          })}
          className="w-full h-full"
        />
      </div>
    );
  }

  // Si NO es manual
  return (
    <div className={`${wrapperStyles} px-1 sm:px-0`}>
      <p className={`${commonStyles} truncate p-0 text-text-secondary`}>
        {t(currentValue, { ns: 'exercise_muscles', defaultValue: currentValue })}
      </p>
    </div>
  );
};

export default EditableMuscleGroup;