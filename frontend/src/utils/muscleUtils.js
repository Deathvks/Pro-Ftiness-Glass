/* frontend/src/utils/muscleUtils.js */
export const DB_TO_HEATMAP_MAP = {
    // Torso - Pecho
    'chest': ['chest'],
    'pectorals': ['chest'],
    'pectoralis major': ['chest'],
    'pectoral mayor': ['chest'],
    'pectoral': ['chest'],
    'pecho': ['chest'],
    'serratus anterior': ['chest', 'obliques'],
    'serrato anterior': ['chest', 'obliques'],

    // Torso - Espalda
    'back': ['upper-back', 'lower-back'],
    'espalda': ['upper-back', 'lower-back'],
    'lats': ['upper-back'],
    'latissimus dorsi': ['upper-back'],
    'dorsales': ['upper-back'],
    'dorsal ancho': ['upper-back'],
    'traps': ['trapezius'],
    'trapecios': ['trapezius'],
    'trapezius': ['trapezius'],
    'lower back': ['lower-back'],
    'lumbares': ['lower-back'],
    'upper back': ['upper-back'],

    // Torso - Hombros
    'shoulders': ['front-deltoids', 'back-deltoids'],
    'hombros': ['front-deltoids', 'back-deltoids'],
    'deltoids': ['front-deltoids', 'back-deltoids'],
    'deltoides': ['front-deltoids', 'back-deltoids'],
    'anterior deltoid': ['front-deltoids'],
    'deltoides anterior': ['front-deltoids'],

    // Torso - Abs
    'abs': ['abs'],
    'abdominales': ['abs'],
    'abdominals': ['abs'],
    'rectus abdominis': ['abs'],
    'recto abdominal': ['abs'],
    'obliques': ['obliques'],
    'oblicuos': ['obliques'],
    'obliquus externus abdominis': ['obliques'],
    'oblicuos externos': ['obliques'],
    'core': ['abs', 'obliques'],

    // Brazos
    'arms': ['biceps', 'triceps'],
    'brazos': ['biceps', 'triceps'],
    'biceps': ['biceps'],
    'bíceps': ['biceps'],
    'biceps brachii': ['biceps'],
    'biceps braquial': ['biceps'],
    'triceps': ['triceps'],
    'tríceps': ['triceps'],
    'triceps brachii': ['triceps'],
    'tríceps braquial': ['triceps'],
    'forearms': ['forearm'],
    'antebrazos': ['forearm'],
    'forearm': ['forearm'],
    'brachialis': ['biceps'],
    'braquial': ['biceps'],
    'antecubital space': ['biceps', 'forearm'],
    'fosa antecubital': ['biceps', 'forearm'],

    // Piernas
    'legs': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
    'piernas': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
    'quads': ['quadriceps'],
    'cuádriceps': ['quadriceps'],
    'quadriceps': ['quadriceps'],
    'quadriceps femoris': ['quadriceps'],
    'hamstrings': ['hamstring'],
    'isquios': ['hamstring'],
    'isquiotibiales': ['hamstring'],
    'femorales': ['hamstring'],
    'biceps femoris': ['hamstring'],
    'glutes': ['gluteal'],
    'glúteos': ['gluteal'],
    'gluteal': ['gluteal'],
    'gluteus maximus': ['gluteal'],
    'calves': ['calves'],
    'gemelos': ['calves'],
    'pantorrillas': ['calves'],
    'gastrocnemius': ['calves'],
    'soleus': ['calves'],
    'adductors': ['adductor'],
    'aductores': ['adductor'],
    'abductors': ['abductors'],
    'abductores': ['abductors'],

    // Otros
    'cardio': [],
    'full body': ['chest', 'upper-back', 'quadriceps', 'hamstring', 'abs', 'biceps', 'triceps', 'front-deltoids'],
    'cuerpo completo': ['chest', 'upper-back', 'quadriceps', 'hamstring', 'abs', 'biceps', 'triceps', 'front-deltoids'],
    'other': [],
    'otro': [],
    'neck': ['neck'],
    'cuello': ['neck'],
    'head': ['head'],
    'cabeza': ['head']
};

