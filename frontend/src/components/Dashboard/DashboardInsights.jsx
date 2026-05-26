/* frontend/src/components/Dashboard/DashboardInsights.jsx */
import React, { useMemo } from 'react';
import { Lightbulb, Flame, Scale, Dumbbell, AlertTriangle, TrendingUp } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import GlassCard from '../GlassCard';

const DashboardInsights = () => {
  const { workoutLog, bodyWeightLog, nutritionSummary, userProfile } = useAppStore();

  const insights = useMemo(() => {
    const alerts = [];
    const today = new Date();

    const getDaysDiff = (dateStr) => {
      if (!dateStr) return 999;
      const diffTime = Math.abs(today - new Date(dateStr));
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    // 1. INACTIVIDAD (Entrenamientos)
    if (workoutLog && workoutLog.length > 0) {
      const daysSinceLastWorkout = getDaysDiff(workoutLog[0].workout_date);
      if (daysSinceLastWorkout > 3) {
        alerts.push({
          id: 'inactivity',
          type: 'warning',
          icon: <Flame size={20} className="text-orange-500" />,
          title: '¡Hora de moverse!',
          message: `Llevas ${daysSinceLastWorkout} días sin entrenar. No pierdas el ritmo, haz aunque sea una sesión rápida de cardio.`,
          colorClass: 'bg-orange-500/10 ring-orange-500/30'
        });
      }
    } else {
      alerts.push({
        id: 'welcome',
        type: 'info',
        icon: <Dumbbell size={20} className="text-accent" />,
        title: '¡Empieza tu camino!',
        message: 'Ve a la sección de rutinas y registra tu primer entrenamiento para empezar a ver estadísticas.',
        colorClass: 'bg-accent/10 ring-accent/30'
      });
    }

    // 2. ESTANCAMIENTO EN PESO (Peso Corporal)
    if (bodyWeightLog && bodyWeightLog.length > 0) {
      const daysSinceLastWeight = getDaysDiff(bodyWeightLog[0].log_date);
      if (daysSinceLastWeight > 7) {
        alerts.push({
          id: 'weight_tracking',
          type: 'info',
          icon: <Scale size={20} className="text-blue-500" />,
          title: 'Actualiza tu peso',
          message: 'Hace más de una semana que no te pesas. Registrarlo te ayudará a afinar tus calorías.',
          colorClass: 'bg-blue-500/10 ring-blue-500/30'
        });
      } else if (bodyWeightLog.length >= 2 && userProfile?.goal) {
        // Lógica simple de progreso
        const currentW = parseFloat(bodyWeightLog[0].weight_kg);
        const prevW = parseFloat(bodyWeightLog[1].weight_kg);
        
        if (userProfile.goal === 'lose_weight' && currentW < prevW) {
          alerts.push({
            id: 'weight_success',
            type: 'success',
            icon: <TrendingUp size={20} className="text-green-500" />,
            title: '¡Vas por buen camino!',
            message: `Has bajado a ${currentW}kg. Tu déficit calórico está funcionando.`,
            colorClass: 'bg-green-500/10 ring-green-500/30'
          });
        }
      }
    }

    // 3. NUTRICIÓN (Si faltan datos)
    const hasRecentNutrition = nutritionSummary?.nutrition?.some(n => getDaysDiff(n.date) <= 1);
    if (!hasRecentNutrition) {
      alerts.push({
        id: 'nutrition_warning',
        type: 'warning',
        icon: <AlertTriangle size={20} className="text-yellow-500" />,
        title: 'Nutrición incompleta',
        message: 'Parece que no has registrado tus comidas hoy. Recuerda que la dieta es el 70% de los resultados.',
        colorClass: 'bg-yellow-500/10 ring-yellow-500/30'
      });
    }

    return alerts.slice(0, 3); // Mostramos solo los 3 más importantes para no saturar
  }, [workoutLog, bodyWeightLog, nutritionSummary, userProfile]);

  if (insights.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-4 animate-[fade-in_0.4s_ease-out]">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Lightbulb className="text-accent" size={20} strokeWidth={2.5} />
        <h3 className="text-lg font-extrabold text-text-primary tracking-tight">Tu Asistente Virtual</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((alert) => (
          <GlassCard 
            key={alert.id} 
            className="glass flex items-start gap-4 p-5 rounded-[24px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-transform hover:-translate-y-1"
          >
            <div className={`p-3 rounded-[16px] shrink-0 ring-1 ${alert.colorClass}`}>
              {alert.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-text-primary mb-1 tracking-tight truncate">
                {alert.title}
              </h4>
              <p className="text-xs font-medium text-text-secondary leading-relaxed">
                {alert.message}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default DashboardInsights;