import { BellRing, LogOut, Shield, Timer, User, Users, WifiOff } from 'lucide-react';

export const SETTINGS_SECTIONS = [
  { id: 'workout', label: 'Entrenamiento', icon: Timer },
  { id: 'offline', label: 'Modo sin conexión', icon: WifiOff },
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'notifications', label: 'Notificaciones', icon: BellRing },
  { id: 'security', label: 'Seguridad', icon: Shield },
  { id: 'privacy', label: 'Privacidad social', icon: Users },
  { id: 'session', label: 'Sesión', icon: LogOut, danger: true },
];
