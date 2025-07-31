import React, { useState } from 'react';
import { ArrowDown, Minus, ArrowUp, Edit } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

const OnboardingScreen = () => {
  const { updateUserProfile } = useAppStore(state => ({
    updateUserProfile: state.updateUserProfile,
  }));
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '',
    weight: '',
    height: '',
    activityLevel: 1.55,
    goal: 'lose'
  });

  const goToStep = (stepNumber) => setStep(stepNumber);
  const handleNext = (e) => {
    e.preventDefault();
    setStep(s => s + 1);
  };
  
  const handleComplete = async (e) => {
    e.preventDefault();
    if (!formData.age || !formData.height || !formData.weight) {
        addToast("Por favor, completa todos los campos requeridos.", 'error');
        return;
    }

    setIsLoading(true);
    const result = await updateUserProfile(formData);

    if (!result.success) {
        addToast(result.message, 'error');
        setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const activityLabels = {
    1.2: 'Poco o nada',
    1.375: 'Ejercicio ligero (1-3 días)',
    1.55: 'Ejercicio moderado (3-5 días)',
    1.725: 'Ejercicio fuerte (6-7 días)',
    1.9: 'Ejercicio muy fuerte',
  };

  const goalLabels = {
    lose: 'Bajar peso',
    maintain: 'Mantener peso',
    gain: 'Subir peso',
  };

  const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";
  const choiceButtonClasses = "flex flex-col items-center justify-center gap-2 p-4 rounded-md border-2 border-glass-border font-semibold transition-all duration-200";
  const activeChoiceButtonClasses = "border-accent bg-accent-transparent text-accent";

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleNext} className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-center">Paso 1: Sobre ti</h2>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2 text-center">Tu género</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData({ ...formData, gender: 'male' })} className={`${choiceButtonClasses} ${formData.gender === 'male' ? activeChoiceButtonClasses : ''}`}>Hombre</button>
                <button type="button" onClick={() => setFormData({ ...formData, gender: 'female' })} className={`${choiceButtonClasses} ${formData.gender === 'female' ? activeChoiceButtonClasses : ''}`}>Mujer</button>
              </div>
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-text-secondary mb-2 text-center">Tu edad</label>
              <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} required className={baseInputClasses} placeholder="Años" />
            </div>
            <button type="submit" className="button bg-accent text-bg-secondary w-full rounded-md py-3 mt-2">Siguiente</button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleNext} className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-center">Paso 2: Medidas</h2>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-text-secondary mb-2 text-center">Tu altura (cm)</label>
              <input id="height" name="height" type="number" value={formData.height} onChange={handleChange} required className={baseInputClasses} placeholder="Ej: 175" />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-text-secondary mb-2 text-center">Tu peso actual (kg)</label>
              <input id="weight" name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} required className={baseInputClasses} placeholder="Ej: 80.5" />
            </div>
            <button type="submit" className="button bg-accent text-bg-secondary w-full rounded-md py-3 mt-2">Siguiente</button>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleNext} className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-center">Paso 3: Actividad</h2>
            {Object.entries(activityLabels).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFormData({ ...formData, activityLevel: parseFloat(value) })} className={`w-full text-center ${choiceButtonClasses} ${formData.activityLevel === parseFloat(value) ? activeChoiceButtonClasses : ''}`}>{label}</button>
            ))}
            <button type="submit" className="button bg-accent text-bg-secondary w-full rounded-md py-3 mt-2">Siguiente</button>
          </form>
        );
      case 4:
        return (
          <form onSubmit={(e) => { e.preventDefault(); goToStep(5); }} className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-center">Paso 4: Tu Objetivo</h2>
            {/* --- INICIO DE LA CORRECCIÓN --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* --- FIN DE LA CORRECCIÓN --- */}
              <button type="button" onClick={() => setFormData({ ...formData, goal: 'lose' })} className={`${choiceButtonClasses} ${formData.goal === 'lose' ? activeChoiceButtonClasses : ''}`}><ArrowDown /><span>Bajar</span></button>
              <button type="button" onClick={() => setFormData({ ...formData, goal: 'maintain' })} className={`${choiceButtonClasses} ${formData.goal === 'maintain' ? activeChoiceButtonClasses : ''}`}><Minus /><span>Mantener</span></button>
              <button type="button" onClick={() => setFormData({ ...formData, goal: 'gain' })} className={`${choiceButtonClasses} ${formData.goal === 'gain' ? activeChoiceButtonClasses : ''}`}><ArrowUp /><span>Subir</span></button>
            </div>
            <button type="submit" className="button bg-accent text-bg-secondary w-full rounded-md py-3 mt-2">Revisar Respuestas</button>
          </form>
        );
      case 5:
        return (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-center">Paso 5: Resumen</h2>
            <p className="text-text-secondary text-center -mt-3">Revisa que toda tu información sea correcta.</p>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-bg-secondary p-4 rounded-md border border-glass-border">
                <div>
                  <p className="text-xs text-text-secondary">Sobre ti</p>
                  <p className="font-semibold">{formData.gender === 'male' ? 'Hombre' : 'Mujer'}, {formData.age} años</p>
                </div>
                <button onClick={() => goToStep(1)} className="p-2 rounded-full hover:bg-white/10 text-text-secondary"><Edit size={16} /></button>
              </div>
              <div className="flex justify-between items-center bg-bg-secondary p-4 rounded-md border border-glass-border">
                <div>
                  <p className="text-xs text-text-secondary">Medidas</p>
                  <p className="font-semibold">{formData.height} cm / {formData.weight} kg</p>
                </div>
                <button onClick={() => goToStep(2)} className="p-2 rounded-full hover:bg-white/10 text-text-secondary"><Edit size={16} /></button>
              </div>
              <div className="flex justify-between items-center bg-bg-secondary p-4 rounded-md border border-glass-border">
                <div>
                  <p className="text-xs text-text-secondary">Actividad</p>
                  <p className="font-semibold">{activityLabels[formData.activityLevel]}</p>
                </div>
                <button onClick={() => goToStep(3)} className="p-2 rounded-full hover:bg-white/10 text-text-secondary"><Edit size={16} /></button>
              </div>
              <div className="flex justify-between items-center bg-bg-secondary p-4 rounded-md border border-glass-border">
                <div>
                  <p className="text-xs text-text-secondary">Objetivo</p>
                  <p className="font-semibold">{goalLabels[formData.goal]}</p>
                </div>
                <button onClick={() => goToStep(4)} className="p-2 rounded-full hover:bg-white/10 text-text-secondary"><Edit size={16} /></button>
              </div>
            </div>
            <button onClick={handleComplete} disabled={isLoading} className="button bg-accent text-bg-secondary w-full rounded-md py-3 mt-2 flex justify-center items-center disabled:opacity-70">
              {isLoading ? <Spinner size={20} /> : 'Confirmar y Empezar'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease-out]">
      <div className="w-full max-w-sm">
        <GlassCard className="p-8">
          {renderStep()}
        </GlassCard>
      </div>
    </div>
  );
};

export default OnboardingScreen;