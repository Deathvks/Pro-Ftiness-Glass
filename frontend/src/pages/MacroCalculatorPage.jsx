/* frontend/src/pages/MacroCalculatorPage.jsx */
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FaUtensils,
  FaChevronLeft,
  FaFireFlameCurved,
  FaGlassWater,
  FaArrowRight,
  FaCalculator,
  FaDumbbell,
  FaNewspaper,
  FaWeightScale,
  FaBolt,
  FaDrumstickBite,
  FaBowlRice,
  FaSeedling,
  FaFlask,
  FaVenus,
  FaMars,
  FaPlus,
  FaMinus,
  FaCircleQuestion,
  FaPersonRunning,
  FaHeartPulse
} from 'react-icons/fa6';
import useAppStore from '../store/useAppStore';

const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentario (Oficina, sin ejercicio)', short: 'Sedentario' },
  { value: 1.375, label: 'Ligero (Gimnasio 1 - 2 días/semana)', short: '1-2 días Gym' },
  { value: 1.55, label: 'Moderado (Gimnasio 3 - 5 días/semana)', short: '3-5 días Gym' },
  { value: 1.725, label: 'Intenso (Gimnasio 5 - 6 días/semana)', short: '5-6 días Gym' },
  { value: 1.9, label: 'Atleta Élite (Entreno diario + físico)', short: 'Atleta' }
];

const GOALS = [
  {
    id: 'cut',
    title: 'Perder Grasa (Definición)',
    shortTitle: 'Definición',
    desc: 'Déficit calórico inteligente (-450 kcal) protegiendo tu masa muscular',
    calDelta: -450,
    proteinPerKg: 2.1,
    fatPerKg: 0.85,
    badge: '-450 kcal'
  },
  {
    id: 'recomp',
    title: 'Recomposición / Mantenimiento',
    shortTitle: 'Mantenimiento',
    desc: 'Normocalórica para perder grasa y ganar músculo simultáneamente',
    calDelta: 0,
    proteinPerKg: 2.0,
    fatPerKg: 0.9,
    badge: 'Normocalórica'
  },
  {
    id: 'bulk',
    title: 'Ganar Músculo (Volumen Limpio)',
    shortTitle: 'Volumen Limpio',
    desc: 'Superávit controlado (+300 kcal) para maximizar la hipertrofia sin ganar grasa excesiva',
    calDelta: 300,
    proteinPerKg: 1.9,
    fatPerKg: 0.95,
    badge: '+300 kcal'
  }
];

