/* frontend/src/pages/PublicExercisesPage.jsx */
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Dumbbell,
  ChevronLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Utensils,
  Newspaper,
  Sparkles,
  ArrowRight,
  Flame,
  Trophy,
  Layers
} from 'lucide-react';
import useAppStore from '../store/useAppStore';

const MUSCLE_GROUPS = ['Todos', 'Pecho', 'Espalda', 'Pierna y Glúteo', 'Hombros', 'Brazos', 'Abdomen y Core'];

const PUBLIC_EXERCISES = [
  {
    id: 'press-banca-barra',
    name: 'Press de Banca Plano con Barra',
    muscleGroup: 'Pecho',
    secondaryMuscles: 'Tríceps braquial, Deltoides anterior',
    equipment: 'Barra olímpica y banco plano',
    difficulty: 'Intermedio',
    idealReps: '5 - 8 reps (Fuerza/Hipertrofia) | 8 - 12 reps (Hipertrofia)',
    restTime: '2.5 a 3.5 minutos',
    technique: [
      'Túmbate en el banco con los ojos justo debajo de la barra y realiza una retracción escapular (junta los omóplatos hacia atrás y hacia abajo).',
      'Apoya los pies firmemente en el suelo para generar estabilidad (Leg Drive) y mantén los glúteos siempre en contacto con el banco.',
      'Baja la barra de forma controlada (2 segundos) hacia la parte inferior del esternón con los codos a unos 45°-60° respecto al torso.',
      'Empuja la barra de forma explosiva hacia arriba y ligeramente hacia atrás hasta bloquear los codos sin perder la retracción escapular.'
    ],
    commonMistake: 'Abrir los codos a 90° en forma de "T", lo que sobrecarga el manguito rotador del hombro y reduce la activación pectoral.'
  },
  {
    id: 'press-inclinado-mancuernas',
    name: 'Press Inclinado con Mancuernas (30°)',
    muscleGroup: 'Pecho',
    secondaryMuscles: 'Deltoides anterior, Tríceps',
    equipment: 'Mancuernas y banco inclinado a 30°',
    difficulty: 'Principiante / Intermedio',
    idealReps: '8 - 12 repeticiones',
    restTime: '2 a 3 minutos',
    technique: [
      'Ajusta el respaldo del banco a 30° (dos puntos por encima de la horizontal) para enfatizar la porción clavicular (pecho superior) sin que el hombro domine.',
      'Baja las mancuernas con control permitiendo un estiramiento profundo del pectoral en la parte baja del recorrido.',
      'Empuja convergiendo ligeramente arriba sin chocar las mancuernas entre sí para mantener la tensión constante.'
    ],
    commonMistake: 'Colocar el banco demasiado vertical (45° o 60°), convirtiendo el ejercicio en un press de hombros.'
  },
  {
    id: 'sentadilla-libre-barra',
    name: 'Sentadilla Libre con Barra (Back Squat)',
    muscleGroup: 'Pierna y Glúteo',
    secondaryMuscles: 'Glúteo mayor, Aductores, Erectores espinales, Core',
    equipment: 'Barra olímpica y Rack / Jaula de potencia',
    difficulty: 'Intermedio / Avanzado',
    idealReps: '5 - 8 reps (Fuerza) | 8 - 10 reps (Hipertrofia)',
    restTime: '3 a 4 minutos',
    technique: [
      'Apoya la barra sobre los trapecios (barra alta) o sobre el deltoides posterior (barra baja) sujetándola con firmeza.',
      'Toma aire profundamente hacia el abdomen (maniobra de Valsalva) para compactar el core a 360° antes de iniciar el descenso.',
      'Flexiona rodillas y cadera simultáneamente manteniendo toda la planta del pie anclada al suelo hasta romper el paralelo.',
      'Empuja el suelo con fuerza manteniendo las rodillas alineadas con la punta de los pies.'
    ],
    commonMistake: 'Dejar que las rodillas colapsen hacia adentro (valgo de rodilla) o despegar los talones del suelo al bajar.'
  },
  {
    id: 'sentadilla-bulgara',
    name: 'Sentadilla Búlgara con Mancuernas',
    muscleGroup: 'Pierna y Glúteo',
    secondaryMuscles: 'Cuádriceps, Glúteo mayor y medio, Isquiosurales',
    equipment: 'Mancuernas y banco o soporte trasero',
    difficulty: 'Intermedio',
    idealReps: '8 - 12 repeticiones por pierna',
    restTime: '90 segundos entre cada pierna',
    technique: [
      'Apoya el empeine del pie trasero sobre un banco a la altura de tu rodilla y da un paso adelante.',
      'Para enfatizar cuádriceps: mantén el torso erguido y deja que la rodilla avance. Para enfatizar glúteo: inclina el tronco 20° hacia adelante y baja hacia atrás.',
      'Desciende hasta que la rodilla trasera quede a pocos centímetros del suelo y sube empujando con el pie delantero.'
    ],
    commonMistake: 'Empujar con la pierna trasera apoyada en el banco en lugar de concentrar el 90% de la carga en la pierna delantera.'
  },
  {
    id: 'peso-muerto-rumano',
    name: 'Peso Muerto Rumano con Barra o Mancuernas (RDL)',
    muscleGroup: 'Pierna y Glúteo',
    secondaryMuscles: 'Isquiosurales, Glúteo mayor, Erectores espinales, Dorsal',
    equipment: 'Barra olímpica o mancuernas pesadas',
    difficulty: 'Intermedio',
    idealReps: '6 - 10 repeticiones',
    restTime: '2.5 a 3 minutos',
    technique: [
      'Inicia de pie con las rodillas ligeramente desbloqueadas (15° de flexión fija durante todo el movimiento).',
      'Lleva la cadera hacia atrás como si quisieras cerrar una puerta con los glúteos mientras la barra desliza pegada a tus muslos y espinillas.',
      'Detén la bajada justo cuando tu cadera deje de ir hacia atrás (normalmente a mitad de la espinilla) manteniendo la espalda neutra.',
      'Extiende la cadera contrayendo glúteos e isquiosurales sin hiperextender la zona lumbar arriba.'
    ],
    commonMistake: 'Bajar la barra hasta el suelo doblando la columna lumbar en lugar de detenerse donde termina el rango de cadera.'
  },
  {
    id: 'hip-thrust-barra',
    name: 'Hip Thrust con Barra (Empuje de Cadera)',
    muscleGroup: 'Pierna y Glúteo',
    secondaryMuscles: 'Glúteo mayor, Isquiosurales, Cuádriceps',
    equipment: 'Barra olímpica, almohadilla y banco estable',
    difficulty: 'Principiante / Intermedio',
    idealReps: '8 - 12 repeticiones',
    restTime: '2 a 3 minutos',
    technique: [
      'Apoya la parte inferior de tus escápulas en el borde del banco y coloca la barra acolchada sobre el pliegue de la cadera.',
      'Coloca los pies a la anchura de los hombros de modo que al subir las tibias queden totalmente verticales (ángulo de 90° en la rodilla).',
      'Sube extendiendo la cadera con la mirada al frente (mentón recogido) y realiza una pausa de 1 segundo arriba apretando el glúteo al máximo.'
    ],
    commonMistake: 'Arquear la espalda baja mirando al techo en vez de mantener las costillas bajas y realizar retroversión pélvica arriba.'
  },
  {
    id: 'dominadas-pronas-lastradas',
    name: 'Dominadas Pronas y Jalón al Pecho',
    muscleGroup: 'Espalda',
    secondaryMuscles: 'Dorsal ancho, Redondo mayor, Bíceps, Trapecio inferior',
    equipment: 'Barra de dominadas o Polea alta',
    difficulty: 'Intermedio',
    idealReps: '6 - 10 reps (Dominadas) | 8 - 12 reps (Jalón)',
    restTime: '2 a 3 minutos',
    technique: [
      'Sujeta la barra con un agarre ligeramente superior al ancho de tus hombros.',
      'Inicia el movimiento deprimiendo las escápulas (alejando los hombros de las orejas) antes de flexionar los codos.',
      'Tira llevando los codos hacia tus bolsillos traseros hasta que la barra pase la barbilla o toque la parte alta del pecho.'
    ],
    commonMistake: 'Tirar exclusivamente con los bíceps encogiendo los hombros hacia las orejas y balanceando las piernas.'
  },
  {
    id: 'remo-con-barra',
    name: 'Remo con Barra (Pendlay / 45°) y Remo en Polea',
    muscleGroup: 'Espalda',
    secondaryMuscles: 'Dorsal ancho, Romboides, Trapecio medio, Deltoides posterior',
    equipment: 'Barra olímpica o Polea baja (Gironda)',
    difficulty: 'Intermedio',
    idealReps: '6 - 10 reps (Barra) | 10 - 12 reps (Polea)',
    restTime: '2 a 3 minutos',
    technique: [
      'Inclina el torso entre 45° y 75° manteniendo la columna neutra y el abdomen firme.',
      'Tracciona la barra hacia la boca del estómago o el ombligo dirigiendo los codos hacia atrás.',
      'Controla la fase excéntrica dejando que las escápulas se abran ligeramente en el estiramiento final.'
    ],
    commonMistake: 'Usar demasiado impulso lumbar levantando el torso en cada repetición para mover más peso del que controla la espalda.'
  },
  {
    id: 'press-militar-hombros',
    name: 'Press Militar con Barra o Mancuernas',
    muscleGroup: 'Hombros',
    secondaryMuscles: 'Deltoides anterior y lateral, Tríceps, Trapecio superior',
    equipment: 'Barra olímpica o Mancuernas',
    difficulty: 'Intermedio',
    idealReps: '6 - 10 repeticiones',
    restTime: '2 a 3 minutos',
    technique: [
      'De pie o sentado con respaldo, coloca los codos ligeramente adelantados respecto al torso (plano escapular, unos 30°).',
      'Aprieta glúteos y abdomen para evitar arquear en exceso la espalda baja.',
      'Empuja verticalmente pasando cerca del rostro y mete ligeramente la cabeza al bloquear arriba.'
    ],
    commonMistake: 'Abrir los codos totalmente hacia los lados o impulsar la barra con las piernas (Push Press) cuando buscas hipertrofia estricta.'
  },
  {
    id: 'elevaciones-laterales-polea-mancuerna',
    name: 'Elevaciones Laterales con Mancuernas o Polea',
    muscleGroup: 'Hombros',
    secondaryMuscles: 'Deltoides lateral (haz medio)',
    equipment: 'Mancuernas o Polea baja a la altura de la muñeca',
    difficulty: 'Principiante',
    idealReps: '12 - 16 repeticiones controladas',
    restTime: '90 segundos a 2 minutos',
    technique: [
      'Mantén una ligerísima flexión de codos fija y eleva los brazos en el plano escapular (15°-20° hacia adelante, no totalmente rectos hacia los lados).',
      'Piensa en lanzar las manos lejos hacia las paredes laterales, no hacia el techo, para evitar que el trapecio robe el trabajo.',
      'Sube hasta la altura de los hombros y baja en 2 segundos manteniendo la tensión.'
    ],
    commonMistake: 'Elegir mancuernas demasiado pesadas y balancear la cadera en cada repetición.'
  },
  {
    id: 'curl-biceps-inclinado-barra-z',
    name: 'Curl de Bíceps en Banco Inclinado y Barra Z',
    muscleGroup: 'Brazos',
    secondaryMuscles: 'Bíceps braquial (cabeza larga y corta), Braquial',
    equipment: 'Mancuernas en banco a 45°-60° o Barra Z',
    difficulty: 'Principiante',
    idealReps: '8 - 12 repeticiones',
    restTime: '90 segundos a 2 minutos',
    technique: [
      'Mantén el hombro fijo y el codo pegado al costado (o ligeramente detrás del torso en banco inclinado para máximo estiramiento de la cabeza larga).',
      'Flexiona el codo supinando la muñeca (girando el meñique hacia adentro) y baja estirando el brazo por completo en cada repetición.'
    ],
    commonMistake: 'Adelantar los codos al subir el peso o acortar la mitad inferior del recorrido.'
  },
  {
    id: 'extension-triceps-polea-katana',
    name: 'Extensión de Tríceps en Polea Alta y Trasnuca (Overhead)',
    muscleGroup: 'Brazos',
    secondaryMuscles: 'Tríceps braquial (cabeza lateral, medial y larga)',
    equipment: 'Polea con cuerda o barra recta',
    difficulty: 'Principiante',
    idealReps: '10 - 15 repeticiones',
    restTime: '90 segundos a 2 minutos',
    technique: [
      'Para trabajar las 3 cabezas del tríceps, combina un ejercicio con los codos pegados al cuerpo (extensión en polea alta) y otro con el hombro flexionado por encima de la cabeza (extensión trasnuca para estirar la cabeza larga).',
      'Mantén los codos fijos como bisagras: solo debe moverse el antebrazo hasta bloquear el codo por completo.'
    ],
    commonMistake: 'Mover los hombros y echarse encima de la cuerda usando el pecho y el abdomen.'
  },
  {
    id: 'crunch-polea-rueda-abdominal',
    name: 'Crunch Abdominal en Polea Alta y Rueda Abdominal',
    muscleGroup: 'Abdomen y Core',
    secondaryMuscles: 'Recto abdominal, Oblicuos, Transverso',
    equipment: 'Polea alta con cuerda o Ab Wheel',
    difficulty: 'Intermedio',
    idealReps: '10 - 15 repeticiones con sobrecarga',
    restTime: '90 segundos',
    technique: [
      'El recto abdominal se hipertrofia igual que cualquier otro músculo: necesita sobrecarga progresiva en flexión espinal.',
      'De rodillas frente a la polea alta, mantén la cadera fija y enrolla tu columna llevando el esternón hacia la pelvis mientras expulsas todo el aire.'
    ],
    commonMistake: 'Flexionar la cadera sentándose sobre los talones con la espalda recta en vez de curvar el abdomen.'
  }
];

