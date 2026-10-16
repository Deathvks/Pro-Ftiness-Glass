export const APP_TUTORIALS = [
  {
    id: 'dashboard', title: 'Dashboard y rutina diaria', category: 'Empezar', icon: 'home', view: 'dashboard',
    description: 'Aprende a leer tu resumen, controlar la racha y acceder a tus entrenamientos y registros rápidos.',
    steps: [
      { title: 'Tu nivel y tu racha', element: '#tour-gamification', description: 'Consulta tu nivel, experiencia y racha actual. Mantén la actividad para conservarla.' },
      { title: 'Resumen semanal', element: '#tour-stats', description: 'Revisa de un vistazo tus sesiones, calorías y cumplimiento de objetivos.' },
      { title: 'Nutrición rápida', element: '#tour-nutrition', description: 'Entra al registro de comidas, agua y otros datos nutricionales.' },
      { title: 'Tus rutinas', element: '#tour-routines', description: 'Abre una rutina guardada y empieza una sesión de entrenamiento.' },
      { title: 'Cardio rápido', element: '#tour-quick-cardio', description: 'Inicia cardio sin tener que preparar una rutina de fuerza.' },
      { title: 'Peso corporal', element: '#tour-weight', description: 'Añade mediciones para consultar cómo cambia tu peso con el tiempo.' }
    ]
  },
  {
    id: 'routines', title: 'Rutinas y entrenamiento', category: 'Entrenamiento', icon: 'dumbbell', view: 'routines',
    description: 'Crea rutinas, encuentra ejercicios, usa plantillas y empieza a entrenar.',
    steps: [
      { title: 'Tus entrenamientos', element: null, description: 'Aquí organizas rutinas propias, plantillas y sesiones de cardio.' },
      { title: 'Secciones de rutinas', element: '#routines-tabs', description: 'Cambia entre Mis Rutinas, Ejercicios Manuales y, si eres administrador, Explorar.' },
      { title: 'Ejercicios Manuales', element: '#tutorial-routines-manual-exercises-tab', description: 'Aquí consultas ejercicios creados fuera del catálogo oficial. Puedes revisar sus registros, transferir el historial a otro ejercicio o eliminarlos.' },
      { title: 'Acciones principales', element: () => window.innerWidth < 768 ? '#routines-actions-mobile' : '#routines-actions-desktop', description: 'Desde aquí puedes crear una rutina o usar las herramientas disponibles.' },
      { title: 'Buscar rutinas', element: '#routines-search', description: 'Encuentra una rutina por nombre y organiza tu lista.' }
    ]
  },
  {
    id: 'nutrition', title: 'Comidas y nutrición', category: 'Nutrición', icon: 'nutrition', view: 'nutrition',
    description: 'Registra comidas, copia un tipo de comida, controla macros, agua y suplementos.',
    steps: [
      { title: 'Tu registro diario', element: '#date-navigator', description: 'Cambia de fecha para consultar o editar otro día del registro.' },
      { title: 'Calorías', element: '#calories-ring', description: 'Compara lo que has consumido con tu objetivo diario.' },
      { title: 'Macronutrientes', element: '#macro-stats', description: 'Consulta proteínas, carbohidratos y grasas.' },
      { title: 'Agua', element: '#water-tracker', description: 'Registra la hidratación y sigue tu objetivo de agua.' },
      { title: 'Añadir o copiar comida', element: '#add-food-btn', description: 'Añade alimentos a una franja. En cada comida también puedes copiar los alimentos de otra fecha o franja.' }
    ]
  },
  {
    id: 'progress', title: 'Progreso y estadísticas', category: 'Seguimiento', icon: 'chart', view: 'progress',
    description: 'Explora mapas musculares, ejercicios, nutrición, récords, peso, medidas y calendario.',
    steps: [
      { title: 'Tu progreso', element: null, description: 'Las pestañas muestran distintas formas de revisar tus entrenamientos y tus cambios físicos.' },
      { title: 'Elige qué analizar', element: '#tutorial-progress-tabs', description: 'Cambia entre mapa muscular, ejercicios, nutrición, récords, peso, medidas y calendario.' },
      { title: 'Vista seleccionada', element: '#tutorial-progress-panel', description: 'El contenido de este panel cambia con la pestaña. Puedes volver aquí cuando quieras para comparar tus datos.' },
      { title: 'Calendario de entrenamientos', element: '[data-tutorial="progress-tab-calendar"]', description: 'Abre el calendario y toca un día con actividad para consultar esa sesión.' }
    ]
  },
  {
    id: 'social', title: 'Comunidad y ranking', category: 'Comunidad', icon: 'users', view: 'social',
    description: 'Comparte actividad, sigue historias, encuentra personas y consulta rachas y posiciones.',
    steps: [
      { title: 'La comunidad', element: null, description: 'Comparte tus avances y descubre la actividad de otras personas.' },
      { title: 'Privacidad', element: '#social-privacy-banner', description: 'Revisa si tu perfil es público y cambia la privacidad desde aquí.' },
      { title: 'Historias', element: '#social-stories', description: 'Publica momentos de entrenamiento que desaparecen al cabo de 24 horas.' },
      { title: 'Muro, ranking y más', element: '#social-tabs', description: 'Cambia entre el muro, el ranking, amigos, grupos, solicitudes y búsqueda.' }
    ]
  },
  {
    id: 'challenges', title: 'Retos, misiones y recompensas', category: 'Seguimiento', icon: 'trophy', view: 'challenges',
    description: 'Completa objetivos diarios y generales, gana XP e invita a amigos.',
    steps: [
      { title: 'Retos y misiones', element: '#tutorial-challenges-header', description: 'Los retos convierten tus acciones de entrenamiento, nutrición y comunidad en objetivos con recompensas.' },
      { title: 'Invita a un amigo', element: '#tutorial-challenges-referral', description: 'Comparte tu código de invitación. Al registrarse alguien nuevo, recibes XP.' },
      { title: 'Tipos de reto', element: '#tutorial-challenges-tabs', description: 'Consulta los retos diarios, los objetivos generales y los que ya has completado.' },
      { title: 'Progreso y XP', element: null, description: 'Cada tarjeta muestra qué necesitas hacer, tu avance y la experiencia que ganarás.' }
    ]
  },
  {
    id: 'appearance', title: 'Temas y personalización', category: 'Personalización', icon: 'palette', view: 'appearance',
    description: 'Cambia el tema, el color de acento, desbloquea estilos y configura la vibración.',
    steps: [
      { title: 'Personaliza la app', element: null, description: 'Los cambios visuales se aplican a toda la interfaz.' },
      { title: 'Tema principal', element: '#tutorial-appearance-base-themes', description: 'Elige el modo del sistema, claro, oscuro u OLED.' },
      { title: 'Acentos', element: '#tutorial-appearance-accents', description: 'El color de acento destaca botones, indicadores y elementos activos. Algunos estilos se desbloquean al subir de nivel.' },
      { title: 'Temas exclusivos', element: '#tutorial-appearance-my-themes', description: 'Consulta y aplica temas especiales que se desbloquean con el progreso.' },
      { title: 'Vibración háptica', element: '#tutorial-appearance-haptics', description: 'Activa o desactiva la respuesta táctil de la interfaz.' }
    ]
  },
  {
    id: 'settings', title: 'Ajustes, seguridad y privacidad', category: 'Personalización', icon: 'settings', view: 'settings',
    description: 'Administra tus datos de cuenta, notificaciones, seguridad y visibilidad social.',
    steps: [
      { title: 'Ajustes', element: null, description: 'Las opciones se agrupan en pestañas para que puedas encontrar cada preferencia.' },
      { title: 'Categorías', element: '#tutorial-settings-tabs', description: 'Entra en Perfil, Notificaciones, Seguridad, Privacidad Social o Sesión.' },
      { title: 'Opciones de la categoría', element: '#tutorial-settings-content', description: 'Activa avisos, configura la privacidad, exporta tus datos y administra la cuenta desde el panel seleccionado.' }
    ]
  },
  {
    id: 'profile', title: 'Tu perfil y datos físicos', category: 'Personalización', icon: 'user', view: 'profile',
    description: 'Edita tu nombre, correo y foto; consulta o actualiza la información de tu cuenta.',
    steps: [
      { title: 'Tu perfil', element: '#tutorial-profile-header', description: 'Esta pantalla reúne la información de tu cuenta y tu imagen de perfil.' },
      { title: 'Foto y nombre', element: '#tutorial-profile-identity', description: 'Actualiza la imagen y los datos que aparecen asociados a tu perfil.' },
      { title: 'Guardar cambios', element: '#tutorial-profile-form', description: 'Edita los campos disponibles y confirma los cambios para guardarlos.' }
    ]
  },
  {
    id: 'cardio', title: 'Cardio rápido', category: 'Entrenamiento', icon: 'activity', view: 'quickCardio',
    description: 'Busca una actividad, ajusta la duración y registra o inicia una sesión de cardio.',
    steps: [
      { title: 'Cardio rápido', element: null, description: 'Registra cardio sin crear una rutina de fuerza.' },
      { title: 'Busca una actividad', element: '#tutorial-cardio-search', description: 'Filtra por actividad o intensidad para encontrar lo que vas a hacer.' },
      { title: 'Elige la actividad', element: '#tutorial-cardio-list', description: 'Abre una actividad para configurar la duración y consultar una estimación de calorías.' }
    ]
  },
  {
    id: 'support', title: 'Ayuda y soporte', category: 'Más herramientas', icon: 'help', view: 'support',
    description: 'Encuentra descargas, información de la app y el formulario para reportar problemas.',
    steps: [
      { title: 'Ayuda y comunidad', element: '#tutorial-support-main', description: 'Aquí tienes recursos de ayuda, descargas y acceso a la comunidad.' },
      { title: 'Reportar un problema', element: '#tutorial-support-bug', description: 'Si algo no funciona, envía un informe para que podamos revisarlo.' }
    ]
  },
  {
    id: 'advice', title: 'Asesoría con tu entrenador', category: 'Comunidad', icon: 'message', view: 'asesoria',
    roles: ['trainee'],
    description: 'Consulta conversaciones, envía mensajes y comparte información con tu entrenador.',
    steps: [
      { title: 'Tu asesoría', element: '#tutorial-advice-main', description: 'Este espacio conecta tu cuenta con el entrenador que te acompaña.' },
      { title: 'Conversación', element: '#tutorial-advice-conversation', description: 'Consulta los mensajes y usa el campo de respuesta para continuar la conversación.' }
    ]
  },
  {
    id: 'trainer', title: 'Panel de entrenador', category: 'Herramientas profesionales', icon: 'users', view: 'trainerPanel',
    roles: ['trainer', 'admin'],
    description: 'Gestiona clientes, revisa cuestionarios y accede a las herramientas de seguimiento.',
    steps: [
      { title: 'Panel de entrenador', element: null, description: 'Desde aquí puedes acceder a las fichas y herramientas de gestión de tus clientes.' },
      { title: 'Clientes', element: '#tutorial-trainer-panel', description: 'Consulta la lista de clientes, abre sus fichas o inicia el flujo para añadir uno nuevo.' }
    ]
  },
  {
    id: 'admin', title: 'Panel de administración', category: 'Herramientas profesionales', icon: 'settings', view: 'adminPanel',
    roles: ['admin'],
    description: 'Accede a la gestión de usuarios, reportes, ejercicios y herramientas de administración.',
    steps: [
      { title: 'Panel de administración', element: '#tutorial-admin-panel', description: 'Esta zona está reservada a administradores y reúne herramientas de mantenimiento de la plataforma.' },
      { title: 'Áreas de gestión', element: '#tutorial-admin-tabs', description: 'Cambia entre las pestañas para administrar usuarios, reportes, ejercicios, valoraciones, notificaciones y otras áreas.' }
    ]
  },
  {
    id: 'notifications', title: 'Centro de notificaciones', category: 'Más herramientas', icon: 'bell', view: 'notifications',
    description: 'Consulta avisos de actividad, comunidad y cuenta, y abre el contenido relacionado.',
    steps: [
      { title: 'Avisos de la app', element: null, description: 'Aquí se reúnen mensajes y alertas relacionados con tu cuenta y actividad.' },
      { title: 'Tus notificaciones', element: '#tutorial-notifications-main', description: 'Aquí se agrupan los avisos importantes. Toca uno para ir al contenido relacionado.' }
    ]
  }
];

export const TUTORIAL_COMPLETION_ACTIONS = {
  dashboard: 'completeTour',
  nutrition: 'completeNutritionTour',
  routines: 'completeRoutineTour',
  social: 'completeSocialTour'
};
