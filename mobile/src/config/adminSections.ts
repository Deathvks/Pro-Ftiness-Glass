import { Bell, Bug, ClipboardCheck, Clock, Cloud, Mail, Monitor, Newspaper, Server, ShieldAlert, Star, Users } from 'lucide-react-native';

export const ADMIN_SECTIONS = [
  { id: 'users', label: 'Usuarios', description: 'Cuentas, roles y actividad', icon: Users },
  { id: 'server', label: 'Servidor', description: 'Recursos y estado de la base de datos', icon: Server },
  { id: 'retention', label: 'Retención 72h', description: 'Usuarios inactivos e historial de rescates', icon: Clock },
  { id: 'reports', label: 'Reportes', description: 'Incidencias enviadas por los usuarios', icon: Bug },
  { id: 'exercises', label: 'Ejercicios', description: 'Catálogo e importación desde YouTube', icon: Monitor },
  { id: 'ratings', label: 'Valoraciones', description: 'Puntuaciones y comentarios', icon: Star },
  { id: 'notifications', label: 'Notificaciones', description: 'Avisos, entregas y tareas programadas', icon: Bell },
  { id: 'emails', label: 'Correos', description: 'Historial y estado de entrega', icon: Mail },
  { id: 'notificationTests', label: 'Pruebas de correo y push', description: 'Diagnóstico y revisión de canales', icon: ClipboardCheck },
  { id: 'uploads', label: 'Subidas', description: 'Archivos subidos y errores', icon: Cloud },
  { id: 'news', label: 'Noticias', description: 'Publicaciones, automatización y visitas', icon: Newspaper },
  { id: 'security', label: 'Ciberseguridad', description: 'Eventos y direcciones bloqueadas', icon: ShieldAlert },
] as const;

export type AdminSectionId = typeof ADMIN_SECTIONS[number]['id'];
