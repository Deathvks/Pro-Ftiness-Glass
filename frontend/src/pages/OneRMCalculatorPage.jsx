/* frontend/src/pages/OneRMCalculatorPage.jsx */
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FaDumbbell,
  FaChevronLeft,
  FaCalculator,
  FaFireFlameCurved,
  FaTrophy,
  FaBolt,
  FaArrowRight,
  FaCircleInfo,
  FaCircleCheck,
  FaNewspaper,
  FaUtensils,
  FaPlus,
  FaMinus,
  FaChartLine,
  FaBullseye,
  FaCircleQuestion
} from 'react-icons/fa6';
import useAppStore from '../store/useAppStore';

const EXERCISES = [
  { id: 'bench', name: 'Press de Banca con Barra', shortName: 'Press Banca', category: 'Pecho / Empuje' },
  { id: 'squat', name: 'Sentadilla Libre con Barra', shortName: 'Sentadilla', category: 'Pierna / Cuádriceps' },
  { id: 'deadlift', name: 'Peso Muerto Convencional / Sumo', shortName: 'Peso Muerto', category: 'Cadena Posterior' },
  { id: 'ohp', name: 'Press Militar de Pie (Overhead)', shortName: 'Press Militar', category: 'Hombros / Empuje' },
  { id: 'row', name: 'Remo con Barra (Pendlay / Yates)', shortName: 'Remo Barra', category: 'Espalda / Tirón' },
  { id: 'hipthrust', name: 'Hip Thrust con Barra', shortName: 'Hip Thrust', category: 'Glúteos / Pierna' },
  { id: 'pullup', name: 'Dominadas Lastradas', shortName: 'Dominadas', category: 'Espalda / Tracción' },
  { id: 'legpress', name: 'Prensa de Piernas 45°', shortName: 'Prensa 45°', category: 'Pierna' }
];

