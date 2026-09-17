import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, Alert, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check, Image as ImageIcon, Folder, Info, ChevronDown, Plus, Camera, Search, Library, Sparkles, Upload, Save, Trash2, GripVertical, PlayCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { GlassButton } from '@/components/ui/GlassButton';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { PixabayModal } from '@/components/modals/PixabayModal';
import { ExerciseSearchModal } from '@/components/modals/ExerciseSearchModal';
import { CropModal } from '@/components/modals/CropModal';
import { SelectModal, SelectOption } from '@/components/ui/SelectModal';
import { SETS_OPTIONS, REPS_OPTIONS, REST_OPTIONS } from '@/constants/exerciseOptions';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';

export default function RoutineEditorScreen() {
  const router = useRouter();
  const theme = useAppStore(state => state.theme);
  const colors = Colors[theme as keyof typeof Colors] || Colors.oled;
  const insets = useSafeAreaInsets();

  // Global Store State
  const routineEditorState = useAppStore(state => state.routineEditorState);
  const setRoutineEditorState = useAppStore(state => state.setRoutineEditorState);
  const loadRoutineEditorState = useAppStore(state => state.loadRoutineEditorState);

  const { routineName, description, folder, imageUrl, exercises } = routineEditorState;

  React.useEffect(() => {
    loadRoutineEditorState();
  }, [loadRoutineEditorState]);

  const setRoutineName = (val: string) => setRoutineEditorState({ routineName: val });
  const setDescription = (val: string) => setRoutineEditorState({ description: val });
  const setFolder = (val: string) => setRoutineEditorState({ folder: val });
  const setImageUrl = (val: string | null) => setRoutineEditorState({ imageUrl: val });
  const setExercises = (updater: any) => {
    setRoutineEditorState((prev: any) => ({ 
      exercises: typeof updater === 'function' ? updater(prev.exercises) : updater 
    }));
  };

  // UI State
  const [showPixabay, setShowPixabay] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
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
    onSelect: () => {}
  });

  const updateExerciseField = (exerciseId: string, field: string, value: any) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  const routines = useAppStore(state => state.routines || []);
  const uniqueFolders = useMemo(() => {
    const folders = routines.map((r: any) => r.folder).filter((f: string) => f && f.trim() !== '');
    return [...new Set(folders)].sort();
  }, [routines]);

  const getImageUrl = (item: any) => {
    if (item.image_url_start) return item.image_url_start;
    if (item.image_url) return item.image_url;
    if (item.images && Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    if (item.images && typeof item.images === 'string') {
      try { const parsed = JSON.parse(item.images); if (parsed.length > 0) return parsed[0]; } catch(e) {}
    }
    return item.muscle_group_image_url || 'https://via.placeholder.com/400';
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
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
        name: routineName,
        description: description,
        image_url: imageUrl,
        folder: folder || null,
        is_trainer_template: false,
        exercises: exercises.map((ex: any, index: number) => ({
          exercise_id: ex.exercise_id || ex.id,
          name: ex.is_manual ? ex.name : undefined,
          sets: parseInt(String(ex.sets), 10) || 3,
          reps: String(ex.reps),
          rest_seconds: parseInt(String(ex.rest_seconds), 10) || 60,
          exercise_order: index,
        }))
    };

    try {
      const createRoutine = useAppStore.getState().createRoutine;
      await createRoutine(routineData);
      
      useAppStore.getState().clearRoutineEditorState();
      goBackSafe();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al guardar la rutina');
    }
  };

  const addManualExercise = () => {
    setExercises((prev: any) => [...prev, {
      id: Math.random().toString(36).substring(7),
      exercise_id: null,
      name: '',
      sets: '3',
      reps: '10',
      rest_seconds: '60',
      is_manual: true
    }]);
  };



  const renderHeader = () => {
    const PREDEFINED_GRADIENTS = [
      { colors: [colors.tint, colors.background], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, name: 'grad-1' },
      { colors: [colors.card, colors.tint], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, name: 'grad-2' },
      { colors: ['#000000', colors.tint], start: { x: 0, y: 1 }, end: { x: 1, y: 0 }, name: 'grad-3' },
      { colors: ['rgba(255,255,255,0.1)', colors.tint + '50'], start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, name: 'grad-4' },
      { colors: [colors.tint, colors.tint], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, name: 'grad-5' }
    ];

    return (
    <View style={styles.content}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Imagen de Portada</Text>
      
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        {/* Cover Image Preview */}
        <View style={[styles.imagePreviewContainer, { backgroundColor: colors.card, borderColor: colors.border, width: '60%', aspectRatio: 16/9, height: 'auto' }]}>
          {imageUrl ? (
            <>
              {imageUrl.startsWith('grad-') ? (
                <LinearGradient 
                  colors={PREDEFINED_GRADIENTS.find(g => g.name === imageUrl)?.colors || [colors.card, colors.tint]} 
                  start={PREDEFINED_GRADIENTS.find(g => g.name === imageUrl)?.start || {x: 0, y: 0}}
                  end={PREDEFINED_GRADIENTS.find(g => g.name === imageUrl)?.end || {x: 1, y: 1}}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} 
                />
              ) : (
                <Image source={{ uri: imageUrl }} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
              )}
              <TouchableOpacity
                onPress={() => setImageUrl(null)}
                style={{
                  position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 6, zIndex: 10
                }}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <ImageIcon size={32} color={colors.textSecondary} style={{ marginBottom: 8, opacity: 0.5 }} />
              <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>Sin imagen</Text>
            </View>
          )}
        </View>

        {/* Image Actions */}
        <View style={{ width: '100%', gap: 12, marginBottom: 24 }}>
          <GlassButton theme={theme} colors={colors} onPress={handleImagePick} style={styles.actionBtn}>
            <Upload size={18} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontWeight: 'bold' }}>Subir foto</Text>
          </GlassButton>
          
          <GlassButton theme={theme} colors={colors} onPress={() => setShowPixabay(true)} style={styles.actionBtn}>
            <Search size={18} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontWeight: 'bold' }}>Buscar en Pixabay</Text>
          </GlassButton>
        </View>

        {/* Predefined Colors */}
        <Text style={[styles.sectionLabelSmall, { color: colors.textSecondary }]}>O ELIGE UN ESTILO DE COLOR</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, width: '100%' }}>
          {PREDEFINED_GRADIENTS.map((grad, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setImageUrl(grad.name)}
              style={[styles.colorSwatch, { borderWidth: imageUrl === grad.name ? 3 : 0, borderColor: colors.tint, marginRight: 0 }]}
            >
              <LinearGradient colors={grad.colors} start={grad.start} end={grad.end} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Inputs */}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex2, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          placeholder="Nombre de la rutina..."
          placeholderTextColor={colors.textSecondary}
          value={routineName}
          onChangeText={setRoutineName}
        />
      </View>

      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.input, styles.flex1, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => setShowFolderPicker(true)}
        >
          <Folder size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={{ flex: 1, color: folder ? colors.text : colors.textSecondary }}>{folder || 'Carpeta (Opcional)'}</Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
        placeholder="Descripción (opcional)..."
        placeholderTextColor={colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <View style={styles.exercisesHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ejercicios ({exercises.length})</Text>
      </View>
    </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footer}>
      {exercises.length === 0 && (
        <View style={[styles.emptyExercises, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 24 }]}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Aún no has añadido ningún ejercicio.
          </Text>
        </View>
      )}

      <View style={{ gap: 12, width: '100%' }}>
        {/* AI Analizer */}
        <GlassButton theme={theme} colors={colors} onPress={() => Alert.alert('IA', 'Próximamente')} style={styles.aiButton}>
          <Sparkles size={20} color={colors.text} />
          <Text style={[styles.aiButtonText, { color: colors.text }]}>Analizar Rutina con IA</Text>
        </GlassButton>

        {/* Add from Library */}
        <GlassButton theme={theme} colors={colors} onPress={() => setShowExerciseSearch(true)} style={styles.libraryBtn}>
          <Library size={20} color={colors.text} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>Añadir desde Biblioteca</Text>
        </GlassButton>
        
        {/* Add Manual */}
        <GlassButton theme={theme} colors={colors} onPress={addManualExercise} style={styles.manualBtn}>
          <Plus size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 16 }}>Añadir Ejercicio Manual</Text>
        </GlassButton>

        {/* Save */}
        <GlassButton theme={theme} colors={colors} onPress={handleSave} style={[styles.libraryBtn, { marginTop: 12 }]}>
          <Save size={20} color={colors.text} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>Crear Rutina</Text>
        </GlassButton>
      </View>
    </View>
  );

  const renderExerciseItem = React.useCallback(({ item, drag, isActive }: any) => {
    const imgUrl = getImageUrl(item);
    return (
      <ScaleDecorator activeScale={1.02}>
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={{ 
            flexDirection: 'column', 
            alignItems: 'stretch',
            backgroundColor: colors.card, 
            borderRadius: 16, 
            borderWidth: 1, 
            borderColor: isActive ? colors.tint : colors.border,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isActive ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: isActive ? 8 : 2
          }}>
            {/* Media - hide for manual exercises */}
            {!item.is_manual && (
              <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.background }}>
                <ExerciseMediaPreview item={item} getImageUrl={getImageUrl} staticOnly={true} />
              </View>
            )}

            {/* Content */}
            <View style={{ flex: 1, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {item.is_manual ? (
                    <TextInput
                      style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, padding: 0, margin: 0, borderBottomWidth: 1, borderBottomColor: colors.border }}
                      placeholder="Nombre del ejercicio..."
                      placeholderTextColor={colors.textSecondary}
                      value={item.name}
                      onChangeText={(val) => updateExerciseField(item.id, 'name', val)}
                    />
                  ) : (
                    <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18 }} numberOfLines={2}>{item.name}</Text>
                  )}
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                    {item.muscle_group || item.category || 'Varios'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(item.id)} style={{ padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12 }}>
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {/* Info Pills */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {/* Series */}
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: colors.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                  onPress={() => setSelectModalConfig({
                    visible: true,
                    title: 'Series',
                    options: SETS_OPTIONS,
                    value: String(item.sets),
                    onSelect: (val) => updateExerciseField(item.id, 'sets', val)
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
                      onSelect: (val) => updateExerciseField(item.id, 'reps', val)
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
                      onSelect: (val) => updateExerciseField(item.id, 'rest_seconds', val)
                    });
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Desc. (s)</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{item.rest_seconds || 60}s</Text>
                </TouchableOpacity>
              </View>

              {/* Drag Handle */}
              <TouchableOpacity 
                onLongPress={drag} 
                disabled={isActive}
                style={{ marginTop: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
              >
                <GripVertical size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 14 }}>Mantén para reordenar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScaleDecorator>
    );
  }, [colors, updateExerciseField, removeExercise]);

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.mainHeader, { paddingTop: insets.top + 12, backgroundColor: 'transparent', position: 'absolute', top: 0, left: 0, right: 0 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
          <AnimatedBlurView intensity={theme === 'oled' ? 50 : 80} tint={theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'default'} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: 0.5 }]} />
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
        </Animated.View>
        
        <GlassButton theme={theme} onPress={() => goBackSafe()} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={colors.textSecondary} />
        </GlassButton>
        
        <Text style={[styles.headerTitle, { color: colors.text, flex: 1, textAlign: 'center' }]}>Crear Nueva Rutina</Text>
        
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <DraggableFlatList
            data={exercises}
            onDragEnd={({ data }) => setExercises(data)}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            renderItem={renderExerciseItem}
            contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: 40 }}
            onScrollOffsetChange={(offset) => scrollY.setValue(offset)}
            scrollEventThrottle={16}
          />
      </KeyboardAvoidingView>

      <PixabayModal 
        visible={showPixabay} 
        onClose={() => setShowPixabay(false)} 
        onSelectImage={(url) => { setCropImageUrl(url); setShowPixabay(false); }} 
      />

      <CropModal
        visible={!!cropImageUrl}
        imageUrl={cropImageUrl}
        onClose={() => setCropImageUrl(null)}
        onCrop={(url: string) => { setImageUrl(url); setCropImageUrl(null); }}
      />

      <Modal visible={showFolderPicker} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }} onPress={() => setShowFolderPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderColor: colors.border, borderWidth: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Seleccionar Carpeta</Text>
            
            <TouchableOpacity style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => { setFolder(''); setShowFolderPicker(false); }}>
              <Text style={{ color: colors.error || '#ef4444', fontSize: 16, fontWeight: 'bold' }}>✕ Ninguna (Quitar)</Text>
            </TouchableOpacity>

            {uniqueFolders.length > 0 ? (
              uniqueFolders.map((f, i) => (
                <TouchableOpacity key={i} style={{ paddingVertical: 12, borderBottomWidth: i === uniqueFolders.length -1 ? 0 : 1, borderBottomColor: colors.border }} onPress={() => { setFolder(f as string); setShowFolderPicker(false); }}>
                  <Text style={{ color: colors.text, fontSize: 16 }}>{f as string}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: colors.textSecondary }}>No tienes carpetas creadas aún.</Text>
            )}
            <TouchableOpacity style={{ marginTop: 16, paddingVertical: 12, backgroundColor: colors.tint, borderRadius: 12, alignItems: 'center' }} onPress={() => {
              Alert.prompt('Nueva Carpeta', 'Introduce el nombre:', (text) => {
                if (text) { setFolder(text); setShowFolderPicker(false); }
              });
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Crear Nueva Carpeta</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ExerciseSearchModal 
        visible={showExerciseSearch} 
        onClose={() => setShowExerciseSearch(false)}
        onAddExercises={(newExercises) => {
          const mapped = newExercises.map(item => ({
            ...item.exercise,
            id: Math.random().toString(36).substring(7),
            exercise_id: item.exercise.id,
            sets: item.sets,
            reps: item.reps,
            rest_seconds: item.rest_seconds,
          }));
          setExercises(prev => [...prev, ...mapped]);
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
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  saveButtonText: {
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
  },
  imageUpload: {
    height: 180,
    borderWidth: 1.5,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  input: {
    height: 54,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    marginBottom: 32,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  footer: {
    paddingHorizontal: 16,
  },
  emptyExercises: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    height: 140,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    height: 'auto',
  },
  sectionLabelSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  colorSwatch: {
    width: 60,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    height: 'auto',
  },
  aiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  libraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    height: 'auto',
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    height: 'auto',
  }
});
