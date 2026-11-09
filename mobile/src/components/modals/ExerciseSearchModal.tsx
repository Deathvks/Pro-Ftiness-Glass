import { getContrastColor } from '@/utils/colorUtils';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import {
  X,
  Search,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  Sparkles,
  ListChecks,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { GlassButton } from '@/components/ui/GlassButton';
import { getExerciseList } from '@/services/exerciseService';
import apiClient from '@/services/apiClient';
import { SelectModal, SelectOption } from '@/components/ui/SelectModal';
import { SETS_OPTIONS, REPS_OPTIONS, REST_OPTIONS } from '@/constants/exerciseOptions';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';
import {
  SwipeableBottomSheet,
  getAppleSheetCardStyle,
} from '@/components/ui/SwipeableBottomSheet';

interface ExerciseSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExercises?: (exercises: any[]) => void;
  isReadOnly?: boolean;
}

const MUSCLE_FILTERS = [
  { id: 'all', label: 'Todos', keywords: [] },
  { id: 'chest', label: 'Pecho', keywords: ['pecho', 'chest', 'pectoral'] },
  { id: 'back', label: 'Espalda', keywords: ['espalda', 'back', 'dorsal', 'trapecio', 'lats', 'lumbar'] },
  { id: 'legs', label: 'Piernas', keywords: ['pierna', 'legs', 'cuádriceps', 'cuadriceps', 'quads', 'isquio', 'hamstring', 'glúteo', 'glute', 'gemelo', 'calves'] },
  { id: 'shoulders', label: 'Hombros', keywords: ['hombro', 'shoulder', 'deltoid'] },
  { id: 'arms', label: 'Brazos', keywords: ['brazo', 'arm', 'bíceps', 'biceps', 'tríceps', 'triceps', 'antebrazo', 'forearm'] },
  { id: 'core', label: 'Core / Abs', keywords: ['abdom', 'core', 'abs', 'oblicuo'] },
  { id: 'cardio', label: 'Cardio', keywords: ['cardio', 'aeróbico', 'hiit'] },
];