export const guessMuscleFromText = (text) => {
    if (!text) return [];
    const t = text.toLowerCase();

    // Pecho
    if (t.includes('bench') || t.includes('banca') || t.includes('chest') || t.includes('pecho') || t.includes('pectoral') || t.includes('push-up') || t.includes('flexiones') || t.includes('pec deck') || t.includes('fly') || t.includes('aperturas') || t.includes('dips') || t.includes('fondos')) return ['chest'];

    // Espalda
    if (t.includes('row') || t.includes('remo') || t.includes('pull') || t.includes('jalon') || t.includes('jalón') || t.includes('dominada') || t.includes('chin') || t.includes('lat') || t.includes('dorsal') || t.includes('back') || t.includes('espalda')) return ['upper-back', 'lower-back'];
    if (t.includes('deadlift') || t.includes('peso muerto') || t.includes('lumbar')) return ['lower-back', 'hamstring'];

    // Hombros
    if (t.includes('press') && (t.includes('shoulder') || t.includes('hombro') || t.includes('militar') || t.includes('military') || t.includes('overhead'))) return ['front-deltoids'];
    if (t.includes('raise') || t.includes('elevacion') || t.includes('lateral') || t.includes('pajaros') || t.includes('face pull')) return ['back-deltoids', 'front-deltoids'];

    // Antebrazos (Nuevo - Antes de "Brazos" para capturar variaciones específicas)
    if (t.includes('wrist') || t.includes('muñeca') || t.includes('forearm') || t.includes('antebrazo') || t.includes('reverse curl') || t.includes('curl invertido') || t.includes('brachioradialis') || t.includes('braquiorradial')) return ['forearm'];

    // Brazos
    if (t.includes('curl') || t.includes('bicep')) return ['biceps'];
    if (t.includes('extension') || t.includes('tricep') || t.includes('skull') || t.includes('copa') || t.includes('patada') || t.includes('pushdown')) return ['triceps'];

    // Piernas
    if (t.includes('squat') || t.includes('sentadilla') || t.includes('leg press') || t.includes('prensa') || t.includes('lunge') || t.includes('zancada') || t.includes('step') || t.includes('extension')) return ['quadriceps', 'gluteal'];
    if (t.includes('curl') && t.includes('leg')) return ['hamstring'];
    if (t.includes('femoral') || t.includes('isko') || t.includes('isquio')) return ['hamstring'];
    if (t.includes('glute') || t.includes('glúteo') || t.includes('hip') || t.includes('cadera') || t.includes('bridge') || t.includes('puente')) return ['gluteal'];
    if (t.includes('calf') || t.includes('gemelo') || t.includes('pantorrilla')) return ['calves'];

    // Abs
    if (t.includes('abs') || t.includes('crunch') || t.includes('plank') || t.includes('plancha') || t.includes('abdominal') || t.includes('sit-up') || t.includes('leg raise')) return ['abs'];

    return [];
};

export const SUGGESTED_EXERCISES = {
    'chest': 'Press de Banca',
    'upper-back': 'Dominadas',
    'lower-back': 'Hiperextensiones',
    'front-deltoids': 'Press Militar',
    'back-deltoids': 'Face Pulls',
    'abs': 'Plancha',
    'obliques': 'Russian Twist',
    'biceps': 'Curl con Barra',
    'triceps': 'Fondos',
    'forearm': 'Paseo de Granjero',
    'quadriceps': 'Sentadilla',
    'hamstring': 'Peso Muerto Rumano',
    'gluteal': 'Hip Thrust',
    'calves': 'Elevación de Talones',
    'trapezius': 'Encogimientos',
    'adductor': 'Plancha Copenhague',
    'abductors': 'Caminata Monstruo',
    'neck': 'Curl de Cuello',
    'head': null
};

// Actualizado para incluir claves faltantes como 'lats', 'serratus', etc.
export const MUSCLE_NAMES_ES = {
    'chest': 'Pecho',
    'upper-back': 'Espalda Alta',
    'lower-back': 'Lumbares',
    'front-deltoids': 'Hombros (Frontal)',
    'back-deltoids': 'Hombros (Posterior)',
    'abs': 'Abdominales',
    'obliques': 'Oblicuos',
    'biceps': 'Bíceps',
    'triceps': 'Tríceps',
    'forearm': 'Antebrazos',
    'quadriceps': 'Cuádriceps',
    'hamstring': 'Isquiotibiales',
    'gluteal': 'Glúteos',
    'calves': 'Gemelos',
    'trapezius': 'Trapecios',
    'adductor': 'Aductores',
    'abductors': 'Abductores',
    'neck': 'Cuello',
    'head': 'Cabeza',

    // Claves adicionales para coherencia completa
    'lats': 'Dorsales',
    'latissimus dorsi': 'Dorsal ancho',
    'serratus anterior': 'Serrato anterior',
    'soleus': 'Sóleo',
    'gastrocnemius': 'Gastrocnemio',
    'brachialis': 'Braquial',
    'biceps femoris': 'Femoral',
    'rectus abdominis': 'Abdominales',
    'pectoralis major': 'Pecho',
    'quadriceps femoris': 'Cuádriceps',
    'triceps brachii': 'Tríceps'
};