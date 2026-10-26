/* frontend/src/pages/MacroCalculatorPage.jsx */
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Utensils,
  ChevronLeft,
  Flame,
  Droplets,
  Sparkles,
  ArrowRight,
  Calculator,
  Dumbbell,
  Newspaper,
  Scale,
  Zap
} from 'lucide-react';
import useAppStore from '../store/useAppStore';

const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentario (Trabajo de oficina, sin ejercicio)', short: 'Sedentario' },
  { value: 1.375, label: 'Ligero (Entrenamiento de gimnasio 1 - 2 días/semana)', short: '1-2 días Gym' },
  { value: 1.55, label: 'Moderado (Gimnasio 3 - 5 días/semana + activo)', short: '3-5 días Gym' },
  { value: 1.725, label: 'Intenso (Gimnasio 5 - 6 días/semana de alta intensidad)', short: '5-6 días Gym' },
  { value: 1.9, label: 'Atleta de Élite (Entreno diario + trabajo físico)', short: 'Atleta' }
];

const GOALS = [
  {
    id: 'cut',
    title: 'Perder Grasa (Definición)',
    desc: 'Déficit calórico inteligente (-450 kcal) protegiendo tu masa muscular',
    calDelta: -450,
    proteinPerKg: 2.1,
    fatPerKg: 0.85,
    badge: 'Déficit Calórico'
  },
  {
    id: 'recomp',
    title: 'Recomposición / Mantenimiento',
    desc: 'Normocalórica para perder grasa y ganar músculo simultáneamente',
    calDelta: 0,
    proteinPerKg: 2.0,
    fatPerKg: 0.9,
    badge: 'Mantenimiento'
  },
  {
    id: 'bulk',
    title: 'Ganar Músculo (Volumen Limpio)',
    desc: 'Superávit controlado (+300 kcal) para maximizar la hipertrofia sin ganar grasa excesiva',
    calDelta: 300,
    proteinPerKg: 1.8,
    fatPerKg: 0.95,
    badge: 'Superávit'
  }
];

