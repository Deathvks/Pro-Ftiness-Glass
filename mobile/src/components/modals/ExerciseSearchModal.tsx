import { getContrastColor } from '@/utils/colorUtils';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets as useSafeAreaInsetsNative } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import { X, Search, Plus, Trash2, Check, ArrowLeft, Sparkles } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { GlassButton } from '@/components/ui/GlassButton';
import { getExerciseList } from '@/services/exerciseService';
import apiClient, { API_BASE_URL } from '@/services/apiClient';
import { SelectModal, SelectOption } from '@/components/ui/SelectModal';
import { SETS_OPTIONS, REPS_OPTIONS, REST_OPTIONS } from '@/constants/exerciseOptions';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';
import { getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

interface ExerciseSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExercises?: (exercises: any[]) => void;
  isReadOnly?: boolean;
}

export const ExerciseSearchModal: React.FC<ExerciseSearchModalProps> = ({
  visible,
  onClose,
  onAddExercises = () => {},
  isReadOnly = false,
}) => {
  const insets = useSafeAreaInsetsNative();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';

  const [view, setView] = useState<'list' | 'detail' | 'summary'>('list');
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      const data = await getExerciseList();
      setExercises(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    if (!searchQuery) return exercises;
    const lowerQ = searchQuery.toLowerCase();
    return exercises.filter(
      e =>
        e.name.toLowerCase().includes(lowerQ) ||
        (e.muscle_group && e.muscle_group.toLowerCase().includes(lowerQ))
    );
  }, [exercises, searchQuery]);

  const stagedIds = useMemo(
    () => new Set(stagedExercises.map(item => item.exercise.id)),
    [stagedExercises]
  );

  const toggleStaged = (exercise: any) => {
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

  const getImageUrl = (item: any) => {
    if (item.image_url_start) return item.image_url_start;
    if (item.image_url) return item.image_url;
    if (item.images && Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    if (item.images && typeof item.images === 'string') {
      try {
        const parsed = JSON.parse(item.images);
        if (parsed.length > 0) return parsed[0];
      } catch (e) {}
    }

    let youtubeId = item.youtube_id;
    if (!youtubeId && item.video_url) {
      const ytMatch = item.video_url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (ytMatch) youtubeId = ytMatch[1];
    }

    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
    }

    const finalUrl = item.muscle_group_image_url || '';
    if (finalUrl && finalUrl.startsWith('/')) {
      const baseUrl = API_BASE_URL.replace('/api', '');
      return baseUrl + finalUrl;
    }
    return finalUrl;
  };

  const renderExerciseItem = ({ item }: { item: any }) => {
    const isStaged = stagedIds.has(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.exerciseCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: isIOS ? 0 : 1,
            flexDirection: 'column',
            alignItems: 'stretch',
          },
          getAppleSheetCardStyle(isDark, 20),
        ]}
        onPress={() => {
          setSelectedExercise(item);
          setView('detail');
        }}
      >
        <View
          style={{
            width: '100%',
            aspectRatio: 16 / 10,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <ExerciseMediaPreview item={item} fitMode="contain" staticOnly={false} />
        </View>
        <View style={{ padding: 14, flex: 1 }}>
          <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            <View
              style={{
                backgroundColor: colors.tint + '18',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: colors.tint,
                  fontSize: 10,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                {item.muscle_group || item.category || 'OTRO'}
              </Text>
            </View>
          </View>
          {item.description ? (
            <Text
              style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 8, lineHeight: 17 }}
              numberOfLines={2}
            >
              {item.description.replace(/<[^>]*>?/gm, '')}
            </Text>
          ) : null}

          {!isReadOnly && (
            <View style={{ marginTop: 12, alignItems: 'stretch' }}>
              <GlassButton
                noShadow
                theme={theme}
                color={isStaged ? colors.tint : undefined}
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 14,
                }}
                onPress={() => toggleStaged(item)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {isStaged ? (
                    <>
                      <Check
                        size={18}
                        color={isIOS ? colors.tint : getContrastColor(colors.tint, theme)}
                      />
                      <Text
                        style={{
                          color: isIOS ? colors.tint : getContrastColor(colors.tint, theme),
                          fontWeight: '700',
                        }}
                      >
                        Añadido
                      </Text>
                    </>
                  ) : (
                    <>
                      <Plus size={18} color={colors.text} />
                      <Text style={{ color: colors.text, fontWeight: '700' }}>Añadir</Text>
                    </>
                  )}
                </View>
              </GlassButton>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const topPad = isIOS ? 12 : insets.top;
  const headerHeight = 56 + topPad;

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    scrollY.setValue(0);
  }, [view, scrollY]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={isIOS ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isIOS ? (isDark ? '#1C1C1E' : '#F2F2F7') : colors.background,
          },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingTop: topPad,
              height: headerHeight,
              backgroundColor: 'transparent',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          {isIOS && (
            <View
              style={{
                position: 'absolute',
                top: 6,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
              pointerEvents="none"
            >
              <View
                style={{
                  width: 38,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: isDark
                    ? 'rgba(235, 235, 245, 0.3)'
                    : 'rgba(60, 60, 67, 0.25)',
                }}
              />
            </View>
          )}
          <Animated.View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: colors.border,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              opacity: bgOpacity,
            }}
          />

          {view !== 'list' ? (
            <GlassButton
              noShadow
              theme={theme}
              onPress={() => setView('list')}
              style={styles.iconButton}
            >
              <ArrowLeft size={20} color={colors.text} />
            </GlassButton>
          ) : (
            <GlassButton noShadow theme={theme} onPress={onClose} style={styles.iconButton}>
              <X size={20} color={colors.text} />
            </GlassButton>
          )}

          <Text
            style={[styles.title, { color: colors.text, flex: 1, textAlign: 'center' }]}
            numberOfLines={1}
          >
            {view === 'list'
              ? 'Biblioteca'
              : view === 'summary'
                ? 'Carrito'
                : selectedExercise?.name}
          </Text>

          {isReadOnly || view === 'summary' || view === 'detail' ? (
            <View style={{ width: 40 }} />
          ) : (
            <GlassButton
              noShadow
              theme={theme}
              color={stagedExercises.length > 0 ? colors.tint : undefined}
              onPress={() => setView('summary')}
              style={{
                paddingHorizontal: 14,
                height: 36,
                borderRadius: 18,
              }}
            >
              <Text
                style={{
                  color:
                    stagedExercises.length > 0
                      ? isIOS
                        ? colors.tint
                        : getContrastColor(colors.tint, theme)
                      : colors.tint,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                Ver ({stagedExercises.length})
              </Text>
            </GlassButton>
          )}
        </View>

        {view === 'list' && (
          <View style={{ flex: 1 }}>
            {isLoading ? (
              <View style={[styles.centerContainer, { paddingTop: headerHeight }]}>
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            ) : (
              <Animated.FlatList
                data={filteredExercises}
                keyExtractor={item => item.id}
                renderItem={renderExerciseItem}
                contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 16 }]}
                initialNumToRender={10}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                ListHeaderComponent={
                  <View style={{ marginBottom: 16 }}>
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
                      <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Buscar ejercicios..."
                        selectionColor={colors.tint}
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                  </View>
                }
              />
            )}
          </View>
        )}

        {view === 'detail' && selectedExercise && (
          <Animated.ScrollView
            style={{ flex: 1, paddingTop: headerHeight }}
            contentContainerStyle={{ paddingBottom: 80 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            <View style={{ alignItems: 'center', width: '100%', paddingVertical: 14 }}>
              <View
                style={{
                  width: 220,
                  maxWidth: '90%',
                  aspectRatio: 9 / 16,
                  maxHeight: 390,
                  borderRadius: 26,
                  backgroundColor: '#000000',
                  overflow: 'hidden',
                  borderWidth: isIOS ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <ExerciseMediaPreview
                  item={selectedExercise}
                  details={selectedExercise}
                  getImageUrl={getImageUrl}
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
            </View>

            <View style={{ padding: 24, flex: 1, paddingBottom: isReadOnly ? 40 : 100 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  letterSpacing: -0.4,
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                {selectedExercise.name}
              </Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
                Músculo: {selectedExercise.muscle_group}
              </Text>
              <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 24 }}>
                {selectedExercise.description
                  ? selectedExercise.description.replace(/<[^>]*>?/gm, '')
                  : 'Sin descripción detallada disponible.'}
              </Text>

              {/* AI Explain Button */}
              <TouchableOpacity
                onPress={handleAskAI}
                disabled={isAiLoading || !!aiExplanation}
                style={[
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.tint,
                    borderWidth: isIOS ? 0 : 1,
                    padding: 16,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    gap: 12,
                  },
                  getAppleSheetCardStyle(isDark, 16),
                ]}
              >
                {isAiLoading ? (
                  <ActivityIndicator color={colors.tint} size="small" />
                ) : (
                  <Sparkles size={20} color={colors.tint} />
                )}
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 16 }}>
                  {isAiLoading ? 'Generando explicación...' : 'Explicación por IA (Coach)'}
                </Text>
              </TouchableOpacity>

              {/* AI Explanation Result */}
              {aiExplanation && (
                <View
                  style={[
                    {
                      backgroundColor: colors.tint + '10',
                      borderColor: colors.tint + '30',
                      borderWidth: isIOS ? 0 : 1,
                      padding: 16,
                      borderRadius: 16,
                      marginBottom: 24,
                    },
                    getAppleSheetCardStyle(isDark, 16),
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <Sparkles size={16} color={colors.tint} />
                    <Text style={{ color: colors.tint, fontWeight: '700' }}>
                      Pro-Fitness Coach
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, lineHeight: 24, fontSize: 15 }}>
                    {aiExplanation}
                  </Text>
                </View>
              )}
            </View>

            {!isReadOnly && (
              <View
                style={[
                  styles.footer,
                  {
                    borderTopColor: colors.border,
                    backgroundColor: isIOS ? (isDark ? '#1C1C1E' : '#F2F2F7') : colors.background,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
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
                      ? 'Quitar del carrito'
                      : 'Añadir al carrito'}
                  </Text>
                </GlassButton>
              </View>
            )}
          </Animated.ScrollView>
        )}

        {view === 'summary' && (
          <View style={{ flex: 1 }}>
            {stagedExercises.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={{ color: colors.textSecondary }}>El carrito está vacío.</Text>
              </View>
            ) : (
              <Animated.FlatList
                data={stagedExercises}
                keyExtractor={item => item.exercise.id}
                contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 16 }]}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.exerciseCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: isIOS ? 0 : 1,
                        flexDirection: 'column',
                        alignItems: 'stretch',
                      },
                      getAppleSheetCardStyle(isDark, 20),
                    ]}
                  >
                    <View
                      style={{
                        width: '100%',
                        aspectRatio: 16 / 10,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        overflow: 'hidden',
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.03)'
                          : 'rgba(0,0,0,0.03)',
                      }}
                    >
                      <ExerciseMediaPreview
                        item={item.exercise}
                        fitMode="contain"
                        staticOnly={false}
                      />
                    </View>
                    <View style={{ padding: 14, flex: 1 }}>
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
                            backgroundColor: isIOS
                              ? isDark
                                ? '#3A3A3C'
                                : '#F2F2F7'
                              : colors.card,
                            padding: 8,
                            borderRadius: 12,
                            borderWidth: isIOS ? 0 : 1,
                            borderColor: colors.border,
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
                            backgroundColor: isIOS
                              ? isDark
                                ? '#3A3A3C'
                                : '#F2F2F7'
                              : colors.card,
                            padding: 8,
                            borderRadius: 12,
                            borderWidth: isIOS ? 0 : 1,
                            borderColor: colors.border,
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
                            backgroundColor: isIOS
                              ? isDark
                                ? '#3A3A3C'
                                : '#F2F2F7'
                              : colors.card,
                            padding: 8,
                            borderRadius: 12,
                            borderWidth: isIOS ? 0 : 1,
                            borderColor: colors.border,
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
                            Desc. (s)
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
                            {item.rest_seconds || 60}s
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={{ marginTop: 12, alignItems: 'stretch' }}>
                        <GlassButton
                          noShadow
                          theme={theme}
                          style={{
                            width: '100%',
                            height: 44,
                            borderRadius: 12,
                          }}
                          onPress={() => toggleStaged(item.exercise)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Trash2 size={18} color="#ef4444" />
                            <Text style={{ color: '#ef4444', fontWeight: '700' }}>Eliminar</Text>
                          </View>
                        </GlassButton>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.border,
                  backgroundColor: isIOS ? (isDark ? '#1C1C1E' : '#F2F2F7') : colors.background,
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
            </View>
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
    </Modal>
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
    height: 56,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    borderRadius: 20,
    borderCurve: 'continuous',
    marginBottom: 14,
    overflow: 'hidden',
  },
  exerciseName: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 32,
  },
});
