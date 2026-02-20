/* frontend/src/utils/muscleUtils.js */
export const DB_TO_HEATMAP_MAP = {
    // Torso - Pecho
    'chest': ['chest'],
    'pectorals': ['chest'],
    'pectoralis major': ['chest'],
    'pectoral mayor': ['chest'],
    'pectoral': ['chest'],
    'pecho': ['chest'],
    'pechos': ['chest'], 
    'serratus anterior': ['chest', 'obliques'],
    'serrato anterior': ['chest', 'obliques'],

    // Torso - Espalda
    'back': ['upper-back', 'lower-back'],
    'espalda': ['upper-back', 'lower-back'],
    'lats': ['upper-back'],
    'latissimus dorsi': ['upper-back'],
    'dorsales': ['upper-back'],
    'dorsal ancho': ['upper-back'],
    'dorsal': ['upper-back'],

    // Trapecios
    'traps': ['trapezius'],
    'trapecios': ['trapezius'],
    'trapecio': ['trapezius'], 
    'trapezius': ['trapezius'],

    'lower back': ['lower-back'],
    'lumbares': ['lower-back'],
    'lumbar': ['lower-back'], 
    'upper back': ['upper-back'],
    'espalda alta': ['upper-back'], 
    'espalda baja': ['lower-back'], 

    // Torso - Hombros
    'shoulders': ['front-deltoids', 'back-deltoids'],
    'shoulder': ['front-deltoids', 'back-deltoids'], 
    'hombros': ['front-deltoids', 'back-deltoids'],
    'hombro': ['front-deltoids', 'back-deltoids'], 
    'deltoids': ['front-deltoids', 'back-deltoids'],
    'deltoides': ['front-deltoids', 'back-deltoids'],
    'anterior deltoid': ['front-deltoids'],
    'deltoides anterior': ['front-deltoids'],
    'deltoides posterior': ['back-deltoids'], 
    'posterior deltoid': ['back-deltoids'], 

    // Torso - Abs y Oblicuos
    'abs': ['abs'],
    'abdominales': ['abs'],
    'abdominal': ['abs'], 
    'abdominals': ['abs'],
    'rectus abdominis': ['abs'],
    'recto abdominal': ['abs'],
    'obliques': ['obliques'],
    'oblicuos': ['obliques'],
    'oblicuo': ['obliques'], 
    'obliquus externus abdominis': ['obliques'],
    'oblicuos externos': ['obliques'],
    'core': ['abs'], 

    // Brazos
    'arms': ['biceps', 'triceps'],
    'brazos': ['biceps', 'triceps'],
    'brazo': ['biceps', 'triceps'], 
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
    'antebrazo': ['forearm'], 
    'forearm': ['forearm'],
    'brachialis': ['biceps'],
    'braquial': ['biceps'],
    'antecubital space': ['biceps', 'forearm'],
    'fosa antecubital': ['biceps', 'forearm'],

    // Piernas
    'legs': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
    'piernas': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
    'pierna': ['quadriceps', 'hamstring', 'gluteal', 'calves'], 
    'quads': ['quadriceps'],
    'cuádriceps': ['quadriceps'],
    'cuadriceps': ['quadriceps'], 
    'quadriceps': ['quadriceps'],
    'quadriceps femoris': ['quadriceps'],
    'hamstrings': ['hamstring'],
    'isquios': ['hamstring'],
    'isquiotibiales': ['hamstring'],
    'femorales': ['hamstring'],
    'femoral': ['hamstring'], 
    'biceps femoris': ['hamstring'],
    'glutes': ['gluteal'],
    'glúteos': ['gluteal'],
    'gluteos': ['gluteal'], 
    'gluteal': ['gluteal'],
    'gluteus maximus': ['gluteal'],
    'glúteo': ['gluteal'], 
    'gluteo': ['gluteal'], 
    'calves': ['calves'],
    'gemelos': ['calves'],
    'gemelo': ['calves'], 
    'pantorrillas': ['calves'],
    'pantorrilla': ['calves'], 
    'gastrocnemius': ['calves'],
    'soleus': ['calves'],
    'adductors': ['adductor'],
    'aductores': ['adductor'],
    'aductor': ['adductor'], 
    'abductors': ['abductors'],
    'abductores': ['abductors'],
    'abductor': ['abductors'], 

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
    
    // Normalizamos para quitar tildes y mayúsculas
    const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 1. EXCEPCIONES Y COMPUESTOS ESPECÍFICOS (Se comprueban antes)
    if (t.includes('face pull')) return ['back-deltoids', 'trapezius'];
    if (t.includes('upright row') || t.includes('remo al menton') || t.includes('remo al cuello')) return ['front-deltoids', 'trapezius'];
    if (t.includes('peso muerto') || t.includes('deadlift')) return ['lower-back', 'hamstring', 'gluteal'];
    if (t.includes('leg press') || t.includes('prensa')) return ['quadriceps', 'gluteal'];
    if (t.includes('leg curl') || t.includes('curl femoral') || t.includes('curl de isquios')) return ['hamstring'];
    if (t.includes('leg extension') || t.includes('extension de pierna')) return ['quadriceps'];
    if (t.includes('hip thrust') || t.includes('puente') || t.includes('bridge')) return ['gluteal'];
    if (t.includes('reverse curl') || t.includes('curl invertido')) return ['forearm'];
    
    // Core "Engañoso" (Lumbares/Estabilidad)
    if (t.includes('bird dog') || t.includes('pajaro perro') || t.includes('perro pajaro')) return ['lower-back', 'gluteal'];
    if (t.includes('good morning') || t.includes('buenos dias')) return ['lower-back', 'hamstring'];

    // Evitamos falsos positivos con "raise/elevacion" y "flexion"
    if (t.includes('calf raise') || t.includes('elevacion de gemelo') || t.includes('talon') || t.includes('plantar')) return ['calves'];
    if (t.includes('leg raise') || t.includes('elevacion de pierna')) return ['abs'];
    if (t.includes('flexion de rodilla') || t.includes('knee flexion')) return ['hamstring'];
    
    // Oblicuos específicos
    if (t.includes('twist') || t.includes('giro') || t.includes('leñador') || t.includes('woodchopper') || t.includes('oblique') || t.includes('oblicuo')) return ['obliques'];
    
    // Trapecios aislados
    if (t.includes('shrug') || t.includes('encogimiento')) return ['trapezius'];

    // 2. BÚSQUEDAS GENERALES
    // Espalda Alta
    if (t.includes('jalon') || t.includes('dominada') || t.includes('chin') || t.includes('lat') || t.includes('pull-down') || t.includes('pulldown')) return ['upper-back'];

    // Espalda General
    if (t.includes('row') || t.includes('remo') || t.includes('pull') || t.includes('dorsal') || t.includes('back') || t.includes('espalda')) return ['upper-back', 'lower-back'];

    // Lumbares
    if (t.includes('lumbar') || t.includes('hiperextension')) return ['lower-back'];

    // Pecho 
    if (t.includes('bench') || t.includes('banca') || t.includes('chest') || t.includes('pecho') || t.includes('pectoral') || t.includes('push-up') || t.includes('push up') || t.includes('flexiones') || t.includes('pec deck') || t.includes('fly') || t.includes('apertura') || t.includes('dip') || t.includes('fondo')) return ['chest'];

    // Hombros 
    if (t.includes('press') && (t.includes('shoulder') || t.includes('hombro') || t.includes('militar') || t.includes('military') || t.includes('overhead'))) return ['front-deltoids'];
    if (t.includes('lateral') || t.includes('pajaro') || t.includes('deltoid') || t.includes('hombro')) return ['front-deltoids', 'back-deltoids'];
    if ((t.includes('raise') || t.includes('elevacion')) && (t.includes('frontal') || t.includes('lateral'))) return ['front-deltoids', 'back-deltoids'];

    // Antebrazos
    if (t.includes('wrist') || t.includes('muñeca') || t.includes('forearm') || t.includes('antebrazo') || t.includes('brachioradialis') || t.includes('braquiorradial') || t.includes('apreton') || t.includes('hand grip') || t.includes('handgrip')) return ['forearm'];

    // Brazos
    if (t.includes('curl') || t.includes('bicep')) return ['biceps'];
    if (t.includes('extension') || t.includes('tricep') || t.includes('skull') || t.includes('copa') || t.includes('patada') || t.includes('pushdown')) return ['triceps'];

    // Piernas
    if (t.includes('squat') || t.includes('sentadilla') || t.includes('lunge') || t.includes('zancada') || t.includes('step')) return ['quadriceps', 'gluteal'];
    if (t.includes('femoral') || t.includes('isko') || t.includes('isquio')) return ['hamstring'];
    if (t.includes('glute') || t.includes('cadera')) return ['gluteal'];
    if (t.includes('calf') || t.includes('gemelo') || t.includes('pantorrilla')) return ['calves'];

    // Abs
    if (t.includes('abs') || t.includes('crunch') || t.includes('plank') || t.includes('plancha') || t.includes('abdominal') || t.includes('sit-up')) return ['abs'];

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
    'hamstring': 'Femoral', 
    'gluteal': 'Glúteos',
    'calves': 'Gemelos',
    'trapezius': 'Trapecios',
    'adductor': 'Aductores',
    'abductors': 'Abductores',
    'neck': 'Cuello',
    'head': 'Cabeza',

    'lats': 'Dorsal',
    'latissimus dorsi': 'Dorsal',
    'dorsales': 'Dorsal',
    'dorsal ancho': 'Dorsal',

    'serratus anterior': 'Serrato anterior',
    'soleus': 'Gemelos', 
    'gastrocnemius': 'Gemelos', 
    'brachialis': 'Braquial',
    'biceps femoris': 'Femoral',
    'rectus abdominis': 'Abdominales',
    'pectoralis major': 'Pecho',
    'quadriceps femoris': 'Cuádriceps',
    'triceps brachii': 'Tríceps'
};