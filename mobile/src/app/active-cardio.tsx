import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { ChevronLeft, Clock, Flame, Footprints, MapPin, Navigation, Pause, Play, Square } from 'lucide-react-native';
import { CardioMap } from '@/components/CardioMap';
import { ConfirmationModal } from '@/components/social/ConfirmationModal';
import { GlassButton } from '@/components/ui/GlassButton';
import ModalThemeBackground, { getThemedModalBorderColor } from '@/components/ui/ModalThemeBackground';
import { getThemeBaseBackground } from '@/constants/theme';
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
    setSession(current => current.startedAt === null
      ? {
          ...current,
          startedAt: time,
          sessionStartTime: current.sessionStartTime || new Date(time).toISOString(),
        }
      : current);
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
  const nativeGlassAvailable = Platform.OS === 'ios' && (() => {
    try { return isLiquidGlassAvailable(); } catch { return false; }
  })();
  const modalBorderColor = getThemedModalBorderColor(theme);
  const metrics = [
    { label: 'Distancia', value: formatCardioDistance(session.distance), icon: Footprints },
    { label: 'Ritmo', value: formatCardioPace(seconds, session.distance), icon: Clock },
    { label: 'Energía', value: `${estimateCardioCalories(activity.mets, weight, seconds)} kcal`, icon: Flame },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: getThemeBaseBackground(theme) }]}>
      {/* Fullscreen Map Edge-to-Edge */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#121317' : '#e9edf0' }]}>
        {showMap ? (
          <CardioMap path={session.path} position={position} follow={follow} color={colors.tint} dark={isDark} />
        ) : (
          <View style={[styles.center, { paddingBottom: 180 }]}>
            {locationProblem ? <MapPin size={32} color={colors.tint} /> : <ActivityIndicator size="large" color={colors.tint} />}
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {locationProblem ? 'Ubicación desactivada' : 'Buscando señal GPS…'}
            </Text>
          </View>
        )}
      </View>

      {/* Top Scrim for Floating Controls Contrast */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.56)', 'rgba(0,0,0,0)']}
        style={[styles.topScrim, { height: insets.top + 84 }]}
      />

      {/* Floating Top Header */}
      <View pointerEvents="box-none" style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityLabel="Volver"
          onPress={backToCatalog}
          style={({ pressed }) => [styles.mapFloatCircle, { opacity: pressed ? 0.78 : 1 }]}
        >
          {nativeGlassAvailable && (
            <GlassView pointerEvents="none" glassEffectStyle="regular" colorScheme="dark" style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
          )}
          <ChevronLeft size={22} color="#ffffff" />
        </Pressable>

        <View style={styles.activityPill}>
          {nativeGlassAvailable && (
            <GlassView pointerEvents="none" glassEffectStyle="regular" colorScheme="dark" style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
          )}
          <Icon size={15} color={activity.color} />
          <Text numberOfLines={1} style={styles.activityPillText}>{activity.name}</Text>
        </View>

        <Pressable
          accessibilityLabel={follow ? 'Dejar de seguir mi ubicación' : 'Centrar en mi ubicación'}
          disabled={!showMap}
          onPress={() => setFollow(value => !value)}
          style={({ pressed }) => [
            styles.mapFloatCircle,
            follow && { backgroundColor: colors.tint, borderColor: 'transparent' },
            !showMap && { opacity: 0.45 },
            pressed && { opacity: 0.78 },
          ]}
        >
          {!follow && nativeGlassAvailable && (
            <GlassView pointerEvents="none" glassEffectStyle="regular" colorScheme="dark" style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
          )}
          <Navigation
            size={20}
            color={follow ? primaryText : '#ffffff'}
            fill={follow ? primaryText : 'none'}
          />
        </Pressable>
      </View>

      {/* Bottom Floating Controls Drawer (Frontend style) */}
      <View
        style={[
          styles.bottomPanel,
          {
            borderColor: modalBorderColor,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <ModalThemeBackground theme={theme} />
        {nativeGlassAvailable && (
          <GlassView
            pointerEvents="none"
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={styles.timerRow}>
          <Text style={[styles.timer, { color: colors.text }]}>{formatCardioTime(seconds)}</Text>
          <Text style={[styles.timerKicker, { color: colors.textSecondary }]}>TIEMPO</Text>
        </View>

        {(!running || session.path.length === 0) && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {running
              ? 'Esperando una señal GPS precisa…'
              : hasSession ? 'Sesión en pausa' : 'Listo para empezar'}
          </Text>
        )}

        <View style={styles.metrics}>
          {metrics.map((metric, index) => (
            <View
              key={metric.label}
              style={[
                styles.metric,
                index === 1 && {
                  borderLeftWidth: StyleSheet.hairlineWidth,
                  borderRightWidth: StyleSheet.hairlineWidth,
                  borderColor: modalBorderColor,
                },
              ]}
            >
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
              <View style={styles.metricLabel}>
                <metric.icon size={12} color={colors.tint} />
                <Text style={[styles.metricLabelText, { color: colors.textSecondary }]}>{metric.label}</Text>
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
          {locationProblem ? (
            <GlassButton
              theme={theme}
              color={colors.tint}
              style={styles.retryBtn}
              disabled={saving}
              onPress={retryLocation}
            >
              <Text style={[styles.buttonLabel, { color: primaryText }]}>Reintentar GPS</Text>
            </GlassButton>
          ) : (
            <>
              <Pressable
                accessibilityLabel={running ? 'Pausar sesión' : hasSession ? 'Continuar sesión' : 'Iniciar sesión'}
                disabled={saving || locationStatus === 'loading'}
                onPress={() => {
                  if (running) setSession(pauseCardio);
                  else start();
                }}
                style={({ pressed }) => [
                  styles.roundControlBtn,
                  {
                    backgroundColor: colors.tint,
                    shadowColor: colors.tint,
                    opacity: saving || locationStatus === 'loading' ? 0.45 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  },
                ]}
              >
                {running ? (
                  <Pause size={24} color={primaryText} fill={primaryText} />
                ) : (
                  <Play size={24} color={primaryText} fill={primaryText} style={{ marginLeft: 3 }} />
                )}
              </Pressable>

              {!running && hasSession && (
                <Pressable
                  accessibilityLabel="Finalizar y guardar sesión"
                  disabled={saving || seconds === 0}
                  onPress={() => setDialog('save')}
                  style={({ pressed }) => [
                    styles.roundControlBtn,
                    {
                      backgroundColor: '#ef4444',
                      shadowColor: '#ef4444',
                      opacity: saving || seconds === 0 ? 0.45 : pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.94 : 1 }],
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Square size={20} color="#ffffff" fill="#ffffff" />
                  )}
                </Pressable>
              )}
            </>
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
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  mapFloatCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    maxWidth: '58%',
    overflow: 'hidden',
  },
  activityPillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  title: { flexShrink: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    paddingHorizontal: 20,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 18,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
  },
  timer: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  timerKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  hint: { fontSize: 12.5, lineHeight: 17, textAlign: 'center' },
  metrics: { flexDirection: 'row', marginVertical: 2 },
  metric: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  metricValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metricLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricLabelText: { fontSize: 11.5, fontWeight: '600' },
  permission: { alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18, paddingTop: 2 },
  roundControlBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  retryBtn: { minHeight: 46, paddingHorizontal: 22, borderRadius: 23 },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
});
