/* frontend/src/pages/OnboardingScreen.jsx */
import React, { useState, useEffect } from 'react';
import {
  ArrowDown, Minus, ArrowUp, Edit, ChevronRight,
  Check, Activity, Scale, User, Target, ChevronLeft, Sparkles,
  Coffee, Footprints, Dumbbell, Trophy
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

// --- ESTILOS (Animaciones) ---
const styles = `
  @keyframes slide-in-right {
    from { opacity: 0; transform: translateX(50px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slide-in-left {
    from { opacity: 0; transform: translateX(-50px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-slide-right { animation: slide-in-right 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
  .animate-slide-left { animation: slide-in-left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
  .animate-float { animation: float 6s ease-in-out infinite; }
  
  /* Stagger delays */
  .delay-100 { animation-delay: 100ms; opacity: 0; animation-fill-mode: forwards; }
  .delay-200 { animation-delay: 200ms; opacity: 0; animation-fill-mode: forwards; }
  .delay-300 { animation-delay: 300ms; opacity: 0; animation-fill-mode: forwards; }
  .delay-400 { animation-delay: 400ms; opacity: 0; animation-fill-mode: forwards; }
  .delay-500 { animation-delay: 500ms; opacity: 0; animation-fill-mode: forwards; }
`;

// --- COMPONENTES UI (DEFINIDOS FUERA) ---

const AnimContainer = ({ children, direction }) => (
  <div className={direction === 'right' ? 'animate-slide-right' : 'animate-slide-left'}>
    {children}
  </div>
);

const StoryProgress = ({ total, current }) => (
  <div className="flex gap-2 w-full px-6 pt-6 z-50">
    {Array.from({ length: total }).map((_, idx) => (
      <div key={idx} className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <div
          className={`h-full bg-accent transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${idx + 1 <= current ? 'w-full' : 'w-0'
            }`}
        />
      </div>
    ))}
  </div>
);

const BigTitle = ({ children, className = "" }) => (
  <h1 className={`text-4xl md:text-5xl font-black text-text-primary mb-4 tracking-tight animate-slide-right ${className}`}>
    {children}
  </h1>
);

const SubText = ({ children, className = "" }) => (
  <p className={`text-lg text-text-secondary mb-8 leading-relaxed font-medium max-w-md animate-slide-right delay-100 ${className}`}>
    {children}
  </p>
);

const BigOptionButton = ({ selected, onClick, icon: Icon, title, desc, delay = "" }) => (
  <button
    onClick={onClick}
    className={`w-full p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 group text-left relative overflow-hidden animate-slide-right ${delay}
    ${selected
        ? 'bg-accent text-white border-accent shadow-[0_10px_30px_-10px_var(--accent)] scale-[1.02]'
        : 'bg-bg-secondary/40 border-white/10 hover:bg-bg-secondary hover:border-glass-highlight text-text-secondary hover:text-text-primary hover:scale-[1.01]'
      } active:scale-[0.98]`}
  >
    {selected && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
    <div className={`relative p-3 rounded-full transition-all duration-500 ${selected ? 'bg-white/20 rotate-[360deg]' : 'bg-bg-primary text-text-secondary group-hover:text-accent'}`}>
      <Icon size={28} strokeWidth={selected ? 3 : 2} />
    </div>
    <div className="flex-1 relative">
      <div className={`font-bold text-lg transition-colors ${selected ? 'text-white' : 'text-text-primary'}`}>{title}</div>
      {desc && <div className={`text-sm transition-colors ${selected ? 'text-white/80' : 'text-text-muted'} leading-tight mt-0.5`}>{desc}</div>}
    </div>
    {selected && <Check size={24} className="text-white animate-[scale-in_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]" strokeWidth={3} />}
  </button>
);

const GiantInput = ({ value, onChange, placeholder, unit, autoFocus }) => (
  <div className="relative inline-flex items-baseline justify-center group animate-slide-right delay-200">
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="bg-transparent text-6xl md:text-8xl font-black text-text-primary text-center outline-none w-full max-w-[300px] placeholder:text-text-muted/10 border-b-2 border-transparent focus:border-accent/50 transition-all pb-2 focus:scale-110 duration-300 ease-out"
        style={{ colorScheme: 'dark' }}
      />
      <div className="absolute inset-0 bg-accent/20 blur-3xl opacity-0 transition-opacity duration-500 group-focus-within:opacity-50 -z-10 rounded-full" />
    </div>
    <span className="text-xl md:text-2xl font-bold text-text-secondary ml-2 transition-colors group-focus-within:text-accent">{unit}</span>
  </div>
);

const FloatingFab = ({ onClick, disabled, isLoading, text }) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className="fixed bottom-8 right-6 bg-accent text-white px-8 py-4 rounded-full font-bold shadow-[0_10px_40px_-10px_var(--accent)] flex items-center gap-3 transition-all hover:scale-110 active:scale-90 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none z-50 text-lg hover:shadow-[0_20px_50px_-15px_var(--accent)]"
  >
    {isLoading ? <Spinner size={24} color="#fff" /> : (
      <>
        {text} <ChevronRight size={24} strokeWidth={3} />
      </>
    )}
  </button>
);

const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-8 left-6 p-4 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all active:scale-75 z-50 backdrop-blur-md bg-black/20"
  >
    <ChevronLeft size={28} />
  </button>
);

