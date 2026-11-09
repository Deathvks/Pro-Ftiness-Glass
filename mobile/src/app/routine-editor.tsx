import { getContrastTextColor } from '@/utils/colorUtils';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Image as ImageIcon,
  Folder,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Library,
  Sparkles,
  Upload,
  Save,
  Trash2,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import {
  getThemeBaseBackground,
  getAppleCardSurfaceStyle,
  shouldUseContentGlass,
} from '@/constants/theme';
import ThemeBackground from '@/components/ThemeBackground';
import { API_BASE_URL } from '@/services/apiClient';
import { GlassButton } from '@/components/ui/GlassButton';
import GlobalHeader from '@/components/GlobalHeader';
import { PixabayModal } from '@/components/modals/PixabayModal';
import { ExerciseSearchModal } from '@/components/modals/ExerciseSearchModal';
import { CropModal } from '@/components/modals/CropModal';
import { SelectModal, SelectOption } from '@/components/ui/SelectModal';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { SETS_OPTIONS, REPS_OPTIONS, REST_OPTIONS, MUSCLE_OPTIONS } from '@/constants/exerciseOptions';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';

export default function RoutineEditorScreen() {
  const router = useRouter();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const isDark = !['light', 'ocean', 'desert'].includes(theme || '');
  const isIOS = Platform.OS === 'ios';
  const useGlass = shouldUseContentGlass(theme);
  const iosCardSurface = getAppleCardSurfaceStyle(theme, 20);
  const iosInnerSurface = isIOS
    ? {
        backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
        borderWidth: 0,
        borderCurve: 'continuous' as const,
      }
    : {};

  // Global Store State
  const routineEditorState = useAppStore(state => state.routineEditorState);
  const setRoutineEditorState = useAppStore(state => state.setRoutineEditorState);

  const {
    routineId,
    routineName = '',
    description = '',
    folder = '',
    imageUrl = null,
    exercises = [],
  } = routineEditorState || {};

  const setRoutineName = (val: string) => setRoutineEditorState({ routineName: val });
  const setDescription = (val: string) => setRoutineEditorState({ description: val });
  const setFolder = (val: string) => setRoutineEditorState({ folder: val });
  const setImageUrl = (val: string | null) => setRoutineEditorState({ imageUrl: val });
  const setExercises = (updater: any) => {
    setRoutineEditorState((prev: any) => ({
      exercises: typeof updater === 'function' ? updater(prev.exercises || []) : updater,
    }));
  };

  // UI State
  const [showPixabay, setShowPixabay] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

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

  const updateExerciseField = (exerciseId: string, field: string, value: any) => {
    setExercises((prev: any[]) =>
      prev.map((ex: any) => (ex.id === exerciseId ? { ...ex, [field]: value } : ex))
    );
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setExercises((prev: any[]) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const routines = useAppStore(state => state.routines || []);
  const allExercises = useAppStore(state => state.allExercises || []);

  React.useEffect(() => {
    if (!allExercises || allExercises.length === 0) {
      const fetchAll = useAppStore.getState()?.getOrFetchAllExercises;
      if (typeof fetchAll === 'function') {
        fetchAll().catch(() => {});
      }
    }
  }, [allExercises?.length]);

  const uniqueFolders = useMemo(() => {
    const folders = routines
      .map((r: any) => r.folder)
      .filter((f: string) => f && f.trim() !== '');
    return [...new Set(folders)].sort();
  }, [routines]);

  const getImageUrl = (item: any) => {
    let url = item.muscle_group_image_url || '';
    if (item.image_url_start) url = item.image_url_start;
    else if (item.image_url) url = item.image_url;
    else if (item.images && Array.isArray(item.images) && item.images.length > 0) url = item.images[0];
    else if (item.images && typeof item.images === 'string') {
      try {
        const parsed = JSON.parse(item.images);
        if (parsed.length > 0) url = parsed[0];
      } catch (e) {}
    }

    if (url && url.startsWith('/')) {
      const baseUrl = API_BASE_URL.replace('/api', '');
      return baseUrl + url;
    }
    return url;
  };

  const removeExercise = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setExercises((prev: any[]) => prev.filter((ex: any) => ex.id !== id));
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const goBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/routines');
    }
  };

  const handleSave = async () => {
    if (!routineName.trim()) {
      Alert.alert('Datos incompletos', 'Por favor ingresa un nombre para la rutina.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Datos incompletos', 'Añade al menos un ejercicio a tu rutina.');
      return;
    }

    const routineData = {
      name: routineName.trim(),
      description: description,
      image_url: imageUrl,
      folder: folder || null,
      is_trainer_template: false,
      exercises: exercises.map((ex: any, index: number) => ({
        exercise_list_id: ex.is_manual ? null : ex.exercise_list_id || ex.exercise_id || ex.id,
        name: ex.name,
        muscle_group: ex.is_manual ? ex.muscle_group : undefined,
        sets: parseInt(String(ex.sets), 10) || 3,
        reps: String(ex.reps),
        rest_seconds: parseInt(String(ex.rest_seconds), 10) || 60,
        exercise_order: index,
      })),
    };

    try {
      if (routineId) {
        const updateRoutine = useAppStore.getState().updateRoutine;
        const res = await updateRoutine(routineId, routineData);
        if (res && !res.success) throw new Error(res.message);
      } else {
        const createRoutine = useAppStore.getState().createRoutine;
        const res = await createRoutine(routineData);
        if (res && !res.success) throw new Error(res.message);
      }

      useAppStore.getState().clearRoutineEditorState();
      goBackSafe();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al guardar la rutina');
    }
  };

  const addManualExercise = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setExercises((prev: any[]) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        exercise_id: null,
        name: '',
        muscle_group: 'Otro',
        sets: '3',
        reps: '10',
        rest_seconds: '60',
        is_manual: true,
      },
    ]);
  };

  const PREDEFINED_GRADIENTS: {
    colors: readonly [string, string];
    start: { x: number; y: number };
    end: { x: number; y: number };
    name: string;
  }[] = [
    { colors: [colors.tint, isDark ? '#09090b' : '#f1f5f9'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, name: 'grad-1' },
    { colors: [isDark ? '#18181b' : '#ffffff', colors.tint], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, name: 'grad-2' },
    { colors: ['#000000', colors.tint], start: { x: 0, y: 1 }, end: { x: 1, y: 0 }, name: 'grad-3' },
    { colors: [colors.tint + '88', colors.tint + '22'], start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, name: 'grad-4' },
    { colors: [colors.tint, colors.tint], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, name: 'grad-5' },
  ];

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const saveContrastText = isIOS ? colors.tint : getContrastTextColor(colors.tint);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background,
      }}
    >
      <ThemeBackground />

      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
        pointerEvents="box-none"
      >
        <GlobalHeader
          title={routineId ? 'Editar Rutina' : 'Crear Rutina'}
          scrollY={scrollY}
          showBackButton={true}
          hideRightButtons={true}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: insets.top + 72,
            paddingBottom: insets.bottom + 60,
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: Platform.OS !== 'web',
          })}
          scrollEventThrottle={16}
        >
          {/* Page Header */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              {routineId ? 'Editar Rutina' : 'Crear Rutina'}
            </Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
              Configura la portada, carpeta y los ejercicios de tu entrenamiento.
            </Text>
          </View>

          {/* 1. PORTADA DE LA RUTINA */}
          <Text style={[styles.sectionHeaderLabel, { color: colors.textSecondary }]}>
            IMAGEN DE PORTADA
          </Text>
          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              },
              iosCardSurface,
            ]}
          >
            {useGlass && (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
            )}

            <View style={{ alignItems: 'center' }}>
              <View
                style={[
                  styles.imagePreviewContainer,
                  {
                    backgroundColor: isIOS
                      ? isDark
                        ? '#2C2C2E'
                        : '#F2F2F7'
                      : colors.card,
                    borderColor: imageUrl ? colors.tint : colors.border,
                    borderWidth: imageUrl ? 2 : isIOS ? 0 : 1,
                  },
                ]}
              >
                {imageUrl ? (
                  <>
                    {imageUrl.startsWith('grad-') ? (
                      <LinearGradient
                        colors={
                          PREDEFINED_GRADIENTS.find(g => g.name === imageUrl)?.colors || [
                            colors.card,
                            colors.tint,
                          ]
                        }
                        start={
                          PREDEFINED_GRADIENTS.find(g => g.name === imageUrl)?.start || {
                            x: 0,
                            y: 0,
                          }
                        }
                        end={
                          PREDEFINED_GRADIENTS.find(g => g.name === imageUrl)?.end || {
                            x: 1,
                            y: 1,
                          }
                        }
                        style={StyleSheet.absoluteFill}
                      />
                    ) : (
                      <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} />
                    )}
                    <TouchableOpacity
                      onPress={() => setImageUrl(null)}
                      style={styles.removeCoverBtn}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <ImageIcon
                      size={32}
                      color={colors.textSecondary}
                      style={{ marginBottom: 8, opacity: 0.5 }}
                    />
                    <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                      Sin imagen de portada
                    </Text>
                  </View>
                )}
              </View>

              {/* Image Actions */}
              <View style={{ flexDirection: 'row', width: '100%', gap: 10, marginBottom: 18 }}>
                <GlassButton
                  noShadow
                  theme={theme}
                  colors={colors}
                  onPress={handleImagePick}
                  style={styles.coverActionBtn}
                >
                  <View style={styles.btnInnerRow}>
                    <Upload size={16} color={colors.text} />
                    <Text style={[styles.coverActionBtnText, { color: colors.text }]}>
                      Subir foto
                    </Text>
                  </View>
                </GlassButton>

                <GlassButton
                  noShadow
                  theme={theme}
                  colors={colors}
                  onPress={() => setShowPixabay(true)}
                  style={styles.coverActionBtn}
                >
                  <View style={styles.btnInnerRow}>
                    <Search size={16} color={colors.text} />
                    <Text style={[styles.coverActionBtnText, { color: colors.text }]}>
                      Pixabay
                    </Text>
                  </View>
                </GlassButton>
              </View>

              {/* Predefined Colors */}
              <Text style={[styles.sectionLabelSmall, { color: colors.textSecondary }]}>
                O ELIGE UN ESTILO DE COLOR
              </Text>
              <View style={styles.swatchesRow}>
                {PREDEFINED_GRADIENTS.map((grad, index) => {
                  const selected = imageUrl === grad.name;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setImageUrl(grad.name)}
                      activeOpacity={0.8}
                      style={[
                        styles.colorSwatch,
                        selected && { borderWidth: 2.5, borderColor: colors.tint },
                      ]}
                    >
                      <LinearGradient
                        colors={grad.colors}
                        start={grad.start}
                        end={grad.end}
                        style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* 2. DATOS DE LA RUTINA */}
          <Text style={[styles.sectionHeaderLabel, { color: colors.textSecondary }]}>
            INFORMACIÓN GENERAL
          </Text>
          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                gap: 12,
              },
              iosCardSurface,
            ]}
          >
            {useGlass && (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
            )}

            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nombre</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  iosInnerSurface,
                ]}
                placeholder="Ej. Empuje Hipertrofia..."
                selectionColor={colors.tint}
                placeholderTextColor={colors.textSecondary + '80'}
                value={routineName}
                onChangeText={setRoutineName}
              />
            </View>

            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Carpeta</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                  },
                  iosInnerSurface,
                ]}
                onPress={() => setShowFolderPicker(true)}
              >
                <Folder size={18} color={colors.tint} style={{ marginRight: 10 }} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: '600',
                    color: folder ? colors.text : colors.textSecondary,
                  }}
                >
                  {folder || 'Sin carpeta (Opcional)'}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Descripción (Opcional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  iosInnerSurface,
                ]}
                placeholder="Notas o enfoque de la rutina..."
                selectionColor={colors.tint}
                placeholderTextColor={colors.textSecondary + '80'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* 3. LISTA DE EJERCICIOS */}
          <View style={styles.exercisesHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Ejercicios ({exercises.length})
            </Text>
          </View>

          {exercises.length === 0 ? (
            <View
              style={[
                styles.emptyExercises,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
                  borderColor: colors.border,
                },
                iosCardSurface,
              ]}
            >
              <Library
                size={32}
                color={colors.textSecondary}
                style={{ opacity: 0.45, marginBottom: 8 }}
              />
              <Text
                style={{
                  color: colors.text,
                  fontWeight: '700',
                  fontSize: 15,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                Aún no has añadido ningún ejercicio
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                Añade ejercicios desde la biblioteca o crea uno manual abajo.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 18, marginBottom: 26 }}>
              {exercises.map((item: any, index: number) => (
                <View
                  key={item.id || String(index)}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                    iosCardSurface,
                  ]}
                >
                  {useGlass && (
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    />
                  )}

                  {/* Top Bar: Order Badge + Reorder & Delete Actions */}
                  <View style={styles.exerciseCardTopRow}>
                    <View
                      style={[
                        styles.orderBadge,
                        { backgroundColor: colors.tint + '1F' },
                      ]}
                    >
                      <Text style={[styles.orderBadgeText, { color: colors.tint }]}>
                        Ejercicio #{index + 1}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity
                        disabled={index === 0}
                        onPress={() => moveExercise(index, 'up')}
                        style={[
                          styles.iconCtrlBtn,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.05)',
                            opacity: index === 0 ? 0.3 : 1,
                          },
                        ]}
                      >
                        <ChevronUp size={18} color={colors.text} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={index === exercises.length - 1}
                        onPress={() => moveExercise(index, 'down')}
                        style={[
                          styles.iconCtrlBtn,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.05)',
                            opacity: index === exercises.length - 1 ? 0.3 : 1,
                          },
                        ]}
                      >
                        <ChevronDown size={18} color={colors.text} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removeExercise(item.id)}
                        style={[
                          styles.iconCtrlBtn,
                          {
                            backgroundColor: 'rgba(239, 68, 68, 0.14)',
                          },
                        ]}
                      >
                        <Trash2 size={17} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Full-Width Visual Media Preview (YouTube Thumbnail / Video or Animated GIF) */}
                  {!item.is_manual && (
                    <View
                      style={[
                        styles.exerciseMediaBanner,
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
                  )}

                  {/* Exercise Name & Muscle Badge */}
                  <View style={styles.exerciseInfoBlock}>
                    {item.is_manual ? (
                      <View style={{ gap: 10 }}>
                        <TextInput
                          style={[
                            styles.manualNameInput,
                            {
                              color: colors.text,
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                            },
                            iosInnerSurface,
                          ]}
                          placeholder="Nombre del ejercicio..."
                          selectionColor={colors.tint}
                          placeholderTextColor={colors.textSecondary}
                          value={item.name}
                          onChangeText={val => updateExerciseField(item.id, 'name', val)}
                        />
                        <TouchableOpacity
                          style={[
                            styles.manualMusclePill,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                            },
                            iosInnerSurface,
                          ]}
                          onPress={() =>
                            setSelectModalConfig({
                              visible: true,
                              title: 'Músculo Principal',
                              options: MUSCLE_OPTIONS,
                              value: item.muscle_group || 'Otro',
                              onSelect: val =>
                                updateExerciseField(item.id, 'muscle_group', val),
                            })
                          }
                        >
                          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                            Músculo:{' '}
                          </Text>
                          <Text
                            style={{
                              color: colors.tint,
                              fontSize: 12,
                              fontWeight: '700',
                            }}
                          >
                            {item.muscle_group || 'Otro'}
                          </Text>
                          <ChevronDown
                            size={14}
                            color={colors.tint}
                            style={{ marginLeft: 4 }}
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ gap: 6 }}>
                        <Text
                          style={[styles.exerciseTitleText, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          <View
                            style={{
                              backgroundColor: colors.tint + '1A',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.tint,
                                fontSize: 11,
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: 0.3,
                              }}
                            >
                              {item.muscle_group || item.category || 'General'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Series / Reps / Rest Pills */}
                  <View style={styles.pillsRow}>
                    {/* Series */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[
                        styles.metricPill,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                        iosInnerSurface,
                      ]}
                      onPress={() =>
                        setSelectModalConfig({
                          visible: true,
                          title: 'Series',
                          options: SETS_OPTIONS,
                          value: String(item.sets),
                          onSelect: val => updateExerciseField(item.id, 'sets', val),
                        })
                      }
                    >
                      <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>
                        SERIES
                      </Text>
                      <Text style={[styles.metricPillVal, { color: colors.text }]}>
                        {item.sets}
                      </Text>
                    </TouchableOpacity>

                    {/* Reps */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[
                        styles.metricPill,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                        iosInnerSurface,
                      ]}
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
                          onSelect: val => updateExerciseField(item.id, 'reps', val),
                        });
                      }}
                    >
                      <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>
                        REPS
                      </Text>
                      <Text style={[styles.metricPillVal, { color: colors.text }]}>
                        {item.reps}
                      </Text>
                    </TouchableOpacity>

                    {/* Rest */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[
                        styles.metricPill,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                        iosInnerSurface,
                      ]}
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
                          onSelect: val => updateExerciseField(item.id, 'rest_seconds', val),
                        });
                      }}
                    >
                      <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>
                        DESCANSO
                      </Text>
                      <Text style={[styles.metricPillVal, { color: colors.text }]}>
                        {item.rest_seconds || 60}s
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 4. ACCIONES DE AÑADIR & GUARDAR */}
          <View style={{ gap: 12, width: '100%' }}>
            {/* Add from Library */}
            <GlassButton
              noShadow
              theme={theme}
              colors={colors}
              onPress={() => setShowExerciseSearch(true)}
              style={styles.fullWidthBtn}
            >
              <View style={styles.btnInnerRow}>
                <Library size={20} color={colors.tint} />
                <Text style={[styles.fullWidthBtnText, { color: colors.text }]}>
                  Añadir desde Biblioteca
                </Text>
              </View>
            </GlassButton>

            {/* Add Manual */}
            <GlassButton
              noShadow
              theme={theme}
              colors={colors}
              onPress={addManualExercise}
              style={styles.fullWidthBtn}
            >
              <View style={styles.btnInnerRow}>
                <Plus size={20} color={colors.textSecondary} />
                <Text style={[styles.fullWidthBtnText, { color: colors.textSecondary }]}>
                  Añadir Ejercicio Manual
                </Text>
              </View>
            </GlassButton>

            {/* Save Button */}
            <GlassButton
              color={colors.tint}
              noShadow
              theme={theme}
              colors={colors}
              onPress={handleSave}
              style={[styles.fullWidthBtn, { marginTop: 8 }]}
            >
              <View style={styles.btnInnerRow}>
                <Save size={20} color={saveContrastText} />
                <Text style={[styles.fullWidthBtnText, { color: saveContrastText }]}>
                  {routineId ? 'Guardar Cambios' : 'Crear Rutina'}
                </Text>
              </View>
            </GlassButton>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <PixabayModal
        visible={showPixabay}
        onClose={() => setShowPixabay(false)}
        onSelectImage={url => {
          setCropImageUrl(url);
          setShowPixabay(false);
        }}
      />

      <CropModal
        visible={!!cropImageUrl}
        imageUrl={cropImageUrl}
        onClose={() => setCropImageUrl(null)}
        onCrop={(url: string) => {
          setImageUrl(url);
          setCropImageUrl(null);
        }}
      />

      <SwipeableBottomSheet
        visible={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        isDark={isDark}
        backgroundColor={colors.card}
        avoidKeyboard
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: isIOS ? '700' : '900',
              letterSpacing: -0.4,
              color: colors.text,
              marginBottom: 14,
            }}
          >
            Seleccionar Carpeta
          </Text>

          <View
            style={[
              {
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                marginBottom: 16,
              },
              getAppleSheetCardStyle(isDark, 16),
            ]}
          >
            <TouchableOpacity
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: uniqueFolders.length > 0 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              }}
              onPress={() => {
                setFolder('');
                setShowFolderPicker(false);
              }}
            >
              <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600' }}>
                Sin carpeta (Quitar)
              </Text>
              {!folder && <Check size={18} color="#ef4444" />}
            </TouchableOpacity>

            {uniqueFolders.map((f, i) => {
              const selected = folder === f;
              return (
                <TouchableOpacity
                  key={i}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth:
                      i === uniqueFolders.length - 1 ? 0 : StyleSheet.hairlineWidth,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  }}
                  onPress={() => {
                    setFolder(f as string);
                    setShowFolderPicker(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Folder size={17} color={selected ? colors.tint : colors.textSecondary} />
                    <Text
                      style={{
                        color: selected ? colors.tint : colors.text,
                        fontSize: 16,
                        fontWeight: selected ? '700' : '500',
                      }}
                    >
                      {f as string}
                    </Text>
                  </View>
                  {selected && <Check size={18} color={colors.tint} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Crear nueva carpeta inline */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            O CREA UNA CARPETA NUEVA
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Nombre de nueva carpeta..."
              placeholderTextColor={colors.textSecondary + '80'}
              style={[
                {
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  color: colors.text,
                  fontSize: 15,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                },
                getAppleSheetCardStyle(isDark, 14),
              ]}
            />
            <TouchableOpacity
              onPress={() => {
                if (newFolderName.trim()) {
                  setFolder(newFolderName.trim());
                  setNewFolderName('');
                  setShowFolderPicker(false);
                }
              }}
              style={{
                height: 48,
                paddingHorizontal: 18,
                borderRadius: 14,
                backgroundColor: colors.tint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: getContrastTextColor(colors.tint),
                  fontWeight: '700',
                  fontSize: 15,
                }}
              >
                Usar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SwipeableBottomSheet>

      <ExerciseSearchModal
        visible={showExerciseSearch}
        onClose={() => setShowExerciseSearch(false)}
        onAddExercises={newExercises => {
          const mapped = newExercises.map(item => ({
            ...item.exercise,
            id: Math.random().toString(36).substring(7),
            exercise_id: item.exercise.id,
            exercise_list_id: item.exercise.id,
            is_manual: false,
            sets: item.sets,
            reps: item.reps,
            rest_seconds: item.rest_seconds,
          }));
          setExercises((prev: any[]) => [...prev, ...mapped]);
        }}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: Platform.OS === 'ios' ? 32 : 28,
    fontWeight: Platform.OS === 'ios' ? '700' : '900',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginLeft: 6,
  },
  cardContainer: {
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  imagePreviewContainer: {
    width: '72%',
    aspectRatio: 16 / 9,
    borderRadius: 18,
    borderCurve: 'continuous',
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 16,
  },
  removeCoverBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 6,
    zIndex: 10,
  },
  coverActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
  },
  coverActionBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sectionLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.6,
  },
  swatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  colorSwatch: {
    width: 52,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  textArea: {
    height: 92,
    paddingTop: 14,
    paddingBottom: 12,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : '900',
    letterSpacing: -0.4,
  },
  emptyExercises: {
    padding: 28,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  exerciseCard: {
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  exerciseCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
  },
  orderBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  iconCtrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseMediaBanner: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginBottom: 14,
  },
  exerciseInfoBlock: {
    marginBottom: 14,
  },
  exerciseTitleText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  manualNameInput: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  manualMusclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  metricPillVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  fullWidthBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
  },
  fullWidthBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
