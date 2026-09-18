/* frontend/src/components/RoutineEditor/EditableMuscleGroup.jsx */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import i18n from '../../i18n';
import CustomSelect from '../CustomSelect';
import { X } from 'lucide-react';


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
    const parts = initialValue.split(',').map(p => p.trim());
    currentValue = parts.map(part => {
      const valLower = part.toLowerCase();
      if (valLower === 'pectoralis major' || valLower === 'pectoral mayor' || valLower === 'chest') return 'Pecho';
      if (valLower === 'biceps brachii' || valLower === 'bíceps braquial' || valLower === 'biceps') return 'Bíceps';
      if (valLower === 'triceps brachii' || valLower === 'tríceps braquial' || valLower === 'triceps') return 'Tríceps';
      if (valLower === 'latissimus dorsi' || valLower === 'dorsal ancho' || valLower === 'lats') return 'Dorsales';
      if (valLower === 'trapezius' || valLower === 'trapecio' || valLower === 'traps') return 'Trapecios';
      if (valLower === 'quadriceps femoris' || valLower === 'cuádriceps' || valLower === 'quads') return 'Cuádriceps';
      if (valLower === 'rectus abdominis' || valLower === 'recto abdominal' || valLower === 'abs') return 'Abdominales';
      if (valLower === 'gluteus maximus' || valLower === 'glúteo mayor' || valLower === 'glutes') return 'Glúteos';
      if (valLower === 'biceps femoris' || valLower === 'femoral' || valLower === 'hamstrings') return 'Isquiotibiales';
      if (valLower === 'back') return 'Espalda';
      if (valLower === 'shoulders') return 'Hombros';
      if (valLower === 'calves') return 'Pantorrillas';
      if (valLower === 'forearms') return 'Antebrazos';
      if (valLower === 'otro' || valLower === 'other' || valLower === 'n/a' || valLower === 'unknown') return 'Otro';
      return part;
    }).join(', ');
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
    const selectedArray = currentValue ? currentValue.split(',').map(m => m.trim()).filter(Boolean) : [];

    return (
      <div className="w-full flex flex-col gap-2">
        {selectedArray.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {selectedArray.map(m => (
              <div key={m} className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-1 rounded-lg text-xs font-bold capitalize">
                <span>{t(m, { ns: 'exercise_muscles', defaultValue: m })}</span>
                <button 
                  onClick={() => {
                    const newValues = selectedArray.filter(val => val !== m);
                    onSave(newValues.join(', '));
                  }}
                  className="p-0.5 hover:bg-accent/20 rounded-md transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="w-full relative flex items-center min-w-[150px]">
          <CustomSelect
            value={currentValue}
            onChange={handleSelectChange}
            options={sortedOptions}
            placeholder={selectedArray.length > 0 ? "+ Añadir otro" : t('muscle_group_placeholder', {
              ns: 'exercise_ui',
              defaultValue: 'Añadir músculos...',
            })}
            className="w-full capitalize"
            multiple={true}
            hideMultipleValues={true}
          />
        </div>
      </div>
    );
  }

  // Si NO es manual
  return (
    <div className="w-full px-1">
      <p className="font-bold text-sm sm:text-base text-text-primary capitalize truncate">
        {currentValue.split(',').map(m => t(m.trim(), { ns: 'exercise_muscles', defaultValue: m.trim() })).join(', ')}
      </p>
    </div>
  );
};

export default EditableMuscleGroup;