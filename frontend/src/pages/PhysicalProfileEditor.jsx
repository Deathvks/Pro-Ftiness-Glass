/* frontend/src/pages/PhysicalProfileEditor.jsx */
import React, { useState, useMemo } from 'react';
import { ArrowDown, Minus, ArrowUp, ChevronLeft, Save, Sparkles } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

const PhysicalProfileEditor = ({ onDone }) => {
  const { userProfile, updateUserProfile, bodyWeightLog } = useAppStore(state => ({
    userProfile: state.userProfile,
    updateUserProfile: state.updateUserProfile,
    bodyWeightLog: state.bodyWeightLog,
  }));
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const latestWeightFromLog = useMemo(() => {
    if (!bodyWeightLog || bodyWeightLog.length === 0) return userProfile?.weight || null;
    const sortedLog = [...bodyWeightLog].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
    return parseFloat(sortedLog[0].weight_kg);
  }, [bodyWeightLog, userProfile?.weight]);

  const [formData, setFormData] = useState({
    gender: userProfile?.gender || 'male',
    age: userProfile?.age || '',
    height: userProfile?.height || '',
    activity_level: userProfile?.activity_level || 1.55,
    goal: userProfile?.goal || 'lose'
  });

  const validateForm = () => {
    const errors = {};
    const ageNum = parseInt(formData.age, 10);
    const heightNum = parseInt(formData.height, 10);

    if (!formData.age || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      errors.age = 'Introduce una edad válida (10-100).';
    }
    if (!formData.height || isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      errors.height = 'Introduce una altura válida en cm (50-250).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast("Por favor, corrige los errores marcados.", 'error');
      return;
    }

    setIsLoading(true);
    const dataToSave = {
      gender: formData.gender,
      age: formData.age,
      height: formData.height,
      activityLevel: formData.activity_level,
      goal: formData.goal,
    };
    const result = await updateUserProfile(dataToSave);

    if (result.success) {
      addToast(result.message, 'success');
    } else {
      const backendError = result.message || 'Error desconocido al guardar.';
      addToast(backendError === 'Invalid value' ? 'Error: Revisa los valores introducidos.' : backendError, 'error');
    }
    setIsLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = value.replace(',', '.');
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const activityLabels = {
    1.2: 'Poco o nada',
    1.375: 'Ejercicio ligero (1-3 días)',
    1.55: 'Ejercicio moderado (3-5 días)',
    1.725: 'Ejercicio fuerte (6-7 días)',
    1.9: 'Ejercicio muy fuerte',
  };

  const goalOptions = [
    { value: 'lose', label: 'Bajar peso', Icon: ArrowDown },
    { value: 'recomp', label: 'Recomposición', Icon: Sparkles },
    { value: 'gain', label: 'Subir peso', Icon: ArrowUp },
    { value: 'maintain', label: 'Mantener peso', Icon: Minus },
  ];

  const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const choiceButtonClasses = "flex flex-col items-center justify-center gap-2 p-4 rounded-md border-2 border-glass-border font-semibold transition-all duration-200";
  const activeChoiceButtonClasses = "border-accent bg-accent-transparent text-accent";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
      <button onClick={onDone} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
        <ChevronLeft size={20} />
        Volver a Ajustes
      </button>
      <h1 className="text-4xl font-extrabold mb-8">Editar Perfil Físico</h1>

      <GlassCard className="p-6">
        <form onSubmit={handleComplete} className="flex flex-col gap-6">

          {/* Género y Edad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Género</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData({ ...formData, gender: 'male' })} className={`${choiceButtonClasses} ${formData.gender === 'male' ? activeChoiceButtonClasses : ''}`}>Hombre</button>
                <button type="button" onClick={() => setFormData({ ...formData, gender: 'female' })} className={`${choiceButtonClasses} ${formData.gender === 'female' ? activeChoiceButtonClasses : ''}`}>Mujer</button>
              </div>
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-text-secondary mb-2">Edad</label>
              <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} required className={baseInputClasses} placeholder="Años" />
              {formErrors.age && <p className="text-red-500 text-xs mt-1">{formErrors.age}</p>}
            </div>
          </div>

          {/* Altura */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-text-secondary mb-2">Altura (cm)</label>
              <input id="height" name="height" type="number" value={formData.height} onChange={handleChange} required className={baseInputClasses} placeholder="Ej: 175" />
              {formErrors.height && <p className="text-red-500 text-xs mt-1">{formErrors.height}</p>}
            </div>
          </div>

          {/* Info Peso Actual */}
          <div className="bg-bg-secondary p-4 rounded-md border border-glass-border">
            <p className="text-sm text-text-secondary">
              Tu peso actual (según el último registro): <strong className="text-text-primary">{latestWeightFromLog ? `${latestWeightFromLog} kg` : 'No registrado'}</strong>.
            </p>
            <p className="text-xs text-text-muted mt-1">Puedes registrar o editar tu peso diario desde el Dashboard.</p>
          </div>

          {/* Nivel de Actividad */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Nivel de Actividad Física</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(activityLabels).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setFormData({ ...formData, activity_level: parseFloat(value) })} className={`${choiceButtonClasses} ${parseFloat(formData.activity_level) === parseFloat(value) ? activeChoiceButtonClasses : ''}`}>{label}</button>
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Objetivo Principal</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {goalOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal: option.value })}
                  className={`${choiceButtonClasses} ${formData.goal === option.value ? activeChoiceButtonClasses : ''}`}
                >
                  <option.Icon size={20} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-center pt-6 border-t border-glass-border">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 w-40 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 disabled:opacity-70"
            >
              {isLoading ? <Spinner size={18} /> : <><Save size={18} /><span>Guardar</span></>}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default PhysicalProfileEditor;