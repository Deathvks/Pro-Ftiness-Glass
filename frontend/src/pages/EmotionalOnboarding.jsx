/* frontend/src/pages/EmotionalOnboarding.jsx */
import React, { useState, useEffect } from 'react';
import { 
    Dumbbell, 
    Zap, 
    Target, 
    Clock, 
    Brain, 
    TrendingUp, 
    ChevronRight, 
    ArrowRight,
    ChevronLeft,
    Calendar,
    Trophy
} from 'lucide-react';

const noSpinnerStyle = `
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

const BG_IMAGES = {
    default: "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?q=80&w=1594&auto=format&fit=crop",
};

const EmotionalOnboarding = ({ onFinish, onBack }) => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        goal: '', 
        obstacle: '', 
        currentWeight: '',
        targetWeight: ''
    });
    const [projection, setProjection] = useState(null);
    
    // Estado para el color de acento (hex/rgb) obtenido del CSS global
    const [accentHex, setAccentHex] = useState('#3b82f6'); 

    useEffect(() => {
        // Obtenemos el valor real de la variable --accent del tema actual
        const timer = setTimeout(() => {
            if (typeof window !== 'undefined') {
                const computedStyle = getComputedStyle(document.documentElement);
                const accentVar = computedStyle.getPropertyValue('--accent');
                if (accentVar && !accentVar.startsWith('#')) {
                    setAccentHex(`rgb(${accentVar})`);
                } else if (accentVar) {
                    setAccentHex(accentVar);
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (formData.currentWeight && formData.targetWeight && step === 3) {
            const current = parseFloat(formData.currentWeight);
            const target = parseFloat(formData.targetWeight);
            const diff = Math.abs(target - current);
            const isLoss = target < current;
            const rate = isLoss ? 0.6 : 0.25; 
            const weeks = Math.max(1, Math.ceil(diff / rate));
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + (weeks * 7));
            const month = futureDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
            const day = futureDate.getDate();
            
            setProjection({
                dateFormatted: `${day} ${month}`,
                fullDate: futureDate.toLocaleDateString('es-ES', { dateStyle: 'long' }),
                weeks,
                isLoss
            });
        }
    }, [formData, step]);

    const handleNext = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setStep(prev => prev + 1);
    };

    // Tarjeta de opción unificada al color de acento
    const OptionCard = ({ icon: Icon, title, desc, onClick }) => (
        <button 
            onClick={onClick}
            className="w-full text-left p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)] active:scale-[0.98] transition-all duration-300 group flex items-center gap-5 backdrop-blur-md"
        >
            {/* Icono usando el color de acento */}
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner text-accent">
                <Icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-white mb-0.5">{title}</h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors leading-tight">{desc}</p>
            </div>
            <ChevronRight className="text-gray-600 group-hover:text-accent transition-colors" />
        </button>
    );

    const BackButton = () => (
        <button 
            onClick={() => step === 0 ? onBack() : setStep(prev => prev - 1)}
            className="absolute top-6 left-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all backdrop-blur-sm z-50 border border-white/5"
        >
            <ChevronLeft size={24} />
        </button>
    );

    const renderContent = () => {
        switch (step) {
            case 0:
                return (
                    <div className="animate-[fade-in_0.4s_ease-out]">
                        <h1 className="text-3xl md:text-4xl font-black text-center mb-2 text-white">Tu Identidad</h1>
                        <p className="text-gray-400 text-center mb-8 text-lg font-medium">¿En quién te quieres convertir?</p>
                        <div className="space-y-4">
                            <OptionCard icon={Dumbbell} title="Estética & Fuerza" desc="Quiero construir un físico esculpido y fuerte." onClick={() => handleNext('goal', 'muscle')} />
                            <OptionCard icon={Zap} title="Atleta Híbrido" desc="Resistencia, agilidad y potencia funcional." onClick={() => handleNext('goal', 'hybrid')} />
                            <OptionCard icon={Target} title="Salud & Definición" desc="Perder grasa y mejorar mi energía diaria." onClick={() => handleNext('goal', 'lose')} />
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="animate-[fade-in_0.4s_ease-out]">
                        <h1 className="text-2xl md:text-3xl font-black text-center mb-2 text-white">El Obstáculo</h1>
                        <p className="text-gray-400 text-center mb-8 font-medium">¿Qué te ha frenado antes?</p>
                        <div className="grid gap-4">
                            <OptionCard icon={Clock} title="Falta de Tiempo" desc="Mis horarios son un caos, necesito eficiencia." onClick={() => handleNext('obstacle', 'time')} />
                            <OptionCard icon={Brain} title="Motivación" desc="Empiezo fuerte pero lo dejo a las semanas." onClick={() => handleNext('obstacle', 'motivation')} />
                            <OptionCard icon={TrendingUp} title="Estancamiento" desc="Me esfuerzo pero mi cuerpo no cambia." onClick={() => handleNext('obstacle', 'knowledge')} />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-[fade-in_0.4s_ease-out]">
                        <h1 className="text-3xl font-black text-center mb-2 text-white">Visualización</h1>
                        <p className="text-gray-400 text-center mb-10">Calculadora de proyección realista</p>
                        <div className="space-y-10 px-2">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-blue-400 ml-1 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Peso Actual (kg)
                                </label>
                                <input 
                                    type="number" 
                                    value={formData.currentWeight} 
                                    onChange={(e) => setFormData({...formData, currentWeight: e.target.value})} 
                                    className="w-full bg-transparent border-b border-white/20 text-6xl font-black text-white py-2 focus:border-blue-500 outline-none text-center placeholder-white/5 transition-all" 
                                    placeholder="0" 
                                    autoFocus 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-accent ml-1 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent"></div> Peso Objetivo (kg)
                                </label>
                                <input 
                                    type="number" 
                                    value={formData.targetWeight} 
                                    onChange={(e) => setFormData({...formData, targetWeight: e.target.value})} 
                                    className="w-full bg-transparent border-b border-white/20 text-6xl font-black text-white py-2 focus:border-accent outline-none text-center placeholder-white/5 transition-all" 
                                    placeholder="0" 
                                />
                            </div>
                            <button 
                                onClick={() => setStep(3)} 
                                disabled={!formData.currentWeight || !formData.targetWeight} 
                                className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                Calcular Hoja de Ruta <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                );
            case 3:
                const isLoss = projection?.isLoss;
                const xStart = 50;
                const xEnd = 250;
                const yHigh = 45;
                const yLow = 115;
                const yStart = isLoss ? yHigh : yLow;
                const yEnd = isLoss ? yLow : yHigh;
                const lineColor = accentHex; 

                return (
                    <div className="animate-[fade-in_0.6s_ease-out] flex flex-col h-full pt-2">
                        <div className="flex justify-between items-end mb-6 px-2">
                            <div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">PROYECCIÓN ESTIMADA</p>
                                <div className="flex items-baseline gap-2">
                                    <h1 className="text-4xl font-black text-white tracking-tighter">{projection?.dateFormatted}</h1>
                                    <span className="text-sm font-bold text-gray-500">{new Date().getFullYear()}</span>
                                </div>
                            </div>
                            <div className="bg-accent/10 border border-accent/20 text-accent px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                <Calendar size={12} /> {projection?.weeks} Semanas
                            </div>
                        </div>

                        <div className="relative w-full h-56 bg-white/5 rounded-2xl border border-white/10 mb-8 overflow-hidden shadow-xl">
                            <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                                        <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d={`M ${xStart},${yStart} C ${xStart + 80},${yStart} ${xEnd - 80},${yEnd} ${xEnd},${yEnd} L ${xEnd},160 L ${xStart},160 Z`} fill="url(#chartGrad)" />
                                <path d={`M ${xStart},${yStart} C ${xStart + 80},${yStart} ${xEnd - 80},${yEnd} ${xEnd},${yEnd}`} fill="none" stroke={lineColor} strokeWidth="4" strokeLinecap="round" />
                                
                                <circle cx={xStart} cy={yStart} r="5" fill="#111" stroke={lineColor} strokeWidth="2" />
                                <circle cx={xEnd} cy={yEnd} r="6" fill={lineColor} stroke="white" strokeWidth="2">
                                    <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                                </circle>

                                <foreignObject x={xStart - 40} y={yStart - (isLoss ? 45 : -10)} width="80" height="40">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-bold text-gray-500 bg-black/40 px-1 rounded uppercase">Hoy</span>
                                        <span className="text-white font-bold text-sm">{formData.currentWeight}</span>
                                    </div>
                                </foreignObject>

                                <foreignObject x={xEnd - 40} y={yEnd - (isLoss ? -10 : 45)} width="80" height="40">
                                    <div className="flex flex-col items-center">
                                        {isLoss ? null : <span className="text-white font-bold text-lg leading-none">{formData.targetWeight}</span>}
                                        <span className="text-[9px] font-bold text-white px-1.5 rounded uppercase bg-accent">Meta</span>
                                        {isLoss ? <span className="text-white font-bold text-lg leading-none">{formData.targetWeight}</span> : null}
                                    </div>
                                </foreignObject>
                            </svg>
                        </div>

                        <div className="text-center space-y-2 mb-8 bg-black/30 p-5 rounded-xl backdrop-blur-sm border border-white/5 mx-2">
                            <Trophy className="text-accent mx-auto mb-2" size={28} />
                            <p className="text-lg text-gray-100 font-medium leading-snug">
                                "En <span className="text-white font-bold">{projection?.weeks} semanas</span> tu cuerpo habrá cambiado para siempre."
                            </p>
                        </div>

                        <button onClick={() => onFinish(formData)} className="w-full bg-white text-black font-black py-4 rounded-xl text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-auto">
                            Reclamar mi Plan <ArrowRight strokeWidth={3} size={20} />
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-black font-sans">
            <style>{noSpinnerStyle}</style>
            
            {/* FONDO CON IMAGEN Y EFECTOS RESTAURADOS */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${BG_IMAGES.default})` }} />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black/80" />
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px] animate-pulse" />
            </div>

            <BackButton />
            
            <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[750px]">
                {/* Barra de progreso usando el color de acento */}
                <div className="h-1.5 bg-black/20 w-full">
                    <div className="h-full bg-accent transition-all duration-700 ease-out" style={{ width: `${((step + 1) / 4) * 100}%` }} />
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default EmotionalOnboarding;