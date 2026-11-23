import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Flame, Scale, Dumbbell, TrendingUp, Target } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { getAppleCardSurfaceStyle, isAtmosphericTheme, shouldUseContentGlass } from '@/constants/theme';

export default function DashboardInsights({ workoutLog, bodyWeightLog, colors }: any) {
  const theme = useAppStore(state => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const useGlass = shouldUseContentGlass(theme);
  const surface = (isIOS || isAtmosphericTheme(theme)) && getAppleCardSurfaceStyle(theme, 24);

  const insights = useMemo(() => {
    const alerts = [];
    const today = new Date();

    const getDaysDiff = (dateStr: string) => {
      if (!dateStr) return 999;
      const diffTime = Math.abs(today.getTime() - new Date(dateStr).getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    if (workoutLog && workoutLog.length > 0) {
      const strengthLogs = workoutLog.filter(
        (l: any) => Array.isArray(l?.WorkoutLogDetails) && l.WorkoutLogDetails.length > 0
      );
      if (strengthLogs.length > 0 && strengthLogs.length < 3) {
        let bestEx: { name: string; weight: number; reps: number; score: number } | null = null;
        strengthLogs[0].WorkoutLogDetails.forEach((detail: any) => {
          const exName = (detail?.exercise_name || '').trim();
          if (!exName) return;
          const sets = Array.isArray(detail?.WorkoutLogSets) ? detail.WorkoutLogSets : [];
          const validSets = sets.filter(
            (s: any) => !(s?.is_warmup === true || s?.is_warmup === 'true' || s?.is_warmup === 1) && (parseInt(s?.reps, 10) || 0) > 0
          );
          const effectiveSets = validSets.length > 0 ? validSets : sets.filter((s: any) => (parseInt(s?.reps, 10) || 0) > 0);
          if (effectiveSets.length === 0) return;

          let bestW = 0;
          let bestR = 0;
          effectiveSets.forEach((s: any) => {
            const w = parseFloat(s.weight_kg) || 0;
            const r = parseInt(s.reps, 10) || 0;
            if (w > bestW || (w === bestW && r > bestR)) {
              bestW = w;
              bestR = r;
            }
          });
          const score = bestW > 0 ? bestW * 100 + bestR : bestR;
          if (!bestEx || score > bestEx.score) {
            bestEx = { name: exName, weight: Math.round(bestW * 10) / 10, reps: bestR, score };
          }
        });

        if (bestEx) {
          const picked = bestEx as { name: string; weight: number; reps: number; score: number };
          const targetDesc =
            picked.weight > 0 && picked.reps >= 12
              ? `Sube a ${Math.round((picked.weight + 2.5) * 10) / 10} kg en tu próxima sesión (${strengthLogs.length}/3 sesiones calibradas).`
              : picked.weight > 0
              ? `Busca ${picked.weight} kg × ${picked.reps + 1} reps (+1 rep) en tu siguiente entreno (${strengthLogs.length}/3 calibradas).`
              : `Intenta superar tus ${picked.reps} reps llegando a ${picked.reps + 1} reps (${strengthLogs.length}/3 calibradas).`;
          alerts.push({
            id: 'next-session-target',
            icon: Target,
            title: `Meta Día 2 · ${picked.name}`,
            message: targetDesc,
            color: colors.tint,
          });
        }
      }

      const daysSinceLastWorkout = getDaysDiff(workoutLog[0].workout_date);
      if (daysSinceLastWorkout > 3) {
        alerts.push({
          id: 'inactivity',
          icon: Flame,
          title: '¡Hora de moverse!',
          message: `Llevas ${daysSinceLastWorkout} días sin entrenar. No pierdas el ritmo, haz aunque sea una sesión rápida.`,
          color: theme === 'ocean' ? '#d97706' : colors.warning
        });
      }
    } else {
      alerts.push({
        id: 'first-workout',
        icon: Dumbbell,
        title: '¡Empieza tu viaje!',
        message: 'Ve a la sección de rutinas y registra tu primer entrenamiento para empezar a ver estadísticas.',
        color: theme === 'ocean' ? '#0284c7' : colors.tint
      });
    }

    if (bodyWeightLog && bodyWeightLog.length > 0) {
      const daysSinceLastWeight = getDaysDiff(bodyWeightLog[0].log_date);
      if (daysSinceLastWeight > 7) {
        alerts.push({
          id: 'weight-reminder',
          icon: Scale,
          title: 'Actualiza tu peso',
          message: 'Llevas más de una semana sin registrar tu peso. Mantenlo actualizado para ajustar tus métricas.',
          color: theme === 'ocean' ? '#0284c7' : colors.tint
        });
      }
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'all-good',
        icon: TrendingUp,
        title: '¡Todo en orden!',
        message: 'Tus registros están al día. Sigue así para mantener tus estadísticas precisas.',
        color: colors.success || '#10B981'
      });
    }

    return alerts;
  }, [workoutLog, bodyWeightLog, colors, theme]);

  if (!insights.length) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      {insights.map(insight => {
        const Icon = insight.icon;
        return (
          <View
            key={insight.id}
            style={[
              {
                borderRadius: isIOS ? 20 : 24,
                borderCurve: 'continuous',
                marginBottom: 12,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                backgroundColor: 'transparent',
              },
              surface,
            ]}
          >
            {useGlass && (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 24 }]}
              />
            )}
            <View style={{ backgroundColor: isIOS ? 'transparent' : insight.color + '12', padding: isIOS ? 16 : 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={
                    isIOS
                      ? {
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          borderCurve: 'continuous',
                          backgroundColor: insight.color + '1F',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 14,
                        }
                      : { marginRight: 16 }
                  }
                >
                  <Icon size={isIOS ? 20 : 24} color={insight.color} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: isIOS ? 16 : 16,
                      fontWeight: isIOS ? '600' : 'bold',
                      letterSpacing: isIOS ? -0.3 : 0,
                      color: isIOS ? colors.text : insight.color,
                      marginBottom: 2,
                    }}
                  >
                    {insight.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: isIOS ? 13 : 14,
                      lineHeight: isIOS ? 18 : 20,
                    }}
                  >
                    {insight.message}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
