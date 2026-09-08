import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Lightbulb, Flame, Scale, Dumbbell, AlertTriangle, TrendingUp } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';

export default function DashboardInsights({ workoutLog, bodyWeightLog, colors }) {
  const insights = useMemo(() => {
    const alerts = [];
    const today = new Date();

    const getDaysDiff = (dateStr) => {
      if (!dateStr) return 999;
      const diffTime = Math.abs(today - new Date(dateStr));
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    if (workoutLog && workoutLog.length > 0) {
      const daysSinceLastWorkout = getDaysDiff(workoutLog[0].workout_date);
      if (daysSinceLastWorkout > 3) {
        alerts.push({
          id: 'inactivity',
          icon: Flame,
          title: '¡Hora de moverse!',
          message: `Llevas ${daysSinceLastWorkout} días sin entrenar. No pierdas el ritmo, haz aunque sea una sesión rápida.`,
          color: colors.warning
        });
      }
    } else {
      alerts.push({
        id: 'welcome',
        icon: Dumbbell,
        title: '¡Empieza tu camino!',
        message: 'Ve a la sección de rutinas y registra tu primer entrenamiento para empezar a ver estadísticas.',
        color: colors.tint
      });
    }

    if (bodyWeightLog && bodyWeightLog.length > 0) {
      const daysSinceLastWeight = getDaysDiff(bodyWeightLog[0].log_date);
      if (daysSinceLastWeight > 7) {
        alerts.push({
          id: 'weight_tracking',
          icon: Scale,
          title: 'No olvides pesarte',
          message: 'Llevas más de una semana sin registrar tu peso. Mantenlo actualizado para ajustar tus métricas.',
          color: colors.tint
        });
      }
    }
    return alerts;
  }, [workoutLog, bodyWeightLog, colors]);

  if (insights.length === 0) return null;

  return (
    <View style={{ marginBottom: 24 }}>
      {insights.map(insight => {
        const Icon = insight.icon;
        return (
          <View key={insight.id} style={{ backgroundColor: insight.color + '15', borderColor: insight.color + '30', borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Icon size={24} color={insight.color} style={{ marginRight: 16, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: insight.color, marginBottom: 4 }}>{insight.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{insight.message}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