const POPULAR_SPLITS = [
  {
    name: 'Rutina Push Pull Legs (Empuje - Tirón - Pierna)',
    days: '3 o 6 días / semana',
    goal: 'Hipertrofia y Fuerza Óptima',
    desc: 'Divide el cuerpo según patrones biomecánicos: Día 1 Empuje (Pecho, Hombro, Tríceps), Día 2 Tirón (Espalda, Bíceps, Deltoides posterior) y Día 3 Pierna completa y Glúteo.'
  },
  {
    name: 'Rutina Torso - Pierna (Upper / Lower)',
    days: '4 días / semana',
    goal: 'Máxima Recuperación y Frecuencia 2',
    desc: 'Entrena cada grupo muscular 2 veces por semana con 3 días completos de descanso. Ideal para progresar en cargas cada semana sin acumular fatiga excesiva.'
  },
  {
    name: 'Rutina Full Body Científica',
    days: '3 días / semana (Lunes - Miércoles - Viernes)',
    goal: 'Eficiencia, Principiantes e Intermedios',
    desc: 'Estimula todo el cuerpo en cada sesión priorizando multiarticulares (Sentadilla, Press de Banca, Dominadas, Peso Muerto Rumano y Press Militar).'
  }
];

export default function PublicExercisesPage({ onBack }) {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(() => {
    return PUBLIC_EXERCISES.filter((ex) => {
      const matchesGroup = selectedMuscle === 'Todos' || ex.muscleGroup === selectedMuscle;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.secondaryMuscles.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [selectedMuscle, searchQuery]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Guía de Ejercicios de Gimnasio y Rutinas de Hipertrofia | Pro Fitness Glass',
        url: 'https://pro-fitness-glass.zeabur.app/ejercicios',
        description:
          'Enciclopedia gratuita de los mejores ejercicios de gimnasio por grupo muscular (Pecho, Espalda, Pierna, Glúteo, Hombros y Brazos) con técnica biomecánica, series óptimas y rutinas Push Pull Legs y Torso Pierna.',
        inLanguage: 'es-ES'
      },
      {
        '@type': 'ItemList',
        itemListElement: PUBLIC_EXERCISES.map((ex, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: ex.name,
          description: `${ex.muscleGroup}: ${ex.technique[0]}`
        }))
      }
    ]
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar"
      style={{
        WebkitOverflowScrolling: 'touch',
        paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 3rem)'
      }}
    >
      <Helmet>
        <title>Ejercicios de Gimnasio y Rutinas de Hipertrofia (Guía Técnica) | Pro Fitness Glass</title>
        <meta
          name="description"
          content="Aprende la técnica correcta de los mejores ejercicios de gimnasio para pecho, espalda, piernas, glúteos, hombros y brazos, junto con las mejores rutinas Push Pull Legs y Torso Pierna."
        />
        <meta
          name="keywords"
          content="ejercicios de gimnasio, mejores ejercicios pecho, ejercicios espalda gym, sentadilla bulgara tecnica, press de banca tecnica, rutina push pull legs, rutina torso pierna 4 dias, hipertrofia muscular"
        />
        <link rel="canonical" href="https://pro-fitness-glass.zeabur.app/ejercicios" />
        <meta property="og:title" content="Guía de Ejercicios de Gimnasio y Rutinas de Hipertrofia — Pro Fitness Glass" />
        <meta
          property="og:description"
          content="Domina la biomecánica de los mejores ejercicios de musculación, evita lesiones y descarga tus rutinas gratis en Pro Fitness Glass."
        />
        <meta property="og:url" content="https://pro-fitness-glass.zeabur.app/ejercicios" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => (onBack ? onBack() : navigate(isAuthenticated ? '/dashboard' : '/'))}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs sm:text-sm font-bold text-text-primary transition-all"
          >
            <ChevronLeft size={18} className="text-accent" />
            <span>{isAuthenticated ? 'Volver a la App' : 'Inicio'}</span>
          </button>

          <div className="flex items-center gap-2">
            <Link
              to="/calculadora-1rm"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-accent transition-colors border border-black/5 dark:border-white/10"
            >
              <Calculator size={15} className="text-accent" />
              <span className="hidden sm:inline">Calculadora 1RM</span>
            </Link>
            <Link
              to="/calculadora-calorias-macros"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-accent transition-colors border border-black/5 dark:border-white/10"
            >
              <Utensils size={15} className="text-emerald-400" />
              <span className="hidden sm:inline">Calculadora Macros</span>
            </Link>
            <Link
              to="/noticias"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-accent transition-colors border border-black/5 dark:border-white/10"
            >
              <Newspaper size={15} className="text-purple-400" />
              <span className="hidden sm:inline">Noticias</span>
            </Link>
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-contrast text-xs sm:text-sm font-black shadow-lg shadow-accent/25 hover:opacity-90 transition-all"
              >
                <span>Crear Mi Rutina Gratis</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-8 pb-16">
        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 ring-1 ring-accent/30 text-accent text-xs font-black uppercase tracking-widest mb-4">
            <Dumbbell size={14} />
            <span>Enciclopedia Biomecánica de Gimnasio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary leading-tight mb-4">
            Mejores Ejercicios de Gimnasio y{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-400 to-purple-400">
              Rutinas de Hipertrofia
            </span>
          </h1>
          <p className="text-text-secondary text-base sm:text-lg font-medium leading-relaxed">
            Domina la técnica exacta de los ejercicios multiarticulares y analíticos con mayor activación electromiográfica, evita errores lesivos y estructura tu rutina semanal.
          </p>
        </header>

        {/* Buscador y Filtros por Grupo Muscular */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 w-full md:w-auto">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedMuscle(group)}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedMuscle === group
                    ? 'bg-accent text-accent-contrast shadow-md shadow-accent/25'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary border border-black/5 dark:border-white/10'
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ejercicio o músculo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Grid de Ejercicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {filteredExercises.map((ex) => (
            <article
              key={ex.id}
              id={ex.id}
              className="p-6 sm:p-7 rounded-[28px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-xl flex flex-col justify-between gap-5 hover:border-accent/40 transition-all"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-black uppercase tracking-wider">
                    {ex.muscleGroup}
                  </span>
                  <span className="text-xs font-bold text-text-tertiary">{ex.equipment}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-text-primary mb-2">{ex.name}</h2>
                <p className="text-xs font-bold text-text-secondary mb-4">
                  <span className="text-text-tertiary">Sinergistas:</span> {ex.secondaryMuscles}
                </p>

                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 mb-5 text-xs">
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-text-tertiary">
                      Rango Óptimo
                    </span>
                    <span className="font-extrabold text-text-primary">{ex.idealReps}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-text-tertiary">
                      Descanso Recomendado
                    </span>
                    <span className="font-extrabold text-accent">{ex.restTime}</span>
                  </div>
                </div>

                <h3 className="text-xs font-black uppercase tracking-wider text-text-primary mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  Técnica Biomecánica Paso a Paso
                </h3>
                <ul className="space-y-2 text-sm text-text-secondary font-medium mb-5">
                  {ex.technique.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-accent font-black text-xs mt-1">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-black/5 dark:border-white/10 flex flex-col gap-3">
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-text-secondary leading-relaxed">
                  <strong className="text-red-400 inline-flex items-center gap-1 font-black uppercase tracking-wider mr-1">
                    <AlertTriangle size={13} /> Error a evitar:
                  </strong>
                  {ex.commonMistake}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    to="/calculadora-1rm"
                    className="text-xs font-black text-accent hover:underline inline-flex items-center gap-1"
                  >
                    <Calculator size={13} /> Calcular mi 1RM en este ejercicio
                  </Link>
                  <button
                    onClick={() => navigate(isAuthenticated ? '/routines' : '/register')}
                    className="text-xs font-black text-text-primary hover:text-accent inline-flex items-center gap-1 transition-colors"
                  >
                    Añadir a mi rutina <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Sección de las 3 Mejores Distribuciones de Rutinas Semanales */}
        <section className="mb-16">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 ring-1 ring-purple-500/30 text-purple-400 text-xs font-black uppercase tracking-widest mb-3">
              <Layers size={14} />
              <span>Estructuras de Entrenamiento Semanal</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-text-primary mb-3">
              ¿Qué Rutina de Gimnasio Elegir según tus Días Disponibles?
            </h2>
            <p className="text-sm sm:text-base text-text-secondary font-medium">
              La evidencia científica demuestra que alcanzar una <strong>frecuencia 2</strong> (estimular cada músculo 2 veces por semana) entre <strong>10 y 20 series efectivas semanales</strong> maximiza la síntesis proteica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {POPULAR_SPLITS.map((split) => (
              <div
                key={split.name}
                className="p-6 rounded-[28px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 text-xs font-black mb-3">
                    {split.days}
                  </span>
                  <h3 className="text-xl font-black text-text-primary mb-2">{split.name}</h3>
                  <p className="text-xs font-bold text-accent mb-3">{split.goal}</p>
                  <p className="text-sm text-text-secondary font-medium leading-relaxed mb-6">{split.desc}</p>
                </div>
                <button
                  onClick={() => navigate(isAuthenticated ? '/routines' : '/register')}
                  className="w-full py-3 px-4 rounded-2xl bg-accent/15 hover:bg-accent text-accent hover:text-accent-contrast font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <span>Configurar esta Rutina en la App</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <div className="p-8 sm:p-10 rounded-[32px] bg-gradient-to-br from-accent/20 via-purple-500/15 to-blue-500/15 border border-accent/30 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-3">
            Apunta tus Pesos, Series y Récords con Sobrecarga Progresiva Automática
          </h2>
          <p className="text-text-secondary font-medium max-w-2xl mx-auto mb-6">
            Accede al catálogo completo con más de 300 ejercicios en vídeo, temporizador inteligente de descanso, calculadora de 1RM integrada y mapa térmico muscular gratis en Pro Fitness Glass.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate(isAuthenticated ? '/routines' : '/register')}
              className="px-8 py-4 rounded-2xl bg-accent text-accent-contrast font-black text-base shadow-xl shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <Sparkles size={18} />
              <span>{isAuthenticated ? 'Ir a Mis Rutinas' : 'Empezar Gratis en Pro Fitness Glass'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
