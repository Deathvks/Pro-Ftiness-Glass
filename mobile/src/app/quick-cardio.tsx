import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { useFocusEffect, usePreventRemove, useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { Slider } from '@expo/ui/community/slider';
import { ChevronRight, Clock, Filter, Flame, MapPin, Save, Search, X } from 'lucide-react-native';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { RoutinesTabs } from '@/components/routines/RoutinesTabs';
import { GlassButton } from '@/components/ui/GlassButton';
import { SelectModal } from '@/components/ui/SelectModal';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import { CARDIO_ACTIVITIES, CARDIO_INTENSITIES, type CardioActivity } from '@/data/cardioActivities';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import useAppStore from '@/store/useAppStore';
import { estimateCardioCalories, getCardioActivity, getCardioWeight, loadCardioSession, saveCardioWorkout } from '@/utils/cardio';
import { getContrastTextColor } from '@/utils/routineHelpers';

const intensityOptions = [
  { value: 'all', label: 'Todas' },
  ...CARDIO_INTENSITIES.map(value => ({ value, label: value })),
];

interface ActivitySheetProps {
  activity: CardioActivity;
  weight: number;
  saving: boolean;
  onClose: () => void;
  onSave: (durationMinutes: number) => void;
  onStartGPS: () => void;
}

function ActivitySheet({ activity, weight, saving, onClose, onSave, onStartGPS }: ActivitySheetProps) {
  const [minutes, setMinutes] = useState(30);
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const primaryText = getContrastTextColor(colors.tint);
  const saveText = activity.hasGPS ? colors.text : primaryText;
  const Icon = activity.icon;

  return (
    <SwipeableBottomSheet visible onClose={onClose} scrollable isDark={isDark} backgroundColor={colors.card}>
      <View style={styles.sheetHeader}>
        <View style={[styles.activityIcon, { backgroundColor: activity.color + '24' }]}>
          <Icon size={24} color={activity.color} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{activity.name}</Text>
          <Text style={[styles.secondary, { color: colors.textSecondary }]}>Intensidad {activity.intensity}</Text>
        </View>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Cerrar" hitSlop={8} style={styles.iconButton}>
          <X size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
        {activity.hasGPS && (
          <>
            <GlassButton onPress={onStartGPS} theme={theme} color={colors.tint} style={styles.action} disabled={saving}>
              <MapPin size={20} color={primaryText} />
              <Text style={[styles.actionLabel, { color: primaryText }]}>Iniciar Ruta GPS</Text>
            </GlassButton>
            <Text style={[styles.dividerLabel, { color: colors.textSecondary }]}>O registra manualmente</Text>
          </>
        )}

        <View style={[styles.metricCard, { backgroundColor: colors.card }, getAppleSheetCardStyle(isDark, 16, theme)]}>
          <View style={styles.spreadRow}>
            <View style={styles.inline}>
              <Clock size={17} color={colors.tint} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Duración</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.tint }]}>{minutes} min</Text>
          </View>
          <Slider
            accessibilityLabel="Duración en minutos"
            minimumValue={5}
            maximumValue={180}
            step={5}
            value={minutes}
            onValueChange={setMinutes}
            minimumTrackTintColor={colors.tint}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.tint}
            disabled={saving}
            style={styles.slider}
          />
          <View style={styles.spreadRow}>
            <Text style={[styles.secondary, { color: colors.textSecondary }]}>5 min</Text>
            <Text style={[styles.secondary, { color: colors.textSecondary }]}>3 h</Text>
          </View>
        </View>

        <View style={[styles.metricCard, styles.spreadRow, { backgroundColor: colors.card }, getAppleSheetCardStyle(isDark, 16, theme)]}>
          <View>
            <Text style={[styles.secondary, { color: colors.textSecondary }]}>Estimación</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {estimateCardioCalories(activity.mets, weight, minutes * 60)} kcal
            </Text>
          </View>
          <Flame size={26} color={activity.color} />
        </View>
      </ScrollView>
      <View style={styles.sheetFooter}>
        <GlassButton
          onPress={() => onSave(minutes)}
          theme={theme}
          color={activity.hasGPS ? undefined : colors.tint}
          style={styles.action}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={saveText} /> : <Save size={19} color={saveText} />}
          <Text style={[styles.actionLabel, { color: saveText }]}>
            {saving ? 'Guardando…' : activity.hasGPS ? 'Registrar manualmente' : 'Registrar sesión'}
          </Text>
        </GlassButton>
      </View>
    </SwipeableBottomSheet>
  );
}

