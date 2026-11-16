import React, { forwardRef, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, Dumbbell, Flame, Sparkles, Trophy, User, Zap } from 'lucide-react-native';

import { BACKEND_BASE_URL } from '@/services/apiClient';
import { formatWorkoutTime } from '@/utils/workoutHelpers';

interface WorkoutShareCardProps {
  workoutData: any;
  userName?: string;
  userAvatar?: string | null;
  accentColor?: string;
  musclesTrained?: string[];
  newPRs?: string[];
}

export const WorkoutShareCard = forwardRef<React.ComponentRef<typeof View>, WorkoutShareCardProps>(
  ({ workoutData, userName, userAvatar, accentColor = '#22c55e', musclesTrained = [], newPRs = [] }, ref) => {
    const safeName = workoutData?.routineName || 'Entrenamiento Libre';
    const details: any[] = workoutData?.details || [];

    const avatarUrl = useMemo(() => {
      if (!userAvatar) return null;
      if (userAvatar.startsWith('http') || userAvatar.startsWith('data:')) return userAvatar;
      return `${BACKEND_BASE_URL}${userAvatar.startsWith('/') ? '' : '/'}${userAvatar}`;
    }, [userAvatar]);

    const { totalVolume, totalSets } = useMemo(() => {
      let vol = 0;
      let sets = 0;
      details.forEach(ex => {
        (ex.setsDone || []).forEach((s: any) => {
          vol += (parseFloat(s.weight_kg) || 0) * (parseInt(s.reps, 10) || 0);
          sets += 1;
        });
      });
      return { totalVolume: Math.round(vol), totalSets: sets };
    }, [details]);

    const computedMuscles = useMemo(() => {
      if (musclesTrained.length > 0) return musclesTrained;
      const set = new Set<string>();
      details.forEach(ex => {
        const mg = ex.muscle_group || ex.muscles || ex.category;
        if (mg) {
          String(mg)
            .split(',')
            .map(m => m.trim())
            .filter(Boolean)
            .forEach(m => set.add(m));
        }
      });
      return Array.from(set).slice(0, 4);
    }, [details, musclesTrained]);

    const rawDate = workoutData?.workout_date || workoutData?.date;
    const d = rawDate ? new Date(rawDate) : new Date();
    const dateLabel = isNaN(d.getTime())
      ? 'HOY'
      : d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <LinearGradient colors={['#09090b', '#111827', '#050507']} style={StyleSheet.absoluteFill} />
        <View style={[styles.glowOrb, { top: -50, left: -50, backgroundColor: accentColor + '33' }]} />
        <View style={[styles.glowOrb, { bottom: -50, right: -50, backgroundColor: '#3b82f633' }]} />

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.athleteRow}>
            <View style={[styles.avatarCircle, { borderColor: accentColor }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <User size={18} color={accentColor} />
              )}
            </View>
            <View>
              <Text style={styles.username}>{userName || 'Atleta'}</Text>
              <Text style={[styles.tagText, { color: accentColor }]}>SESIÓN COMPLETADA</Text>
            </View>
          </View>
          <View style={styles.datePill}>
            <Calendar size={11} color="#9ca3af" />
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
        </View>

        {/* Routine Title */}
        <View style={styles.heroBlock}>
          <Text style={styles.routineTitle} numberOfLines={2}>
            {safeName}
          </Text>
          {computedMuscles.length > 0 && (
            <View style={styles.musclesRow}>
              {computedMuscles.map(m => (
                <View key={m} style={[styles.musclePill, { borderColor: accentColor + '55', backgroundColor: accentColor + '1A' }]}>
                  <Text style={[styles.muscleText, { color: accentColor }]}>{m}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Clock size={14} color="#38bdf8" />
            <Text style={styles.statVal}>{formatWorkoutTime(workoutData?.duration_seconds || 0)}</Text>
            <Text style={styles.statLabel}>TIEMPO</Text>
          </View>
          <View style={styles.statBox}>
            <Dumbbell size={14} color={accentColor} />
            <Text style={styles.statVal}>{totalVolume.toLocaleString('es-ES')} kg</Text>
            <Text style={styles.statLabel}>VOLUMEN</Text>
          </View>
          <View style={styles.statBox}>
            <Flame size={14} color="#f97316" />
            <Text style={styles.statVal}>{workoutData?.calories_burned || 0} kcal</Text>
            <Text style={styles.statLabel}>CALORÍAS</Text>
          </View>
          <View style={styles.statBox}>
            <Zap size={14} color="#a855f7" />
            <Text style={styles.statVal}>{totalSets}</Text>
            <Text style={styles.statLabel}>SERIES</Text>
          </View>
        </View>

        {/* Highlights */}
        <View style={styles.exercisesWrap}>
          {details.slice(0, 5).map((ex, i) => {
            const best = (ex.setsDone || []).reduce(
              (mx: number, s: any) => Math.max(mx, parseFloat(s.weight_kg) || 0),
              0
            );
            return (
              <View key={i} style={styles.exRow}>
                <Text style={styles.exName} numberOfLines={1}>
                  {ex.exerciseName || ex.name}
                </Text>
                <Text style={[styles.exBest, { color: accentColor }]}>
                  {best > 0 ? `${best} kg` : `${(ex.setsDone || []).length} series`}
                </Text>
              </View>
            );
          })}
          {details.length > 5 && (
            <Text style={styles.moreEx}>+ {details.length - 5} ejercicios más</Text>
          )}
        </View>

        {newPRs.length > 0 && (
          <View style={styles.prBanner}>
            <Trophy size={13} color="#eab308" />
            <Text style={styles.prBannerText}>{newPRs.length} nuevo(s) récord(s) personal(es)</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={styles.brandRow}>
            <Sparkles size={13} color={accentColor} />
            <Text style={styles.brandText}>PRO FITNESS GLASS</Text>
          </View>
          <Text style={styles.hashText}>profitnessglass.es</Text>
        </View>
      </View>
    );
  }
);

WorkoutShareCard.displayName = 'WorkoutShareCard';

const styles = StyleSheet.create({
  card: {
    width: 340,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    gap: 14,
  },
  glowOrb: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  athleteRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatarImg: { width: '100%', height: '100%' },
  username: { color: '#ffffff', fontSize: 13.5, fontWeight: '800' },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dateText: { color: '#d1d5db', fontSize: 10, fontWeight: '700' },
  heroBlock: { gap: 8 },
  routineTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  musclesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  musclePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  muscleText: { fontSize: 10, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: {
    width: '48.5%',
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 3,
  },
  statVal: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  statLabel: { color: '#9ca3af', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6 },
  exercisesWrap: { gap: 6 },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 8,
  },
  exName: { color: '#e5e7eb', fontSize: 12, fontWeight: '700', flex: 1 },
  exBest: { fontSize: 12, fontWeight: '900' },
  moreEx: { color: '#9ca3af', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  prBannerText: { color: '#fde047', fontSize: 11.5, fontWeight: '800' },
  footerRow: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  brandText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  hashText: { color: '#9ca3af', fontSize: 11, fontWeight: '700' },
});

export default WorkoutShareCard;
