import { Activity, CalendarDays, Dumbbell, Ruler, Scale, Trophy, Utensils } from 'lucide-react';

export const PROGRESS_SECTIONS = [
  { id: 'heatmap', label: 'Mapa muscular', icon: Activity },
  { id: 'exercise', label: 'Ejercicios', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrición', icon: Utensils },
  { id: 'records', label: 'Récords', icon: Trophy },
  { id: 'bodyWeight', label: 'Peso corporal', icon: Scale },
  { id: 'measurements', label: 'Medidas', icon: Ruler },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
];
