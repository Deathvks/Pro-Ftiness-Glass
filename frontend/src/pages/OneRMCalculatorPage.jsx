/* frontend/src/pages/OneRMCalculatorPage.jsx */
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Dumbbell,
  ChevronLeft,
  Calculator,
  Flame,
  Trophy,
  Zap,
  ArrowRight,
  Info,
  CheckCircle2,
  Sparkles,
  Newspaper
} from 'lucide-react';
import useAppStore from '../store/useAppStore';

const EXERCISES = [
  { id: 'bench', name: 'Press de Banca con Barra', category: 'Pecho / Empuje' },
  { id: 'squat', name: 'Sentadilla Libre con Barra', category: 'Pierna / Cuádriceps' },
  { id: 'deadlift', name: 'Peso Muerto Convencional / Sumo', category: 'Cadena Posterior' },
  { id: 'ohp', name: 'Press Militar de Pie (Overhead)', category: 'Hombros / Empuje' },
  { id: 'row', name: 'Remo con Barra (Pendlay / Yates)', category: 'Espalda / Tirón' },
  { id: 'hipthrust', name: 'Hip Thrust con Barra', category: 'Glúteos / Pierna' },
  { id: 'pullup', name: 'Dominadas Lastradas', category: 'Espalda / Tracción' },
  { id: 'legpress', name: 'Prensa de Piernas 45°', category: 'Pierna' }
];

