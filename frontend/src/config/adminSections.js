import { Bell, Bug, ClipboardCheck, Clock, Cloud, Mail, Monitor, Newspaper, Server, ShieldAlert, Star, Users } from 'lucide-react';

export const ADMIN_SECTIONS = [
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'server', label: 'Servidor', icon: Server },
  { id: 'retention', label: 'Retención 72h', icon: Clock },
  { id: 'reports', label: 'Reportes', icon: Bug },
  { id: 'exercises', label: 'Ejercicios', icon: Monitor },
  { id: 'ratings', label: 'Valoraciones', icon: Star },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'emails', label: 'Correos', icon: Mail },
  { id: 'notificationTests', label: 'Pruebas de correo y push', icon: ClipboardCheck },
  { id: 'uploads', label: 'Subidas', icon: Cloud },
  { id: 'news', label: 'Noticias', icon: Newspaper },
  { id: 'security', label: 'Ciberseguridad', icon: ShieldAlert, danger: true },
];
