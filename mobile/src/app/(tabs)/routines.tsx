import React, { useState, useMemo } from 'react';
import { View, FlatList, TextInput, StyleSheet, Alert, TouchableOpacity, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, Trash2, Globe, Sparkles } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { RoutinesTabs, TabKey } from '@/components/routines/RoutinesTabs';
import { FolderList } from '@/components/routines/FolderList';
import { RoutineCard } from '@/components/routines/RoutineCard';
import GlobalHeader from '@/components/GlobalHeader';
import { GlassButton } from '@/components/ui/GlassButton';
import { useRouter } from 'expo-router';

export default function RoutinesScreen() {
  const theme = useAppStore(state => state.theme);
  const colors = Colors[theme as keyof typeof Colors] || Colors.oled;
  const router = useRouter();
  
  // Zustand state
  const routines = useAppStore(state => state.routines || []);
  const completedRoutineIdsToday = useAppStore(state => state.completedRoutineIdsToday || []);
  const startWorkout = useAppStore(state => state.startWorkout);
  // Add other actions like deleteRoutine, createRoutine when needed

  // Local State
  const [activeTab, setActiveTab] = useState<TabKey>('myRoutines');
  const [selectedFolder, setSelectedFolder] = useState<string>('Todas');
  const [query, setQuery] = useState('');

  // Derived State
  const uniqueFolders = useMemo(() => {
    const folders = new Set<string>();
    routines.forEach((r: any) => {
      if (r.folder) folders.add(r.folder);
    });
    return Array.from(folders).sort();
  }, [routines]);

  const filteredRoutines = useMemo(() => {
    return routines.filter((r: any) => {
      const matchesSearch = r.name?.toLowerCase().includes(query.toLowerCase()) || 
                            r.description?.toLowerCase().includes(query.toLowerCase());
      
      const inFolder = selectedFolder === 'Todas' ? true :
                       selectedFolder === 'Sin Carpeta' ? !r.folder :
                       r.folder === selectedFolder;
      
      return matchesSearch && inFolder;
    });
  }, [routines, query, selectedFolder]);

  const handleStartWorkout = (routine: any) => {
    if (completedRoutineIdsToday.includes(routine.id)) {
      Alert.alert('Rutina ya completada', 'Ya has completado esta rutina hoy. ¿Quieres iniciarla de nuevo?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar', onPress: () => {
          if (startWorkout) startWorkout(routine);
          else Alert.alert('Error', 'No se pudo iniciar el entrenamiento');
        }}
      ]);
    } else {
      if (startWorkout) startWorkout(routine);
      else Alert.alert('Error', 'No se pudo iniciar el entrenamiento');
    }
  };

  const handleRoutineOptions = (routine: any) => {
    Alert.alert(
      'Opciones',
      routine.name,
      [
        { text: 'Editar', onPress: () => {
          const setRoutineEditorState = useAppStore.getState().setRoutineEditorState;
          const exercises = routine.exercises || routine.RoutineExercises || [];
          const normalizedRoutine = {
            routineId: routine.id,
            routineName: routine.name,
            description: routine.description || '',
            folder: routine.folder || '',
            imageUrl: routine.image_url || null,
            exercises: exercises.map((ex: any) => ({ ...ex }))
          };
          setRoutineEditorState(normalizedRoutine);
          router.push('/routine-editor');
        } },
        { text: 'Compartir', onPress: () => Alert.alert('TODO', 'Abrir modal de compartir') },
        { text: 'Duplicar', onPress: () => Alert.alert('TODO', 'Duplicar rutina') },
        { text: 'Eliminar', onPress: () => Alert.alert('TODO', 'Eliminar rutina'), style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const insets = useSafeAreaInsets();

  const renderHeader = () => {
    return (
      <View style={{ paddingTop: insets.top + 70 }}>
        {/* Tabs */}
        <View style={[styles.tabsWrapper, { marginTop: 16 }]}>
          <RoutinesTabs activeTab={activeTab} onChangeTab={setActiveTab} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <GlassButton theme={theme} style={{ width: 44, height: 44, borderRadius: 22 }} onPress={() => Alert.alert('TODO', 'Eliminar todas')}>
            <Trash2 size={20} color={routines.length > 0 ? '#ef4444' : colors.textSecondary} />
          </GlassButton>
          <GlassButton theme={theme} style={{ width: 44, height: 44, borderRadius: 22 }} onPress={() => Alert.alert('TODO', 'Privacidad Global')}>
            <Globe size={20} color={colors.textSecondary} />
          </GlassButton>
          <GlassButton theme={theme} style={{ width: 44, height: 44, borderRadius: 22 }} onPress={() => Alert.alert('TODO', 'Generador IA')}>
            <Sparkles size={20} color={colors.tint} />
          </GlassButton>
          <GlassButton 
            theme={theme} 
            style={{ width: 'auto', height: 44, paddingHorizontal: 16, borderRadius: 22, flexDirection: 'row', marginLeft: 'auto' }} 
            onPress={() => {
              useAppStore.getState().clearRoutineEditorState();
              router.push('/routine-editor');
            }}
          >
            <Plus size={20} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={[styles.createButtonText, { color: colors.text }]}>Crear Rutina</Text>
          </GlassButton>
        </View>

        {activeTab === 'myRoutines' && (
          <View style={styles.listHeader}>
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar rutinas..."
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={setQuery}
              />
            </View>
            <FolderList
              folders={uniqueFolders}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
            />
          </View>
        )}
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No se encontraron rutinas.
      </Text>
    </View>
  );

  const scrollY = React.useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <GlobalHeader title="Rutinas" scrollY={scrollY} />
      </View>

      {activeTab === 'myRoutines' && (
        <Animated.FlatList
          data={filteredRoutines}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              onPressStart={() => handleStartWorkout(item)}
              onPressOptions={() => handleRoutineOptions(item)}
              isCompletedToday={completedRoutineIdsToday.includes(item.id)}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}

      {activeTab === 'explore' && (
        <Animated.FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Explorar plantillas (Próximamente)</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
        />
      )}

      {activeTab === 'manualExercises' && (
        <Animated.FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Ejercicios Manuales (Próximamente)</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
        />
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24, // increased spacing
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    marginLeft: 'auto',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabsWrapper: {
    marginBottom: 24, // increased spacing
  },
  listHeader: {
    marginBottom: 24, // increased spacing
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24, // increased spacing
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  }
});
