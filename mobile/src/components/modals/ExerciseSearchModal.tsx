import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image, Platform, Linking, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets as useSafeAreaInsetsNative } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { X, Search, Plus, Trash2, Check, ArrowLeft, Filter, Sparkles } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { GlassButton } from '@/components/ui/GlassButton';
import { getExerciseList } from '@/services/exerciseService';
import apiClient from '@/services/apiClient';
import { SelectModal, SelectOption } from '@/components/ui/SelectModal';
import { SETS_OPTIONS, REPS_OPTIONS, REST_OPTIONS } from '@/constants/exerciseOptions';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';

interface ExerciseSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExercises: (exercises: any[]) => void;
}

import { WebView } from 'react-native-webview';

export const ExerciseSearchModal: React.FC<ExerciseSearchModalProps> = ({ visible, onClose, onAddExercises }) => {
  const insets = useSafeAreaInsetsNative();
  const theme = useAppStore(state => state.theme);
  const colors = Colors[theme as keyof typeof Colors] || Colors.oled;

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
    onSelect: () => {}
  });

  const updateStagedExercise = (exerciseId: string, field: string, value: any) => {
    setStagedExercises(prev => prev.map(item => 
      item.exercise.id === exerciseId ? { ...item, [field]: value } : item
    ));
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
    return exercises.filter(e => 
      e.name.toLowerCase().includes(lowerQ) || 
      (e.muscle_group && e.muscle_group.toLowerCase().includes(lowerQ))
    );
  }, [exercises, searchQuery]);

  const stagedIds = useMemo(() => new Set(stagedExercises.map(item => item.exercise.id)), [stagedExercises]);

  const toggleStaged = (exercise: any) => {
    if (stagedIds.has(exercise.id)) {
      setStagedExercises(prev => prev.filter(item => item.exercise.id !== exercise.id));
    } else {
      setStagedExercises(prev => [...prev, {
        exercise,
        sets: 3,
        reps: '8-12',
        rest_seconds: 60
      }]);
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
        body: { prompt }
      });
      const data = response.data || response;
      setAiExplanation(data.response || data.text || 'Sin explicación de IA.');
      
      // Update store gamification if it returned limits
      if (data.remaining !== undefined) {
        const { gamification, updateGamification } = useAppStore.getState();
        if (updateGamification) {
          updateGamification({ ...gamification, ai_queries_remaining: data.remaining });
        }
      }
    } catch (error) {
      console.error(error);
      setAiExplanation('Error al generar la explicación con IA. Comprueba tu conexión o tu límite de uso diario.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const getImageUrl = (item: any) => {
    if (item.image_url_start) return item.image_url_start;
    if (item.image_url) return item.image_url;
    if (item.images && Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    if (item.images && typeof item.images === 'string') {
      try { const parsed = JSON.parse(item.images); if (parsed.length > 0) return parsed[0]; } catch(e) {}
    }
    
    // Check for youtube ID
    let youtubeId = item.youtube_id;
    if (!youtubeId && item.video_url) {
      const ytMatch = item.video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (ytMatch) youtubeId = ytMatch[1];
    }
    
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/0.jpg`;
    }
    
    return item.muscle_group_image_url || 'https://via.placeholder.com/400';
  };

  const renderExerciseItem = ({ item }: { item: any }) => {
    const isStaged = stagedIds.has(item.id);
    const imageUrl = getImageUrl(item);
    
    return (
      <TouchableOpacity 
        style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}
        onPress={() => {
          setSelectedExercise(item);
          setView('detail');
        }}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={{ width: '100%', aspectRatio: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
          resizeMode="cover"
        />
        <View style={{ padding: 12, flex: 1, backgroundColor: colors.background + '80' }}>
          <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            <View style={{ backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
                {item.muscle_group || item.category || 'OTRO'}
              </Text>
            </View>
          </View>
          {item.description ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }} numberOfLines={2}>
              {item.description.replace(/<[^>]*>?/gm, '')}
            </Text>
          ) : null}
          
          <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: isStaged ? colors.tint : colors.background, borderColor: isStaged ? colors.tint : colors.border, alignSelf: 'stretch', width: 'auto', flexDirection: 'row', gap: 8, borderRadius: 12, paddingVertical: 8 }]}
              onPress={() => toggleStaged(item)}
            >
              {isStaged ? (
                <>
                  <Check size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Añadido</Text>
                </>
              ) : (
                <>
                  <Plus size={18} color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>Añadir</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const headerHeight = 56 + insets.top;
  
  const getYoutubeId = (url) => {
    if (!url) return null;
    if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0];
    if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
    return null;
  };
  
  const scrollY = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    scrollY.setValue(0);
  }, [view]);

  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top, height: headerHeight, backgroundColor: 'transparent', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
            <AnimatedBlurView intensity={theme === 'oled' ? 50 : 80} tint={theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'default'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: 0.5 }]} />
            <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
          </Animated.View>

          {view !== 'list' ? (
            <GlassButton theme={theme} onPress={() => setView('list')} style={styles.iconButton}>
              <ArrowLeft size={20} color={colors.text} />
            </GlassButton>
          ) : (
            <GlassButton theme={theme} onPress={onClose} style={styles.iconButton}>
              <X size={20} color={colors.text} />
            </GlassButton>
          )}

          <Text style={[styles.title, { color: colors.text, flex: 1, textAlign: 'center' }]} numberOfLines={1}>
            {view === 'list' ? 'Biblioteca' : view === 'summary' ? 'Carrito' : selectedExercise?.name}
          </Text>

          {view === 'summary' || view === 'detail' ? (
            <View style={{ width: 40 }} />
          ) : (
            <GlassButton theme={theme} onPress={() => setView('summary')} style={{ width: 'auto', paddingHorizontal: 16, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.tint, fontWeight: 'bold', fontSize: 13 }}>
                Ver ({stagedExercises.length})
              </Text>
            </GlassButton>
          )}
        </View>

        {view === 'list' && (
          <View style={{ flex: 1 }}>
            {isLoading ? (
              <View style={[styles.centerContainer, { paddingTop: headerHeight }]}><ActivityIndicator size="large" color={colors.tint} /></View>
            ) : (
              <Animated.FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                renderItem={renderExerciseItem}
                contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 16 }]}
                initialNumToRender={10}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
                ListHeaderComponent={() => (
                  <View style={{ marginBottom: 16 }}>
                    <View style={[styles.searchInputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Buscar ejercicios..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {view === 'detail' && selectedExercise && (
          <Animated.ScrollView 
            style={{ flex: 1, paddingTop: headerHeight }} 
            contentContainerStyle={{ paddingBottom: 80 }}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
          >
              {playingVideo ? (
                <View style={{ width: '100%', height: 300, backgroundColor: colors.card }} pointerEvents="none">
                  <WebView 
                    source={(() => {
                      const yid = selectedExercise.youtube_id || getYoutubeId(selectedExercise.video_url);
                      if (yid) {
                        return {
                          html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
                              <style>
                                body { margin: 0; padding: 0; background: #000; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; }
                                iframe { width: 100%; height: 100%; border: none; pointer-events: none; }
                              </style>
                            </head>
                            <body>
                              <iframe src="https://www.youtube.com/embed/${yid}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&loop=1&playlist=${yid}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
                            </body>
                            </html>
                          `,
                          baseUrl: 'https://youtube.com'
                        };
                      }
                      return { uri: selectedExercise.video_url };
                    })()}
                    style={{ flex: 1, backgroundColor: colors.card }}  
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                  />
                </View>
              ) : (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  if (selectedExercise.video_url || selectedExercise.youtube_id) setPlayingVideo(true);
                }}
              >
                <Image 
                  source={{ uri: getImageUrl(selectedExercise) }} 
                  style={{ width: '100%', height: 300, backgroundColor: colors.card }}
                  resizeMode="contain"
                />
                {(selectedExercise.video_url || selectedExercise.youtube_id) && (
                  <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 16, borderRadius: 32 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>▶ Reproducir Video</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}
            
            <View style={{ padding: 24, flex: 1, paddingBottom: 100 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>{selectedExercise.name}</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>Músculo: {selectedExercise.muscle_group}</Text>
              <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 24 }}>
                {selectedExercise.description ? selectedExercise.description.replace(/<[^>]*>?/gm, '') : "Sin descripción detallada disponible."}
              </Text>

              {/* AI Explain Button */}
              <TouchableOpacity
                onPress={handleAskAI}
                disabled={isAiLoading || !!aiExplanation}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.tint,
                  borderWidth: 1,
                  padding: 16,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  gap: 12
                }}
              >
                {isAiLoading ? (
                  <ActivityIndicator color={colors.tint} size="small" />
                ) : (
                  <Sparkles size={20} color={colors.tint} />
                )}
                <Text style={{ color: colors.tint, fontWeight: 'bold', fontSize: 16 }}>
                  {isAiLoading ? "Generando explicación..." : "Explicación por IA (Coach)"}
                </Text>
              </TouchableOpacity>

              {/* AI Explanation Result */}
              {aiExplanation && (
                <View style={{ backgroundColor: colors.tint + '10', borderColor: colors.tint + '30', borderWidth: 1, padding: 16, borderRadius: 16, marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Sparkles size={16} color={colors.tint} />
                    <Text style={{ color: colors.tint, fontWeight: 'bold' }}>Pro-Fitness Coach</Text>
                  </View>
                  <Text style={{ color: colors.text, lineHeight: 24, fontSize: 15 }}>
                    {aiExplanation}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background, position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
              <GlassButton theme={theme} colors={colors} style={{ width: '100%', height: 50, borderRadius: 16 }} onPress={() => { toggleStaged(selectedExercise); setView('list'); }}>
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>
                  {stagedIds.has(selectedExercise.id) ? 'Quitar del carrito' : 'Añadir al carrito'}
                </Text>
              </GlassButton>
            </View>
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
                keyExtractor={(item) => item.exercise.id}
                contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 16 }]}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
                renderItem={({ item }) => {
                  const imageUrl = getImageUrl(item.exercise);
                  return (
                    <View style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
                      <View style={{ width: '100%', aspectRatio: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', backgroundColor: colors.background }}>
                        <ExerciseMediaPreview item={item.exercise} getImageUrl={getImageUrl} staticOnly={true} />
                      </View>
                      <View style={{ padding: 12, flex: 1, backgroundColor: colors.background + '80' }}>
                        <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>{item.exercise.name}</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            <View style={{ backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {item.exercise.muscle_group || item.exercise.category || 'OTRO'}
                              </Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                            {/* Series */}
                            <TouchableOpacity
                              style={{ flex: 1, backgroundColor: colors.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                              onPress={() => setSelectModalConfig({
                                visible: true,
                                title: 'Series',
                                options: SETS_OPTIONS,
                                value: String(item.sets),
                                onSelect: (val) => updateStagedExercise(item.exercise.id, 'sets', val)
                              })}
                            >
                              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Series</Text>
                              <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{item.sets}</Text>
                            </TouchableOpacity>

                            {/* Reps */}
                            <TouchableOpacity
                              style={{ flex: 1, backgroundColor: colors.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                              onPress={() => {
                                const curr = String(item.reps);
                                const has = REPS_OPTIONS.some(o => o.value === curr);
                                const opts = has ? REPS_OPTIONS : [{ value: curr, label: curr }, ...REPS_OPTIONS];
                                setSelectModalConfig({
                                  visible: true,
                                  title: 'Repeticiones',
                                  options: opts,
                                  value: curr,
                                  onSelect: (val) => updateStagedExercise(item.exercise.id, 'reps', val)
                                });
                              }}
                            >
                              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Reps</Text>
                              <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{item.reps}</Text>
                            </TouchableOpacity>

                            {/* Rest */}
                            <TouchableOpacity
                              style={{ flex: 1, backgroundColor: colors.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                              onPress={() => {
                                const curr = String(item.rest_seconds || "60");
                                const has = REST_OPTIONS.some(o => o.value === curr);
                                const opts = has ? REST_OPTIONS : [{ value: curr, label: `${curr}s` }, ...REST_OPTIONS];
                                setSelectModalConfig({
                                  visible: true,
                                  title: 'Descanso',
                                  options: opts,
                                  value: curr,
                                  onSelect: (val) => updateStagedExercise(item.exercise.id, 'rest_seconds', val)
                                });
                              }}
                            >
                              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Desc. (s)</Text>
                              <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{item.rest_seconds || 60}s</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
                            <TouchableOpacity 
                              style={{ alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, flexDirection: 'row', gap: 8, borderRadius: 12, paddingVertical: 8 }}
                              onPress={() => toggleStaged(item.exercise)}
                            >
                              <Trash2 size={18} color="#ef4444" />
                              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Eliminar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
              <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                <GlassButton theme={theme} colors={colors} style={{ width: '100%', height: 50, borderRadius: 16 }} onPress={handleConfirm}>
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>
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
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
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
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 32,
  }
});
