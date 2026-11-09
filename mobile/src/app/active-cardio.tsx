import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ChevronLeft, Clock, Flame, Footprints, MapPin, Navigation, Pause, Play, Square } from 'lucide-react-native';
import { CardioMap } from '@/components/CardioMap';
import { ConfirmationModal } from '@/components/social/ConfirmationModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { getAppleCardSurfaceStyle, getThemeBaseBackground } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import useAppStore from '@/store/useAppStore';
import {
  cardioDistance, cardioElapsedMs, estimateCardioCalories, formatCardioDistance, formatCardioPace,
  formatCardioTime, getCardioActivity, getCardioWeight, loadCardioSession, saveCardioWorkout,
  storeCardioSession, type CardioPoint, type CardioSession,
} from '@/utils/cardio';
import { getContrastTextColor } from '@/utils/routineHelpers';

const emptySession = (activityId: string): CardioSession => ({
  activityId, elapsedMs: 0, startedAt: null, path: [], distance: 0,
});

type LocationStatus = 'loading' | 'ready' | 'denied' | 'unavailable';

function pauseCardio(session: CardioSession) {
  return session.startedAt === null ? session : {
    ...session, elapsedMs: cardioElapsedMs(session, Date.now()), startedAt: null,
  };
}

function Tracker({ activityId, userId, recovered }: { activityId?: string; userId: string | number; recovered: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const { showToast } = useToast();
  const theme = useAppStore(state => state.theme);
  const profileWeight = useAppStore(state => state.userProfile?.weight);
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog);
  const weight = getCardioWeight(bodyWeightLog, profileWeight);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const primaryText = getContrastTextColor(colors.tint);
  const [session, setSession] = useState(() => loadCardioSession(userId) ?? emptySession(activityId ?? ''));
  const activity = getCardioActivity(session.activityId);
  const [now, setNow] = useState(Date.now);
  const [position, setPosition] = useState<CardioPoint | null>(() => session.path.at(-1) ?? null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading');
  const [canAskPermission, setCanAskPermission] = useState(true);
  const [locationRequest, setLocationRequest] = useState(0);
  const [follow, setFollow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<'exit' | 'save' | null>(null);
  const savingRef = useRef(false);
  const pendingBack = useRef<(() => void) | null>(null);
  const running = session.startedAt !== null;
  const hasSession = running || session.elapsedMs > 0 || session.path.length > 0;
  const seconds = Math.floor(cardioElapsedMs(session, now) / 1000);

  useEffect(() => {
    if (hasSession) storeCardioSession(userId, session);
  }, [hasSession, session, userId]);

  useEffect(() => {
    if (!activity?.hasGPS) return;
    let active = true;
    const prepareLocation = async () => {
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!active) return;
        if (!permission.granted && permission.canAskAgain) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (!active) return;
        setCanAskPermission(permission.canAskAgain);
        if (!permission.granted) {
          setLocationStatus('denied');
          setSession(pauseCardio);
          return;
        }
        const enabled = await Location.hasServicesEnabledAsync();
        if (!active) return;
        if (!enabled) {
          setLocationStatus('unavailable');
          setSession(pauseCardio);
          return;
        }
        setLocationStatus('ready');
        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
        if (active && initial) {
          setPosition(current => current ?? [initial.coords.latitude, initial.coords.longitude]);
        }
      } catch {
        if (active) {
          setLocationStatus('unavailable');
          setSession(pauseCardio);
        }
      }
    };
    void prepareLocation();
    return () => { active = false; };
  }, [activity, locationRequest]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    const startedAt = session.startedAt;
    if (startedAt === null || locationStatus !== 'ready') return;
    let active = true;
    let subscription: Location.LocationSubscription | undefined;
    let last: CardioPoint | undefined;

    const fail = () => {
      if (!active) return;
      setLocationStatus('unavailable');
      setSession(pauseCardio);
    };
    void Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 1000 },
      ({ coords }) => {
        if (!active || (coords.accuracy ?? Infinity) > 50) return;
        const point: CardioPoint = [coords.latitude, coords.longitude];
        setPosition(point);
        const distance = last ? cardioDistance(last, point) : 0;
        if (last && distance <= 2) return;
        last = point;
        setSession(current => current.startedAt !== startedAt ? current : {
          ...current, distance: current.distance + distance, path: [...current.path, point],
        });
      },
      fail,
    ).then(result => {
      if (active) subscription = result;
      else result.remove();
    }, fail);

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [session.startedAt, locationStatus]);

  const disablePrevention = usePreventRemove(hasSession || saving, ({ repeat }) => {
    if (savingRef.current) return;
    pendingBack.current = repeat;
    setSession(pauseCardio);
    setDialog('exit');
  });

  const backToCatalog = () => {
    if (recovered || !router.canGoBack()) router.replace('/quick-cardio');
    else router.back();
  };

  const clearSession = () => {
    storeCardioSession(userId, null);
    setSession(emptySession(session.activityId));
    setDialog(null);
    disablePrevention();
  };

  const start = () => {
    const time = Date.now();
    setNow(time);
    setFollow(true);
    setSession(current => current.startedAt === null ? { ...current, startedAt: time } : current);
  };

  const retryLocation = () => {
    setLocationStatus('loading');
    setLocationRequest(value => value + 1);
  };

  const finish = async () => {
    if (!activity || seconds === 0 || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await saveCardioWorkout(activity, seconds, weight, session);
      if (!result.success) {
        showToast(result.message, 'error');
        return;
      }
      showToast(result.offline ? result.message : `¡Sesión de ${activity.name} guardada!`, result.offline ? 'info' : 'success');
      clearSession();
      router.dismissTo('/(tabs)');
    } catch {
      showToast('Error al guardar la sesión. Puedes volver a intentarlo.', 'error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (!activity?.hasGPS) {
    return (
      <View style={[styles.center, { backgroundColor: getThemeBaseBackground(theme) }]}>
        <Text style={[styles.title, { color: colors.text }]}>Actividad GPS no disponible</Text>
        <GlassButton theme={theme} onPress={backToCatalog} style={styles.button}>
          <Text style={[styles.buttonLabel, { color: colors.text }]}>Volver a Cardio Rápido</Text>
        </GlassButton>
      </View>
    );
  }

  const Icon = activity.icon;
  const locationProblem = locationStatus === 'denied' || locationStatus === 'unavailable';
  const showMap = position !== null || session.path.length > 0;
  const metrics = [
    { label: 'Distancia', value: formatCardioDistance(session.distance), icon: Footprints },
    { label: 'Ritmo', value: formatCardioPace(seconds, session.distance), icon: Clock },
    { label: 'Energía', value: `${estimateCardioCalories(activity.mets, weight, seconds)} kcal`, icon: Flame },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: getThemeBaseBackground(theme) }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <GlassButton theme={theme} onPress={backToCatalog} style={styles.circle}>
          <ChevronLeft size={24} color={colors.text} accessibilityLabel="Volver" />
        </GlassButton>
        <View style={styles.titleGroup}>
          <Icon size={20} color={activity.color} />
          <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>{activity.name}</Text>
        </View>
        <GlassButton theme={theme} onPress={() => setFollow(value => !value)} style={styles.circle} color={follow ? colors.tint + '28' : undefined} disabled={!showMap}>
          <Navigation size={20} color={follow ? colors.tint : colors.textSecondary} accessibilityLabel={follow ? 'Dejar de seguir mi ubicación' : 'Centrar en mi ubicación'} />
        </GlassButton>
      </View>

      <View style={[styles.map, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {showMap ? (
          <CardioMap path={session.path} position={position} follow={follow} color={colors.tint} dark={isDark} />
        ) : (
          <View style={styles.center}>
            {locationProblem ? <MapPin size={28} color={colors.tint} /> : <ActivityIndicator size="large" color={colors.tint} />}
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {locationProblem ? 'Ubicación desactivada' : 'Buscando señal GPS…'}
            </Text>
          </View>
        )}
      </View>

      <View style={[
        styles.panel,
        { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) },
        getAppleCardSurfaceStyle(theme, 26),
      ]}>
        <Text style={[styles.timer, { color: colors.text }]}>{formatCardioTime(seconds)}</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {running
            ? session.path.length ? 'Tiempo transcurrido' : 'Esperando una señal GPS precisa…'
            : hasSession ? 'Sesión en pausa' : 'Listo para empezar'}
        </Text>
        <View style={styles.metrics}>
          {metrics.map(metric => (
            <View key={metric.label} style={styles.metric}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
              <View style={styles.metricLabel}>
                <metric.icon size={13} color={colors.tint} />
                <Text style={[styles.hint, { color: colors.textSecondary }]}>{metric.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {locationProblem && (
          <View style={styles.permission}>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {locationStatus === 'denied' ? 'Permite el acceso a tu ubicación para registrar la ruta.' : 'Activa la ubicación del dispositivo y vuelve a intentarlo.'}
            </Text>
            {locationStatus === 'denied' && !canAskPermission && (
              <GlassButton theme={theme} onPress={() => void Linking.openSettings().catch(() => {})} style={styles.button}>
                <Text style={[styles.buttonLabel, { color: colors.text }]}>Abrir ajustes</Text>
              </GlassButton>
            )}
          </View>
        )}
        <View style={styles.actions}>
          <GlassButton
            theme={theme}
            color={colors.tint}
            style={styles.control}
            disabled={saving || locationStatus === 'loading'}
            onPress={() => {
              if (locationProblem) retryLocation();
              else if (running) setSession(pauseCardio);
              else start();
            }}
          >
            {running ? <Pause size={21} color={primaryText} /> : <Play size={21} color={primaryText} />}
            <Text style={[styles.buttonLabel, { color: primaryText }]}>
              {locationProblem ? 'Reintentar GPS' : running ? 'Pausar' : hasSession ? 'Continuar' : 'Iniciar'}
            </Text>
          </GlassButton>
          {!running && hasSession && (
            <GlassButton theme={theme} color="#ef444426" style={styles.control} disabled={saving || seconds === 0} onPress={() => setDialog('save')}>
              <Square size={18} color="#ef4444" />
              <Text style={[styles.buttonLabel, { color: colors.text }]}>Finalizar</Text>
            </GlassButton>
          )}
        </View>
      </View>

      <ConfirmationModal
        visible={dialog !== null}
        title={dialog === 'exit' ? '¿Salir de la ruta?' : '¿Guardar esta sesión?'}
        message={dialog === 'exit' ? 'Se perderá el progreso de la sesión actual.' : 'La ruta y tus estadísticas se guardarán en el historial de entrenamiento.'}
        confirmText={dialog === 'exit' ? 'Salir sin guardar' : 'Guardar'}
        cancelText={dialog === 'exit' ? 'Continuar' : 'Cancelar'}
        isDestructive={dialog === 'exit'}
        isLoading={saving}
        onCancel={() => {
          if (savingRef.current) return;
          pendingBack.current = null;
          setDialog(null);
        }}
        onConfirm={() => {
          if (dialog === 'save') {
            void finish();
          } else if (dialog === 'exit') {
            const resumeBack = pendingBack.current;
            pendingBack.current = null;
            clearSession();
            if (resumeBack) resumeBack();
            else backToCatalog();
          }
        }}
      />
    </View>
  );
}

export default function ActiveCardioScreen() {
  const { activityId, recovered } = useLocalSearchParams<{ activityId?: string; recovered?: string }>();
  const userId = useAppStore(state => state.userProfile?.id);
  const colors = useAppColors();
  if (userId == null) {
    return <View style={styles.center}><ActivityIndicator color={colors.tint} /></View>;
  }
  return <Tracker key={userId} userId={userId} activityId={activityId} recovered={recovered === '1'} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  titleGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { flexShrink: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  circle: { width: 44, height: 44, borderRadius: 22 },
  map: { flex: 1, minHeight: 100, borderRadius: 24, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  panel: { borderRadius: 26, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 8, gap: 9 },
  timer: { fontSize: 51, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'], textAlign: 'center' },
  hint: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  metrics: { flexDirection: 'row', marginTop: 5, marginBottom: 8 },
  metric: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  metricValue: { fontSize: 19, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  permission: { alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', gap: 10 },
  control: { flex: 1, minHeight: 48, borderRadius: 20, flexDirection: 'row', padding: 10, gap: 8 },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
});