const PERCENTAGE_ROWS = [
  { pct: 100, reps: '1 rep', zone: 'Fuerza Máxima / Récord (PR)', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { pct: 95, reps: '2 reps', zone: 'Fuerza Neural Pura', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { pct: 90, reps: '3 - 4 reps', zone: 'Fuerza Base / Powerlifting', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { pct: 85, reps: '5 - 6 reps', zone: 'Fuerza + Hipertrofia Miofibrilar', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
  { pct: 80, reps: '7 - 8 reps', zone: 'Hipertrofia Óptima (Tensión Mecánica)', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { pct: 75, reps: '9 - 10 reps', zone: 'Hipertrofia / Volumen Muscular', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  { pct: 70, reps: '11 - 12 reps', zone: 'Hipertrofia Metabólica / Resistencia', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
  { pct: 65, reps: '13 - 15 reps', zone: 'Bombeo / Resistencia Muscular', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { pct: 60, reps: '15 - 18 reps', zone: 'Calentamiento Específico / Técnica', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' }
];

export default function OneRMCalculatorPage({ onBack }) {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0].id);
  const [weight, setWeight] = useState(80);
  const [reps, setReps] = useState(8);

  const results = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const r = Math.max(1, Math.min(30, parseInt(reps, 10) || 1));

    if (w <= 0) {
      return { avg: 0, epley: 0, brzycki: 0, lander: 0 };
    }

    if (r === 1) {
      return { avg: Math.round(w * 10) / 10, epley: w, brzycki: w, lander: w };
    }

    const epley = w * (1 + r / 30);
    const brzycki = r < 37 ? w * (36 / (37 - r)) : epley;
    const lander = (100 * w) / (101.3 - 2.67123 * r);
    const avg = (epley + brzycki + lander) / 3;

    return {
      avg: Math.round(avg * 10) / 10,
      epley: Math.round(epley * 10) / 10,
      brzycki: Math.round(brzycki * 10) / 10,
      lander: Math.round(lander * 10) / 10
    };
  }, [weight, reps]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        'name': 'Calculadora de 1RM para Gimnasio — Pro Fitness Glass',
        'url': 'https://pro-fitness-glass.zeabur.app/calculadora-1rm',
        'applicationCategory': 'HealthApplication',
        'operatingSystem': 'All',
        'description': 'Calculadora gratuita de 1RM (Una Repetición Máxima) para Press de Banca, Sentadilla, Peso Muerto y ejercicios de gimnasio usando las fórmulas científicas de Epley, Brzycki y Lander.',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'EUR'
        }
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': '¿Qué es el 1RM en el gimnasio y para qué sirve?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'El 1RM (Una Repetición Máxima) es el peso máximo que puedes levantar una sola vez con técnica correcta en un ejercicio determinado. Sirve para programar tus cargas de entrenamiento por porcentajes y medir tu ganancia de fuerza e hipertrofia.'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Qué porcentaje de mi 1RM debo usar para ganar masa muscular (hipertrofia)?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'La evidencia científica sitúa la zona óptima de hipertrofia entre el 70% y el 85% de tu 1RM, lo que equivale a series de entre 6 y 12 repeticiones cercanas al fallo muscular (RIR 1-2).'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Cuál es la fórmula más precisa para calcular el 1RM?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Las fórmulas de Epley y Brzycki son las más validadas en ciencias del deporte. Para máxima precisión, se recomienda utilizar una serie de entre 3 y 10 repeticiones reales.'
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
        WebkitOverflowScrolling: 'touch',
        paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 2rem)'
      }}
    >
      <Helmet>
        <title>Calculadora de 1RM Gimnasio Gratis | Calcular Repetición Máxima y Porcentajes</title>
        <meta
          name="description"
          content="Calcula tu 1RM (Repetición Máxima) en Press de Banca, Sentadilla y Peso Muerto gratis. Tabla de porcentajes de fuerza e hipertrofia con las fórmulas de Epley y Brzycki."
        />
        <link rel="canonical" href="https://pro-fitness-glass.zeabur.app/calculadora-1rm" />
        <meta property="og:title" content="Calculadora de 1RM para Gimnasio — Pro Fitness Glass" />
        <meta
          property="og:description"
          content="Descubre tu fuerza máxima (1RM) y tu tabla exacta de cargas para hipertrofia y powerlifting sin riesgo de lesión."
        />
        <meta property="og:url" content="https://pro-fitness-glass.zeabur.app/calculadora-1rm" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-bg-primary/85 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => (onBack ? onBack() : navigate('/'))}
              className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Volver"
            >
              <ChevronLeft size={18} />
            </button>
            <Link to="/" className="flex items-center gap-2 font-black text-sm sm:text-base tracking-tight">
              <img src="/logo.webp" alt="Pro Fitness Glass" className="w-7 h-7 rounded-lg" />
              <span className="hidden xs:inline">PRO FITNESS GLASS</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/calculadora-calorias-macros"
              className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-text-secondary hover:text-accent transition-colors"
            >
              Calc. Macros
            </Link>
            <Link
              to="/noticias"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-text-secondary hover:text-accent transition-colors"
            >
              <Newspaper size={14} className="text-accent" />
              <span>Guías Gym</span>
            </Link>
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-contrast text-xs font-black shadow-md shadow-accent/20 hover:opacity-90 transition-all cursor-pointer"
            >
              {isAuthenticated ? 'Ir a la App' : 'App Gratis'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-12">
        {/* HERO TITLE */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 text-accent text-xs font-black uppercase tracking-wider border border-accent/30">
            <Calculator size={14} />
            <span>Herramienta Científica de Gimnasio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Calculadora de <span className="text-accent">1RM</span> y Tabla de Porcentajes de Fuerza
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary leading-relaxed">
            Descubre tu <strong>Repetición Máxima (1RM)</strong> real en Press de Banca, Sentadilla o Peso Muerto sin riesgo de lesión y obtén tus cargas exactas para <strong>hipertrofia muscular</strong> y <strong>fuerza</strong>.
          </p>
        </section>

        {/* INTERACTIVE CALCULATOR GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: INPUT CONTROLS */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2">
                1. Ejercicio de Gimnasio
              </label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-bg-primary border border-black/10 dark:border-white/10 font-bold text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {EXERCISES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-text-secondary">
                  2. Peso Levantado (kg)
                </label>
                <span className="text-sm font-black text-accent">{weight} kg</span>
              </div>
              <input
                type="number"
                min="1"
                max="500"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-bg-primary border border-black/10 dark:border-white/10 font-black text-xl text-text-primary focus:outline-none focus:border-accent"
              />
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {[40, 60, 80, 100, 120, 140].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWeight(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      Number(weight) === preset
                        ? 'bg-accent text-accent-contrast shadow-xs'
                        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {preset} kg
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-text-secondary">
                  3. Repeticiones Completadas
                </label>
                <span className="text-sm font-black text-accent">{reps} repeticiones</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {[3, 5, 8, 10, 12].map((rPreset) => (
                  <button
                    key={rPreset}
                    type="button"
                    onClick={() => setReps(rPreset)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      Number(reps) === rPreset
                        ? 'bg-accent text-accent-contrast shadow-xs'
                        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {rPreset} reps
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-tertiary mt-2 flex items-center gap-1">
                <Info size={12} className="shrink-0 text-accent" />
                Para máxima exactitud usa una serie de entre 2 y 10 repeticiones al fallo.
              </p>
            </div>
          </div>

          {/* RIGHT: 1RM RESULTS & ZONES */}
          <div className="lg:col-span-7 space-y-6">
            {/* MAIN 1RM CARD */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-accent/20 via-accent/5 to-transparent border border-accent/30 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-accent">
                    Tu Fuerza Máxima Estimada (1RM)
                  </span>
                  <div className="text-5xl sm:text-6xl font-black tracking-tight text-text-primary mt-1">
                    {results.avg} <span className="text-2xl sm:text-3xl text-accent">kg</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Media ponderada de las 3 fórmulas biomecánicas principales
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-bg-primary/70 backdrop-blur-md p-3 rounded-2xl border border-black/5 dark:border-white/10 text-center">
                  <div>
                    <span className="block text-[10px] font-bold text-text-tertiary uppercase">Epley</span>
                    <span className="text-sm sm:text-base font-black text-text-primary">{results.epley} kg</span>
                  </div>
                  <div className="border-x border-black/10 dark:border-white/10 px-2">
                    <span className="block text-[10px] font-bold text-text-tertiary uppercase">Brzycki</span>
                    <span className="text-sm sm:text-base font-black text-text-primary">{results.brzycki} kg</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-text-tertiary uppercase">Lander</span>
                    <span className="text-sm sm:text-base font-black text-text-primary">{results.lander} kg</span>
                  </div>
                </div>
              </div>

              {/* QUICK RM TARGETS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-black/10 dark:border-white/10">
                <div className="p-3 rounded-2xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase text-orange-500">3RM (Fuerza)</span>
                  <p className="text-lg font-black text-text-primary mt-0.5">
                    {Math.round(results.avg * 0.92 * 10) / 10} kg
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase text-amber-500">5RM (Base 5x5)</span>
                  <p className="text-lg font-black text-text-primary mt-0.5">
                    {Math.round(results.avg * 0.86 * 10) / 10} kg
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase text-emerald-500">8RM (Hipertrofia)</span>
                  <p className="text-lg font-black text-text-primary mt-0.5">
                    {Math.round(results.avg * 0.8 * 10) / 10} kg
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase text-cyan-500">12RM (Volumen)</span>
                  <p className="text-lg font-black text-text-primary mt-0.5">
                    {Math.round(results.avg * 0.7 * 10) / 10} kg
                  </p>
                </div>
              </div>
            </div>

            {/* PERCENTAGE TABLE */}
            <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <h2 className="text-lg font-black text-text-primary mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-accent" />
                Tabla de Porcentajes de 1RM para Entrenar
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-text-tertiary uppercase text-[11px]">
                      <th className="py-2.5 px-2">% 1RM</th>
                      <th className="py-2.5 px-2">Carga (Peso)</th>
                      <th className="py-2.5 px-2">Repeticiones</th>
                      <th className="py-2.5 px-2">Objetivo en el Gimnasio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                    {PERCENTAGE_ROWS.map((row) => {
                      const targetKg = Math.round(((results.avg * row.pct) / 100) * 10) / 10;
                      return (
                        <tr key={row.pct} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-2 font-black text-accent">{row.pct}%</td>
                          <td className="py-2.5 px-2 font-black text-text-primary text-base">{targetKg} kg</td>
                          <td className="py-2.5 px-2 text-text-secondary font-bold">{row.reps}</td>
                          <td className="py-2.5 px-2">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${row.color}`}>
                              {row.zone}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* CONVERSION BANNER */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-accent/20 via-purple-500/15 to-accent/20 border border-accent/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-accent">
              <Sparkles size={14} /> Automatiza tu progreso en el gimnasio
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-text-primary">
              ¿Cansado de calcular tu 1RM a mano en cada entrenamiento?
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl">
              <strong>Pro Fitness Glass</strong> calcula automáticamente tu 1RM en tiempo real mientras anotas tus series en el gimnasio, te avisa cuando bates un récord personal (PR) y programa tu sobrecarga progresiva gratis.
            </p>
          </div>
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-accent text-accent-contrast font-black text-sm shadow-lg shadow-accent/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>Usar Diario de Gimnasio Gratis</span>
            <ArrowRight size={16} />
          </button>
        </section>

        {/* SEO EDUCATIONAL CONTENT */}
        <article className="space-y-8 max-w-4xl mx-auto pt-4 border-t border-black/10 dark:border-white/10">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary">
              ¿Qué es el 1RM y cómo usar esta calculadora en tu rutina de gimnasio?
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              El <strong>1RM (One Repetition Maximum o Una Repetición Máxima)</strong> es la mayor cantidad de peso que puedes desplazar una única vez con técnica estricta en ejercicios básicos como el <strong>press de banca, la sentadilla libre, el peso muerto o el press militar</strong>. Conocer tu 1RM te permite dejar de entrenar «a ojo» y aplicar el principio de <strong>sobrecarga progresiva</strong> con precisión matemática.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black">
                1
              </div>
              <h3 className="font-bold text-text-primary">Hipertrofia (70% - 85% 1RM)</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Si tu objetivo es <strong>ganar masa muscular</strong>, trabaja con pesos que representen entre el 70% y el 85% de tu 1RM, realizando de 6 a 12 repeticiones quedando a 1 o 2 repeticiones del fallo (RIR 1-2).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black">
                2
              </div>
              <h3 className="font-bold text-text-primary">Fuerza Máxima (85% - 95% 1RM)</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Para mejorar tus marcas en <strong>powerlifting o rutinas 5x5</strong>, utiliza cargas de entre el 85% y el 95% de tu 1RM en rangos de 1 a 5 repeticiones con descansos de 3 a 5 minutos entre series.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-black">
                3
              </div>
              <h3 className="font-bold text-text-primary">Fórmulas Epley y Brzycki</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Intentar un 1RM real cada semana fatiga el sistema nervioso central y aumenta el riesgo articular. Estimar tu 1RM con una serie de 5 a 8 repeticiones mediante <strong>Epley (`Peso × (1 + Reps/30)`)</strong> es seguro y fiable.
              </p>
            </div>
          </div>

          {/* FAQ SECTION */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xl sm:text-2xl font-black text-text-primary">
              Preguntas Frecuentes sobre el 1RM en el Gimnasio
            </h2>
            <div className="space-y-3">
              <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <h3 className="font-bold text-sm sm:text-base text-text-primary mb-1">
                  ¿Cada cuánto tiempo debo recalcular mi 1RM?
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Al usar una aplicación de seguimiento de gimnasio como <strong>Pro Fitness Glass</strong>, tu 1RM teórico se actualiza en cada sesión. Si entrenas con sobrecarga progresiva, verás subir tu 1RM estimado cada 2 a 4 semanas sin necesidad de hacer un test máximo peligroso.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <h3 className="font-bold text-sm sm:text-base text-text-primary mb-1">
                  ¿Sirve el cálculo de 1RM para ejercicios con mancuernas o poleas?
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Sí, aunque es especialmente útil en ejercicios multiarticulares (press banca, sentadilla, peso muerto, dominadas y remos), conocer tu RM estimado en mancuernas te ayuda a saber si estás progresando en volumen e intensidad mes a mes.
                </p>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
