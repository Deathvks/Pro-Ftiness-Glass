import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Share as NativeShare,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  Calendar,
  Download,
  Dumbbell,
  Link2,
  Share2,
  User,
} from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import {
  getAppleCardSurfaceStyle,
  getThemeBaseBackground,
  shouldUseContentGlass,
} from '@/constants/theme';
import { getContrastTextColor } from '@/utils/colorUtils';
import { buildSharedRoutineUrl } from '@/utils/deepLinking';
import { getDisplayImageUrl, resolveRoutineCoverPreset } from '@/utils/routineHelpers';
import { getThemedModalCardColor } from '@/components/ui/ModalThemeBackground';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { forkRoutine, getPublicRoutine } from '@/services/routineService';
import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';
import { AndroidHeaderBlurTarget } from '@/components/AndroidHeaderBlur';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';

export default function SharedRoutinePreviewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const routineId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore((s: any) => s.theme) || 'oled';
  const isAuthenticated = useAppStore((s: any) => s.isAuthenticated);
  const fetchInitialData = useAppStore((s: any) => s.fetchInitialData);
  const { showToast } = useToast();

  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const useGlass = shouldUseContentGlass(theme);
  const tintText = getContrastTextColor(colors.tint);

  const [routine, setRoutine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const androidBlurTarget = useRef<React.ComponentRef<typeof View>>(null);

  const getMediaUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (!routineId) {
      setError('Enlace de rutina inválido.');
      setLoading(false);
      return;
    }

    let active = true;
    const loadRoutine = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicRoutine(routineId);
        if (active) setRoutine(data);
      } catch (err: any) {
        if (!active) return;
        const msg =
          err?.status === 403
            ? 'No tienes permiso para ver o copiar esta rutina (Solo Amigos/Privada).'
            : err?.message ||
              'No se pudo cargar la rutina. Es posible que sea privada o no exista.';
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadRoutine();
    return () => {
      active = false;
    };
  }, [routineId]);

  const exerciseGroups = useMemo(() => {
    const exercises = routine?.exercises || routine?.RoutineExercises;
    if (!Array.isArray(exercises) || exercises.length === 0) return [];

    const sorted = [...exercises].sort(
      (a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0),
    );
    const groups: any[][] = [];
    let currentGroup: any[] = [];

    for (const ex of sorted) {
      if (currentGroup.length === 0) {
        currentGroup.push(ex);
        continue;
      }
      if (
        ex.superset_group_id !== null &&
        ex.superset_group_id !== undefined &&
        currentGroup[0].superset_group_id === ex.superset_group_id
      ) {
        currentGroup.push(ex);
      } else {
        groups.push(currentGroup);
        currentGroup = [ex];
      }
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    return groups;
  }, [routine]);

  const handleImport = async () => {
    if (!routineId || !routine) return;
    if (!isAuthenticated) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('post_auth_redirect', `/share/routine/${routineId}`);
        }
      } catch {}
      showToast('Inicia sesión para importar esta rutina.');
      router.push('/login');
      return;
    }

    setImporting(true);
    try {
      const creatorName = routine.creatorName || routine.user?.username || 'Usuario Desconocido';
      const folderName = `Compartido de ${creatorName}`;
      await forkRoutine(routineId, folderName);
      await fetchInitialData?.();
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      showToast('¡Rutina importada con éxito!');
      router.replace('/(tabs)/routines' as any);
    } catch (err: any) {
      showToast(err?.message || 'Error al importar la rutina.');
    } finally {
      setImporting(false);
    }
  };

  const handleShareUrl = async () => {
    if (!routineId || !routine) return;
    const url = buildSharedRoutineUrl(routineId);
    try {
      await NativeShare.share({
        title: `Rutina: ${routine.name}`,
        message: `¡Echa un vistazo a la rutina "${routine.name}" en Pro Fitness Glass!\n${url}`,
        url,
      });
    } catch {}
  };

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else if (isAuthenticated) {
      router.replace('/(tabs)/routines' as any);
    } else {
      router.replace('/login');
    }
  }, [router, isAuthenticated]);

  const bgColor =
    colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <AndroidHeaderBlurTarget target={androidBlurTarget}>
        <ThemeBackground />

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>
              Cargando rutina compartida...
            </Text>
          </View>
        ) : error || !routine ? (
          <View style={[styles.centerState, { paddingHorizontal: 28 }]}>
            <View style={styles.errorIconCircle}>
              <AlertTriangle size={38} color="#ef4444" />
            </View>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Rutina no disponible
            </Text>
            <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
              {error ||
                'El enlace podría estar roto, la rutina fue eliminada o no tienes permisos para verla.'}
            </Text>
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.82}
              style={[styles.fallbackBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.fallbackBtnText, { color: tintText }]}>
                {isAuthenticated ? 'Ir al Inicio' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingTop: insets.top + 74,
              paddingBottom: insets.bottom + 40,
              paddingHorizontal: 16,
              gap: 16,
            }}
          >
            {/* Routine Header Card */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  ...(isIOS ? getAppleCardSurfaceStyle(theme, 26) : null),
                },
              ]}
            >
              {useGlass && (
                <GlassView
                  pointerEvents="none"
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
                />
              )}

              {(() => {
                const preset = resolveRoutineCoverPreset(routine.cover_image_url, {
                  tint: colors.tint,
                  baseBg: getThemeBaseBackground(theme),
                  secondaryBg: theme === 'light' ? '#f1f5f9' : getThemedModalCardColor(theme),
                  isDark,
                });
                if (preset) {
                  return (
                    <View style={[styles.coverImage, { backgroundColor: getThemeBaseBackground(theme) }]}>
                      <LinearGradient
                        colors={preset.colors}
                        start={preset.start}
                        end={preset.end}
                        style={StyleSheet.absoluteFill}
                      />
                    </View>
                  );
                }
                const resolvedCover = getDisplayImageUrl(routine.cover_image_url) || getMediaUrl(routine.cover_image_url);
                if (!resolvedCover) return null;
                return (
                  <Image
                    source={{ uri: resolvedCover }}
                    style={styles.coverImage}
                    contentFit="cover"
                  />
                );
              })()}

              <View style={styles.heroBody}>
                {/* Creator row */}
                <TouchableOpacity
                  activeOpacity={routine.user_id && isAuthenticated ? 0.75 : 1}
                  disabled={!routine.user_id || !isAuthenticated}
                  onPress={() => {
                    if (routine.user_id && isAuthenticated) {
                      router.push(`/public-profile/${routine.user_id}` as any);
                    }
                  }}
                  style={styles.creatorRow}
                >
                  {routine.creatorAvatar ? (
                    <Image
                      source={{ uri: getMediaUrl(routine.creatorAvatar) || undefined }}
                      style={styles.creatorAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.creatorAvatarFallback,
                        { backgroundColor: colors.tint + '1F' },
                      ]}
                    >
                      <User size={16} color={colors.tint} />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.creatorLabel, { color: colors.textSecondary }]}>
                      Compartida por
                    </Text>
                    <Text style={[styles.creatorName, { color: colors.text }]} numberOfLines={1}>
                      {routine.creatorName || routine.user?.username || 'Atleta Pro Fitness'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleShareUrl}
                    hitSlop={10}
                    style={[
                      styles.shareIconBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.05)',
                      },
                    ]}
                  >
                    <Share2 size={17} color={colors.tint} />
                  </TouchableOpacity>
                </TouchableOpacity>

                <Text style={[styles.routineTitle, { color: colors.text }]}>
                  {routine.name}
                </Text>

                {Boolean(routine.description) && (
                  <Text style={[styles.routineDesc, { color: colors.textSecondary }]}>
                    {routine.description}
                  </Text>
                )}

                <View style={styles.metaPillsRow}>
                  <View style={[styles.metaPill, { backgroundColor: colors.tint + '18' }]}>
                    <Dumbbell size={13} color={colors.tint} />
                    <Text style={[styles.metaPillText, { color: colors.tint }]}>
                      {(routine.exercises || routine.RoutineExercises || []).length} ejercicios
                    </Text>
                  </View>

                  {Boolean(routine.created_at) && (
                    <View
                      style={[
                        styles.metaPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.07)'
                            : 'rgba(0,0,0,0.05)',
                        },
                      ]}
                    >
                      <Calendar size={13} color={colors.textSecondary} />
                      <Text style={[styles.metaPillText, { color: colors.textSecondary }]}>
                        {new Date(routine.created_at).toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleImport}
                  disabled={importing}
                  activeOpacity={0.85}
                  style={[
                    styles.importBtn,
                    { backgroundColor: colors.tint, opacity: importing ? 0.65 : 1 },
                  ]}
                >
                  {importing ? (
                    <ActivityIndicator size="small" color={tintText} />
                  ) : (
                    <>
                      <Download size={18} color={tintText} strokeWidth={2.4} />
                      <Text style={[styles.importBtnText, { color: tintText }]}>
                        {isAuthenticated
                          ? 'Importar a Mis Rutinas'
                          : 'Iniciar sesión para importar'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Exercises List */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
              EJERCICIOS DE LA RUTINA
            </Text>

            {exerciseGroups.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Esta rutina no tiene ejercicios visibles.
                </Text>
              </View>
            ) : (
              exerciseGroups.map((group, gIdx) => {
                const isSuperset = group.length > 1;
                return (
                  <View key={gIdx} style={styles.groupRow}>
                    {isSuperset && (
                      <View style={[styles.supersetBar, { backgroundColor: colors.tint + '80' }]} />
                    )}
                    <View style={{ flex: 1, gap: 10 }}>
                      {group.map((ex, exIdx) => (
                        <View
                          key={ex.id || `${gIdx}-${exIdx}`}
                          style={[
                            styles.exerciseCard,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              ...(isIOS ? getAppleCardSurfaceStyle(theme, 20) : null),
                            },
                          ]}
                        >
                          {useGlass && (
                            <GlassView
                              pointerEvents="none"
                              glassEffectStyle="regular"
                              colorScheme={isDark ? 'dark' : 'light'}
                              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                            />
                          )}

                          <View style={styles.mediaBox}>
                            <ExerciseMediaPreview
                              item={ex}
                              details={ex}
                              fitMode="contain"
                              staticOnly
                              roundedRadius={14}
                              previewColors={{ background: 'transparent', placeholder: colors.textSecondary }}
                            />
                            {isSuperset && (
                              <View style={styles.supersetBadge}>
                                <Link2 size={13} color={colors.tint} />
                                <Text style={[styles.supersetBadgeText, { color: '#fff' }]}>
                                  Superserie
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.exerciseBody}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.exerciseName, { color: colors.text }]}>
                                {ex.name}
                              </Text>
                              {Boolean(ex.notes) && (
                                <Text style={[styles.exerciseNotes, { color: colors.textSecondary }]}>
                                  {ex.notes}
                                </Text>
                              )}
                            </View>

                            <View
                              style={[
                                styles.setsPill,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(255,255,255,0.07)'
                                    : 'rgba(0,0,0,0.05)',
                                },
                              ]}
                            >
                              <Text style={[styles.setsPrimary, { color: colors.text }]}>
                                {ex.sets || 3} series
                              </Text>
                              <Text style={[styles.setsSecondary, { color: colors.textSecondary }]}>
                                × {ex.reps || 10} reps
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            )}
          </Animated.ScrollView>
        )}
      </AndroidHeaderBlurTarget>

      <View style={styles.floatingHeader} pointerEvents="box-none">
        <GlobalHeader
          title="Rutina Compartida"
          scrollY={scrollY}
          androidBlurTarget={androidBlurTarget}
          showBackButton
          onBackPress={handleBack}
          hideRightButtons
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 8,
  },
  fallbackBtn: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 999,
  },
  fallbackBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 170,
  },
  heroBody: {
    padding: 18,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  creatorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  creatorAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  creatorName: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  shareIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTitle: {
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  routineDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  metaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  importBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginLeft: 4,
    marginTop: 4,
  },
  emptyBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  supersetBar: {
    width: 4,
    borderRadius: 2,
    marginVertical: 8,
  },
  exerciseCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mediaBox: {
    width: '100%',
    height: 175,
    position: 'relative',
  },
  supersetBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.68)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  supersetBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  exerciseBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
  },
  exerciseName: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  exerciseNotes: {
    fontSize: 12.5,
    marginTop: 3,
  },
  setsPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  setsPrimary: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  setsSecondary: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
});
