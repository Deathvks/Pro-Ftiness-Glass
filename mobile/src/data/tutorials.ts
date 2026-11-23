export interface TutorialStep {
  title: string;
  element: string | null;
  description: string;
  side?: 'top' | 'bottom';
  sectionParam?: string;
}

export interface AppTutorial {
  id: string;
  title: string;
  category: string;
  icon:
    | 'home'
    | 'dumbbell'
    | 'nutrition'
    | 'chart'
    | 'users'
    | 'trophy'
    | 'palette'
    | 'settings'
    | 'user'
    | 'activity'
    | 'help'
    | 'message'
    | 'bell';
  view: string;
  route: string;
  roles?: string[];
  description: string;
  steps: TutorialStep[];
}

export const APP_TUTORIALS: AppTutorial[] = [
  {
    id: 'dashboard',
    title: 'Dashboard y rutina diaria',
    category: 'Empezar',
    icon: 'home',
    view: 'dashboard',
    route: '/(tabs)',
    description:
      'Aprende a leer tu resumen, controlar la racha y acceder a tus entrenamientos y registros rápidos.',
    steps: [
      {
        title: 'Tu nivel y tu racha',
        element: '#tour-gamification',
        description:
          'Consulta tu nivel, experiencia y racha actual. Mantén la actividad para conservarla.',
      },
      {
        title: 'Resumen semanal',
        element: '#tour-stats',
        description:
          'Revisa de un vistazo tus sesiones, calorías y cumplimiento de objetivos.',
      },
      {
        title: 'Nutrición rápida',
        element: '#tour-nutrition',
        description:
          'Entra al registro de comidas, agua y otros datos nutricionales.',
      },
      {
        title: 'Tus rutinas',
        element: '#tour-routines',
        description:
          'Abre una rutina guardada y empieza una sesión de entrenamiento.',
      },
      {
        title: 'Cardio rápido',
        element: '#tour-quick-cardio',
        description:
          'Inicia cardio sin tener que preparar una rutina de fuerza.',
      },
      {
        title: 'Peso corporal',
        element: '#tour-weight',
        description:
          'Añade mediciones para consultar cómo cambia tu peso con el tiempo.',
      },
    ],
  },
  {
    id: 'routines',
    title: 'Rutinas y entrenamiento',
    category: 'Entrenamiento',
    icon: 'dumbbell',
    view: 'routines',
    route: '/(tabs)/routines',
    description:
      'Crea rutinas, encuentra ejercicios, usa plantillas y empieza a entrenar.',
    steps: [
      {
        title: 'Tus entrenamientos',
        element: null,
        description:
          'Aquí organizas rutinas propias, plantillas y sesiones de cardio.',
      },
      {
        title: 'Secciones de rutinas',
        element: '#routines-tabs',
        description:
          'Cambia entre Mis Rutinas, Ejercicios Manuales y, si eres administrador, Explorar.',
      },
      {
        title: 'Ejercicios Manuales',
        element: '#tutorial-routines-manual-exercises-tab',
        description:
          'Aquí consultas ejercicios creados fuera del catálogo oficial. Puedes revisar sus registros, transferir el historial a otro ejercicio o eliminarlos.',
      },
      {
        title: 'Acciones principales',
        element: '#routines-actions',
        description:
          'Desde aquí puedes crear una rutina o usar las herramientas disponibles.',
      },
      {
        title: 'Buscar rutinas',
        element: '#routines-search',
        description: 'Encuentra una rutina por nombre y organiza tu lista.',
      },
    ],
  },
  {
    id: 'nutrition',
    title: 'Comidas y nutrición',
    category: 'Nutrición',
    icon: 'nutrition',
    view: 'nutrition',
    route: '/(tabs)/nutrition',
    description:
      'Registra comidas, copia un tipo de comida, controla macros, agua y suplementos.',
    steps: [
      {
        title: 'Tu registro diario',
        element: '#date-navigator',
        description:
          'Cambia de fecha para consultar o editar otro día del registro.',
      },
      {
        title: 'Calorías',
        element: '#calories-ring',
        description:
          'Compara lo que has consumido con tu objetivo diario.',
      },
      {
        title: 'Macronutrientes',
        element: '#macro-stats',
        description: 'Consulta proteínas, carbohidratos y grasas.',
      },
      {
        title: 'Agua',
        element: '#water-tracker',
        description: 'Registra la hidratación y sigue tu objetivo de agua.',
      },
      {
        title: 'Añadir o copiar comida',
        element: '#add-food-btn',
        description:
          'Añade alimentos a una franja. En cada comida también puedes copiar los alimentos de otra fecha o franja.',
      },
    ],
  },
  {
    id: 'progress',
    title: 'Progreso y estadísticas',
    category: 'Seguimiento',
    icon: 'chart',
    view: 'progress',
    route: '/progress',
    description:
      'Explora mapas musculares, ejercicios, nutrición, récords, peso, medidas y calendario.',
    steps: [
      {
        title: 'Tu progreso',
        element: null,
        description:
          'Los apartados muestran distintas formas de revisar tus entrenamientos y tus cambios físicos. En móvil, usa la flecha de la cabecera para volver a la lista.',
      },
      {
        title: 'Elige qué analizar',
        element: '#tutorial-progress-tabs',
        description:
          'Cambia entre mapa muscular, ejercicios, nutrición, récords, peso, medidas y calendario.',
      },
      {
        title: 'Vista seleccionada',
        element: '#tutorial-progress-panel',
        description:
          'Aquí aparecen los datos del apartado abierto. Puedes volver cuando quieras para comparar tus resultados.',
      },
      {
        title: 'Calendario de entrenamientos',
        element: '#progress-tab-calendar',
        description:
          'Abre el calendario y toca un día con actividad para consultar esa sesión.',
      },
    ],
  },
  {
    id: 'social',
    title: 'Comunidad y ranking',
    category: 'Comunidad',
    icon: 'users',
    view: 'social',
    route: '/(tabs)/social',
    description:
      'Muro Global, Mi Gimnasio y Amigos, reacciones rápidas, historias 24h, grupos (Squads) y ranking.',
    steps: [
      {
        title: 'La Comunidad',
        element: null,
        description:
          'Tu espacio social para compartir entrenamientos terminados, descubrir atletas, importar sus rutinas y competir en los rankings.',
      },
      {
        title: 'Privacidad de Perfil y Muro',
        element: '#social-privacy-banner',
        description:
          'Revisa si tu perfil es Público o Privado y cámbialo desde aquí. Además, desde Rutinas puedes elegir si tus sesiones se publican en "Todo el mundo", "Solo Amigos" o "No subir".',
      },
      {
        title: 'Historias de 24 Horas',
        element: '#social-stories',
        description:
          'Publica fotos o vídeos de entrenamiento que desaparecen a las 24 horas, visibles para toda la comunidad o solo para tus amigos.',
      },
      {
        title: 'Muro, Ranking, Grupos y Más',
        element: '#social-tabs',
        description:
          'Desliza entre el Muro, el Ranking Global (Top 50 por XP y racha), tu lista de Amigos, Grupos privados (Squads con código de invitación), Solicitudes y Búsqueda.',
      },
      {
        title: 'Global, Mi Gimnasio y Amigos',
        element: '#social-feed-scopes',
        description:
          'Cambia entre Global (entrenos públicos en "Todo el mundo"), Mi Gimnasio (vincula tu centro para descubrir atletas de tu mismo gimnasio o ciudad) y Amigos.',
      },
      {
        title: 'Reacciones Rápidas, Rutinas e Histórico',
        element: '#social-feed-content',
        description:
          'Da ánimo con reacciones de 1 toque (Fuego, Bestia, Respeto y PR), comenta, importa rutinas de otros atletas, envía solicitud rápida o carga publicaciones anteriores del histórico.',
      },
    ],
  },
  {
    id: 'challenges',
    title: 'Retos, misiones y recompensas',
    category: 'Seguimiento',
    icon: 'trophy',
    view: 'challenges',
    route: '/challenges',
    description:
      'Completa objetivos diarios y generales, gana XP e invita a amigos.',
    steps: [
      {
        title: 'Retos y misiones',
        element: '#tutorial-challenges-header',
        description:
          'Los retos convierten tus acciones de entrenamiento, nutrición y comunidad en objetivos con recompensas.',
      },
      {
        title: 'Invita a un amigo',
        element: '#tutorial-challenges-referral',
        description:
          'Comparte tu código de invitación. Al registrarse alguien nuevo, recibes XP.',
      },
      {
        title: 'Tipos de reto',
        element: '#tutorial-challenges-tabs',
        description:
          'Consulta los retos diarios, los objetivos generales y los que ya has completado.',
      },
      {
        title: 'Progreso y XP',
        element: null,
        description:
          'Cada tarjeta muestra qué necesitas hacer, tu avance y la experiencia que ganarás.',
      },
    ],
  },
  {
    id: 'appearance',
    title: 'Temas y personalización',
    category: 'Personalización',
    icon: 'palette',
    view: 'appearance',
    route: '/appearance',
    description:
      'Cambia el tema, el color de acento, desbloquea estilos y configura la vibración.',
    steps: [
      {
        title: 'Personaliza la app',
        element: null,
        description: 'Los cambios visuales se aplican a toda la interfaz.',
      },
      {
        title: 'Temas exclusivos',
        element: '#tutorial-appearance-my-themes',
        description:
          'Consulta y aplica temas especiales que se desbloquean con el progreso.',
      },
      {
        title: 'Tema principal',
        element: '#tutorial-appearance-base-themes',
        description: 'Elige el modo del sistema, claro, oscuro u OLED.',
      },
      {
        title: 'Acentos',
        element: '#tutorial-appearance-accents',
        description:
          'El color de acento destaca botones, indicadores y elementos activos. Algunos estilos se desbloquean al subir de nivel.',
      },
      {
        title: 'Vibración háptica',
        element: '#tutorial-appearance-haptics',
        description: 'Activa o desactiva la respuesta táctil de la interfaz.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Ajustes, seguridad y privacidad',
    category: 'Personalización',
    icon: 'settings',
    view: 'settings',
    route: '/settings',
    description:
      'Administra tus datos de cuenta, notificaciones, seguridad y visibilidad social.',
    steps: [
      {
        title: 'Ajustes',
        element: null,
        description:
          'Las opciones se agrupan por apartados. En móvil, toca uno para abrirlo y usa la flecha Atrás para volver a la lista.',
      },
      {
        title: 'Categorías',
        element: '#tutorial-settings-tabs',
        description:
          'Entra en Perfil, Notificaciones, Seguridad, Privacidad Social o Sesión.',
      },
      {
        title: 'Opciones de la categoría',
        element: '#tutorial-settings-content',
        description:
          'Activa avisos, configura la privacidad, exporta tus datos y administra la cuenta desde el panel seleccionado.',
      },
    ],
  },
  {
    id: 'profile',
    title: 'Tu perfil y datos físicos',
    category: 'Personalización',
    icon: 'user',
    view: 'profile',
    route: '/profile',
    description:
      'Edita tu nombre, correo y foto; consulta o actualiza la información de tu cuenta.',
    steps: [
      {
        title: 'Tu perfil',
        element: '#tutorial-profile-header',
        description:
          'Esta pantalla reúne la información de tu cuenta y tu imagen de perfil.',
      },
      {
        title: 'Foto y nombre',
        element: '#tutorial-profile-identity',
        description:
          'Actualiza la imagen y los datos que aparecen asociados a tu perfil.',
      },
      {
        title: 'Guardar cambios',
        element: '#tutorial-profile-form',
        description:
          'Edita los campos disponibles y confirma los cambios para guardarlos.',
      },
    ],
  },
  {
    id: 'cardio',
    title: 'Cardio rápido',
    category: 'Entrenamiento',
    icon: 'activity',
    view: 'quickCardio',
    route: '/quick-cardio',
    description:
      'Busca una actividad, ajusta la duración y registra o inicia una sesión de cardio.',
    steps: [
      {
        title: 'Cardio rápido',
        element: null,
        description: 'Registra cardio sin crear una rutina de fuerza.',
      },
      {
        title: 'Busca una actividad',
        element: '#tutorial-cardio-search',
        description:
          'Filtra por actividad o intensidad para encontrar lo que vas a hacer.',
      },
      {
        title: 'Elige la actividad',
        element: '#tutorial-cardio-list',
        description:
          'Abre una actividad para configurar la duración y consultar una estimación de calorías.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Ayuda y soporte',
    category: 'Más herramientas',
    icon: 'help',
    view: 'support',
    route: '/support',
    description:
      'Encuentra descargas, información de la app y el formulario para reportar problemas.',
    steps: [
      {
        title: 'Ayuda y comunidad',
        element: '#tutorial-support-main',
        description:
          'Aquí tienes recursos de ayuda, descargas y acceso a la comunidad.',
      },
      {
        title: 'Reportar un problema',
        element: '#tutorial-support-bug',
        description:
          'Si algo no funciona, envía un informe para que podamos revisarlo.',
      },
    ],
  },
  {
    id: 'advice',
    title: 'Asesoría con tu entrenador',
    category: 'Comunidad',
    icon: 'message',
    view: 'asesoria',
    route: '/asesoria',
    roles: ['trainee'],
    description:
      'Consulta conversaciones, envía mensajes y comparte información con tu entrenador.',
    steps: [
      {
        title: 'Tu asesoría',
        element: '#tutorial-advice-main',
        description:
          'Este espacio conecta tu cuenta con el entrenador que te acompaña.',
      },
      {
        title: 'Conversación',
        element: '#tutorial-advice-conversation',
        description:
          'Consulta los mensajes y usa el campo de respuesta para continuar la conversación.',
      },
    ],
  },
  {
    id: 'trainer',
    title: 'Panel de entrenador',
    category: 'Herramientas profesionales',
    icon: 'users',
    view: 'trainerPanel',
    route: '/trainerPanel',
    roles: ['trainer', 'admin'],
    description:
      'Gestiona clientes, revisa cuestionarios y accede a las herramientas de seguimiento.',
    steps: [
      {
        title: 'Panel de entrenador',
        element: null,
        description:
          'Desde aquí puedes acceder a las fichas y herramientas de gestión de tus clientes.',
      },
      {
        title: 'Clientes',
        element: '#tutorial-trainer-panel',
        description:
          'Consulta la lista de clientes, abre sus fichas o inicia el flujo para añadir uno nuevo.',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Panel de administración',
    category: 'Herramientas profesionales',
    icon: 'settings',
    view: 'adminPanel',
    route: '/admin',
    roles: ['admin'],
    description:
      'Accede a la gestión de usuarios, reportes, ejercicios y herramientas de administración.',
    steps: [
      {
        title: 'Panel de administración',
        element: '#tutorial-admin-panel',
        description:
          'Esta zona está reservada a administradores y reúne herramientas de mantenimiento de la plataforma.',
      },
      {
        title: 'Áreas de gestión',
        element: '#tutorial-admin-tabs',
        description:
          'Abre un apartado para administrar usuarios, reportes, ejercicios, valoraciones, notificaciones y otras áreas.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Centro de notificaciones',
    category: 'Más herramientas',
    icon: 'bell',
    view: 'notifications',
    route: '/notifications',
    description:
      'Consulta avisos de actividad, comunidad y cuenta, y abre el contenido relacionado.',
    steps: [
      {
        title: 'Avisos de la app',
        element: null,
        description:
          'Aquí se reúnen mensajes y alertas relacionados con tu cuenta y actividad.',
      },
      {
        title: 'Tus notificaciones',
        element: '#tutorial-notifications-main',
        description:
          'Aquí se agrupan los avisos importantes. Toca uno para ir al contenido relacionado.',
      },
    ],
  },
];

export const TUTORIAL_COMPLETION_ACTIONS: Record<string, string> = {
  dashboard: 'completeTour',
  nutrition: 'completeNutritionTour',
  routines: 'completeRoutineTour',
  social: 'completeSocialTour',
};

export interface AutoTourDefinition {
  id: 'dashboard' | 'nutrition' | 'routines' | 'social' | 'hub';
  routes: string[];
  flagKey:
    | 'tourCompleted'
    | 'nutritionTourCompleted'
    | 'routineTourCompleted'
    | 'socialTourCompleted'
    | 'hubTourCompleted';
  completeAction:
    | 'completeTour'
    | 'completeNutritionTour'
    | 'completeRoutineTour'
    | 'completeSocialTour'
    | 'completeHubTour';
  doneBtnText: string;
  progressFormat: 'slash' | 'de';
  steps: TutorialStep[];
}

export const AUTO_TOURS: AutoTourDefinition[] = [
  {
    id: 'dashboard',
    routes: ['/', '/index', '/(tabs)', '/(tabs)/index'],
    flagKey: 'tourCompleted',
    completeAction: 'completeTour',
    doneBtnText: '¡A entrenar!',
    progressFormat: 'slash',
    steps: [
      {
        title: 'Nivel y Racha',
        element: '#tour-gamification',
        description:
          'Tu progreso gamificado. ¡Mantén la llama encendida entrenando o registrando datos cada día para subir de nivel!',
      },
      {
        title: 'Resumen Semanal',
        element: '#tour-stats',
        description:
          'Un vistazo rápido a tus sesiones, calorías quemadas y cumplimiento de tu meta calórica diaria.',
      },
      {
        title: 'Nutrición Rápida',
        element: '#tour-nutrition',
        description:
          'Toca los anillos para registrar calorías, proteínas, agua o creatina al instante. ¡Todo cuenta!',
      },
      {
        title: 'Tus Rutinas',
        element: '#tour-routines',
        description:
          'Aquí aparecen tus rutinas creadas. Pulsa "Play" para iniciar el Modo Entrenamiento.',
      },
      {
        title: 'Cardio Exprés',
        element: '#tour-quick-cardio',
        description:
          '¿Solo vas a correr o usar la bici? Inicia una sesión rápida sin necesidad de configurar una rutina compleja.',
      },
      {
        title: 'Control de Peso',
        element: '#tour-weight',
        description:
          'Registra tu peso corporal regularmente para ver tu tendencia y gráfica de progreso aquí mismo.',
      },
    ],
  },
  {
    id: 'nutrition',
    routes: ['/nutrition', '/(tabs)/nutrition'],
    flagKey: 'nutritionTourCompleted',
    completeAction: 'completeNutritionTour',
    doneBtnText: '¡Entendido!',
    progressFormat: 'slash',
    steps: [
      {
        title: 'Tu Panel de Nutrición',
        element: null,
        description:
          'Gestiona tus comidas diarias, controla tus macros y mantén tu hidratación al día desde aquí.',
      },
      {
        title: 'Viaja en el Tiempo',
        element: '#date-navigator',
        description:
          'Usa las flechas para revisar registros pasados o planificar tus comidas de los próximos días.',
      },
      {
        title: 'Objetivo de Calorías',
        element: '#calories-ring',
        description:
          'Este anillo te muestra visualmente cuántas calorías has consumido y cuántas te quedan para llegar a tu meta.',
      },
      {
        title: 'Tus Macros',
        element: '#macro-stats',
        description:
          'Desglose detallado de Proteínas, Carbohidratos y Grasas. Toca las tarjetas para ver más detalles si están disponibles.',
      },
      {
        title: 'Control de Agua',
        element: '#water-tracker',
        description:
          'Registra tu consumo de agua rápidamente. ¡La hidratación es clave para tu rendimiento!',
      },
      {
        title: 'Añadir Alimentos',
        element: '#add-food-btn',
        description:
          'El botón principal para registrar desayunos, comidas, cenas y snacks. Escanea códigos o busca en la base de datos.',
      },
    ],
  },
  {
    id: 'routines',
    routes: ['/routines', '/(tabs)/routines'],
    flagKey: 'routineTourCompleted',
    completeAction: 'completeRoutineTour',
    doneBtnText: '¡Entendido!',
    progressFormat: 'slash',
    steps: [
      {
        title: 'Tus Entrenamientos',
        element: null,
        description:
          'Aquí puedes crear tus rutinas personalizadas, descubrir nuevas plantillas y organizar todo tu progreso.',
      },
      {
        title: 'Navegación Rápida',
        element: '#routines-tabs',
        description:
          'Cambia entre tus rutinas guardadas, explora la biblioteca de plantillas o inicia una sesión de cardio rápida.',
      },
      {
        title: 'Acciones Principales',
        element: '#routines-actions',
        description:
          'Configura la privacidad de tu muro, deja que la IA diseñe una rutina para ti o crea una desde cero.',
      },
      {
        title: 'Búsqueda y Filtros',
        element: '#routines-search',
        description:
          'Si tienes muchas rutinas, puedes buscarlas rápidamente por su nombre o agruparlas usando carpetas.',
      },
    ],
  },
  {
    id: 'social',
    routes: ['/social', '/(tabs)/social'],
    flagKey: 'socialTourCompleted',
    completeAction: 'completeSocialTour',
    doneBtnText: '¡Entendido!',
    progressFormat: 'slash',
    steps: [
      {
        title: 'La Comunidad',
        element: null,
        description:
          'Tu espacio social para compartir entrenamientos terminados, descubrir a otros atletas, importar sus rutinas y competir en los rankings.',
      },
      {
        title: 'Privacidad de Perfil y Muro',
        element: '#social-privacy-banner',
        description:
          'Aquí ves si tu perfil es Público o Privado y puedes cambiarlo al instante. Además, en Rutinas (icono de globo) puedes elegir si tus entrenos se publican en "Todo el mundo", "Solo Amigos" o "No subir".',
      },
      {
        title: 'Historias de 24 Horas',
        element: '#social-stories',
        description:
          'Sube fotos o vídeos de tu entrenamiento que desaparecen automáticamente a las 24 horas. Puedes elegir compartirlas con toda la comunidad o solo con tus amigos.',
      },
      {
        title: 'Muro, Ranking, Grupos y Más',
        element: '#social-tabs',
        description:
          'Desliza entre el Muro de actividad, el Ranking Global (Top 50 por XP y racha), tu lista de Amigos, Grupos privados (Squads con código de invitación), Solicitudes y Búsqueda de atletas.',
      },
      {
        title: 'Global, Mi Gimnasio y Amigos',
        element: '#social-feed-scopes',
        description:
          'Filtra el Muro en 3 modos: Global (entrenos públicos en "Todo el mundo"), Mi Gimnasio (vincula tu centro para descubrir gente que entrena en tu mismo gimnasio o ciudad) y Amigos.',
      },
      {
        title: 'Reacciones Rápidas, Rutinas e Histórico',
        element: '#social-feed-content',
        description:
          'Reacciona con 1 toque (Fuego, Bestia, Respeto o PR), comenta sesiones, importa las rutinas de otros atletas con "Importar", conecta con compañeros o carga publicaciones anteriores del histórico.',
      },
    ],
  },
  {
    id: 'hub',
    routes: ['/hub', '/(tabs)/hub'],
    flagKey: 'hubTourCompleted',
    completeAction: 'completeHubTour',
    doneBtnText: '¡Entendido!',
    progressFormat: 'slash',
    steps: [
      {
        title: 'Tu Centro de Control',
        element: null,
        description:
          'Bienvenido al Hub. Desde aquí puedes acceder a herramientas avanzadas y personalizar tu experiencia al máximo.',
      },
      {
        title: 'Tutoriales visuales',
        element: '#hub-tutorials',
        description:
          'Abre una guía de cada sección. El tutorial resaltará los controles reales de la pantalla y te explicará para qué sirve cada uno.',
      },
      {
        title: 'Tu Progreso',
        element: '#hub-progress',
        description:
          'Consulta tus estadísticas detalladas, marcas personales, mapa de calor muscular y volumen entrenado a lo largo del tiempo.',
      },
      {
        title: 'Retos y Misiones',
        element: '#hub-challenges',
        description:
          '¡Gamifica tu entrenamiento! Completa misiones diarias y semanales para ganar puntos de experiencia (XP) y subir de nivel.',
      },
      {
        title: 'Apariencia',
        element: '#hub-appearance',
        description:
          'Configura la estética de la app. Cambia entre modo claro y oscuro, ajusta tu color de acento favorito, o desbloquea temas especiales.',
      },
      {
        title: 'Ajustes de Cuenta',
        element: '#hub-settings',
        description:
          'Gestiona tu privacidad, notificaciones, suscripción y otros datos personales de forma segura.',
      },
    ],
  },
];
