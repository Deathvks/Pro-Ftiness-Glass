/* mobile/src/components/routines/RoutineCard.tsx */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import {
  Play, Globe, Users, Lock, Clock, Dumbbell, CalendarClock,
  CheckCircle, Edit, Copy, Trash2, Share2, Folder, Link2, Activity
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import {
  getContrastTextColor,
  calculateRoutineEstimatedTime,
  groupExercises,
  getDisplayImageUrl
} from '@/utils/routineHelpers';

interface RoutineCardProps {
  routine: any;
  onPressStart: () => void;
  onPressEdit: () => void;
  onPressDuplicate: () => void;
  onPressDelete: () => void;
  onPressShare?: () => void;
  onPressPrivacy: () => void;
  onPressVolumeFilter?: () => void;
  volumeInclusionStats?: { included: number; total: number; status: 'all' | 'partial' | 'none' };
  isCompletedToday: boolean;
  isActive: boolean;
  isBlockedByOtherWorkout: boolean;
  lastUsedDate?: Date | null;
}

export function RoutineCard({
  routine,
  onPressStart,
  onPressEdit,
  onPressDuplicate,
  onPressDelete,
  onPressShare,
  onPressPrivacy,
  onPressVolumeFilter,
  volumeInclusionStats,
  isCompletedToday,
  isActive,
  isBlockedByOtherWorkout,
  lastUsedDate,
}: RoutineCardProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const iconBadgeBg = isDark
    ? (isIOS ? '#2C2C2E' : 'rgba(255, 255, 255, 0.06)')
    : (isIOS ? '#F2F2F7' : 'rgba(0, 0, 0, 0.05)');
  const innerPillBg = isDark
    ? (isIOS ? '#3A3A3C' : 'rgba(255, 255, 255, 0.06)')
    : (isIOS ? '#E5E5EA' : 'rgba(0, 0, 0, 0.05)');
  const startTextColor = getContrastTextColor(colors.tint);

  const exercises = routine.exercises || routine.RoutineExercises || [];
  const totalExercises = exercises.length;
  const estimatedTime = useMemo(() => {
    return calculateRoutineEstimatedTime(exercises, userProfile?.goal);
  }, [exercises, userProfile?.goal]);

  const exerciseGroups = useMemo(() => {
    return groupExercises(exercises);
  }, [exercises]);

  const rawImage = routine.image_url || routine.imageUrl;
  const imageSrc = getDisplayImageUrl(rawImage);

  const lastUsedFormatted = useMemo(() => {
    if (!lastUsedDate) return null;
    return new Date(lastUsedDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }, [lastUsedDate]);

  const renderVisibilityBadge = () => {
    let Icon = Lock;
    let label = 'Privada';

    if (routine.visibility === 'public') {
      Icon = Globe;
      label = 'Pública';
    } else if (routine.visibility === 'friends') {
      Icon = Users;
      label = 'Amigos';
    }

    return (
      <View style={[styles.badgePill, { backgroundColor: iconBadgeBg }]}>
        <Icon size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
        <Text style={[styles.badgePillText, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={[
      styles.card,
      getAppleCardSurfaceStyle(theme, 20),
      {
        overflow: 'hidden',
        borderColor: isActive ? colors.tint : (isIOS ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)')),
        borderWidth: isActive ? 2 : (isIOS ? 0 : 1),
      },
      !isIOS && {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.65)',
      },
    ]}>
      {/* iOS Liquid Glass Effect Background on photo themes */}
      {shouldUseContentGlass(theme) && (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 28 }]}
        />
      )}

      {/* 1. IMAGEN DE CABECERA (SI TIENE) */}
      {imageSrc && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageSrc }}
            style={styles.imageCover}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.imageOverlay} />
          {routine.folder ? (
            <View style={styles.floatingFolderTag}>
              <Folder size={11} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.floatingFolderText} numberOfLines={1}>{routine.folder}</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.cardBody}>
        {/* CARPETA (SI NO TIENE IMAGEN) */}
        {!imageSrc && routine.folder ? (
          <View style={[styles.folderBadgeNoImg, { backgroundColor: colors.tint + '15' }]}>
            <Folder size={11} color={colors.tint} style={{ marginRight: 4 }} />
            <Text style={[styles.folderTextNoImg, { color: colors.tint }]} numberOfLines={1}>
              {routine.folder}
            </Text>
          </View>
        ) : null}

        {/* TÍTULO Y BADGES DE ESTADO */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }, isIOS && { fontWeight: '700' }]} numberOfLines={2}>
            {routine.name}
          </Text>

          <View style={styles.badgesInline}>
            {isActive && (
              <View style={[styles.badgePill, { backgroundColor: colors.tint + '20' }]}>
                <Text style={[styles.badgePillText, { color: colors.tint }]}>ACTIVO</Text>
              </View>
            )}
            {renderVisibilityBadge()}
          </View>
        </View>

        {/* DESCRIPCIÓN */}
        {routine.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {routine.description}
          </Text>
        ) : null}

        {/* STATS ROW (TIEMPO, EJERCICIOS, ÚLTIMA FECHA, COMPLETADA) */}
        <View style={styles.statsPillsRow}>
          {isCompletedToday ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.statPill, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <CheckCircle size={12} color="#22c55e" style={{ marginRight: 4 }} />
                <Text style={[styles.statPillText, { color: '#22c55e' }]}>Completada</Text>
              </View>
              {onPressShare && (
                <TouchableOpacity
                  onPress={onPressShare}
                  activeOpacity={0.75}
                  style={[styles.storiesPill, { backgroundColor: colors.tint + '20' }]}
                >
                  <Share2 size={11} color={colors.tint} style={{ marginRight: 4 }} />
                  <Text style={[styles.storiesPillText, { color: colors.tint }]}>Stories</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <View style={[styles.statPill, { backgroundColor: iconBadgeBg }]}>
            <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.statPillText, { color: colors.textSecondary }]}>~{estimatedTime} min</Text>
          </View>

          <View style={[styles.statPill, { backgroundColor: iconBadgeBg }]}>
            <Dumbbell size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.statPillText, { color: colors.textSecondary }]}>{totalExercises} ejercicios</Text>
          </View>

          <View style={[styles.statPill, { backgroundColor: iconBadgeBg }]}>
            <CalendarClock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.statPillText, { color: colors.textSecondary }]}>
              {lastUsedFormatted || 'Sin uso'}
            </Text>
          </View>
        </View>

        {/* BARRA DE ACCIONES INLINE */}
        <View style={styles.actionsBar}>
          {/* Privacidad */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: iconBadgeBg }]}
            onPress={onPressPrivacy}
            activeOpacity={0.7}
            accessibilityLabel="Privacidad de rutina"
          >
            <Globe size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Compartir entreno */}
          {onPressShare && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: iconBadgeBg }]}
              onPress={onPressShare}
              activeOpacity={0.7}
              accessibilityLabel="Compartir entreno"
            >
              <Share2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Editar */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: iconBadgeBg }]}
            onPress={onPressEdit}
            activeOpacity={0.7}
            accessibilityLabel="Editar rutina"
          >
            <Edit size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Duplicar */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: iconBadgeBg }]}
            onPress={onPressDuplicate}
            activeOpacity={0.7}
            accessibilityLabel="Duplicar rutina"
          >
            <Copy size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Recuento de series semanales pill */}
          {onPressVolumeFilter && (
            <TouchableOpacity
              onPress={onPressVolumeFilter}
              activeOpacity={0.75}
              style={[
                styles.volumePillBtn,
                {
                  backgroundColor:
                    volumeInclusionStats?.status === 'all'
                      ? colors.tint + '18'
                      : volumeInclusionStats?.status === 'partial'
                      ? 'rgba(245, 158, 11, 0.18)'
                      : iconBadgeBg,
                },
              ]}
            >
              <Activity
                size={13}
                color={
                  volumeInclusionStats?.status === 'all'
                    ? colors.tint
                    : volumeInclusionStats?.status === 'partial'
                    ? '#f59e0b'
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.volumePillText,
                  {
                    color:
                      volumeInclusionStats?.status === 'all'
                        ? colors.tint
                        : volumeInclusionStats?.status === 'partial'
                        ? '#f59e0b'
                        : colors.textSecondary,
                  },
                ]}
              >
                {volumeInclusionStats
                  ? volumeInclusionStats.status === 'all'
                    ? `Series: Todas (${volumeInclusionStats.total})`
                    : volumeInclusionStats.status === 'none'
                    ? 'Series: 0'
                    : `Series: ${volumeInclusionStats.included}/${volumeInclusionStats.total}`
                  : 'Series sem.'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }} />

          {/* Eliminar */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
            onPress={onPressDelete}
            activeOpacity={0.7}
            accessibilityLabel="Eliminar rutina"
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* LISTA PREVIA DE EJERCICIOS CON SUPERSERIES Y BANNER DE RECUENTO */}
        {exerciseGroups.length > 0 && (
          <View style={[styles.previewBox, { backgroundColor: iconBadgeBg, borderColor: isIOS ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'), borderWidth: isIOS ? 0 : 1 }]}>
            {onPressVolumeFilter && (
              <TouchableOpacity
                onPress={onPressVolumeFilter}
                style={[
                  styles.volumeHeaderRow,
                  { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Activity size={13} color={colors.tint} />
                  <Text style={[styles.volumeHeaderTitle, { color: colors.textSecondary }]}>
                    Recuento semanal:{' '}
                    <Text style={{ color: colors.text, fontWeight: '700' }}>
                      {volumeInclusionStats
                        ? volumeInclusionStats.status === 'all'
                          ? `Todos (${volumeInclusionStats.total})`
                          : volumeInclusionStats.status === 'none'
                          ? 'Ninguno (0)'
                          : `${volumeInclusionStats.included} de ${volumeInclusionStats.total}`
                        : 'Todos'}
                    </Text>
                  </Text>
                </View>
                <View style={[styles.choosePill, { backgroundColor: colors.tint + '20' }]}>
                  <Text style={[styles.choosePillText, { color: colors.tint }]}>Elegir</Text>
                </View>
              </TouchableOpacity>
            )}

            {exerciseGroups.map((group, gIdx) => {
              const isSuperset = group.length > 1;

              return (
                <View key={gIdx} style={gIdx > 0 ? { marginTop: 10 } : undefined}>
                  {isSuperset && (
                    <View style={styles.supersetTag}>
                      <Link2 size={11} color={colors.tint} style={{ marginRight: 4 }} />
                      <Text style={[styles.supersetTagText, { color: colors.tint }]}>SUPERSERIE</Text>
                    </View>
                  )}

                  <View style={[styles.groupContainer, isSuperset && { borderLeftWidth: 2, borderLeftColor: colors.tint, paddingLeft: 8 }]}>
                    {group.map((ex, eIdx) => (
                      <View key={ex.id || ex.tempId || eIdx} style={styles.exerciseRow}>
                        <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                          {ex.name || ex.exercise?.name || 'Ejercicio'}
                        </Text>
                        <View style={[styles.repsPill, { backgroundColor: innerPillBg }]}>
                          <Text style={[styles.repsPillText, { color: colors.textSecondary }]}>
                            {ex.sets}×{ex.reps}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* BOTÓN GRANDE PRINCIPAL (INICIAR / CONTINUAR / BLOQUEADO / COMPLETADO) - LIQUID GLASS */}
        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {}
            onPressStart();
          }}
          disabled={isCompletedToday || isBlockedByOtherWorkout}
          activeOpacity={0.82}
          style={[
            styles.mainButton,
            isCompletedToday ? {
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.14)' : 'rgba(34, 197, 94, 0.1)',
              borderColor: 'rgba(34, 197, 94, 0.35)',
              borderWidth: isIOS ? 0 : 1,
            } : isActive ? {
              backgroundColor: colors.tint,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.8)',
              borderWidth: isIOS ? 0 : 1.2,
              shadowColor: colors.tint,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isIOS ? 0.2 : (isDark ? 0.5 : 0.3),
              shadowRadius: 10,
              elevation: 5,
            } : isBlockedByOtherWorkout ? {
              backgroundColor: isIOS ? iconBadgeBg : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              borderWidth: isIOS ? 0 : 1,
            } : {
              backgroundColor: colors.tint,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.85)',
              borderWidth: isIOS ? 0 : 1.2,
              shadowColor: colors.tint,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isIOS ? 0.2 : (isDark ? 0.45 : 0.28),
              shadowRadius: 10,
              elevation: 5,
            }
          ]}
        >
          {!isActive && !isCompletedToday && isBlockedByOtherWorkout && (
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          )}
          {/* Reflejo superior Liquid Glass en Android */}
          {!isIOS && (
            <View
              style={[
                styles.buttonHighlight,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.22)'
                    : 'rgba(255, 255, 255, 0.45)',
                },
              ]}
            />
          )}

          <View style={styles.mainButtonInner}>
            {isActive ? (
              <>
                <Clock size={18} color={startTextColor} style={{ marginRight: 8 }} />
                <Text style={[styles.mainButtonText, { color: startTextColor }]}>
                  Continuar Entrenamiento
                </Text>
              </>
            ) : isBlockedByOtherWorkout ? (
              <>
                <Lock size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.mainButtonText, { color: colors.textSecondary }]}>
                  Entrenamiento en Curso
                </Text>
              </>
            ) : isCompletedToday ? (
              <>
                <CheckCircle size={18} color="#22c55e" style={{ marginRight: 8 }} />
                <Text style={[styles.mainButtonText, { color: '#22c55e' }]}>
                  Completado hoy
                </Text>
              </>
            ) : (
              <>
                <Play size={18} color={startTextColor} fill={startTextColor} style={{ marginRight: 8 }} />
                <Text style={[styles.mainButtonText, { color: startTextColor }]}>
                  Empezar Entrenamiento
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderCurve: 'continuous',
    marginBottom: 16,
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  imageCover: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  floatingFolderTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  floatingFolderText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 18,
  },
  folderBadgeNoImg: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderCurve: 'continuous',
    marginBottom: 8,
  },
  folderTextNoImg: {
    fontSize: 11,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.3,
  },
  badgesInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 12,
  },
  statsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  storiesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  storiesPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  volumePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  previewBox: {
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 12,
    marginBottom: 14,
  },
  volumeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  volumeHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  choosePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  choosePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  supersetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  supersetTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  groupContainer: {
    gap: 6,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  repsPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  repsPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mainButton: {
    height: 48,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonHighlight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1.5,
    borderRadius: 1,
  },
  mainButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