const PERCENTAGE_ROWS = [
  { pct: 100, reps: '1 rep', zone: 'Fuerza Máxima / Récord (PR)', shortZone: 'Récord 1RM', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { pct: 95, reps: '2 reps', zone: 'Fuerza Neural Pura', shortZone: 'Fuerza Neural', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { pct: 90, reps: '3 - 4 reps', zone: 'Fuerza Base / Powerlifting', shortZone: 'Powerlifting', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { pct: 85, reps: '5 - 6 reps', zone: 'Fuerza + Hipertrofia Miofibrilar', shortZone: 'Fuerza + Hipertrofia', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
  { pct: 80, reps: '7 - 8 reps', zone: 'Hipertrofia Óptima (Tensión Mecánica)', shortZone: 'Hipertrofia Óptima', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { pct: 75, reps: '9 - 10 reps', zone: 'Hipertrofia / Volumen Muscular', shortZone: 'Volumen Muscular', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  { pct: 70, reps: '11 - 12 reps', zone: 'Hipertrofia Metabólica / Resistencia', shortZone: 'Hipertrofia Metabólica', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
  { pct: 65, reps: '13 - 15 reps', zone: 'Bombeo / Resistencia Muscular', shortZone: 'Bombeo / Resistencia', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { pct: 60, reps: '15 - 18 reps', zone: 'Calentamiento Específico / Técnica', shortZone: 'Técnica / Aprox.', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' }
];

const QUICK_WEIGHTS = [40, 60, 80, 100, 120, 140];
const QUICK_REPS = [3, 5, 6, 8, 10, 12];

export default function OneRMCalculatorPage({ onBack }) {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0].id);
  const [weight, setWeight] = useState(80);
  const [reps, setReps] = useState(8);

  const results = useMemo(() => {
    const w = Math.max(1, Number(weight) || 0);
    const r = Math.max(1, Math.min(30, Number(reps) || 1));

    if (r === 1) {
      return {
        epley: w,
        brzycki: w,
        lander: w,
        average: w
      };
    }

    const epley = w * (1 + r / 30);
    const brzycki = w * (36 / (37 - Math.min(r, 36)));
    const lander = (100 * w) / (101.3 - 2.67123 * r);
    const average = (epley + brzycki + lander) / 3;

    return {
      epley: Math.round(epley * 10) / 10,
      brzycki: Math.round(brzycki * 10) / 10,
      lander: Math.round(lander * 10) / 10,
      average: Math.round(average * 10) / 10
    };
  }, [weight, reps]);

  const currentExerciseObj = EXERCISES.find((e) => e.id === selectedExercise) || EXERCISES[0];

  const adjustWeight = (delta) => {
    setWeight((prev) => Math.max(1, Math.min(500, Math.round((Number(prev) + delta) * 10) / 10)));
  };

  const adjustReps = (delta) => {
    setReps((prev) => Math.max(1, Math.min(20, Number(prev) + delta)));
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Calculadora de 1RM (Repetición Máxima) — Pro Fitness Glass',
        url: 'https://pro-fitness-glass.zeabur.app/calculadora-1rm',
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Web, Android, iOS',
        description:
          'Calculadora gratuita de 1RM (Repetición Máxima) para Press de Banca, Sentadilla, Peso Muerto y ejercicios de gimnasio. Calcula tus porcentajes de fuerza e hipertrofia con las fórmulas de Epley, Brzycki y Lander.',
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
            name: '¿Qué es el 1RM en el gimnasio y para qué sirve?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'El 1RM (Una Repetición Máxima) es el peso máximo que puedes levantar una sola vez con técnica correcta en un ejercicio como Press de Banca, Sentadilla o Peso Muerto. Sirve para programar tus cargas de hipertrofia (70%-85% del 1RM) y medir tu sobrecarga progresiva.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Cuál es la fórmula más precisa para calcular el 1RM?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Las ecuaciones científicas más validadas son la fórmula de Epley (Peso × (1 + Reps/30)) y la fórmula de Brzycki (Peso × (36 / (37 - Reps))). Nuestra calculadora combina Epley, Brzycki y Lander para darte la media exacta sin riesgo de lesión.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Con qué porcentaje del 1RM debo entrenar para ganar masa muscular (hipertrofia)?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'La literatura científica sitúa la zona óptima de hipertrofia miofibrilar entre el 70% y el 85% de tu 1RM (lo que equivale a series de entre 6 y 12 repeticiones cercanas al fallo muscular, dejando RIR 1-2).'
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
        <title>Calculadora de 1RM (Repetición Máxima) para Gimnasio y Pesas | Pro Fitness Glass</title>
        <meta
          name="description"
          content="Calcula gratis tu 1RM (Repetición Máxima) en Press de Banca, Sentadilla, Peso Muerto y Press Militar con las fórmulas de Epley, Brzycki y Lander. Descubre tu tabla de porcentajes para hipertrofia y fuerza."
        />
        <meta
          name="keywords"
          content="calculadora 1rm, calcular repeticion maxima, 1rm press banca, 1rm sentadilla, 1rm peso muerto, porcentajes 1rm hipertrofia, formula epley brzycki, fuerza gimnasio, sobrecarga progresiva"
        />
        <link rel="canonical" href="https://pro-fitness-glass.zeabur.app/calculadora-1rm" />
        <meta property="og:title" content="Calculadora de 1RM y Porcentajes de Fuerza para Gimnasio — Pro Fitness Glass" />
        <meta
          property="og:description"
          content="Descubre tu fuerza máxima estimada y los kilos exactos para tus series de hipertrofia y fuerza sin riesgo de lesión."
        />
        <meta property="og:url" content="https://pro-fitness-glass.zeabur.app/calculadora-1rm" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main
        className="max-w-5xl mx-auto px-3.5 sm:px-6 pb-20 sm:pb-28"
        style={{
          paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1rem)',
          paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 6.5rem)'
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
                  <span className="sm:hidden">1RM</span>
                  <span className="hidden sm:inline">Registrar Pesos Gratis</span>
                  <FaArrowRight className="text-[11px] shrink-0" />
                </button>
              )}
            </div>
          </div>

          {/* Segmented Glass Switcher Pill */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-xl w-full overflow-hidden">
            <Link
              to="/calculadora-1rm"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl bg-accent/15 text-accent text-[11px] sm:text-xs font-black border border-accent/30 shadow-xs min-w-0"
            >
              <FaCalculator className="text-[11px] sm:text-xs shrink-0" />
              <span className="truncate sm:hidden">1RM</span>
              <span className="truncate hidden sm:inline">Calculadora 1RM</span>
            </Link>
            <Link
              to="/calculadora-calorias-macros"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary text-[11px] sm:text-xs font-bold transition-colors min-w-0"
            >
              <FaUtensils className="text-emerald-400 text-[11px] sm:text-xs shrink-0" />
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
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-accent/10 ring-1 ring-accent/30 text-accent text-[10px] sm:text-xs font-black uppercase tracking-wider mb-3 sm:mb-4 max-w-full text-center">
            <FaDumbbell className="text-xs shrink-0" />
            <span className="sm:hidden">Calculadora de 1RM • 100% Gratis</span>
            <span className="hidden sm:inline">Pro Fitness Glass • Calculadora de Fuerza 100% Gratis</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-text-primary leading-tight mb-3 sm:mb-4">
            Calculadora de <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-purple-400 to-accent">1RM y Porcentajes</span> de Gimnasio
          </h1>
          <p className="text-text-secondary text-sm sm:text-lg font-medium leading-relaxed px-1">
            Calcula tu <strong>Repetición Máxima (1RM)</strong> en Press de Banca, Sentadilla, Peso Muerto o Dominadas sin riesgo de lesión y descubre tus pesos exactos para ganar músculo y fuerza con el diario <strong>Pro Fitness Glass</strong> 100% gratis.
          </p>
        </header>

        {/* Interactive Calculator Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start mb-10 sm:mb-14">
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-5 p-4 sm:p-7 rounded-[24px] sm:rounded-[28px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-3.5 border-b border-black/5 dark:border-white/10">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30 shrink-0">
                <FaDumbbell className="text-lg sm:text-xl" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-text-primary leading-snug">Introduce tu Serie</h2>
                <p className="text-[11px] sm:text-xs text-text-secondary font-medium">Mejor precisión entre 2 y 10 repeticiones</p>
              </div>
            </div>

            {/* Exercise Selector Pills on Mobile + Select */}
            <div>
              <label htmlFor="exercise-select" className="block text-[11px] font-black uppercase tracking-wider text-text-secondary mb-2">
                Ejercicio de Referencia
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-1.5 mb-2.5">
                {EXERCISES.slice(0, 4).map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setSelectedExercise(ex.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all truncate ${
                      selectedExercise === ex.id
                        ? 'bg-accent text-accent-contrast shadow-sm shadow-accent/25'
                        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary border border-black/5 dark:border-white/10'
                    }`}
                  >
                    {ex.shortName}
                  </button>
                ))}
              </div>
              <select
                id="exercise-select"
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-primary border border-black/10 dark:border-white/15 text-text-primary font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {EXERCISES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Weight Input with Touch Stepper Buttons */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/10">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="weight-input" className="text-[11px] font-black uppercase tracking-wider text-text-secondary">
                  Peso Levantado (kg)
                </label>
                <span className="text-sm font-black text-accent">{weight} kg</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => adjustWeight(-2.5)}
                  aria-label="Restar 2.5 kg"
                  className="w-11 h-11 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-accent/20 text-text-primary active:scale-95 transition-all flex items-center justify-center shrink-0 font-bold"
                >
                  <FaMinus className="text-xs" />
                </button>
                <input
                  id="weight-input"
                  type="number"
                  min="1"
                  max="500"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full text-center py-2.5 rounded-xl bg-bg-primary border border-black/10 dark:border-white/15 text-xl font-black text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => adjustWeight(2.5)}
                  aria-label="Sumar 2.5 kg"
                  className="w-11 h-11 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-accent/20 text-text-primary active:scale-95 transition-all flex items-center justify-center shrink-0 font-bold"
                >
                  <FaPlus className="text-xs" />
                </button>
              </div>

              <input
                type="range"
                min="10"
                max="260"
                step="2.5"
                value={Math.min(260, Math.max(10, Number(weight) || 10))}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer mb-2"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_WEIGHTS.map((qw) => (
                  <button
                    key={qw}
                    type="button"
                    onClick={() => setWeight(qw)}
                    className={`flex-1 min-w-[44px] py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                      Number(weight) === qw
                        ? 'bg-accent text-accent-contrast'
                        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {qw}kg
                  </button>
                ))}
              </div>
            </div>

            {/* Reps Input with Touch Stepper Buttons */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/10">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="reps-input" className="text-[11px] font-black uppercase tracking-wider text-text-secondary">
                  Repeticiones Completadas
                </label>
                <span className="text-sm font-black text-accent">{reps} {Number(reps) === 1 ? 'rep' : 'reps'}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => adjustReps(-1)}
                  aria-label="Restar 1 repetición"
                  className="w-11 h-11 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-accent/20 text-text-primary active:scale-95 transition-all flex items-center justify-center shrink-0 font-bold"
                >
                  <FaMinus className="text-xs" />
                </button>
                <input
                  id="reps-input"
                  type="number"
                  min="1"
                  max="30"
                  step="1"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full text-center py-2.5 rounded-xl bg-bg-primary border border-black/10 dark:border-white/15 text-xl font-black text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => adjustReps(1)}
                  aria-label="Sumar 1 repetición"
                  className="w-11 h-11 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-accent/20 text-text-primary active:scale-95 transition-all flex items-center justify-center shrink-0 font-bold"
                >
                  <FaPlus className="text-xs" />
                </button>
              </div>

              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={Math.min(15, Math.max(1, Number(reps) || 1))}
                onChange={(e) => setReps(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer mb-2"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_REPS.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => setReps(qr)}
                    className={`flex-1 min-w-[42px] py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                      Number(reps) === qr
                        ? 'bg-accent text-accent-contrast'
                        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {qr} reps
                  </button>
                ))}
              </div>
            </div>

            {/* Result Highlight Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/20 via-purple-500/15 to-transparent border border-accent/30 text-center relative overflow-hidden">
              <span className="text-[11px] font-black uppercase tracking-widest text-accent block mb-1 truncate">
                Tu 1RM Estimado ({currentExerciseObj.shortName})
              </span>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-text-primary my-1">
                {results.average} <span className="text-xl sm:text-2xl font-bold text-accent">kg</span>
              </div>
              <p className="text-[11px] text-text-secondary font-medium mb-3">
                Media científica de Epley, Brzycki y Lander
              </p>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-black/10 dark:border-white/10 text-xs">
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase block">Epley</span>
                  <span className="font-black text-text-primary">{results.epley} kg</span>
                </div>
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase block">Brzycki</span>
                  <span className="font-black text-text-primary">{results.brzycki} kg</span>
                </div>
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase block">Lander</span>
                  <span className="font-black text-text-primary">{results.lander} kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Percentage Table & Training Zones */}
          <div className="lg:col-span-7 p-4 sm:p-7 rounded-[24px] sm:rounded-[28px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30 shrink-0">
                  <FaTrophy className="text-lg sm:text-xl" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-text-primary leading-snug">
                    Tabla de Porcentajes de 1RM
                  </h2>
                  <p className="text-[11px] sm:text-xs text-text-secondary font-medium">
                    Pesos exactos para programar fuerza, hipertrofia o bombeo
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Card Rows (< 640px) - Zero Horizontal Scroll */}
            <div className="sm:hidden space-y-2">
              {PERCENTAGE_ROWS.map((row) => {
                const targetWeight = Math.round(((results.average * row.pct) / 100) * 2) / 2;
                return (
                  <div
                    key={row.pct}
                    className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-12 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-center font-black text-xs text-text-primary shrink-0">
                        {row.pct}%
                      </span>
                      <div className="min-w-0">
                        <div className="text-base font-black text-accent leading-tight">
                          {targetWeight} kg
                        </div>
                        <div className="text-[11px] font-bold text-text-secondary">
                          {row.reps}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 ${row.color}`}>
                      {row.shortZone}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Desktop / Tablet Full Table (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-wider text-text-tertiary border-b border-black/10 dark:border-white/10">
                    <th className="py-3 px-3">% 1RM</th>
                    <th className="py-3 px-3">Peso de Trabajo</th>
                    <th className="py-3 px-3">Reps Estimadas</th>
                    <th className="py-3 px-3">Objetivo Fisiológico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                  {PERCENTAGE_ROWS.map((row) => {
                    const targetWeight = Math.round(((results.average * row.pct) / 100) * 2) / 2;
                    return (
                      <tr key={row.pct} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-black text-text-primary">{row.pct}%</td>
                        <td className="py-3 px-3">
                          <span className="font-black text-base text-accent">{targetWeight} kg</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-text-secondary">{row.reps}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold border ${row.color}`}>
                            {row.zone}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Conversion CTA Banner inside Calculator */}
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-accent/15 via-blue-500/10 to-purple-500/15 border border-accent/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-black text-text-primary text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
                  <FaChartLine className="text-accent shrink-0" />
                  <span>¿Quieres que la App calcule tu 1RM automáticamente?</span>
                </h3>
                <p className="text-xs text-text-secondary font-medium mt-1">
                  En <strong>Pro Fitness Glass</strong> apuntas tus series en el gimnasio y el entrenador IA te sugiere cuánto peso subir en cada sesión.
                </p>
              </div>
              <button
                onClick={() => navigate(isAuthenticated ? '/routines' : '/register')}
                className="w-full sm:w-auto shrink-0 px-5 py-3 rounded-xl bg-accent text-accent-contrast font-black text-xs uppercase tracking-wider shadow-lg shadow-accent/25 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
              >
                {isAuthenticated ? 'Ir a Mis Rutinas' : 'Guardar Mi Progreso Gratis'}
              </button>
            </div>
          </div>
        </section>

        {/* Rich SEO Educational Content */}
        <article className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          <div className="p-5 sm:p-8 rounded-[24px] sm:rounded-[28px] bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
            <h2 className="text-xl sm:text-2xl font-black text-text-primary mb-4 flex items-center gap-2.5">
              <FaBullseye className="text-accent shrink-0" />
              <span>¿Cómo usar tu 1RM para aplicar Sobrecarga Progresiva en el Gimnasio?</span>
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
              Conocer tu <strong>1RM (Una Repetición Máxima)</strong> en ejercicios multiarticulares como el <strong>Press de Banca</strong>, la <strong>Sentadilla Libre</strong>, el <strong>Peso Muerto</strong> o el <strong>Press Militar</strong> te permite dejar de entrenar a ciegas y seleccionar el peso exacto según tu objetivo:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-5">
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm mb-2">
                  <FaBolt />
                  <span>Fuerza Máxima (85% - 95%)</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Series de <strong>2 a 5 repeticiones</strong> con descansos de 3 a 5 minutos. Maximiza el reclutamiento de unidades motoras y la eficiencia neural.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-2">
                  <FaFireFlameCurved />
                  <span>Hipertrofia Óptima (70% - 85%)</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Series de <strong>6 a 12 repeticiones</strong> dejando 1 o 2 repeticiones en recámara (RIR 1-2). Es la zona con mejor relación estímulo-fatiga para construir masa muscular.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2 text-cyan-400 font-black text-sm mb-2">
                  <FaCircleCheck />
                  <span>Resistencia y Bombeo (60% - 70%)</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Series de <strong>12 a 18 repeticiones</strong> ideales para ejercicios analíticos, poleas o series de descarga cuidando las articulaciones.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-5 sm:p-8 rounded-[24px] sm:rounded-[28px] bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-5 mb-10">
            <h2 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2.5">
              <FaCircleQuestion className="text-accent shrink-0" />
              <span>Preguntas Frecuentes sobre el Cálculo de 1RM</span>
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                <h3 className="font-extrabold text-text-primary text-sm sm:text-base mb-1">
                  ¿Es seguro probar mi 1RM real con 1 sola repetición al límite?
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Si no compites en Powerlifting, no es necesario arriesgarse a una lesión probando un levantamiento máximo a 1 repetición. Calcular tu <strong>1RM estimado con una serie de 5 a 8 repeticiones</strong> mediante las fórmulas de <em>Epley</em> y <em>Brzycki</em> tiene una precisión superior al 97% y es mucho más seguro para tus tendones.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                <h3 className="font-extrabold text-text-primary text-sm sm:text-base mb-1">
                  ¿Cada cuánto tiempo debo actualizar mi 1RM en mi rutina de gimnasio?
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Cada vez que logres hacer 1 o 2 repeticiones más con el mismo peso o subas 2,5 kg a la barra, tu 1RM teórico habrá subido. Usando el diario de entrenamiento de <strong>Pro Fitness Glass</strong>, este cálculo se actualiza en tiempo real en cada sesión.
                </p>
              </div>
            </div>
          </div>
        </article>
        {/* Espaciador inferior generoso: garantiza separación real del fin de la pantalla y barras de navegación en móviles */}
        <div
          className="w-full shrink-0 select-none pointer-events-none"
          style={{
            height: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 24px)) + 10rem)',
            minHeight: '180px'
          }}
          aria-hidden="true"
        />
      </main>
    </div>
  );
}
