/* frontend/src/utils/trainerLogic.js */

export const analyzeRoutine = (exercises = [], answers = {}) => {
  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) return null;

  const stats = {
    push: 0, pull: 0, legs: 0, core: 0, totalSets: 0, muscles: {}
  };

  // 1. Recopilar Datos
  exercises.forEach(ex => {
    // Calculamos series
    let sets = (ex.sets && Array.isArray(ex.sets)) ? (ex.sets.length || 3) : (typeof ex.sets === 'number' ? ex.sets : 3);
    stats.totalSets += sets;
    
    // Identificamos músculo
    let muscle = ex.muscle_group || ex.target || 'unknown';
    if ((!muscle || muscle === 'other') && ex.name) muscle = inferMuscleFromName(ex.name);
    
    const muscleKey = muscle ? muscle.toLowerCase() : 'unknown';
    stats.muscles[muscleKey] = (stats.muscles[muscleKey] || 0) + sets;

    // Agrupamos por patrón
    const group = getGroupFromMuscle(muscleKey);
    if (group) stats[group] = (stats[group] || 0) + sets;
  });

  const suggestions = [];
  const questions = [];

  if (stats.totalSets > 0) {
    const pushRatio = stats.push / stats.totalSets;
    const pullRatio = stats.pull / stats.totalSets;
    const legsRatio = stats.legs / stats.totalSets;
    
    // Ratios específicos para Brazos
    const bicepsSets = stats.muscles['biceps'] || 0;
    const tricepsSets = stats.muscles['triceps'] || 0;
    const armRatio = (bicepsSets + tricepsSets) / stats.totalSets;

    // --- 2. DETECCIÓN DEL TIPO DE SESIÓN ---
    
    let sessionType = 'fullbody'; 

    // Orden de prioridad: Si es casi todo brazos, es "Día de Brazos" antes que Push/Pull
    if (armRatio > 0.65) sessionType = 'arms';
    else if (pushRatio > 0.7) sessionType = 'push';
    else if (pullRatio > 0.7) sessionType = 'pull';
    else if (legsRatio > 0.7) sessionType = 'legs';
    else if ((stats.push + stats.pull) / stats.totalSets > 0.85) sessionType = 'upper';

    // --- INTERACTIVIDAD Y SUGERENCIAS ---

    // CASO: Día de Brazos
    if (sessionType === 'arms') {
        suggestions.push({
            type: 'info',
            title: 'Día de Brazos',
            text: `¡Día de bombeo! Tienes ${bicepsSets} series de bíceps y ${tricepsSets} de tríceps. Es una sesión de especialización excelente.`
        });
        
        // Sugerencia extra si hay desequilibrio interno en el brazo
        if (bicepsSets > tricepsSets * 2) {
             suggestions.push({ type: 'tip', title: 'Equilibrio de Brazo', text: 'El tríceps da el volumen al brazo. Considera añadir algo más de trabajo para él.' });
        }
    }
    
    // CASO: Día de Empuje (Push)
    else if (sessionType === 'push') {
        let isPushFocus = answers.isPushFocus;
        if (isPushFocus === undefined) {
             // Si el sistema lo detectó claro (>70%), lo asumimos. Si es dudoso, preguntamos.
             isPushFocus = true; 
        }
        suggestions.push({ type: 'info', title: 'Enfoque: Empuje', text: 'Sesión de Pecho/Hombro/Tríceps. Recuerda compensar con tracción en la semana.' });
    }

    // CASO: Día de Tracción (Pull)
    else if (sessionType === 'pull') {
         suggestions.push({ type: 'info', title: 'Enfoque: Tracción', text: 'Sesión de Espalda/Bíceps. Ideal para la postura y la "V".' });
         
         // Si es día de tracción pero NO hay espalda (solo bíceps), avisamos
         const hasBack = stats.muscles['back'] || stats.muscles['espalda'] || stats.muscles['dorsal'] || stats.muscles['lats'];
         if (!hasBack && stats.totalSets > 4) {
             suggestions.push({ type: 'tip', title: '¿Solo Bíceps?', text: 'Es un día de tracción, pero no vemos trabajo de espalda. Si es intencionado, ¡adelante!' });
         }
    }

    // CASO: Pierna (Legs)
    else if (sessionType === 'legs') {
        suggestions.push({ type: 'info', title: 'Leg Day', text: 'El día más duro. ¡Asegúrate de descansar bien después!' });
    }

    // CASO: Full Body o Torso General (Upper)
    else {
        // Pregunta sobre Pierna si falta
        let isUpperDay = answers.isUpperDay;
        if (isUpperDay === undefined && stats.legs === 0 && stats.totalSets > 4) {
             questions.push({
                id: 'isUpperDay',
                text: 'No hay ejercicios de pierna. ¿Es una rutina solo de Torso?',
                options: [ { label: 'Sí, solo Torso', value: true }, { label: 'No, es Full Body', value: false } ]
            });
        } else if (isUpperDay === undefined && stats.legs > 0) {
            isUpperDay = false; // Tiene pierna, así que asumimos Full Body
        }

        const pendingIds = questions.map(q => q.id);

        // Lógica Torso vs Full Body
        if (isUpperDay) {
             suggestions.push({ type: 'info', title: 'Sesión de Torso', text: 'Buen trabajo general de tren superior.' });
             // Chequeo de equilibrio Empuje/Tracción en rutina de torso
             if (stats.push > stats.pull * 1.5) {
                 suggestions.push({ type: 'warning', title: 'Desequilibrio', text: 'Mucho más empuje que tracción. Cuida tus hombros añadiendo remos.' });
             }
        } else if (isUpperDay === false && !pendingIds.includes('isUpperDay')) {
             // Full Body
             const upperBody = stats.push + stats.pull;
             if (stats.legs < upperBody * 0.35) {
                suggestions.push({ type: 'warning', title: 'Falta Pierna', text: 'Para ser Full Body, el volumen de pierna se queda corto.' });
             }
        }
    }

    // Alerta de Volumen Alto General
    if (stats.totalSets > 28) {
      suggestions.push({ type: 'warning', title: 'Volumen Alto', text: `Detectamos ${stats.totalSets} series. Si la calidad baja, divide la sesión.` });
    }
  }

  return { stats, suggestions, questions };
};

