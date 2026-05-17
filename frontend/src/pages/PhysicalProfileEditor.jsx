/* frontend/src/pages/PhysicalProfileEditor.jsx */
import React, { useState, useMemo } from 'react';
import { ArrowDown, Minus, ArrowUp, ChevronLeft, Save, Sparkles, Scale } from 'lucide-react';
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
      onDone(); // Cerramos al guardar con éxito
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
    1.375: 'Ligero (1-3 días)',
    1.55: 'Moderado (3-5 días)',
    1.725: 'Fuerte (6-7 días)',
    1.9: 'Muy fuerte',
  };

  const goalOptions = [
    { value: 'lose', label: 'Bajar peso', Icon: ArrowDown },
    { value: 'recomp', label: 'Recomposición', Icon: Sparkles },
    { value: 'gain', label: 'Subir peso', Icon: ArrowUp },
    { value: 'maintain', label: 'Mantener', Icon: Minus },
  ];

  const baseInputClasses = "w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] px-5 py-4 text-text-primary focus:ring-2 focus:ring-accent/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold placeholder:text-text-muted shadow-inner";
  const choiceButtonClasses = "flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] transition-all duration-300 font-bold text-sm sm:text-base border-none ring-1 active:scale-95";
  const inactiveChoiceClasses = "ring-black/5 dark:ring-white/10 bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary";
  const activeChoiceClasses = "ring-accent bg-accent text-white shadow-lg shadow-accent/20";
  const labelClasses = "block text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest mb-3";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-[fade-in_0.5s_ease-out]">
      <button 
        onClick={onDone} 
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-6 sm:mb-8 w-fit"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
        Volver a Ajustes
      </button>

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 tracking-tight text-text-primary">Editar Perfil Físico</h1>

      <GlassCard className="glass p-6 sm:p-10 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-xl">
        <form onSubmit={handleComplete} className="flex flex-col gap-8 sm:gap-10">

          {/* Género y Edad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <label className={labelClasses}>Género</label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, gender: 'male' })} 
                  className={`${choiceButtonClasses} ${formData.gender === 'male' ? activeChoiceClasses : inactiveChoiceClasses}`}
                >
                  Hombre
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, gender: 'female' })} 
                  className={`${choiceButtonClasses} ${formData.gender === 'female' ? activeChoiceClasses : inactiveChoiceClasses}`}
                >
                  Mujer
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="age" className={labelClasses}>Edad</label>
              <input 
                id="age" 
                name="age" 
                type="number" 
                value={formData.age} 
                onChange={handleChange} 
                required 
                className={baseInputClasses} 
                placeholder="Años" 
              />
              {formErrors.age && <p className="text-red font-bold text-xs mt-2 px-2">{formErrors.age}</p>}
            </div>
          </div>

          {/* Altura e Info Peso Actual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <label htmlFor="height" className={labelClasses}>Altura (cm)</label>
              <input 
                id="height" 
                name="height" 
                type="number" 
                value={formData.height} 
                onChange={handleChange} 
                required 
                className={baseInputClasses} 
                placeholder="Ej: 175" 
              />
              {formErrors.height && <p className="text-red font-bold text-xs mt-2 px-2">{formErrors.height}</p>}
            </div>

            <div className="flex flex-col justify-end">
                <div className="bg-accent/10 p-5 rounded-[24px] ring-1 ring-accent/30 flex items-start gap-4">
                  <div className="p-3 bg-accent rounded-[16px] text-white shrink-0 shadow-sm mt-1">
                    <Scale size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary leading-relaxed">
                      Tu peso actual es de <strong className="font-black text-accent">{latestWeightFromLog ? `${latestWeightFromLog} kg` : 'No registrado'}</strong>.
                    </p>
                    <p className="text-xs font-bold text-text-secondary mt-2">Puedes actualizarlo desde el Dashboard.</p>
                  </div>
                </div>
            </div>
          </div>

          {/* Nivel de Actividad */}
          <div>
            <label className={labelClasses}>Nivel de Actividad Física</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(activityLabels).map(([value, label]) => (
                <button 
                  key={value} 
                  type="button" 
                  onClick={() => setFormData({ ...formData, activity_level: parseFloat(value) })} 
                  className={`${choiceButtonClasses} ${parseFloat(formData.activity_level) === parseFloat(value) ? activeChoiceClasses : inactiveChoiceClasses}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div>
            <label className={labelClasses}>Objetivo Principal</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {goalOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal: option.value })}
                  className={`${choiceButtonClasses} ${formData.goal === option.value ? activeChoiceClasses : inactiveChoiceClasses}`}
                >
                  <option.Icon size={24} strokeWidth={2.5} className={formData.goal === option.value ? 'text-white' : 'text-accent'} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-center pt-8 border-t border-black/5 dark:border-white/10 mt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-10 py-4 w-full sm:w-auto min-w-[200px] rounded-[20px] bg-accent text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-accent/20"
            >
              {isLoading ? <Spinner size={24} color="white" /> : <><Save size={20} strokeWidth={2.5} /><span>Guardar Perfil</span></>}
            </button>
          </div>
          
        </form>
      </GlassCard>
    </div>
  );
};

export default PhysicalProfileEditor;