export default function MacroCalculatorPage({ onBack }) {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const [sex, setSex] = useState('male');
  const [age, setAge] = useState(26);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(176);
  const [activity, setActivity] = useState(1.55);
  const [goalId, setGoalId] = useState('cut');

  const calc = useMemo(() => {
    const w = Math.max(35, Math.min(250, Number(weight) || 70));
    const h = Math.max(120, Math.min(230, Number(height) || 170));
    const a = Math.max(14, Math.min(95, Number(age) || 25));
    const act = Number(activity) || 1.55;
    const goal = GOALS.find((g) => g.id === goalId) || GOALS[0];

    const bmr = Math.round(10 * w + 6.25 * h - 5 * a + (sex === 'male' ? 5 : -161));
    const tdee = Math.round(bmr * act);
    const targetCalories = Math.max(1200, tdee + goal.calDelta);

    const proteinGrams = Math.round(w * goal.proteinPerKg);
    const fatGrams = Math.round(w * goal.fatPerKg);
    const proteinCals = proteinGrams * 4;
    const fatCals = fatGrams * 9;
    const remainingCals = Math.max(200, targetCalories - proteinCals - fatCals);
    const carbGrams = Math.round(remainingCals / 4);

    const totalMacroCals = proteinCals + fatCals + carbGrams * 4;
    const proteinPct = Math.round((proteinCals / totalMacroCals) * 100);
    const carbPct = Math.round(((carbGrams * 4) / totalMacroCals) * 100);
    const fatPct = Math.max(10, 100 - proteinPct - carbPct);

    const waterLiters = Math.round((w * 0.04 + (act >= 1.55 ? 0.5 : 0.2)) * 10) / 10;
    const creatineGrams = Math.max(3, Math.round(w * 0.07));

    return {
      bmr,
      tdee,
      targetCalories,
      proteinGrams,
      carbGrams,
      fatGrams,
      proteinPct,
      carbPct,
      fatPct,
      waterLiters,
      creatineGrams,
      goal
    };
  }, [sex, age, weight, height, activity, goalId]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Calculadora de Calorías, Macros y Déficit Calórico — Pro Fitness Glass',
        url: 'https://pro-fitness-glass.zeabur.app/calculadora-calorias-macros',
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Web, Android, iOS',
        description:
          'Calculadora científica gratuita de calorías diarias (TDEE), metabolismo basal (Mifflin-St Jeor) y macronutrientes (proteínas, carbohidratos y grasas) para perder grasa en déficit calórico o ganar masa muscular en el gimnasio.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR'
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '¿Cuántos gramos de proteína al día necesito para ganar masa muscular o definir?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'La evidencia científica (ISSN) recomienda entre 1.8 g y 2.2 g de proteína por kilogramo de peso corporal al día para personas que entrenan fuerza en el gimnasio, subiendo ligeramente en etapas de déficit calórico para preservar la masa muscular.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Qué déficit calórico es mejor para perder grasa sin perder músculo?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Un déficit calórico moderado de entre 350 y 500 kcal por debajo de tu gasto energético diario total (TDEE), combinado con entrenamiento de pesas y alta ingesta proteica, permite oxidar grasa corporal manteniendo la fuerza y el músculo.'
            }
          }
        ]
      }
    ]
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar"
      style={{
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <Helmet>
        <title>Calculadora de Calorías, Macros y Déficit Calórico para Gimnasio | Pro Fitness Glass</title>
        <meta
          name="description"
          content="Calcula gratis tus calorías diarias (TDEE), tasa metabólica basal (Mifflin-St Jeor) y gramos exactos de proteínas, carbohidratos y grasas para definición, recomposición o volumen muscular."
        />
        <meta
          name="keywords"
          content="calculadora calorias y macros, calculadora deficit calorico, calcular tdee gimnasio, gramos de proteina por kilo, macros para volumen muscular, mifflin st jeor calculadora, dieta hipertrofia"
        />
        <link rel="canonical" href="https://pro-fitness-glass.zeabur.app/calculadora-calorias-macros" />
        <meta property="og:title" content="Calculadora de Calorías, Macros y Déficit Calórico — Pro Fitness Glass" />
        <meta
          property="og:description"
          content="Obtén tus calorías exactas y tu reparto de proteínas, carbohidratos, grasas, agua y creatina para transformar tu físico."
        />
        <meta property="og:url" content="https://pro-fitness-glass.zeabur.app/calculadora-calorias-macros" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main
        className="max-w-5xl mx-auto px-3.5 sm:px-6 pb-12 sm:pb-16"
        style={{
          paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1rem)',
          paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 3rem)'
        }}
      >
        {/* Clean Integrated Header (No full-bleed borders or browser gap) */}
        <nav aria-label="Navegación de herramientas" className="flex flex-col gap-3.5 mb-7 sm:mb-10">
          <div className="flex items-center justify-between gap-2.5 w-full">
            {/* Logo + Marca + Badge Gratis */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 group cursor-pointer min-w-0"
              title="Pro Fitness Glass - App de Gimnasio 100% Gratis"
            >
              <img
                src="/icons/icon-96.png"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.webp';
                }}
                alt="Pro Fitness Glass"
                loading="eager"
                decoding="async"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain shadow-xs ring-1 ring-black/10 dark:ring-white/10 group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-black text-sm sm:text-base tracking-tight text-text-primary leading-none group-hover:text-accent transition-colors truncate">
                  Pro Fitness Glass
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden xs:inline">100%</span> Gratis
                </span>
              </div>
            </Link>

            {/* Acciones: Volver a la App / Empezar Gratis */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => (onBack ? onBack() : navigate(isAuthenticated ? '/dashboard' : '/'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/10 dark:ring-white/10 text-xs font-bold text-text-secondary hover:text-text-primary active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <FaChevronLeft className="text-accent text-[11px] shrink-0" />
                <span className="sm:hidden">{isAuthenticated ? 'App' : 'Inicio'}</span>
                <span className="hidden sm:inline">{isAuthenticated ? 'Volver a la App' : 'Inicio'}</span>
              </button>

              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-accent text-accent-contrast text-xs font-black shadow-md shadow-accent/25 hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span className="sm:hidden">Macros</span>
                  <span className="hidden sm:inline">Registrar Dieta Gratis</span>
                  <FaArrowRight className="text-[11px] shrink-0" />
                </button>
              )}
            </div>
          </div>

          {/* Segmented Glass Switcher Pill */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-xl w-full overflow-hidden">
            <Link
              to="/calculadora-1rm"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary text-[11px] sm:text-xs font-bold transition-colors min-w-0"
            >
              <FaCalculator className="text-accent text-[11px] sm:text-xs shrink-0" />
              <span className="truncate sm:hidden">1RM</span>
              <span className="truncate hidden sm:inline">Calculadora 1RM</span>
            </Link>
            <Link
              to="/calculadora-calorias-macros"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-[11px] sm:text-xs font-black border border-emerald-500/30 shadow-xs min-w-0"
            >
              <FaUtensils className="text-[11px] sm:text-xs shrink-0" />
              <span className="truncate sm:hidden">Macros</span>
              <span className="truncate hidden sm:inline">Calorías y Macros</span>
            </Link>
            <Link
              to="/ejercicios"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary text-[11px] sm:text-xs font-bold transition-colors min-w-0"
            >
              <FaDumbbell className="text-blue-400 text-[11px] sm:text-xs shrink-0" />
              <span className="truncate">Ejercicios</span>
            </Link>
            <Link
              to="/noticias"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary text-[11px] sm:text-xs font-bold transition-colors min-w-0"
            >
              <FaNewspaper className="text-purple-400 text-[11px] sm:text-xs shrink-0" />
              <span className="truncate sm:hidden">Guías</span>
              <span className="truncate hidden sm:inline">Guías y Noticias</span>
            </Link>
          </div>
        </nav>

        {/* Hero SEO Header */}
        <header className="text-center max-w-3xl mx-auto mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-3 sm:mb-4 max-w-full text-center">
            <FaUtensils className="text-xs shrink-0" />
            <span className="sm:hidden">Calculadora Nutricional • 100% Gratis</span>
            <span className="hidden sm:inline">Pro Fitness Glass • Calculadora de Nutrición 100% Gratis</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-text-primary leading-tight mb-3 sm:mb-4">
            Calculadora de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-accent to-teal-400">Calorías, Macros y Déficit</span>
          </h1>
          <p className="text-text-secondary text-sm sm:text-lg font-medium leading-relaxed px-1">
            Calcula tu <strong>Gasto Energético Diario Total (TDEE)</strong> con la ecuación científica de <em>Mifflin-St Jeor</em> y obtén tus gramos exactos de proteína, carbohidratos, grasas, agua y creatina con la app <strong>Pro Fitness Glass</strong> 100% gratis.
          </p>
        </header>

        {/* Interactive Calculator Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start mb-10 sm:mb-14">
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-5 p-4 sm:p-7 rounded-[24px] sm:rounded-[28px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-xl space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3 pb-3.5 border-b border-black/5 dark:border-white/10">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 shrink-0">
                <FaWeightScale className="text-lg sm:text-xl" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-text-primary leading-snug">Tus Datos Físicos</h2>
                <p className="text-[11px] sm:text-xs text-text-secondary font-medium">Fórmula clínica Mifflin-St Jeor</p>
              </div>
            </div>

            {/* Sex Toggle with FontAwesome Icons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSex('male')}
                className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border flex items-center justify-center gap-2 ${
                  sex === 'male'
                    ? 'bg-accent text-accent-contrast border-accent shadow-md shadow-accent/20'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary border-black/10 dark:border-white/10'
                }`}
              >
                <FaMars className="text-sm" />
                <span>Hombre</span>
              </button>
              <button
                type="button"
                onClick={() => setSex('female')}
                className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border flex items-center justify-center gap-2 ${
                  sex === 'female'
                    ? 'bg-accent text-accent-contrast border-accent shadow-md shadow-accent/20'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary border-black/10 dark:border-white/10'
                }`}
              >
                <FaVenus className="text-sm" />
                <span>Mujer</span>
              </button>
            </div>

            {/* Weight, Height, Age with Touch Steppers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              {/* Weight */}
              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/10">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Peso Corporal</label>
                  <span className="text-xs font-black text-emerald-400">{weight} kg</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWeight((w) => Math.max(35, Number(w) - 1))}
                    className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/10 text-text-primary flex items-center justify-center active:scale-95 shrink-0"
                  >
                    <FaMinus className="text-[10px]" />
                  </button>
                  <input
                    type="number"
                    min="35"
                    max="220"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full py-1.5 rounded-lg bg-bg-primary border border-black/10 dark:border-white/15 text-center font-black text-base text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setWeight((w) => Math.min(220, Number(w) + 1))}
                    className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/10 text-text-primary flex items-center justify-center active:scale-95 shrink-0"
                  >
                    <FaPlus className="text-[10px]" />
                  </button>
                </div>
              </div>

              {/* Height */}
              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/10">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Altura</label>
                  <span className="text-xs font-black text-emerald-400">{height} cm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHeight((h) => Math.max(120, Number(h) - 1))}
                    className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/10 text-text-primary flex items-center justify-center active:scale-95 shrink-0"
                  >
                    <FaMinus className="text-[10px]" />
                  </button>
                  <input
                    type="number"
                    min="120"
                    max="230"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full py-1.5 rounded-lg bg-bg-primary border border-black/10 dark:border-white/15 text-center font-black text-base text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setHeight((h) => Math.min(230, Number(h) + 1))}
                    className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/10 text-text-primary flex items-center justify-center active:scale-95 shrink-0"
                  >
                    <FaPlus className="text-[10px]" />
                  </button>
                </div>
              </div>

              {/* Age */}
              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/10">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Edad</label>
                  <span className="text-xs font-black text-emerald-400">{age} años</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAge((a) => Math.max(14, Number(a) - 1))}
                    className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/10 text-text-primary flex items-center justify-center active:scale-95 shrink-0"
                  >
                    <FaMinus className="text-[10px]" />
                  </button>
                  <input
                    type="number"
                    min="14"
                    max="95"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full py-1.5 rounded-lg bg-bg-primary border border-black/10 dark:border-white/15 text-center font-black text-base text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setAge((a) => Math.min(95, Number(a) + 1))}
                    className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/10 text-text-primary flex items-center justify-center active:scale-95 shrink-0"
                  >
                    <FaPlus className="text-[10px]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Level Pills + Select */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                <FaPersonRunning className="text-emerald-400" />
                <span>Nivel de Actividad Semanal</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {ACTIVITY_LEVELS.slice(1, 4).map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setActivity(lvl.value)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-all truncate ${
                      Number(activity) === lvl.value
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary border border-black/5 dark:border-white/10'
                    }`}
                  >
                    {lvl.short}
                  </button>
                ))}
              </div>
              <select
                value={activity}
                onChange={(e) => setActivity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-primary border border-black/10 dark:border-white/15 text-text-primary font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {ACTIVITY_LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Goal Selector */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-text-secondary mb-2">
                Tu Objetivo Físico
              </label>
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoalId(g.id)}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all ${
                      goalId === g.id
                        ? 'bg-accent/15 border-accent ring-1 ring-accent/40'
                        : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-xs sm:text-sm text-text-primary">{g.title}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/20 text-accent shrink-0">
                        {g.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">{g.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Calories & Macros Breakdown */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {/* Calories Hero Card */}
            <div className="p-5 sm:p-7 rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-emerald-500/15 via-accent/10 to-transparent border border-emerald-500/30 backdrop-blur-xl shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-center sm:text-left">
                <div className="sm:col-span-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                    Objetivo Diario Recomendado ({calc.goal.shortTitle})
                  </span>
                  <div className="text-4xl sm:text-5xl font-black tracking-tight text-text-primary">
                    {calc.targetCalories.toLocaleString()} <span className="text-lg sm:text-xl font-bold text-emerald-400">kcal / día</span>
                  </div>
                  <p className="text-xs text-text-secondary font-medium mt-1.5">
                    Mantenimiento (TDEE): <strong>{calc.tdee} kcal</strong> · Metabolismo Basal (TMB): <strong>{calc.bmr} kcal</strong>
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 text-center">
                  <FaFireFlameCurved className="text-emerald-400 mx-auto mb-1 text-xl" />
                  <span className="text-[10px] font-black uppercase text-text-tertiary block">Balance Energético</span>
                  <span className="text-sm font-black text-text-primary">
                    {calc.goal.calDelta === 0
                      ? 'Normocalórica'
                      : `${calc.goal.calDelta > 0 ? '+' : ''}${calc.goal.calDelta} kcal/día`}
                  </span>
                </div>
              </div>

              {/* Visual Macro Distribution Bar */}
              <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10">
                <div className="flex justify-between text-[11px] font-black mb-1.5">
                  <span className="text-rose-400">Proteínas {calc.proteinPct}%</span>
                  <span className="text-amber-400">Carbohidratos {calc.carbPct}%</span>
                  <span className="text-sky-400">Grasas {calc.fatPct}%</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-black/20">
                  <div style={{ width: `${calc.proteinPct}%` }} className="bg-rose-500 h-full transition-all duration-300" />
                  <div style={{ width: `${calc.carbPct}%` }} className="bg-amber-400 h-full transition-all duration-300" />
                  <div style={{ width: `${calc.fatPct}%` }} className="bg-sky-400 h-full transition-all duration-300" />
                </div>
              </div>
            </div>

            {/* 3 Macro Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-[22px] bg-black/5 dark:bg-white/[0.04] border border-rose-500/30 flex sm:flex-col items-center sm:items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:block">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center sm:mb-2 shrink-0">
                    <FaDrumstickBite className="text-lg" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 block">
                      Proteínas ({calc.proteinPct}%)
                    </span>
                    <span className="text-[11px] text-text-secondary sm:hidden">
                      {calc.goal.proteinPerKg} g/kg · Construcción muscular
                    </span>
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <div className="text-2xl sm:text-3xl font-black text-text-primary">
                    {calc.proteinGrams} <span className="text-sm font-bold text-text-tertiary">g</span>
                  </div>
                  <div className="text-[11px] font-bold text-text-secondary">
                    {calc.proteinGrams * 4} kcal
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-[22px] bg-black/5 dark:bg-white/[0.04] border border-amber-500/30 flex sm:flex-col items-center sm:items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:block">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center sm:mb-2 shrink-0">
                    <FaBowlRice className="text-lg" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                      Carbohidratos ({calc.carbPct}%)
                    </span>
                    <span className="text-[11px] text-text-secondary sm:hidden">
                      Glucógeno y rendimiento
                    </span>
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <div className="text-2xl sm:text-3xl font-black text-text-primary">
                    {calc.carbGrams} <span className="text-sm font-bold text-text-tertiary">g</span>
                  </div>
                  <div className="text-[11px] font-bold text-text-secondary">
                    {calc.carbGrams * 4} kcal
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-[22px] bg-black/5 dark:bg-white/[0.04] border border-sky-500/30 flex sm:flex-col items-center sm:items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:block">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center sm:mb-2 shrink-0">
                    <FaSeedling className="text-lg" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 block">
                      Grasas ({calc.fatPct}%)
                    </span>
                    <span className="text-[11px] text-text-secondary sm:hidden">
                      {calc.goal.fatPerKg} g/kg · Salud hormonal
                    </span>
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <div className="text-2xl sm:text-3xl font-black text-text-primary">
                    {calc.fatGrams} <span className="text-sm font-bold text-text-tertiary">g</span>
                  </div>
                  <div className="text-[11px] font-bold text-text-secondary">
                    {calc.fatGrams * 9} kcal
                  </div>
                </div>
              </div>
            </div>

            {/* Water & Creatine Recommendations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 shrink-0">
                  <FaGlassWater className="text-xl" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 block">
                    Hidratación Diaria Óptima
                  </span>
                  <div className="text-xl font-black text-text-primary">{calc.waterLiters} Litros / día</div>
                  <p className="text-[11px] text-text-secondary">Clave para el rendimiento muscular y celular</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
                  <FaFlask className="text-xl" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 block">
                    Dosis de Creatina Monohidrato
                  </span>
                  <div className="text-xl font-black text-text-primary">{calc.creatineGrams} g / día</div>
                  <p className="text-[11px] text-text-secondary">Fórmula clínica (~0.07 g por kg de peso)</p>
                </div>
              </div>
            </div>

            {/* CTA to AI Nutrition Tracker */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-accent/15 to-blue-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-black text-text-primary text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
                  <FaHeartPulse className="text-emerald-400 shrink-0" />
                  <span>¿Cansado de pesar cada alimento a mano?</span>
                </h3>
                <p className="text-xs text-text-secondary font-medium mt-1">
                  En <strong>Pro Fitness Glass</strong> puedes describir tu plato o escanear el código de barras y la IA calcula tus calorías y macros al segundo.
                </p>
              </div>
              <button
                onClick={() => navigate(isAuthenticated ? '/nutrition' : '/register')}
                className="w-full sm:w-auto shrink-0 px-5 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
              >
                {isAuthenticated ? 'Abrir Mi Nutrición' : 'Controlar Mis Macros Gratis'}
              </button>
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        <article className="space-y-6 max-w-4xl mx-auto">
          <div className="p-5 sm:p-8 rounded-[24px] sm:rounded-[28px] bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2.5">
              <FaCircleQuestion className="text-emerald-400 shrink-0" />
              <span>¿Cómo repartir tus Macronutrientes para Hipertrofia o Definición?</span>
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Tanto si tu objetivo en el gimnasio es <strong>perder grasa corporal (definición)</strong> como <strong>ganar masa muscular (volumen limpio)</strong>, el factor determinante es el balance energético (TDEE) unido a una ingesta adecuada de proteínas:
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-text-secondary">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-black">1.</span>
                <span>
                  <strong className="text-text-primary">Proteínas (1.8 a 2.2 g/kg):</strong> Son los ladrillos estructurales de tus fibras musculares. En etapa de definición, mantener la proteína alta en 2.1 g/kg evita que pierdas músculo mientras bajas de peso.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-sky-400 font-black">2.</span>
                <span>
                  <strong className="text-text-primary">Grasas esenciales (0.8 a 1.0 g/kg):</strong> Imprescindibles para la producción hormonal (testosterona, estrógenos) y la absorción de vitaminas liposolubles (A, D, E, K).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-amber-400 font-black">3.</span>
                <span>
                  <strong className="text-text-primary">Carbohidratos (Resto de tus calorías):</strong> Son el combustible principal para tus series pesadas en el gimnasio, recargando el glucógeno muscular y favoreciendo la recuperación.
                </span>
              </li>
            </ul>
          </div>
        </article>
      </main>
    </div>
  );
}
