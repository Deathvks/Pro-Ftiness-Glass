/* frontend/src/pages/OnboardingScreen.jsx */
import React, { useState } from 'react';
import {
  ArrowDown, Minus, ArrowUp, Edit, ChevronRight,
  Check, Activity, Scale, User, Target, ChevronLeft, Sparkles
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

// --- Componentes UI Reutilizables ---

const TitleSection = ({ icon: Icon, title, description }) => (
  <div className="text-center mb-6">
    <div className="flex justify-center mb-3">
      <div className="p-3 bg-accent/10 rounded-full text-accent">
        <Icon size={32} />
      </div>
    </div>
    <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
    <p className="text-sm text-text-secondary px-4 leading-relaxed">{description}</p>
  </div>
);

const SelectionButton = ({ selected, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    style={{ WebkitTapHighlightColor: 'transparent' }}
    className={`relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left group outline-none focus:outline-none focus:ring-0 select-none active:scale-[0.98]
    ${selected
        ? 'border-accent bg-accent/5 shadow-[0_0_15px_-3px_var(--accent)]'
        : 'border-glass-border bg-bg-secondary md:hover:border-accent/50 active:border-accent/50'
      } ${className}`}
  >
    {children}
    {selected && (
      <div className="absolute top-3 right-3 text-accent animate-scale-in">
        <Check size={18} strokeWidth={3} />
      </div>
    )}
  </button>
);

const InputField = ({ label, id, ...props }) => (
  <div className="w-full">
    <label htmlFor={id} className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">
      {label}
    </label>
    <input
      id={id}
      className="w-full bg-bg-secondary border border-glass-border rounded-xl px-4 py-3 text-lg text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      {...props}
    />
  </div>
);

const OnboardingScreen = () => {
  const { updateUserProfile, userProfile } = useAppStore(state => ({
    updateUserProfile: state.updateUserProfile,
    userProfile: state.userProfile
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

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  // --- Constantes y Descripciones ---
  const activityOptions = [
    { value: 1.2, label: 'Sedentario', desc: 'Trabajo de oficina, poco o nada de ejercicio.' },
    { value: 1.375, label: 'Ligero', desc: 'Ejercicio suave 1-3 días por semana.' },
    { value: 1.55, label: 'Moderado', desc: 'Entrenamiento moderado 3-5 días por semana.' },
    { value: 1.725, label: 'Activo', desc: 'Entrenamiento fuerte 6-7 días por semana.' },
    { value: 1.9, label: 'Muy Activo', desc: 'Trabajo físico duro o doble sesión diaria.' },
  ];

  const goalOptions = [
    { value: 'lose', label: 'Perder Grasa', icon: ArrowDown, desc: 'Déficit calórico para reducir % graso.' },
    { value: 'recomp', label: 'Recomposición', icon: Sparkles, desc: 'Perder grasa y ganar músculo a la vez.' },
    { value: 'gain', label: 'Ganar Músculo', icon: ArrowUp, desc: 'Superávit ligero para hipertrofia.' },
    { value: 'maintain', label: 'Mantener Peso', icon: Minus, desc: 'Mismo peso, mejorando rendimiento.' },
  ];

  // --- Validación por Paso ---
  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1: // Perfil
        if (!formData.age) {
          addToast('Por favor, introduce tu edad.', 'warning');
          return false;
        }
        if (formData.age < 10 || formData.age > 100) {
          addToast('Por favor, introduce una edad válida.', 'warning');
          return false;
        }
        return true;
      case 2: // Medidas
        if (!formData.height) {
          addToast('Por favor, introduce tu altura.', 'warning');
          return false;
        }
        if (!formData.weight) {
          addToast('Por favor, introduce tu peso.', 'warning');
          return false;
        }
        // Validación específica para altura (evitar metros si se pide cm)
        if (formData.height < 50) {
          addToast('La altura debe ser en centímetros (ej: 175).', 'warning');
          return false;
        }
        if (formData.height > 250) {
          addToast('Revisa la altura introducida.', 'warning');
          return false;
        }
        return true;
      case 3: // Actividad
        if (!formData.activityLevel) {
          addToast('Selecciona un nivel de actividad.', 'warning');
          return false;
        }
        return true;
      case 4: // Objetivo
        if (!formData.goal) {
          addToast('Selecciona un objetivo.', 'warning');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // --- Handlers ---
  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, totalSteps));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = value.replace(',', '.');
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    setIsLoading(true);
    const result = await updateUserProfile(formData);

    if (!result.success) {
      addToast(result.message, 'error');
      setIsLoading(false);
    }
  };

  const goToStep = (stepNumber) => setStep(stepNumber);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleNext} className="flex flex-col h-full">
            <TitleSection
              icon={User}
              title={`Hola${userProfile?.username ? ', ' + userProfile.username : ''}!`}
              description="Para empezar, necesitamos conocerte un poco. Tu género y edad son fundamentales para calcular tu metabolismo basal (TMB)."
            />

            <div className="flex-1 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <SelectionButton
                  selected={formData.gender === 'male'}
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className="flex flex-col items-center justify-center gap-2 py-6"
                >
                  <User size={32} className="text-accent mb-1" />
                  <span className="font-bold">Hombre</span>
                </SelectionButton>
                <SelectionButton
                  selected={formData.gender === 'female'}
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className="flex flex-col items-center justify-center gap-2 py-6"
                >
                  <User size={32} className="text-accent mb-1" />
                  <span className="font-bold">Mujer</span>
                </SelectionButton>
              </div>

              <InputField
                id="age"
                name="age"
                label="Tu Edad"
                type="number"
                value={formData.age}
                onChange={handleChange}
                required
                placeholder="Ej: 25 años"
                min="10"
                max="100"
              />
            </div>

            <button type="submit" className="mt-6 w-full bg-accent text-white hover:bg-accent/90 py-4 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 group">
              Siguiente <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleNext} className="flex flex-col h-full">
            <TitleSection
              icon={Scale}
              title="Medidas Corporales"
              description="Estos datos nos ayudan a determinar tu Índice de Masa Corporal (IMC) y tus necesidades energéticas diarias."
            />

            <div className="flex-1 flex flex-col gap-6">
              <InputField
                id="height"
                name="height"
                label="Altura (cm)"
                type="number"
                value={formData.height}
                onChange={handleChange}
                required
                placeholder="Ej: 175"
              />
              <InputField
                id="weight"
                name="weight"
                label="Peso Actual (kg)"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={handleChange}
                required
                placeholder="Ej: 70.5"
              />
            </div>

            <button type="submit" className="mt-6 w-full bg-accent text-white hover:bg-accent/90 py-4 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 group">
              Siguiente <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleNext} className="flex flex-col h-full">
            <TitleSection
              icon={Activity}
              title="Nivel de Actividad"
              description="Sé honesto/a. Esto define tu factor de actividad (NEAT) y es crucial para no subestimar ni sobreestimar tus calorías."
            />

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[40vh] pr-1 scrollbar-hide">
              {activityOptions.map((option) => (
                <SelectionButton
                  key={option.value}
                  selected={formData.activityLevel === option.value}
                  onClick={() => setFormData({ ...formData, activityLevel: option.value })}
                >
                  <div className="font-bold text-text-primary mb-1">{option.label}</div>
                  <div className="text-xs text-text-secondary">{option.desc}</div>
                </SelectionButton>
              ))}
            </div>

            <button type="submit" className="mt-6 w-full bg-accent text-white hover:bg-accent/90 py-4 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 group">
              Siguiente <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        );

      case 4:
        return (
          <form onSubmit={(e) => { e.preventDefault(); goToStep(5); }} className="flex flex-col h-full">
            <TitleSection
              icon={Target}
              title="Tu Objetivo"
              description="¿Qué quieres lograr? Ajustaremos tus macronutrientes (proteínas, grasas, carbos) para optimizar tu progreso."
            />

            <div className="flex-1 flex flex-col gap-4">
              {goalOptions.map((option) => (
                <SelectionButton
                  key={option.value}
                  selected={formData.goal === option.value}
                  onClick={() => setFormData({ ...formData, goal: option.value })}
                  className="flex items-center gap-4"
                >
                  <div className={`p-3 rounded-full ${formData.goal === option.value ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary'}`}>
                    <option.icon size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary mb-1">{option.label}</div>
                    <div className="text-xs text-text-secondary">{option.desc}</div>
                  </div>
                </SelectionButton>
              ))}
            </div>

            <button type="submit" className="mt-6 w-full bg-accent text-white hover:bg-accent/90 py-4 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 group">
              Revisar Todo <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        );

      case 5:
        return (
          <div className="flex flex-col h-full">
            <TitleSection
              icon={Check}
              title="Resumen Final"
              description="Revisa que todo esté correcto antes de generar tu plan inicial. Siempre podrás cambiar esto en ajustes."
            />

            <div className="flex-1 flex flex-col gap-3">
              {[
                { label: 'Perfil', val: `${formData.gender === 'male' ? 'Hombre' : 'Mujer'}, ${formData.age} años`, step: 1 },
                { label: 'Cuerpo', val: `${formData.height} cm / ${formData.weight} kg`, step: 2 },
                { label: 'Actividad', val: activityOptions.find(o => o.value === formData.activityLevel)?.label, step: 3 },
                { label: 'Objetivo', val: goalOptions.find(o => o.value === formData.goal)?.label, step: 4 }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-bg-secondary p-4 rounded-xl border border-glass-border">
                  <div>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="font-semibold text-text-primary">{item.val}</p>
                  </div>
                  <button
                    onClick={() => goToStep(item.step)}
                    className="p-2 rounded-lg hover:bg-bg-primary text-accent transition-colors"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="mt-6 w-full bg-accent text-white hover:bg-accent/90 py-4 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Spinner size={24} color="#fff" /> : (
                <>
                  <Check size={20} strokeWidth={3} />
                  <span>Confirmar y Empezar</span>
                </>
              )}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg-primary/95 backdrop-blur-md animate-[fade-in_0.3s_ease-out]">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Barra de Progreso */}
          <div className="mb-6 px-2">
            <div className="flex justify-between text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">
              <span>Paso {step} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <GlassCard className="p-6 md:p-8 min-h-[500px] flex flex-col shadow-2xl border-glass-border/50">
            {renderStep()}
          </GlassCard>

          {/* Botón Volver (solo pasos > 1) */}
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="mt-4 w-full text-center text-text-secondary hover:text-text-primary text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              <ChevronLeft size={16} /> Volver al paso anterior
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;