export const checkStagnation = (history = []) => {
  if (!history || history.length < 3) return null;
  const recent = history.slice(0, 3);
  const weights = recent.map(session => {
    if (!session.sets || !Array.isArray(session.sets)) return 0;
    return Math.max(...session.sets.map(s => parseFloat(s.weight || 0)), 0);
  });
  if (weights.some(w => w === 0)) return null;
  const isStalled = weights[0] <= weights[1] && weights[1] <= weights[2];
  if (isStalled) {
    return {
      isStalled: true,
      title: 'Estancamiento Detectado',
      text: 'Llevas 3 sesiones sin subir cargas.',
      actions: ['Semana de descarga', 'Drop sets', 'Cambio de ejercicio']
    };
  }
  return null;
};

const inferMuscleFromName = (name) => {
  if (!name) return 'unknown';
  const n = name.toLowerCase();
  if (n.includes('biceps') || n.includes('bíceps') || n.includes('curl')) return 'biceps';
  if (n.includes('triceps') || n.includes('tríceps') || n.includes('francés') || n.includes('skull') || n.includes('copa') || n.includes('kickback') || n.includes('fondos') || n.includes('dippings')) return 'triceps';
  if (n.includes('pecho') || n.includes('chest') || n.includes('press') || n.includes('aperturas') || n.includes('fly') || n.includes('pec')) return 'chest';
  if (n.includes('espalda') || n.includes('back') || n.includes('remo') || n.includes('jalón') || n.includes('dominada') || n.includes('pull') || n.includes('row')) return 'back';
  if (n.includes('hombro') || n.includes('shoulder') || n.includes('militar') || n.includes('lateral') || n.includes('pájaro') || n.includes('front')) return 'shoulders';
  if (n.includes('pierna') || n.includes('leg') || n.includes('sentadilla') || n.includes('squat') || n.includes('prensa') || n.includes('lunge') || n.includes('zancada') || n.includes('extensión') || n.includes('curl femoral')) return 'legs';
  if (n.includes('glute') || n.includes('glúteo') || n.includes('hip')) return 'glutes';
  if (n.includes('abs') || n.includes('crunch') || n.includes('plancha') || n.includes('elevación')) return 'core';
  return 'other';
};

const getGroupFromMuscle = (muscle) => {
  if (!muscle || typeof muscle !== 'string') return null;
  const m = muscle.toLowerCase();
  if (['chest', 'pecho', 'pectoral', 'shoulders', 'hombros', 'deltoides', 'triceps', 'tríceps', 'push'].some(x => m.includes(x))) return 'push';
  if (['back', 'espalda', 'dorsal', 'lats', 'traps', 'trapecio', 'biceps', 'bíceps', 'pull', 'forearm', 'antebrazo'].some(x => m.includes(x))) return 'pull';
  if (['legs', 'pierna', 'quads', 'cuádriceps', 'cuadriceps', 'hamstrings', 'femoral', 'isquios', 'glutes', 'glúteo', 'gluteo', 'calves', 'gemelos', 'pantorrilla'].some(x => m.includes(x))) return 'legs';
  if (['abs', 'core', 'abdominales', 'lumbar'].some(x => m.includes(x))) return 'core';
  return null;
};