export default function MacroCalculatorPage({ onBack }) {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(26);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(176);
  const [activity, setActivity] = useState(1.55);
  const [goalId, setGoalId] = useState('cut');

  const calc = useMemo(() => {
    const w = Math.max(35, Math.min(250, parseFloat(weight) || 75));
    const h = Math.max(120, Math.min(230, parseFloat(height) || 175));
    const a = Math.max(14, Math.min(95, parseInt(age, 10) || 25));
    const act = parseFloat(activity) || 1.55;
    const selectedGoal = GOALS.find((g) => g.id === goalId) || GOALS[0];

    // Fórmula Mifflin-St Jeor
    const bmr = Math.round(10 * w + 6.25 * h - 5 * a + (gender === 'male' ? 5 : -161));
    const tdee = Math.round(bmr * act);
    const targetCalories = Math.max(1200, tdee + selectedGoal.calDelta);

    const proteinG = Math.round(w * selectedGoal.proteinPerKg);
    const proteinKcal = proteinG * 4;

    const fatG = Math.round(w * selectedGoal.fatPerKg);
    const fatKcal = fatG * 9;

    const remainingKcal = Math.max(200, targetCalories - proteinKcal - fatKcal);
    const carbsG = Math.round(remainingKcal / 4);

    const waterMl = Math.round(w * 38);
    const creatineG = Math.round(w * 0.08 * 10) / 10;

    return {
      bmr,
      tdee,
      targetCalories,
      proteinG,
      fatG,
      carbsG,
      waterLiters: (waterMl / 1000).toFixed(1),
      creatineG: Math.max(3, Math.min(10, creatineG)),
      selectedGoal
    };
  }, [gender, age, weight, height, activity, goalId]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        'name': 'Calculadora de Calorías, Macros y Déficit Calórico — Pro Fitness Glass',
        'url': 'https://pro-fitness-glass.zeabur.app/calculadora-calorias-macros',
        'applicationCategory': 'HealthApplication',
        'operatingSystem': 'All',
        'description': 'Calculadora científica gratuita de calorías diarias, macronutrientes (proteínas, carbohidratos y grasas), tasa metabólica basal (TMB), gasto energético (TDEE), agua y creatina para gimnasio.',
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
            'name': '¿Cómo calcular el déficit calórico para perder grasa sin perder músculo?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Para perder grasa preservando la masa muscular, resta entre 350 y 500 kcal a tu gasto energético diario total (TDEE), mantén una ingesta alta de proteína (entre 1.8 y 2.2 gramos por kilo de peso corporal) y realiza entrenamiento de fuerza en el gimnasio.'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Cuántos gramos de proteína al día necesito para ganar masa muscular?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'La evidencia científica actual recomienda consumir entre 1.6 y 2.2 gramos de proteína por cada kilogramo de peso corporal al día para maximizar la síntesis proteica muscular y la hipertrofia.'
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
        <title>Calculadora de Calorías y Macros Gimnasio Gratis | Déficit Calórico y Volumen</title>
        <meta
          name="description"
          content="Calcula tus calorías diarias, proteínas, carbohidratos y grasas gratis con la fórmula Mifflin-St Jeor. Ideal para déficit calórico, definición o ganar masa muscular en el gimnasio."
        />
        <link rel="canonical" href="https://pro-fitness-glass.zeabur.app/calculadora-calorias-macros" />
        <meta property="og:title" content="Calculadora de Calorías, Macros y Déficit Calórico — Pro Fitness Glass" />
        <meta
          property="og:description"
          content="Obtén tus gramos exactos de proteína, hidratos, grasas, agua y creatina según tu peso y entrenamientos en el gimnasio."
        />
        <meta property="og:url" content="https://pro-fitness-glass.zeabur.app/calculadora-calorias-macros" />
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
              to="/calculadora-1rm"
              className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-text-secondary hover:text-accent transition-colors"
            >
              Calc. 1RM
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
            <Utensils size={14} />
            <span>Nutrición Deportiva Basada en Ciencia</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Calculadora de <span className="text-accent">Calorías, Macros</span> y Déficit Calórico
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary leading-relaxed">
            Calcula tu gasto energético real (TDEE) y obtén tus gramos exactos de <strong>proteína, carbohidratos y grasas</strong> para perder grasa o ganar masa muscular en el gimnasio.
          </p>
        </section>

        {/* INTERACTIVE CALCULATOR GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: USER DATA INPUTS */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-5">
            {/* GENDER */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2">
                1. Sexo Biológico
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer border ${
                    gender === 'male'
                      ? 'bg-accent text-accent-contrast border-accent shadow-md shadow-accent/20'
                      : 'bg-bg-primary text-text-secondary border-black/10 dark:border-white/10'
                  }`}
                >
                  Hombre
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer border ${
                    gender === 'female'
                      ? 'bg-accent text-accent-contrast border-accent shadow-md shadow-accent/20'
                      : 'bg-bg-primary text-text-secondary border-black/10 dark:border-white/10'
                  }`}
                >
                  Mujer
                </button>
              </div>
            </div>

            {/* AGE, WEIGHT, HEIGHT */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-text-secondary mb-1.5">
                  Edad (años)
                </label>
                <input
                  type="number"
                  min="14"
                  max="95"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-3 rounded-2xl bg-bg-primary border border-black/10 dark:border-white/10 font-black text-base text-center text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-text-secondary mb-1.5">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  min="35"
                  max="250"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-3 rounded-2xl bg-bg-primary border border-black/10 dark:border-white/10 font-black text-base text-center text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-text-secondary mb-1.5">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  min="120"
                  max="230"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-3 rounded-2xl bg-bg-primary border border-black/10 dark:border-white/10 font-black text-base text-center text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* ACTIVITY */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2">
                2. Nivel de Entrenamiento Semanal
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-bg-primary border border-black/10 dark:border-white/10 font-bold text-xs sm:text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {ACTIVITY_LEVELS.map((act) => (
                  <option key={act.value} value={act.value}>
                    {act.label}
                  </option>
                ))}
              </select>
            </div>

            {/* GOAL */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2">
                3. Tu Objetivo Físico
              </label>
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoalId(g.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      goalId === g.id
                        ? 'bg-accent/15 border-accent shadow-xs'
                        : 'bg-bg-primary border-black/10 dark:border-white/10 hover:border-accent/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-text-primary">{g.title}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                        {g.badge}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{g.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: RESULTS */}
          <div className="lg:col-span-7 space-y-6">
            {/* MAIN CALORIE TARGET */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-accent/20 via-accent/5 to-transparent border border-accent/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-accent">
                    Objetivo Diario Recomendado
                  </span>
                  <div className="text-5xl sm:text-6xl font-black tracking-tight text-text-primary mt-1">
                    {calc.targetCalories.toLocaleString()} <span className="text-2xl sm:text-3xl text-accent">kcal</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{calc.selectedGoal.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-bg-primary/70 backdrop-blur-md p-3.5 rounded-2xl border border-black/5 dark:border-white/10 text-center">
                  <div>
                    <span className="block text-[10px] font-bold text-text-tertiary uppercase">Metabolismo Basal</span>
                    <span className="text-sm sm:text-base font-black text-text-primary">{calc.bmr} kcal</span>
                  </div>
                  <div className="border-l border-black/10 dark:border-white/10 pl-3">
                    <span className="block text-[10px] font-bold text-text-tertiary uppercase">Mantenimiento (TDEE)</span>
                    <span className="text-sm sm:text-base font-black text-text-primary">{calc.tdee} kcal</span>
                  </div>
                </div>
              </div>

              {/* MACROS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-black/10 dark:border-white/10">
                <div className="p-4 rounded-2xl bg-bg-primary/80 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-500">Proteínas</span>
                    <span className="text-[11px] font-bold text-text-tertiary">{calc.proteinG * 4} kcal</span>
                  </div>
                  <p className="text-3xl font-black text-text-primary mt-1">{calc.proteinG} g</p>
                  <p className="text-[11px] text-text-secondary mt-1">Construcción y retención muscular</p>
                </div>

                <div className="p-4 rounded-2xl bg-bg-primary/80 border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-blue-500">Carbohidratos</span>
                    <span className="text-[11px] font-bold text-text-tertiary">{calc.carbsG * 4} kcal</span>
                  </div>
                  <p className="text-3xl font-black text-text-primary mt-1">{calc.carbsG} g</p>
                  <p className="text-[11px] text-text-secondary mt-1">Energía y glucógeno para entrenar</p>
                </div>

                <div className="p-4 rounded-2xl bg-bg-primary/80 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-500">Grasas Saludables</span>
                    <span className="text-[11px] font-bold text-text-tertiary">{calc.fatG * 9} kcal</span>
                  </div>
                  <p className="text-3xl font-black text-text-primary mt-1">{calc.fatG} g</p>
                  <p className="text-[11px] text-text-secondary mt-1">Entorno hormonal y testosterona</p>
                </div>
              </div>

              {/* HYDRATION & CREATINE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                <div className="p-3.5 rounded-2xl bg-bg-primary/60 border border-black/5 dark:border-white/10 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-500">
                    <Droplets size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-text-tertiary uppercase block">Agua Diaria Mínima</span>
                    <span className="text-lg font-black text-text-primary">{calc.waterLiters} Litros / día</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-bg-primary/60 border border-black/5 dark:border-white/10 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-500">
                    <Zap size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-text-tertiary uppercase block">Creatina Monohidrato</span>
                    <span className="text-lg font-black text-text-primary">{calc.creatineG} g / día (0.08g/kg)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CONVERSION CARD */}
            <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-accent font-black text-xs uppercase tracking-wider">
                <Sparkles size={15} />
                <span>Registra tus macros en 5 segundos con IA</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-text-primary">
                Lleva el control de estas {calc.targetCalories} kcal gratis en Pro Fitness Glass
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                En lugar de pesar cada ingrediente y buscar en tablas interminables, describe tu plato con voz o texto a nuestra <strong>Inteligencia Artificial</strong> o escanea el <strong>código de barras</strong> del producto.
              </p>
              <button
                onClick={() => navigate(isAuthenticated ? '/nutrition' : '/register')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-accent text-accent-contrast font-black text-sm shadow-lg shadow-accent/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span>Empezar Mi Diario Nutricional Gratis</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* SEO EDUCATIONAL CONTENT */}
        <article className="space-y-8 max-w-4xl mx-auto pt-6 border-t border-black/10 dark:border-white/10">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary">
              Cómo calcular tus calorías y macronutrientes para el gimnasio
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Nuestra calculadora utiliza la ecuación científica de <strong>Mifflin-St Jeor</strong>, demostrada en estudios clínicos como la más exacta para estimar la <strong>Tasa Metabólica Basal (TMB)</strong> en personas que entrenan fuerza e hipertrofia. Al multiplicarla por tu factor de actividad semanal obtenemos tu <strong>Gasto Energético Diario Total (TDEE)</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
              <h3 className="font-bold text-text-primary text-base">1. Proteína: Tu Seguro Muscular</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                En etapa de <strong>definición o déficit calórico</strong>, elevar la proteína a <strong>2.0 - 2.2 g/kg</strong> evita el catabolismo muscular y aumenta la saciedad. En volumen, <strong>1.8 g/kg</strong> es suficiente para maximizar la síntesis proteica.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
              <h3 className="font-bold text-text-primary text-base">2. Grasas y Entorno Hormonal</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Nunca bajes de <strong>0.8 g de grasa por kilo de peso</strong>. Los lípidos saludables (aguacate, AOVE, huevos, frutos secos, omega 3) son indispensables para la producción natural de testosterona y estrógenos.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
              <h3 className="font-bold text-text-primary text-base">3. Carbohidratos para Rendir</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                El resto de tus calorías se asigna a los hidratos de carbono, el combustible principal para recargar el <strong>glucógeno muscular</strong> y levantar más peso en tus entrenamientos de gimnasio.
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
