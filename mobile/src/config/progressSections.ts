import {
  Activity,
  CalendarDays,
  Dumbbell,
  Ruler,
  Scale,
  Trophy,
  Utensils,
  LucideIcon,
} from 'lucide-react-native';

export type ProgressSectionId =
  | 'heatmap'
  | 'exercise'
  | 'nutrition'
  | 'records'
  | 'bodyWeight'
  | 'measurements'
  | 'calendar';

export interface ProgressSection {
  id: ProgressSectionId;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const PROGRESS_SECTIONS: ProgressSection[] = [
  {
    id: 'heatmap',
    label: 'Mapa muscular',
    icon: Activity,
    description: 'Intensidad por grupo muscular y puntos a mejorar',
  },
  {
    id: 'exercise',
    label: 'Ejercicios',
    icon: Dumbbell,
    description: 'Evolución de peso máximo y 1RM por ejercicio',
  },
  {
    id: 'nutrition',
    label: 'Nutrición',
    icon: Utensils,
    description: 'Calorías, macronutrientes e hidratación diaria',
  },
  {
    id: 'records',
    label: 'Récords',
    icon: Trophy,
    description: 'Tus mejores marcas personales registradas',
  },
  {
    id: 'bodyWeight',
    label: 'Peso corporal',
    icon: Scale,
    description: 'Tendencia, medias y registro de peso corporal',
  },
  {
    id: 'measurements',
    label: 'Medidas',
    icon: Ruler,
    description: 'Evolución de perímetros y medidas corporales',
  },
  {
    id: 'calendar',
    label: 'Calendario',
    icon: CalendarDays,
    description: 'Historial mensual de sesiones y volumen levantado',
  },
];