export default function QuickCardioScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const { width } = useWindowDimensions();
  const { showToast } = useToast();
  const theme = useAppStore(state => state.theme);
  const user = useAppStore(state => state.userProfile);
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const useGlass = shouldUseContentGlass(theme);
  const weight = getCardioWeight(bodyWeightLog, user?.weight);
  const [query, setQuery] = useState('');
  const [intensity, setIntensity] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<CardioActivity | null>(null);
  const [savedActivityId, setSavedActivityId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const disablePrevention = usePreventRemove(saving);

  useFocusEffect(useCallback(() => {
    setSavedActivityId(loadCardioSession(user?.id)?.activityId);
  }, [user?.id]));

  const savedActivity = getCardioActivity(savedActivityId);
  const normalizedQuery = query.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = CARDIO_ACTIVITIES.filter(activity =>
    (intensity === 'all' || activity.intensity === intensity) &&
    activity.name.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery));

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const openGPS = (activity: CardioActivity) => {
    setSelected(null);
    const saved = loadCardioSession(user?.id);
    router.push({ pathname: '/active-cardio', params: { activityId: saved?.activityId ?? activity.id } });
  };

  const save = async (activity: CardioActivity, minutes: number) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await saveCardioWorkout(activity, minutes * 60, weight);
      if (!result.success) {
        showToast(result.message, 'error');
        return;
      }
      showToast(result.offline ? result.message : `¡Sesión de ${activity.name} guardada!`, result.offline ? 'info' : 'success');
      setSelected(null);
      disablePrevention();
      goBack();
    } catch {
      showToast('Error al guardar la sesión.', 'error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const cardSurface = [
    styles.surface,
    { borderColor: colors.border, backgroundColor: colors.card },
    getAppleCardSurfaceStyle(theme, 24),
  ];

  return (
    <AnimatedScreen
      keyboardShouldPersistTaps="handled"
      paddingBottom={48}
      header={<GlobalHeader title="Cardio Rápido" showBackButton onBackPress={goBack} hideRightButtons />}
    >
      <View style={styles.content}>
        <RoutinesTabs
          activeTab="quickCardio"
          onChangeTab={tab => {
            if (!saving && tab !== 'quickCardio') {
              router.dismissTo({ pathname: '/(tabs)/routines', params: { tab } });
            }
          }}
        />
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Registra una sesión de cardio o sigue tu ruta con GPS.
        </Text>

        {savedActivity && (
          <GlassButton theme={theme} color={colors.tint + '20'} style={styles.resume} onPress={() => openGPS(savedActivity)} disabled={saving}>
            <MapPin size={19} color={colors.tint} />
            <View style={styles.flex}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Recuperar ruta GPS</Text>
              <Text style={[styles.secondary, { color: colors.textSecondary }]}>{savedActivity.name}</Text>
            </View>
            <ChevronRight size={18} color={colors.tint} />
          </GlassButton>
        )}

        <View style={styles.filters}>
          <View style={[...cardSurface, styles.search]}>
            <Search size={19} color={colors.textSecondary} />
            <TextInput
              accessibilityLabel="Buscar actividad"
              placeholder="Buscar actividad…"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              style={[styles.searchInput, { color: colors.text }]}
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Borrar búsqueda" hitSlop={8}>
                <X size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <GlassButton
            theme={theme}
            color={intensity === 'all' ? undefined : colors.tint + '22'}
            style={styles.filter}
            onPress={() => setFilterOpen(true)}
            disabled={saving}
          >
            <Filter size={17} color={intensity === 'all' ? colors.textSecondary : colors.tint} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>{intensity === 'all' ? 'Todas' : intensity}</Text>
          </GlassButton>
        </View>

        {filtered.length === 0 ? (
          <View style={[...cardSurface, styles.empty]}>
            <Search size={26} color={colors.textSecondary} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>No se encontraron actividades</Text>
            <Text style={[styles.secondary, { color: colors.textSecondary }]}>Prueba otro nombre o intensidad.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map(activity => {
              const Icon = activity.icon;
              return (
                <TouchableOpacity
                  key={activity.id}
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  disabled={saving}
                  onPress={() => setSelected(activity)}
                  style={[...cardSurface, styles.card, { width: width >= 620 ? '48.8%' : '100%' }]}
                >
                  {useGlass && (
                    <GlassView
                      pointerEvents="none"
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 24 }]}
                    />
                  )}
                  <View style={[styles.activityIcon, { backgroundColor: activity.color + '24' }]}>
                    <Icon size={23} color={activity.color} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{activity.name}</Text>
                    <Text style={[styles.secondary, { color: colors.textSecondary }]}>{activity.description}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={[styles.secondary, { color: colors.textSecondary }]}>{activity.intensity} · {activity.mets} METs</Text>
                      {activity.hasGPS && <MapPin size={14} color={colors.tint} accessibilityLabel="GPS" />}
                    </View>
                  </View>
                  <ChevronRight size={17} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <SelectModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        onSelect={value => setIntensity(String(value))}
        options={intensityOptions}
        value={intensity}
        title="Intensidad"
        theme={theme}
        colors={colors}
      />
      {selected && (
        <ActivitySheet
          key={selected.id}
          activity={selected}
          weight={weight}
          saving={saving}
          onClose={() => setSelected(null)}
          onSave={minutes => void save(selected, minutes)}
          onStartGPS={() => openGPS(selected)}
        />
      )}
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', gap: 16 },
  flex: { flex: 1 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  surface: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  search: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  filter: { minHeight: 48, borderRadius: 20, paddingHorizontal: 13, flexDirection: 'row', gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  activityIcon: { width: 46, height: 46, borderRadius: 15, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  cardMeta: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  secondary: { fontSize: 13, lineHeight: 18 },
  empty: { padding: 28, alignItems: 'center', gap: 8 },
  resume: { width: '100%', minHeight: 62, padding: 14, borderRadius: 20, flexDirection: 'row', gap: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, gap: 12 },
  sheetTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { padding: 20, gap: 14 },
  sheetFooter: { paddingHorizontal: 20, paddingBottom: 6 },
  action: { minHeight: 52, width: '100%', padding: 12, borderRadius: 20, flexDirection: 'row', gap: 9 },
  actionLabel: { fontSize: 15, fontWeight: '700' },
  dividerLabel: { textAlign: 'center', fontSize: 12, fontWeight: '600' },
  metricCard: { borderRadius: 18, borderCurve: 'continuous', padding: 14 },
  spreadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricValue: { fontVariant: ['tabular-nums'], fontWeight: '800', fontSize: 23 },
  slider: { width: '100%', height: 44 },
});