export const ExerciseSearchModal: React.FC<ExerciseSearchModalProps> = ({
  visible,
  onClose,
  onAddExercises = () => {},
  isReadOnly = false,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';

  const [view, setView] = useState<'list' | 'detail' | 'summary'>('list');
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('all');

  const [stagedExercises, setStagedExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [playingVideo, setPlayingVideo] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [selectModalConfig, setSelectModalConfig] = useState<{
    visible: boolean;
    options: SelectOption[];
    value: string | number;
    title: string;
    onSelect: (val: string | number) => void;
  }>({
    visible: false,
    options: [],
    value: '',
    title: '',
    onSelect: () => {},
  });

  const updateStagedExercise = (exerciseId: string, field: string, value: any) => {
    setStagedExercises(prev =>
      prev.map(item => (item.exercise.id === exerciseId ? { ...item, [field]: value } : item))
    );
  };

  useEffect(() => {
    if (visible) {
      loadExercises();
    }
  }, [visible]);

  useEffect(() => {
    if (view === 'detail' && selectedExercise) {
      if (selectedExercise.video_url || selectedExercise.youtube_id) {
        setPlayingVideo(true);
      } else {
        setPlayingVideo(false);
      }
    } else {
      setPlayingVideo(false);
      setAiExplanation(null);
    }
  }, [view, selectedExercise]);

  const loadExercises = async () => {
    setIsLoading(true);
    try {
      const fetchFromStore = useAppStore.getState()?.getOrFetchAllExercises;
      const data =
        typeof fetchFromStore === 'function'
          ? await fetchFromStore()
          : await getExerciseList();
      setExercises(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    const stripAccents = (str: string) =>
      str
        ? str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
        : '';

    const lowerQ = stripAccents(searchQuery.trim());
    const activeFilterObj = MUSCLE_FILTERS.find(f => f.id === selectedMuscleFilter);

    return exercises.filter(e => {
      if (!e) return false;
      const nameNorm = stripAccents(e.name || '');
      const muscleNorm = stripAccents(
        `${e.muscle_group || ''} ${e.category || ''}`
      );

      const matchesSearch =
        !lowerQ || nameNorm.includes(lowerQ) || muscleNorm.includes(lowerQ);

      if (!matchesSearch) return false;

      if (
        selectedMuscleFilter !== 'all' &&
        activeFilterObj &&
        activeFilterObj.keywords.length > 0
      ) {
        const matchesMuscle = activeFilterObj.keywords.some(kw =>
          muscleNorm.includes(stripAccents(kw))
        );
        if (!matchesMuscle) return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedMuscleFilter]);

  const stagedIds = useMemo(
    () => new Set(stagedExercises.map(item => item.exercise.id)),
    [stagedExercises]
  );

  const toggleStaged = (exercise: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (stagedIds.has(exercise.id)) {
      setStagedExercises(prev => prev.filter(item => item.exercise.id !== exercise.id));
    } else {
      setStagedExercises(prev => [
        ...prev,
        {
          exercise,
          sets: 3,
          reps: '8-12',
          rest_seconds: 60,
        },
      ]);
    }
  };

  const handleConfirm = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    onAddExercises(stagedExercises);
    setStagedExercises([]);
    setView('list');
    onClose();
  };

  const handleAskAI = async () => {
    if (!selectedExercise) return;
    setIsAiLoading(true);
    try {
      const prompt = `Actúa como un entrenador experto. Explica detalladamente el ejercicio "${selectedExercise.name}". 
      Incluye una breve descripción de la técnica correcta paso a paso, músculos principales y secundarios implicados, los 2 errores más comunes al realizarlo y un "Pro Tip" final. 
      Sé directo y usa un formato limpio y fácil de leer.`;

      const response = await apiClient('/ai/ask', {
        body: { prompt },
      });
      const data = response.data || response;
      setAiExplanation(data.response || data.text || 'Sin explicación de IA.');

      if (data.remaining !== undefined) {
        const { gamification, updateGamification } = useAppStore.getState();
        if (updateGamification) {
          updateGamification({ ...gamification, ai_queries_remaining: data.remaining });
        }
      }
    } catch (error) {
      console.error(error);
      setAiExplanation(
        'Error al generar la explicación con IA. Comprueba tu conexión o tu límite de uso diario.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const innerPillBg = isIOS
    ? isDark
      ? '#3A3A3C'
      : '#F2F2F7'
    : isDark
    ? 'rgba(255,255,255,0.06)'
    : 'rgba(0,0,0,0.05)';

  const renderExerciseItem = ({ item }: { item: any }) => {
    const isStaged = stagedIds.has(item.id);
    const rawMuscles = (item.muscle_group || item.category || 'General')
      .split(',')
      .map((m: string) => m.trim())
      .filter(Boolean);

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={[
          styles.exerciseCard,
          {
            backgroundColor: colors.card,
            borderColor: isStaged ? colors.tint : colors.border,
            borderWidth: isStaged ? 1.5 : isIOS ? 0 : 1,
          },
          getAppleSheetCardStyle(isDark, 22),
          isStaged && {
            borderWidth: 1.5,
            borderColor: colors.tint,
          },
        ]}
        onPress={() => {
          setSelectedExercise(item);
          setView('detail');
        }}
      >
        <View
          style={[
            styles.mediaPreviewBox,
            {
              backgroundColor: isDark ? '#0B0B0E' : '#18181B',
            },
          ]}
        >
          <ExerciseMediaPreview
            item={item}
            details={item}
            fitMode="contain"
            staticOnly={false}
          />
        </View>

        <View style={styles.cardContentBox}>
          <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.musclePillsWrap}>
            {rawMuscles.slice(0, 3).map((m: string, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.muscleBadge,
                  { backgroundColor: colors.tint + '1A' },
                ]}
              >
                <Text style={[styles.muscleBadgeText, { color: colors.tint }]}>
                  {m}
                </Text>
              </View>
            ))}
          </View>

          {item.description ? (
            <Text
              style={[styles.exerciseDescription, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.description.replace(/<[^>]*>?/gm, '')}
            </Text>
          ) : null}

          {!isReadOnly && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleStaged(item)}
              style={[
                styles.stageActionBtn,
                isStaged
                  ? {
                      backgroundColor: 'rgba(34, 197, 94, 0.16)',
                      borderColor: 'rgba(34, 197, 94, 0.4)',
                      borderWidth: 1,
                    }
                  : {
                      backgroundColor: innerPillBg,
                      borderColor: isIOS ? 'transparent' : colors.border,
                      borderWidth: isIOS ? 0 : 1,
                    },
              ]}
            >
              {isStaged ? (
                <>
                  <Check size={18} color="#22c55e" strokeWidth={2.6} />
                  <Text style={{ color: '#22c55e', fontWeight: '700', fontSize: 14 }}>
                    Añadido
                  </Text>
                </>
              ) : (
                <>
                  <Plus size={18} color={colors.tint} strokeWidth={2.4} />
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                    Añadir ejercicio
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.background === 'transparent' ? colors.card : colors.background}
      height="92%"
      maxHeight="92%"
      scrollable
      edgeToEdge
      avoidKeyboard
    >
      <View style={styles.container}>
        {/* Sheet Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              borderBottomWidth: StyleSheet.hairlineWidth,
            },
          ]}
        >
          {view !== 'list' ? (
            <TouchableOpacity
              onPress={() => setView('list')}
              activeOpacity={0.75}
              style={[styles.headerCircleBtn, { backgroundColor: innerPillBg }]}
            >
              <ArrowLeft size={19} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.75}
              style={[styles.headerCircleBtn, { backgroundColor: innerPillBg }]}
            >
              <X size={19} color={colors.text} />
            </TouchableOpacity>
          )}

          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {view === 'list'
                ? isReadOnly
                  ? 'Biblioteca de Ejercicios'
                  : 'Añadir Ejercicios'
                : view === 'summary'
                ? `Selección (${stagedExercises.length})`
                : selectedExercise?.name || 'Detalle'}
            </Text>
          </View>

          {isReadOnly || view === 'summary' || view === 'detail' ? (
            <View style={{ width: 38 }} />
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView('summary')}
              style={[
                styles.cartPillBtn,
                {
                  backgroundColor:
                    stagedExercises.length > 0 ? colors.tint : innerPillBg,
                },
              ]}
            >
              <ListChecks
                size={15}
                color={
                  stagedExercises.length > 0
                    ? getContrastColor(colors.tint, theme)
                    : colors.textSecondary
                }
              />
              <Text
                style={{
                  color:
                    stagedExercises.length > 0
                      ? getContrastColor(colors.tint, theme)
                      : colors.textSecondary,
                  fontWeight: '800',
                  fontSize: 13,
                }}
              >
                Ver ({stagedExercises.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LIST VIEW */}
        {view === 'list' && (
          <View style={{ flex: 1 }}>
            {/* Search & Muscle Filter Bar */}
            <View style={styles.filtersContainer}>
              <View
                style={[
                  styles.searchInputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: isIOS ? 0 : 1,
                  },
                  getAppleSheetCardStyle(isDark, 16),
                ]}
              >
                <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Buscar ejercicio o grupo muscular..."
                  selectionColor={colors.tint}
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Muscle Filter Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPillsScroll}
              >
                {MUSCLE_FILTERS.map(f => {
                  const active = selectedMuscleFilter === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSelectedMuscleFilter(f.id);
                      }}
                      style={[
                        styles.filterChip,
                        active
                          ? {
                              backgroundColor: isIOS ? colors.tint + '24' : colors.tint,
                              borderColor: colors.tint,
                              borderWidth: isIOS ? 1 : 0,
                            }
                          : {
                              backgroundColor: isIOS
                                ? isDark
                                  ? '#2C2C2E'
                                  : '#FFFFFF'
                                : innerPillBg,
                              borderWidth: isIOS ? 0 : 1,
                              borderColor: colors.border,
                            },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: active ? '700' : '600',
                          color: active
                            ? isIOS
                              ? colors.tint
                              : getContrastColor(colors.tint, theme)
                            : colors.textSecondary,
                        }}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.resultsCountRow}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                  {filteredExercises.length}{' '}
                  {filteredExercises.length === 1 ? 'ejercicio disponible' : 'ejercicios disponibles'}
                </Text>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            ) : (
              <FlatList
                data={filteredExercises}
                keyExtractor={item => String(item.id)}
                renderItem={renderExerciseItem}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={<SafeAreaView edges={['bottom']} />}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={7}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selectedExercise && (
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.detailContent}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.detailMediaBox,
                  {
                    backgroundColor: '#0B0B0E',
                    borderColor: colors.border,
                    borderWidth: isIOS ? 0 : 1,
                  },
                ]}
              >
                <ExerciseMediaPreview
                  item={selectedExercise}
                  details={selectedExercise}
                  fitMode="contain"
                  playYouTube={playingVideo}
                  onPress={() => {
                    if (
                      selectedExercise.video_url ||
                      selectedExercise.youtube_id ||
                      selectedExercise.video
                    ) {
                      setPlayingVideo(true);
                    }
                  }}
                />
              </View>

              <View
                style={[
                  {
                    padding: 18,
                    marginTop: 16,
                    backgroundColor: colors.card,
                    borderRadius: 20,
                  },
                  getAppleSheetCardStyle(isDark, 20),
                ]}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '700',
                    letterSpacing: -0.4,
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  {selectedExercise.name}
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  <View
                    style={[
                      styles.muscleBadge,
                      { backgroundColor: colors.tint + '1A' },
                    ]}
                  >
                    <Text style={[styles.muscleBadgeText, { color: colors.tint }]}>
                      {selectedExercise.muscle_group || selectedExercise.category || 'General'}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: colors.textSecondary, lineHeight: 22, fontSize: 14.5 }}>
                  {selectedExercise.description
                    ? selectedExercise.description.replace(/<[^>]*>?/gm, '')
                    : 'Sin descripción detallada disponible.'}
                </Text>
              </View>

              {/* AI Explain Button */}
              <TouchableOpacity
                onPress={handleAskAI}
                disabled={isAiLoading || !!aiExplanation}
                activeOpacity={0.8}
                style={[
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.tint,
                    borderWidth: isIOS ? 0 : 1,
                    padding: 16,
                    borderRadius: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 14,
                    gap: 10,
                  },
                  getAppleSheetCardStyle(isDark, 18),
                ]}
              >
                {isAiLoading ? (
                  <ActivityIndicator color={colors.tint} size="small" />
                ) : (
                  <Sparkles size={19} color={colors.tint} />
                )}
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 15 }}>
                  {isAiLoading ? 'Generando explicación...' : 'Explicación por IA (Coach)'}
                </Text>
              </TouchableOpacity>

              {/* AI Explanation Result */}
              {aiExplanation && (
                <View
                  style={[
                    {
                      backgroundColor: colors.tint + '12',
                      borderColor: colors.tint + '30',
                      borderWidth: isIOS ? 0 : 1,
                      padding: 16,
                      borderRadius: 18,
                      marginTop: 14,
                    },
                    getAppleSheetCardStyle(isDark, 18),
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <Sparkles size={16} color={colors.tint} />
                    <Text style={{ color: colors.tint, fontWeight: '700' }}>
                      Pro-Fitness Coach
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, lineHeight: 23, fontSize: 14.5 }}>
                    {aiExplanation}
                  </Text>
                </View>
              )}
              {isReadOnly && <SafeAreaView edges={['bottom']} />}
            </ScrollView>

            {!isReadOnly && (
              <SafeAreaView
                edges={['bottom']}
                style={[
                  styles.footer,
                  {
                    borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <GlassButton
                  noShadow
                  theme={theme}
                  color={colors.tint}
                  style={{ width: '100%', height: 50, borderRadius: 16 }}
                  onPress={() => {
                    toggleStaged(selectedExercise);
                    setView('list');
                  }}
                >
                  <Text
                    style={{
                      color: isIOS ? colors.tint : getContrastColor(colors.tint, theme),
                      fontWeight: '700',
                      fontSize: 16,
                    }}
                  >
                    {stagedIds.has(selectedExercise.id)
                      ? 'Quitar de la selección'
                      : 'Añadir a la selección'}
                  </Text>
                </GlassButton>
              </SafeAreaView>
            )}
          </View>
        )}

        {/* SUMMARY / PREVIEW BEFORE CONFIRMING */}
        {view === 'summary' && (
          <View style={{ flex: 1 }}>
            {stagedExercises.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '600' }}>
                  No has seleccionado ningún ejercicio todavía.
                </Text>
              </View>
            ) : (
              <FlatList
                data={stagedExercises}
                keyExtractor={item => String(item.exercise.id)}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.exerciseCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: isIOS ? 0 : 1,
                      },
                      getAppleSheetCardStyle(isDark, 22),
                    ]}
                  >
                    {/* Header row inside preview card */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 14,
                        paddingTop: 14,
                        paddingBottom: 10,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: colors.tint + '1F',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 9,
                        }}
                      >
                        <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '800' }}>
                          #{index + 1}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleStaged(item.exercise)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: 'rgba(239, 68, 68, 0.14)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={17} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Large Media Preview (YouTube Thumbnail / Video or Animated GIF) */}
                    <View
                      style={{
                        width: '100%',
                        aspectRatio: 16 / 10,
                        backgroundColor: isDark ? '#0B0B0E' : '#18181B',
                        overflow: 'hidden',
                      }}
                    >
                      <ExerciseMediaPreview
                        item={item.exercise}
                        details={item.exercise}
                        fitMode="contain"
                        staticOnly={false}
                      />
                    </View>

                    <View style={{ padding: 16 }}>
                      <Text
                        style={[styles.exerciseName, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {item.exercise.name}
                      </Text>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        {/* Series */}
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: innerPillBg,
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderRadius: 12,
                            alignItems: 'center',
                          }}
                          onPress={() =>
                            setSelectModalConfig({
                              visible: true,
                              title: 'Series',
                              options: SETS_OPTIONS,
                              value: String(item.sets),
                              onSelect: val =>
                                updateStagedExercise(item.exercise.id, 'sets', val),
                            })
                          }
                        >
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 10,
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              marginBottom: 4,
                            }}
                          >
                            Series
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
                            {item.sets}
                          </Text>
                        </TouchableOpacity>

                        {/* Reps */}
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: innerPillBg,
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderRadius: 12,
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            const curr = String(item.reps);
                            const has = REPS_OPTIONS.some(o => o.value === curr);
                            const opts = has
                              ? REPS_OPTIONS
                              : [{ value: curr, label: curr }, ...REPS_OPTIONS];
                            setSelectModalConfig({
                              visible: true,
                              title: 'Repeticiones',
                              options: opts,
                              value: curr,
                              onSelect: val =>
                                updateStagedExercise(item.exercise.id, 'reps', val),
                            });
                          }}
                        >
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 10,
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              marginBottom: 4,
                            }}
                          >
                            Reps
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
                            {item.reps}
                          </Text>
                        </TouchableOpacity>

                        {/* Rest */}
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: innerPillBg,
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderRadius: 12,
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            const curr = String(item.rest_seconds || '60');
                            const has = REST_OPTIONS.some(o => o.value === curr);
                            const opts = has
                              ? REST_OPTIONS
                              : [{ value: curr, label: `${curr}s` }, ...REST_OPTIONS];
                            setSelectModalConfig({
                              visible: true,
                              title: 'Descanso',
                              options: opts,
                              value: curr,
                              onSelect: val =>
                                updateStagedExercise(item.exercise.id, 'rest_seconds', val),
                            });
                          }}
                        >
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 10,
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              marginBottom: 4,
                            }}
                          >
                            Descanso
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
                            {item.rest_seconds || 60}s
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}

            <SafeAreaView
              edges={['bottom']}
              style={[
                styles.footer,
                {
                  borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <GlassButton
                noShadow
                theme={theme}
                color={colors.tint}
                style={{ width: '100%', height: 50, borderRadius: 16 }}
                onPress={handleConfirm}
              >
                <Text
                  style={{
                    color: isIOS ? colors.tint : getContrastColor(colors.tint, theme),
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  Confirmar {stagedExercises.length} Ejercicios
                </Text>
              </GlassButton>
            </SafeAreaView>
          </View>
        )}
      </View>

      <SelectModal
        visible={selectModalConfig.visible}
        onClose={() => setSelectModalConfig(prev => ({ ...prev, visible: false }))}
        options={selectModalConfig.options}
        value={selectModalConfig.value}
        onSelect={selectModalConfig.onSelect}
        title={selectModalConfig.title}
        theme={theme as 'light' | 'dark'}
        colors={colors}
      />
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 2,
  },
  headerCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    height: 36,
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  filterPillsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  resultsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 16,
  },
  detailContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  exerciseCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  mediaPreviewBox: {
    width: '100%',
    aspectRatio: 16 / 10,
    overflow: 'hidden',
  },
  cardContentBox: {
    padding: 16,
  },
  exerciseName: {
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  musclePillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  muscleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  muscleBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  exerciseDescription: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  stageActionBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailMediaBox: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
