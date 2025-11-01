/* frontend/src/components/RoutineEditor/EditableMuscleGroup.jsx */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import i18n from '../../i18n';
import CustomSelect from '../CustomSelect';

// Esta lista de CLAVES (keys) está bien.
const MUSCLE_GROUP_KEYS = [
  'Other',
  'Abs',
  'Arms',
  'Back',
  'Biceps',
  'Calves',
  'Cardio',
  'Chest',
  'Shoulders',
  'Forearms',
  'Glutes',
  'Hamstrings',
  'Lats',
  'Legs',
  'Quads',
  'Traps',
  'Triceps',
  'Full Body',
];

/**
 * Un componente que muestra el grupo muscular.
 * Si 'isManual' es true, muestra un CustomSelect para editarlo.
 * Si 'isManual' es false, muestra un <p> estático.
 */
const EditableMuscleGroup = ({ initialValue, onSave, isManual }) => {
  // Pedimos los namespaces (esto estaba bien)
  const { t } = useTranslation(['exercise_muscles', 'exercise_ui']);
  const { addToast } = useToast();

  const handleSelectChange = (newValue) => {
    // 'newValue' será el 'value' de la opción (la CLAVE, ej: "Other")
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

  // --- INICIO DE LA MODIFICACIÓN ---
  // Mapeamos los valores "antiguos" o "incorrectos" (como 'Otro', 'other', o 'N/A')
  // de vuelta al 'key' canónico ('Other') para que el <select> lo reconozca.
  let currentValue;
  if (
    initialValue === 'Otro' ||
    initialValue === 'other' ||
    initialValue === 'N/A'
  ) {
    currentValue = 'Other';
  } else {
    currentValue = initialValue; // Asume que es un key válido (ej: 'Chest', 'Back', 'Other')
  }
  // --- FIN DE LA MODIFICACIÓN ---

  if (isManual) {
    return (
      <div className={wrapperStyles}>
        <CustomSelect
          // Usamos el 'currentValue' corregido (ahora será "Other")
          value={currentValue}
          onChange={handleSelectChange}
          // Ahora 'key' (ej: "Chest") coincide con el JSON
          options={MUSCLE_GROUP_KEYS.map((key) => ({
            value: key, // El valor es el key (ej: "Other")
            label: t(key, { ns: 'exercise_muscles', defaultValue: key }), // La etiqueta es la traducción (ej: "Otro")
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
        {/* Usamos 'currentValue' aquí también por seguridad */}
        {t(currentValue, { ns: 'exercise_muscles', defaultValue: currentValue })}
      </p>
    </div>
  );
};

export default EditableMuscleGroup;