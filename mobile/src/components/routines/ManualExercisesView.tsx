/* mobile/src/components/routines/ManualExercisesView.tsx */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import {
  Dumbbell,
  Trash2,
  Info,
  ArrowRight,
  Check,
  X,
  Search,
  AlertTriangle,
  Flame,
  Award,
  RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import apiClient from '@/services/apiClient';
import { getExerciseList } from '@/services/exerciseService';

interface ManualExerciseItem {
  name: string;
  totalSets: number;
  inRoutines: number;
  maxWeight: number | null;
}

// ==========================================
// INFO MODAL
// ==========================================
interface InfoModalProps {
  visible: boolean;
  exerciseName: string | null;
  onClose: () => void;
}

const ManualExerciseInfoModal: React.FC<InfoModalProps> = ({
  visible,
  exerciseName,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore((state) => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<{
    pr?: { weight: number; date: string } | null;
    routines: string[];
    history: { date: string; sets: number; weight: number }[];
  } | null>(null);

  useEffect(() => {
    if (!visible || !exerciseName) {
      setInfo(null);
      setLoading(true);
      return;
    }

    let isMounted = true;
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await (apiClient as any)(
          `/exercise-list/manual-exercises/info?name=${encodeURIComponent(exerciseName)}`
        );
        if (isMounted) {
          setInfo(res);
        }
      } catch (err) {
        console.error('Error fetching manual exercise info:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInfo();
    return () => {
      isMounted = false;
    };
  }, [visible, exerciseName]);

  if (!visible || !exerciseName) return null;

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={isDark ? '#141418' : '#FAFAFC'}
      contentContainerStyle={{ paddingHorizontal: 20 }}
    >
      {/* Header */}
      <View style={styles.sheetHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.sheetTitle, { color: colors.text }, isIOS && { fontWeight: '700' }]} numberOfLines={1}>
                {exerciseName}
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                Detalles e Historial de Registros
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeIconBtn,
                { backgroundColor: isIOS ? (isDark ? '#2C2C2E' : '#E5E5EA') : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)') },
              ]}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Record Personal */}
              {info?.pr && (
                <View
                  style={[
                    styles.prCard,
                    {
                      backgroundColor: 'rgba(234, 179, 8, 0.12)',
                      borderColor: 'rgba(234, 179, 8, 0.3)',
                      borderWidth: isIOS ? 0 : 1,
                    },
                  ]}
                >
                  <View style={styles.prLeft}>
                    <Award size={20} color="#eab308" />
                    <Text style={[styles.prLabel, { color: colors.text }]}>
                      Récord Personal (RM)
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.prValue, { color: colors.text }]}>
                      {info.pr.weight} kg
                    </Text>
                    <Text style={[styles.prDate, { color: colors.textSecondary }]}>
                      {info.pr.date ? new Date(info.pr.date).toLocaleDateString() : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Rutinas en las que aparece */}
              {info && info.routines && info.routines.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                    RUTINAS EN LAS QUE APARECE
                  </Text>
                  <View style={styles.routineTagsRow}>
                    {info.routines.map((r, i) => (
                      <View
                        key={i}
                        style={[
                          styles.routineTag,
                          {
                            backgroundColor: isIOS
                              ? (isDark ? '#2C2C2E' : '#FFFFFF')
                              : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
                            borderColor: isIOS
                              ? 'transparent'
                              : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'),
                            borderWidth: isIOS ? 0 : 1,
                          },
                        ]}
                      >
                        <Text style={[styles.routineTagText, { color: colors.text }]}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Últimos registros */}
              <View style={styles.infoSection}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                  ÚLTIMOS REGISTROS
                </Text>
                {info && info.history && info.history.length > 0 ? (
                  info.history.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.historyItem,
                        {
                          backgroundColor: isIOS
                            ? (isDark ? '#2C2C2E' : '#FFFFFF')
                            : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                          borderColor: isIOS
                            ? 'transparent'
                            : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                          borderWidth: isIOS ? 0 : 1,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                        <Text style={[styles.historyDate, { color: colors.text }]}>
                          {new Date(h.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={[styles.historySets, { color: colors.text }]}>
                        {h.sets} series {h.weight > 0 ? `(Mejor: ${h.weight}kg)` : ''}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>
                    No hay historial de series y repeticiones.
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
    </SwipeableBottomSheet>
  );
};

// ==========================================
// TRANSFER MODAL
// ==========================================
interface TransferModalProps {
  visible: boolean;
  sourceName: string | null;
  existingManuals: string[];
  onClose: () => void;
  onSuccess: () => void;
}

const ManualExerciseTransferModal: React.FC<TransferModalProps> = ({
  visible,
  sourceName,
  existingManuals,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore((state) => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';

  const [searchQuery, setSearchQuery] = useState('');
  const [catalogExercises, setCatalogExercises] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);

  const [deleteSource, setDeleteSource] = useState(true);
  const [replaceInRoutines, setReplaceInRoutines] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar catálogo oficial para buscador
  useEffect(() => {
    if (!visible) {
      setSelectedTarget(null);
      setSearchQuery('');
      return;
    }

    let isMounted = true;
    const loadCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const data = await getExerciseList();
        if (isMounted) {
          setCatalogExercises(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error loading exercises catalog:', err);
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    };
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Filtrar catálogo por texto
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return catalogExercises
      .filter((ex) => ex.name?.toLowerCase().includes(q))
      .slice(0, 15);
  }, [catalogExercises, searchQuery]);

  const handleTransfer = async () => {
    if (!sourceName) return;
    if (!selectedTarget) {
      Alert.alert('Atención', 'Selecciona un ejercicio oficial de destino.');
      return;
    }

    if (selectedTarget.name === sourceName) {
      Alert.alert('Error', 'El ejercicio de destino no puede ser igual al de origen.');
      return;
    }

    try {
      setIsSubmitting(true);
      await (apiClient as any)('/exercise-list/manual-exercises/transfer', {
        method: 'POST',
        body: {
          sourceName,
          targetName: selectedTarget.name,
          targetExerciseListId: selectedTarget.id || null,
          deleteSource,
          replaceInRoutines,
        },
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      Alert.alert('Éxito', `Datos transferidos correctamente a "${selectedTarget.name}".`);
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al transferir datos del ejercicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible || !sourceName) return null;

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={isDark ? '#141418' : '#FAFAFC'}
      avoidKeyboard
      contentContainerStyle={{ paddingHorizontal: 20 }}
    >
      {/* Header */}
      <View style={styles.sheetHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.sheetTitle, { color: colors.text }, isIOS && { fontWeight: '700' }]}>Transferir Datos</Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                Mueve el historial y rutinas hacia un ejercicio oficial
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeIconBtn,
                { backgroundColor: isIOS ? (isDark ? '#2C2C2E' : '#E5E5EA') : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)') },
              ]}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Origen Box */}
            <View
              style={[
                styles.transferBox,
                {
                  backgroundColor: colors.tint + '15',
                  borderColor: colors.tint + '40',
                  borderWidth: isIOS ? 0 : 1,
                },
              ]}
            >
              <Text style={[styles.transferLabel, { color: colors.tint }]}>ORIGEN (MANUAL)</Text>
              <Text style={[styles.transferName, { color: colors.text }]}>{sourceName}</Text>
            </View>

            <View style={styles.arrowCenter}>
              <ArrowRight size={22} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
            </View>

            {/* Destino Box / Buscador */}
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginBottom: 8 }]}>
                DESTINO (BIBLIOTECA OFICIAL)
              </Text>

              {selectedTarget ? (
                <View
                  style={[
                    styles.selectedTargetCard,
                    {
                      backgroundColor: colors.tint + '15',
                      borderColor: colors.tint + '50',
                      borderWidth: isIOS ? 0 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectedTargetName, { color: colors.text }]}>
                      {selectedTarget.name}
                    </Text>
                    <Text style={[styles.selectedTargetSub, { color: colors.textSecondary }]}>
                      {selectedTarget.muscle_group || 'Ejercicio oficial'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedTarget(null)}
                    style={styles.removeTargetBtn}
                  >
                    <Text style={styles.removeTargetText}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View
                    style={[
                      styles.searchInputContainer,
                      {
                        backgroundColor: isIOS
                          ? (isDark ? '#2C2C2E' : '#FFFFFF')
                          : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                        borderColor: isIOS
                          ? 'transparent'
                          : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                        borderWidth: isIOS ? 0 : 1,
                      },
                    ]}
                  >
                    <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="Buscar ejercicio oficial..."
                      placeholderTextColor={colors.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <X size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Resultados de búsqueda */}
                  {searchQuery.trim().length > 0 && (
                    <View
                      style={[
                        styles.searchResultsContainer,
                        {
                          backgroundColor: isIOS
                            ? (isDark ? '#2C2C2E' : '#FFFFFF')
                            : (isDark ? 'rgba(28, 28, 36, 0.98)' : 'rgba(245, 245, 247, 0.98)'),
                          borderColor: isIOS
                            ? 'transparent'
                            : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                          borderWidth: isIOS ? 0 : 1,
                        },
                      ]}
                    >
                      {filteredCatalog.length > 0 ? (
                        filteredCatalog.map((ex) => (
                          <TouchableOpacity
                            key={ex.id || ex.name}
                            style={[
                              styles.searchResultItem,
                              {
                                borderBottomColor: isDark
                                  ? 'rgba(255, 255, 255, 0.06)'
                                  : 'rgba(0, 0, 0, 0.05)',
                              },
                            ]}
                            onPress={() => {
                              setSelectedTarget(ex);
                              setSearchQuery('');
                            }}
                          >
                            <Text style={[styles.resultItemName, { color: colors.text }]}>
                              {ex.name}
                            </Text>
                            <Text style={[styles.resultItemMuscle, { color: colors.textSecondary }]}>
                              {ex.muscle_group || ''}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={{ padding: 16, alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                            No se encontraron ejercicios oficiales con ese nombre.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Opciones Checkboxes */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.8}
                onPress={() => setDeleteSource(!deleteSource)}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    deleteSource
                      ? { backgroundColor: colors.tint, borderColor: colors.tint }
                      : { borderColor: colors.textSecondary },
                  ]}
                >
                  {deleteSource && <Check size={14} color="#000" strokeWidth={3} />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                  Mover datos y eliminar "{sourceName}"
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.8}
                onPress={() => setReplaceInRoutines(!replaceInRoutines)}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    replaceInRoutines
                      ? { backgroundColor: colors.tint, borderColor: colors.tint }
                      : { borderColor: colors.textSecondary },
                  ]}
                >
                  {replaceInRoutines && <Check size={14} color="#000" strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                    Reemplazar en mis rutinas guardadas
                  </Text>
                  <Text style={[styles.checkboxDesc, { color: colors.textSecondary }]}>
                    Las rutinas que tengan "{sourceName}" usarán el ejercicio de destino.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Warning si no elimina origen */}
            {!deleteSource && (
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: 'rgba(234, 179, 8, 0.12)', borderColor: 'rgba(234, 179, 8, 0.25)', borderWidth: isIOS ? 0 : 1 },
                ]}
              >
                <AlertTriangle size={18} color="#eab308" style={{ marginTop: 2 }} />
                <Text style={[styles.warningText, { color: isDark ? '#fef08a' : '#854d0e' }]}>
                  Si no eliminas el origen, se copiará el historial manteniendo los registros tanto en el origen como en el destino.
                </Text>
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.actionsFooter}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { backgroundColor: isIOS ? (isDark ? '#2C2C2E' : '#E5E5EA') : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)') },
                ]}
                onPress={onClose}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: colors.tint, opacity: isSubmitting || !selectedTarget ? 0.5 : 1 },
                ]}
                disabled={isSubmitting || !selectedTarget}
                onPress={handleTransfer}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.confirmBtnText}>Transferir</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
    </SwipeableBottomSheet>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const ManualExercisesView: React.FC = () => {
  const colors = useAppColors();
  const theme = useAppStore((state) => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const iosTertiaryBg = isDark ? '#2C2C2E' : '#F2F2F7';

  const [exercises, setExercises] = useState<ManualExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Modals state
  const [infoExercise, setInfoExercise] = useState<string | null>(null);
  const [transferExercise, setTransferExercise] = useState<string | null>(null);

  const loadManualExercises = useCallback(async () => {
    try {
      setLoading(true);
      const res = await (apiClient as any)('/exercise-list/manual-exercises');
      setExercises(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching manual exercises:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManualExercises();
  }, [loadManualExercises]);

  // Filtrado por buscador
  const filteredExercises = useMemo(() => {
    if (!query.trim()) return exercises;
    const q = query.toLowerCase().trim();
    return exercises.filter((ex) => ex.name?.toLowerCase().includes(q));
  }, [exercises, query]);

  // Eliminar individual
  const handleDeleteExercise = (name: string) => {
    Alert.alert(
      'Eliminar Ejercicio Manual',
      `¿Estás seguro de que quieres eliminar "${name}"? Se borrará todo su historial y se quitará de las rutinas guardadas. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await (apiClient as any)(`/exercise-list/manual-exercises?name=${encodeURIComponent(name)}`, {
                method: 'DELETE',
              });
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
              Alert.alert('Éxito', `Ejercicio "${name}" eliminado correctamente.`);
              loadManualExercises();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el ejercicio.');
            }
          },
        },
      ]
    );
  };

  // Eliminar todos
  const handleDeleteAll = () => {
    if (exercises.length === 0) return;
    Alert.alert(
      'Borrar TODOS los Ejercicios Manuales',
      '¿Estás COMPLETAMENTE SEGURO de que deseas eliminar TODOS tus ejercicios manuales? Se borrarán todos los historiales y raciones en tus rutinas. Es irreversible.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar Todos',
          style: 'destructive',
          onPress: async () => {
            try {
              await (apiClient as any)('/exercise-list/manual-exercises/all', {
                method: 'DELETE',
              });
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
              Alert.alert('Éxito', 'Todos los ejercicios manuales han sido eliminados.');
              loadManualExercises();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudieron eliminar los ejercicios.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Info Banner */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Dumbbell size={22} color={colors.tint} />
            <Text style={[styles.title, { color: colors.text }, isIOS && { fontWeight: '700' }]}>Ejercicios Manuales</Text>
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Ejercicios creados fuera del catálogo oficial. Puedes fusionar su historial con ejercicios oficiales o eliminarlos.
          </Text>
        </View>

        {exercises.length > 0 && (
          <TouchableOpacity
            style={styles.deleteAllBtn}
            onPress={handleDeleteAll}
            activeOpacity={0.8}
          >
            <Trash2 size={15} color="#ef4444" style={{ marginRight: 6 }} />
            <Text style={styles.deleteAllText}>Borrar Todos</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Buscador */}
      {exercises.length > 0 && (
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isIOS
                ? (isDark ? '#1C1C1E' : '#FFFFFF')
                : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
              borderColor: isIOS
                ? 'transparent'
                : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
              borderWidth: isIOS ? 0 : 1,
            },
          ]}
        >
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar ejercicio manual..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Lista / Estado */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : filteredExercises.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            getAppleCardSurfaceStyle(theme, 20),
            !isIOS && {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            },
          ]}
        >
          {shouldUseContentGlass(theme) && (
            <GlassView
              style={StyleSheet.absoluteFill}
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
            />
          )}
          <Dumbbell size={36} color={colors.textSecondary} style={{ marginBottom: 12, opacity: 0.7 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }, isIOS && { fontWeight: '700' }]}>
            {exercises.length === 0
              ? 'No tienes ejercicios manuales'
              : 'No se encontraron coincidencias'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {exercises.length === 0
              ? 'Cuando agregues un ejercicio que no esté en la biblioteca durante un entreno o rutina, aparecerá aquí.'
              : 'Prueba a buscar con otro término.'}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredExercises.map((ex) => (
            <View
              key={ex.name}
              style={[
                styles.card,
                getAppleCardSurfaceStyle(theme, 20),
                !isIOS && {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                },
              ]}
            >
              {shouldUseContentGlass(theme) && (
                <GlassView
                  style={StyleSheet.absoluteFill}
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                />
              )}

              {/* Card Top: Name + Actions */}
              <View style={styles.cardHeader}>
                <Text style={[styles.exerciseName, { color: colors.text }, isIOS && { fontWeight: '700' }]} numberOfLines={1}>
                  {ex.name}
                </Text>

                <View style={styles.cardActionButtons}>
                  {/* Delete */}
                  <TouchableOpacity
                    style={[styles.smallIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                    onPress={() => handleDeleteExercise(ex.name)}
                  >
                    <Trash2 size={15} color="#ef4444" />
                  </TouchableOpacity>

                  {/* Info */}
                  <TouchableOpacity
                    style={[
                      styles.smallIconBtn,
                      { backgroundColor: isIOS ? iosTertiaryBg : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)') },
                    ]}
                    onPress={() => setInfoExercise(ex.name)}
                  >
                    <Info size={15} color={colors.text} />
                  </TouchableOpacity>

                  {/* Transfer */}
                  <TouchableOpacity
                    style={[styles.transferBtn, { backgroundColor: colors.tint + '20' }]}
                    onPress={() => setTransferExercise(ex.name)}
                  >
                    <Text style={[styles.transferBtnText, { color: colors.tint }]}>Transferir</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card Bottom: Stats pills */}
              <View style={styles.statsRow}>
                {ex.totalSets > 0 && (
                  <View
                    style={[
                      styles.statBadge,
                      { backgroundColor: isIOS ? iosTertiaryBg : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)') },
                    ]}
                  >
                    <Dumbbell size={11} color={colors.textSecondary} />
                    <Text style={[styles.statBadgeText, { color: colors.textSecondary }]}>
                      {ex.totalSets} series reg.
                    </Text>
                  </View>
                )}

                {ex.inRoutines > 0 && (
                  <View
                    style={[
                      styles.statBadge,
                      { backgroundColor: isIOS ? iosTertiaryBg : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)') },
                    ]}
                  >
                    <Text style={[styles.rLetter, { color: colors.tint }]}>R</Text>
                    <Text style={[styles.statBadgeText, { color: colors.textSecondary }]}>
                      En {ex.inRoutines} rutinas
                    </Text>
                  </View>
                )}

                {ex.maxWeight && ex.maxWeight > 0 ? (
                  <View style={[styles.statBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                    <Award size={11} color="#eab308" />
                    <Text style={[styles.statBadgeText, { color: '#eab308', fontWeight: '800' }]}>
                      RM: {ex.maxWeight} kg
                    </Text>
                  </View>
                ) : null}

                {ex.totalSets === 0 && ex.inRoutines === 0 && (
                  <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                    Sin datos registrados
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Info Modal */}
      <ManualExerciseInfoModal
        visible={!!infoExercise}
        exerciseName={infoExercise}
        onClose={() => setInfoExercise(null)}
      />

      {/* Transfer Modal */}
      <ManualExerciseTransferModal
        visible={!!transferExercise}
        sourceName={transferExercise}
        existingManuals={exercises.map((e) => e.name).filter((n) => n !== transferExercise)}
        onClose={() => setTransferExercise(null)}
        onSuccess={loadManualExercises}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 6,
  },
  deleteAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderCurve: 'continuous',
    marginTop: 2,
  },
  deleteAllText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 24,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  grid: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  cardActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferBtn: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rLetter: {
    fontSize: 10,
    fontWeight: '900',
  },
  noDataText: {
    fontSize: 11,
    fontStyle: 'italic',
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    marginBottom: 16,
  },
  prLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  prValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  prDate: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  routineTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routineTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  routineTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  historySets: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyHistoryText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Transfer Modal specifics
  transferBox: {
    padding: 16,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
  },
  transferLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  transferName: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  arrowCenter: {
    alignItems: 'center',
    marginVertical: 4,
  },
  selectedTargetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  selectedTargetName: {
    fontSize: 15,
    fontWeight: '800',
  },
  selectedTargetSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  removeTargetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  removeTargetText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchResultsContainer: {
    marginTop: 6,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    maxHeight: 180,
    overflow: 'hidden',
  },
  searchResultItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultItemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultItemMuscle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  optionsContainer: {
    marginTop: 16,
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    marginTop: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  actionsFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
});