// --- COMPONENTE PRINCIPAL ---

const OnboardingScreen = () => {
  const { updateUserProfile, userProfile } = useAppStore(state => ({
    updateUserProfile: state.updateUserProfile,
    userProfile: state.userProfile
  }));
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState('right');

  // Inicializar estado desde localStorage o valores por defecto
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('onboarding_step');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('onboarding_data');
    return saved ? JSON.parse(saved) : {
      gender: 'male',
      age: '',
      weight: '',
      height: '',
      activityLevel: 1.55,
      goal: 'lose'
    };
  });

  const totalSteps = 5;

  // Persistir cambios en localStorage
  useEffect(() => {
    localStorage.setItem('onboarding_data', JSON.stringify(formData));
    localStorage.setItem('onboarding_step', step.toString());
  }, [formData, step]);

  // Scroll al top al cambiar paso
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const validateStep = (s) => {
    if (s === 1 && (!formData.age || formData.age < 10 || formData.age > 100)) return addToast('Introduce una edad válida (10-100)', 'warning');
    if (s === 2 && (!formData.height || !formData.weight)) return addToast('Por favor, completa tus medidas', 'warning');
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setDirection('right');
      setStep(Math.min(step + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setDirection('left');
    setStep(Math.max(step - 1, 1));
  };

  const handleInput = (key, val, mode = 'decimal') => {
    let clean;
    if (mode === 'int') {
      clean = val.replace(/[^0-9]/g, '');
    } else {
      clean = val.replace(',', '.').replace(/[^0-9.]/g, '');
    }
    setFormData(p => ({ ...p, [key]: clean }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    const result = await updateUserProfile(formData);
    if (!result.success) {
      addToast(result.message, 'error');
      setIsLoading(false);
    } else {
      localStorage.removeItem('onboarding_data');
      localStorage.removeItem('onboarding_step');
    }
  };

  const activityData = [
    { v: 1.2, t: 'Sedentario', d: 'Poco o nada de ejercicio.', icon: Coffee },
    { v: 1.375, t: 'Ligero', d: 'Ejercicio ligero 1-3 días/semana.', icon: Footprints },
    { v: 1.55, t: 'Moderado', d: 'Ejercicio moderado 3-5 días/semana.', icon: Activity },
    { v: 1.725, t: 'Activo', d: 'Ejercicio fuerte 6-7 días/semana.', icon: Dumbbell },
    { v: 1.9, t: 'Atleta', d: 'Ejercicio muy fuerte o doble sesión.', icon: Trophy },
  ];

  const getGoalLabel = (val) => {
    switch (val) {
      case 'lose': return 'Perder Grasa';
      case 'gain': return 'Ganar Músculo';
      case 'recomp': return 'Recomposición';
      case 'maintain': return 'Mantenimiento';
      default: return '';
    }
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <AnimContainer key={1} direction={direction}>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-6 animate-float text-accent shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                <Sparkles size={48} className="animate-pulse" />
              </div>
              <BigTitle>¡Hola, {userProfile?.username || 'Atleta'}!</BigTitle>
              <SubText>Configuremos tu perfil. Tu metabolismo depende de estos datos básicos.</SubText>

              <div className="grid grid-cols-2 gap-4 w-full mb-10 animate-slide-right delay-200">
                {['male', 'female'].map(g => (
                  <button
                    key={g}
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-4 group hover:scale-[1.03] active:scale-95 ${formData.gender === g
                      ? 'border-accent bg-accent/10 text-accent shadow-lg shadow-accent/20'
                      : 'border-glass-border bg-bg-secondary/30 text-text-secondary hover:border-glass-highlight hover:bg-bg-secondary'
                      }`}
                  >
                    <div className={`p-4 rounded-full transition-colors ${formData.gender === g ? 'bg-accent text-white' : 'bg-bg-primary'}`}>
                      <User size={32} strokeWidth={formData.gender === g ? 3 : 2} />
                    </div>
                    <span className="font-bold text-lg">{g === 'male' ? 'Hombre' : 'Mujer'}</span>
                  </button>
                ))}
              </div>

              <div className="w-full animate-slide-right delay-300">
                <p className="text-text-secondary mb-2 uppercase tracking-widest text-xs font-bold opacity-60">TU EDAD</p>
                <GiantInput
                  value={formData.age}
                  onChange={(e) => handleInput('age', e.target.value, 'int')}
                  placeholder="25"
                  unit="años"
                />
              </div>
            </div>
          </AnimContainer>
        );

      case 2:
        return (
          <AnimContainer key={2} direction={direction}>
            <div className="flex flex-col items-center text-center">
              <BigTitle>Tus Medidas</BigTitle>
              <SubText>Necesario para calcular tus macros con precisión milimétrica.</SubText>

              <div className="flex flex-col gap-16 w-full mt-8">
                <div className="animate-slide-right delay-100">
                  <p className="text-accent mb-4 uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2 bg-accent/10 py-1 px-3 rounded-full w-fit mx-auto"><ArrowUp size={14} /> ALTURA</p>
                  <GiantInput
                    value={formData.height}
                    onChange={(e) => handleInput('height', e.target.value, 'int')}
                    placeholder="175"
                    unit="cm"
                    autoFocus
                  />
                </div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-glass-border to-transparent" />
                <div className="animate-slide-right delay-200">
                  <p className="text-accent mb-4 uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2 bg-accent/10 py-1 px-3 rounded-full w-fit mx-auto"><Scale size={14} /> PESO ACTUAL</p>
                  <GiantInput
                    value={formData.weight}
                    onChange={(e) => handleInput('weight', e.target.value, 'decimal')}
                    placeholder="70.5"
                    unit="kg"
                  />
                </div>
              </div>
            </div>
          </AnimContainer>
        );

      case 3:
        return (
          <AnimContainer key={3} direction={direction}>
            <div className="flex flex-col w-full">
              <BigTitle className="text-center">Nivel de Actividad</BigTitle>
              <SubText className="text-center mx-auto">Tu NEAT (actividad fuera del gym) quema más calorías que el propio entreno. Sé honesto.</SubText>

              <div className="flex flex-col gap-3 w-full pb-24">
                {activityData.map((opt, i) => (
                  <BigOptionButton
                    key={opt.v}
                    selected={formData.activityLevel === opt.v}
                    onClick={() => setFormData({ ...formData, activityLevel: opt.v })}
                    icon={opt.icon}
                    title={opt.t}
                    desc={opt.d}
                    delay={`delay-${(i + 1) * 100}`}
                  />
                ))}
              </div>
            </div>
          </AnimContainer>
        );

      case 4:
        return (
          <AnimContainer key={4} direction={direction}>
            <div className="flex flex-col w-full">
              <BigTitle className="text-center">Tu Objetivo</BigTitle>
              <SubText className="text-center mx-auto">Definiremos tus calorías y macronutrientes basándonos en esta elección.</SubText>

              <div className="flex flex-col gap-4 w-full">
                <BigOptionButton
                  selected={formData.goal === 'lose'}
                  onClick={() => setFormData({ ...formData, goal: 'lose' })}
                  icon={ArrowDown}
                  title="Perder Grasa"
                  desc="Déficit calórico para definir y bajar peso."
                  delay="delay-100"
                />
                <BigOptionButton
                  selected={formData.goal === 'gain'}
                  onClick={() => setFormData({ ...formData, goal: 'gain' })}
                  icon={ArrowUp}
                  title="Ganar Músculo"
                  desc="Superávit ligero para hipertrofia (volumen)."
                  delay="delay-200"
                />
                <BigOptionButton
                  selected={formData.goal === 'recomp'}
                  onClick={() => setFormData({ ...formData, goal: 'recomp' })}
                  icon={Sparkles}
                  title="Recomposición"
                  desc="Bajar grasa y subir músculo (mismo peso)."
                  delay="delay-300"
                />
                <BigOptionButton
                  selected={formData.goal === 'maintain'}
                  onClick={() => setFormData({ ...formData, goal: 'maintain' })}
                  icon={Minus}
                  title="Mantenimiento"
                  desc="Mantener peso mejorando rendimiento."
                  delay="delay-400"
                />
              </div>
            </div>
          </AnimContainer>
        );

      case 5:
        return (
          <AnimContainer key={5} direction={direction}>
            <div className="flex flex-col items-center w-full text-center">
              <div className="w-28 h-28 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center mb-8 shadow-[0_0_60px_-10px_var(--accent)] animate-float">
                <Check size={56} className="text-white drop-shadow-md" strokeWidth={4} />
              </div>
              <BigTitle>¡Todo Listo!</BigTitle>
              <SubText>Revisa tus datos. Si algo está mal, toca la tarjeta para editarlo rápidamente.</SubText>

              {/* TARJETA FINAL ACTUALIZADA - Borde más visible (white/15) + Sombra envolvente */}
              <div className="w-full bg-bg-secondary/40 backdrop-blur-2xl rounded-[2rem] border border-white/15 flex flex-col mb-8 overflow-hidden shadow-[0_0_30px_-5px_rgba(255,255,255,0.08)] animate-slide-right delay-200">

                {/* Item 1 */}
                <button onClick={() => setStep(1)} className="relative flex items-center justify-center p-6 hover:bg-white/5 transition-colors group border-b border-black/20 text-center active:bg-white/10">
                  <div className="flex flex-col items-center transition-transform group-hover:scale-105">
                    <p className="text-text-muted text-[10px] uppercase font-black tracking-[0.2em] mb-1">PERFIL</p>
                    <p className="font-bold text-text-primary text-xl">{formData.gender === 'male' ? 'Hombre' : 'Mujer'}, {formData.age} años</p>
                  </div>
                  <div className="absolute right-6 p-2 rounded-full bg-bg-primary/50 text-accent opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-sm">
                    <Edit size={18} />
                  </div>
                </button>

                {/* Item 2 */}
                <button onClick={() => setStep(2)} className="relative flex items-center justify-center p-6 hover:bg-white/5 transition-colors group border-b border-black/20 text-center active:bg-white/10">
                  <div className="flex flex-col items-center transition-transform group-hover:scale-105">
                    <p className="text-text-muted text-[10px] uppercase font-black tracking-[0.2em] mb-1">MEDIDAS</p>
                    <p className="font-bold text-text-primary text-xl">{formData.height} cm  •  {formData.weight} kg</p>
                  </div>
                  <div className="absolute right-6 p-2 rounded-full bg-bg-primary/50 text-accent opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-sm">
                    <Edit size={18} />
                  </div>
                </button>

                {/* Item 3 */}
                <button onClick={() => setStep(3)} className="relative flex items-center justify-center p-6 hover:bg-white/5 transition-colors group border-b border-black/20 text-center active:bg-white/10">
                  <div className="flex flex-col items-center transition-transform group-hover:scale-105">
                    <p className="text-text-muted text-[10px] uppercase font-black tracking-[0.2em] mb-1">ACTIVIDAD</p>
                    <p className="font-bold text-text-primary text-xl">{activityData.find(a => a.v === formData.activityLevel)?.t}</p>
                  </div>
                  <div className="absolute right-6 p-2 rounded-full bg-bg-primary/50 text-accent opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-sm">
                    <Edit size={18} />
                  </div>
                </button>

                {/* Item 4 */}
                <button onClick={() => setStep(4)} className="relative flex items-center justify-center p-6 hover:bg-white/5 transition-colors group text-center active:bg-white/10">
                  <div className="flex flex-col items-center transition-transform group-hover:scale-105">
                    <p className="text-text-muted text-[10px] uppercase font-black tracking-[0.2em] mb-1">OBJETIVO</p>
                    <p className="font-black text-accent text-xl uppercase tracking-tight shadow-accent drop-shadow-sm">{getGoalLabel(formData.goal)}</p>
                  </div>
                  <div className="absolute right-6 p-2 rounded-full bg-bg-primary/50 text-accent opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-sm">
                    <Edit size={18} />
                  </div>
                </button>

              </div>
            </div>
          </AnimContainer>
        );
      default: return null;
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="fixed inset-0 z-[100] bg-bg-primary flex flex-col animate-[fade-in_0.5s_ease-out]">
        <div className="absolute top-0 left-0 w-full h-[70%] bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        <div className="absolute -top-[20%] -right-[20%] w-[600px] h-[600px] bg-accent/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-float delay-1000" />

        <StoryProgress total={totalSteps} current={step} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative z-10">
          <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-12 max-w-2xl mx-auto py-20">
            <div className="w-full">
              {renderContent()}
            </div>
          </div>
        </div>

        {step > 1 && <BackButton onClick={handleBack} />}

        <FloatingFab
          onClick={step === totalSteps ? handleComplete : handleNext}
          disabled={step === 1 && !formData.age}
          isLoading={isLoading}
          text={step === totalSteps ? 'Empezar' : 'Siguiente'}
        />
      </div>
    </>
  );
};

export default OnboardingScreen;