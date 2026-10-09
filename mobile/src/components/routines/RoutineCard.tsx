/* mobile/src/components/routines/RoutineCard.tsx */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { 
  Play, Globe, Users, Lock, Clock, Dumbbell, CalendarClock, 
  CheckCircle, Edit, Copy, Trash2, Share2, Folder, Link2 
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
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
  isCompletedToday,
  isActive,
  isBlockedByOtherWorkout,
  lastUsedDate,
}: RoutineCardProps) {
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const iconBadgeBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
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
      { 
        overflow: 'hidden',
        borderColor: isActive ? colors.tint : colors.border,
        backgroundColor: 'transparent',
        borderWidth: isActive ? 2 : 1,
      }
    ]}>
      <GlassView 
        glassEffectStyle="regular" 
        colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} 
        style={StyleSheet.absoluteFill} 
      />

      {/* 1. IMAGEN DE CABECERA (SI TIENE) */}
      {imageSrc && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageSrc }} 
            style={styles.imageCover} 
            resizeMode="cover" 
          />
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
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
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
          {isCompletedToday && (
            <View style={[styles.statPill, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <CheckCircle size={12} color="#22c55e" style={{ marginRight: 4 }} />
              <Text style={[styles.statPillText, { color: '#22c55e' }]}>Completada</Text>
            </View>
          )}

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

        {/* BARRA DE ACCIONES INLINE (PRIVACIDAD, COMPARTIR, EDITAR, DUPLICAR, ELIMINAR) */}
        <View style={styles.actionsBar}>
          {/* Privacidad */}
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: iconBadgeBg }]} 
            onPress={onPressPrivacy}
            activeOpacity={0.7}
          >
            <Globe size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Compartir entreno (si completada hoy) */}
          {isCompletedToday && onPressShare ? (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: iconBadgeBg }]} 
              onPress={onPressShare}
              activeOpacity={0.7}
            >
              <Share2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}

          {/* Editar */}
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: iconBadgeBg }]} 
            onPress={onPressEdit}
            activeOpacity={0.7}
          >
            <Edit size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Duplicar */}
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: iconBadgeBg }]} 
            onPress={onPressDuplicate}
            activeOpacity={0.7}
          >
            <Copy size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {/* Eliminar */}
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]} 
            onPress={onPressDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* LISTA PREVIA DE EJERCICIOS CON SUPERSERIES */}
        {exerciseGroups.length > 0 && (
          <View style={[styles.previewBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
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
                        <View style={[styles.repsPill, { backgroundColor: iconBadgeBg }]}>
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

        {/* BOTÓN GRANDE PRINCIPAL (INICIAR / CONTINUAR / BLOQUEADO / COMPLETADO) */}
        <TouchableOpacity
          onPress={onPressStart}
          disabled={isCompletedToday || isBlockedByOtherWorkout}
          activeOpacity={0.85}
          style={[
            styles.mainButton,
            {
              backgroundColor: isCompletedToday || isBlockedByOtherWorkout
                ? iconBadgeBg
                : colors.tint,
            }
          ]}
        >
          {isCompletedToday ? (
            <>
              <CheckCircle size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.mainButtonText, { color: colors.textSecondary }]}>
                Entrenamiento Completado
              </Text>
            </>
          ) : isActive ? (
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
          ) : (
            <>
              <Play 
                size={18} 
                color={startTextColor} 
                fill={startTextColor} 
                style={{ marginRight: 8 }} 
              />
              <Text style={[styles.mainButtonText, { color: startTextColor }]}>
                Empezar Entrenamiento
              </Text>
            </>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1f1f23',
  },
  imageCover: {
    width: '100%',
    height: '100%',
  },
  floatingFolderTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  floatingFolderText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 120,
  },
  cardBody: {
    padding: 18,
  },
  folderBadgeNoImg: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  folderTextNoImg: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  titleRow: {
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  badgesInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  statsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    marginBottom: 14,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  supersetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  supersetTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  groupContainer: {
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  exerciseName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  repsPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  repsPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 20,
    marginTop: 4,
  },
  mainButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
