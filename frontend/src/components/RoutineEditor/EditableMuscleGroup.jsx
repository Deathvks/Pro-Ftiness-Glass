/* frontend/src/components/RoutineEditor/EditableMuscleGroup.jsx */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import i18n from '../../i18n';
import CustomSelect from '../CustomSelect';

// Lista de claves para el selector (coincide con el Heatmap)
const MUSCLE_GROUP_KEYS = [
  'Chest',          // Pecho
  'Back',           // Espalda (General)
  'Upper Back',     // Espalda Alta
  'Lower Back',     // Lumbares
  'Lats',           // Dorsales
  'Traps',          // Trapecios
  'Shoulders',      // Hombros
  'Abs',            // Abdominales
  'Obliques',       // Oblicuos
  'Biceps',         // Bíceps
  'Triceps',        // Tríceps
  'Forearms',       // Antebrazos
  'Quads',          // Cuádriceps
  'Hamstrings',     // Femorales/Isquios
  'Glutes',         // Glúteos
  'Calves',         // Gemelos
  'Adductors',      // Aductores
  'Abductors',      // Abductores
  'Neck',           // Cuello
  'Cardio',         // Cardio
  'Full Body',      // Cuerpo completo
  'Other',          // Otro
];

const EditableMuscleGroup = ({ initialValue, onSave, isManual }) => {
  const { t } = useTranslation(['exercise_muscles', 'exercise_ui']);
  const { addToast } = useToast();

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
  const wrapperStyles = 'mt-1 w-full';

  // --- LÓGICA DE NORMALIZACIÓN MEJORADA ---
  // Convertimos nombres técnicos o antiguos a las claves del selector
  let currentValue = initialValue;

  if (initialValue) {
    const valLower = initialValue.toLowerCase();

    // Mapeo de nombres técnicos a grupos generales
    if (valLower === 'pectoralis major' || valLower === 'pectoral mayor') currentValue = 'Chest';
    else if (valLower === 'biceps brachii' || valLower === 'bíceps braquial') currentValue = 'Biceps';
    else if (valLower === 'triceps brachii' || valLower === 'tríceps braquial') currentValue = 'Triceps';
    else if (valLower === 'latissimus dorsi' || valLower === 'dorsal ancho') currentValue = 'Lats';
    else if (valLower === 'trapezius' || valLower === 'trapecio') currentValue = 'Traps';
    else if (valLower === 'quadriceps femoris' || valLower === 'cuádriceps') currentValue = 'Quads';
    else if (valLower === 'rectus abdominis' || valLower === 'recto abdominal') currentValue = 'Abs';
    else if (valLower === 'gluteus maximus' || valLower === 'glúteo mayor') currentValue = 'Glutes';
    else if (valLower === 'biceps femoris' || valLower === 'femoral') currentValue = 'Hamstrings';
    // Mapeo de valores antiguos
    else if (valLower === 'otro' || valLower === 'other' || valLower === 'n/a') currentValue = 'Other';
  }

  if (isManual) {
    return (
      <div className={wrapperStyles}>
        <CustomSelect
          value={currentValue}
          onChange={handleSelectChange}
          options={MUSCLE_GROUP_KEYS.map((key) => ({
            value: key,
            // Traduce la clave (ej: "Lower Back" -> "Lumbares")
            label: t(key, { ns: 'exercise_muscles', defaultValue: key }),
          }))}
          placeholder={t('muscle_group_placeholder', {
            ns: 'exercise_ui',
            defaultValue: 'Selecciona grupo...',
          })}
          className="w-full"
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