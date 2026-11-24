/* mobile/src/components/workout/WorkoutSummaryModal.tsx */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {
  Trophy,
  Clock,
  Flame,
  Dumbbell,
  CheckCircle2,
  ArrowRight,
  Share2,
  Target,
  Bell,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { formatWorkoutTime } from '@/utils/workoutHelpers';
import { getContrastTextColor } from '@/utils/colorUtils';
import * as userService from '@/services/userService';
import { EMAIL_CONSENT_VERSION } from '@/config/emailConsent';
import { registerDeviceForPushNotifications } from '@/services/nativeNotifications';
import { trackRetentionEvent, updatePushPreferences } from '@/services/notificationService';
import { WorkoutShareCard } from '@/components/workout/WorkoutShareCard';
import { ModalThemeBackground, getThemedModalBorderColor, getThemedModalSurfaceColor } from '@/components/ui/ModalThemeBackground';

interface WorkoutSummaryModalProps {
  visible: boolean;
  workoutData: any;
  onClose: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  visible,
  workoutData,
  onClose,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const userProfile = useAppStore(state => state.userProfile);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const shareCardRef = useRef<React.ComponentRef<typeof View>>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showReminderOffer, setShowReminderOffer] = useState(false);
  const [selectedOfferHour, setSelectedOfferHour] = useState<number>(() =>
    Number(userProfile?.training_reminder_hour ?? 18)
  );
  const [savingReminderOffer, setSavingReminderOffer] = useState(false);

  const reminderEligible = Boolean(
    visible &&
      userProfile?.id &&
      !(userProfile.email_marketing_consent && userProfile.push_notifications)
  );

  const hasTrackedTargetRef = useRef(false);
  useEffect(() => {
    if (!visible || !workoutData) {
      hasTrackedTargetRef.current = false;
      return;
    }
    const detailsList = workoutData?.details || [];
    const hasCompletedReps = Array.isArray(detailsList) && detailsList.some((ex: any) =>
      Array.isArray(ex?.setsDone) && ex.setsDone.some((s: any) => (parseInt(s?.reps, 10) || 0) > 0)
    );
    if (!hasCompletedReps || hasTrackedTargetRef.current) return;
    hasTrackedTargetRef.current = true;
    void trackRetentionEvent({
      channel: 'hook_next_session_target',
      action: 'shown',
      platform: 'native',
      detail: workoutData?.routineName || 'next_session_target',
    });
  }, [visible, workoutData]);

  useEffect(() => {
    if (!reminderEligible || !userProfile?.id) return undefined;
    let cancelled = false;
    const cooldownKey = `pfg_notif_offer_dismiss_training_${userProfile.id}`;
    AsyncStorage.getItem(cooldownKey)
      .then(raw => {
        if (cancelled) return;
        const ts = Number(raw || '0');
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (!ts || Date.now() - ts >= sevenDaysMs) {
          setShowReminderOffer(true);
        } else {
          setShowReminderOffer(false);
        }
      })
      .catch(() => {
        if (!cancelled) setShowReminderOffer(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reminderEligible, userProfile?.id]);

  const handleAcceptReminderOffer = async () => {
    if (savingReminderOffer || !userProfile) return;
    setSavingReminderOffer(true);
    try {
      const pushResult = await registerDeviceForPushNotifications(userProfile.id);
      if (pushResult.ok) {
        await updatePushPreferences('training', true, '2026-11-06').catch(() => {});
      }
      const payload = {
        email_marketing_consent: true,
        emailConsentVersion: EMAIL_CONSENT_VERSION,
        push_notifications: pushResult.ok,
        training_reminder_hour: selectedOfferHour,
      };
      await userService.updateUserProfile(payload);
      useAppStore.setState({ userProfile: { ...userProfile, ...payload } } as any);
      useAppStore.getState().showToast?.(
        `Recordatorios activados a las ${String(selectedOfferHour).padStart(2, '0')}:00`
      );
      setShowReminderOffer(false);
    } catch {
      Alert.alert('Error', 'No se pudieron activar los recordatorios.');
    } finally {
      setSavingReminderOffer(false);
    }
  };

  const handleDismissReminderOffer = () => {
    if (userProfile?.id) {
      AsyncStorage.setItem(`pfg_notif_offer_dismiss_training_${userProfile.id}`, String(Date.now())).catch(() => {});
    }
    setShowReminderOffer(false);
  };

  if (!visible || !workoutData) return null;

  // Cálculo de volumen total y series completadas
  let totalVolumeKg = 0;
  let totalSetsCount = 0;

  (workoutData.details || []).forEach((d: any) => {
    (d.setsDone || []).forEach((s: any) => {
      const w = parseFloat(s.weight_kg) || 0;
      const r = parseInt(s.reps, 10) || 0;
      totalVolumeKg += w * r;
      totalSetsCount += 1;
    });
  });

  const nextSessionTarget = (() => {
    let bestCandidate: { name: string; bestWeight: number; bestReps: number; score: number } | null = null;
    (workoutData.details || []).forEach((ex: any) => {
      const sets = Array.isArray(ex?.setsDone) ? ex.setsDone : [];
      const validSets = sets.filter(
        (s: any) => !(s?.is_warmup === true || s?.is_warmup === 'true') && (parseInt(s?.reps, 10) || 0) > 0
      );
      const effectiveSets = validSets.length > 0 ? validSets : sets.filter((s: any) => (parseInt(s?.reps, 10) || 0) > 0);
      if (effectiveSets.length === 0) return;

      let bestWeight = 0;
      let bestReps = 0;
      effectiveSets.forEach((s: any) => {
        const w = parseFloat(s.weight_kg) || 0;
        const r = parseInt(s.reps, 10) || 0;
        if (w > bestWeight || (w === bestWeight && r > bestReps)) {
          bestWeight = w;
          bestReps = r;
        }
      });

      const score = bestWeight > 0 ? bestWeight * 100 + bestReps : bestReps;
      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = {
          name: ex.exerciseName || ex.name || 'Tu ejercicio principal',
          bestWeight: Math.round(bestWeight * 10) / 10,
          bestReps,
          score,
        };
      }
    });

    if (!bestCandidate) return null;
    const picked = bestCandidate as { name: string; bestWeight: number; bestReps: number; score: number };

    if (picked.bestWeight > 0 && picked.bestReps >= 12) {
      const nextWeight = Math.round((picked.bestWeight + 2.5) * 10) / 10;
      return {
        headline: `${picked.name}: sube a ${nextWeight} kg`,
        detail: `Hoy completaste ${picked.bestWeight} kg × ${picked.bestReps} reps. En tu próxima sesión busca ${nextWeight} kg × ${Math.max(8, picked.bestReps - 2)}-${picked.bestReps} reps.`,
      };
    }

    if (picked.bestWeight > 0) {
      return {
        headline: `${picked.name}: busca ${picked.bestWeight} kg × ${picked.bestReps + 1} reps`,
        detail: `Tu marca base hoy quedó en ${picked.bestWeight} kg × ${picked.bestReps} reps. Sumar +1 rep la próxima vez ya es progreso real.`,
      };
    }

    return {
      headline: `${picked.name}: apunta a ${picked.bestReps + 1} reps`,
      detail: `Hoy cerraste con ${picked.bestReps} repeticiones. Intenta sumar al menos +1 rep en tu siguiente sesión.`,
    };
  })();

  const handleFinish = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onClose();
  };

  const handleShareWorkout = async () => {
    if (!shareCardRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir Entrenamiento',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Compartir', 'No disponible en este dispositivo.');
      }
    } catch {
      Alert.alert('Error', 'No se pudo generar la tarjeta para compartir.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)' }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: getThemedModalSurfaceColor(theme),
              borderColor: getThemedModalBorderColor(theme),
            },
          ]}
        >
          <ModalThemeBackground theme={theme} />

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Trophy celebration header */}
            <View style={styles.trophyWrapper}>
              <View
                style={[
                  styles.trophyCircle,
                  {
                    backgroundColor: colors.tint + '20',
                    borderColor: colors.tint + '40',
                  },
                ]}
              >
                <Trophy size={42} color={colors.tint} />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                ¡Entrenamiento Completado!
              </Text>
              <Text style={[styles.routineName, { color: colors.tint }]}>
                {workoutData.routineName || 'Sesión de Entrenamiento'}
              </Text>
            </View>

            {/* Stats Grid Liquid Glass */}
            <View style={styles.statsGrid}>
              {/* Tiempo */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Clock size={18} color="#3b82f6" style={{ marginBottom: 6 }} />
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {formatWorkoutTime(workoutData.duration_seconds || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TIEMPO</Text>
              </View>

              {/* Calorías */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Flame size={18} color="#f97316" style={{ marginBottom: 6 }} />
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {workoutData.calories_burned || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>KCAL</Text>
              </View>

              {/* Volumen */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Dumbbell size={18} color={colors.tint} style={{ marginBottom: 6 }} />
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {Math.round(totalVolumeKg)} kg
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>VOLUMEN</Text>
              </View>

              {/* Series */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <CheckCircle2 size={18} color="#22c55e" style={{ marginBottom: 6 }} />
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {totalSetsCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SERIES</Text>
              </View>
            </View>

            {/* Objetivo concreto para la próxima sesión */}
            {nextSessionTarget && (
              <View
                style={{
                  width: '100%',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.tint + '44',
                  backgroundColor: colors.tint + '14',
                  padding: 14,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    backgroundColor: colors.tint + '24',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  <Target size={18} color={colors.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: colors.tint, letterSpacing: 0.6, marginBottom: 3 }}>
                    OBJETIVO PARA TU PRÓXIMA SESIÓN
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 3 }}>
                    {nextSessionTarget.headline}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17 }}>
                    {nextSessionTarget.detail}
                  </Text>
                </View>
              </View>
            )}

            {/* Oferta de recordatorio tras el entreno */}
            {reminderEligible && showReminderOffer && (
              <View
                style={{
                  width: '100%',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  padding: 14,
                  marginBottom: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: colors.tint + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bell size={16} color={colors.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                      ¿Te avisamos para tu próximo entreno?
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      Elige hora y activa push + email (puedes cambiarlo luego).
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {[9, 12, 16, 18, 20, 21].map(hour => {
                    const active = selectedOfferHour === hour;
                    return (
                      <TouchableOpacity
                        key={hour}
                        onPress={() => setSelectedOfferHour(hour)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 10,
                          borderWidth: 1,
                          backgroundColor: active ? colors.tint : 'transparent',
                          borderColor: active ? colors.tint : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '800',
                            color: active ? getContrastTextColor(colors.tint) : colors.text,
                          }}
                        >
                          {`${String(hour).padStart(2, '0')}:00`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleAcceptReminderOffer}
                    disabled={savingReminderOffer}
                    style={{
                      flex: 1,
                      backgroundColor: colors.tint,
                      borderRadius: 12,
                      paddingVertical: 9,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: getContrastTextColor(colors.tint) }}>
                      Activar avisos
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDismissReminderOffer}
                    style={{
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      paddingVertical: 9,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                      Ahora no
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Invitación rápida post-entreno */}
            <View
              style={{
                width: '100%',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                padding: 13,
                marginBottom: 14,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: colors.tint + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FontAwesome5 name="gift" size={14} color={colors.tint} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.text }}>
                    ¿Invitas a alguien a entrenar contigo?
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
                    Gana +1.000 XP y desbloquea los temas Galaxia, Desierto y Océano.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const code = userProfile?.referral_code || '';
                  const link = `https://profitnessglass.es/register?ref=${code}`;
                  void Share.share({
                    title: 'Únete a Pro Fitness Glass',
                    message: `¡Acabo de completar mi entrenamiento en Pro Fitness Glass! Regístrate gratis con mi enlace: ${link}`,
                    url: link,
                  }).catch(() => {});
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  backgroundColor: colors.tint,
                  borderRadius: 12,
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                }}
              >
                <FontAwesome5 name="share-alt" size={12} color={getContrastTextColor(colors.tint)} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: getContrastTextColor(colors.tint) }}>
                  Invitar (+1.000 XP)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón Compartir Tarjeta PNG */}
            <TouchableOpacity
              onPress={() => void handleShareWorkout()}
              disabled={isSharing}
              style={[
                styles.finishBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 10,
                },
              ]}
              activeOpacity={0.82}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <>
                  <Share2 size={17} color={colors.tint} style={{ marginRight: 8 }} />
                  <Text style={[styles.finishBtnText, { color: colors.text }]}>Compartir Resumen PNG</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Botón Finalizar / Salir */}
            <TouchableOpacity
              onPress={handleFinish}
              style={[
                styles.finishBtn,
                {
                  backgroundColor: colors.tint,
                  shadowColor: colors.tint,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 6,
                },
              ]}
              activeOpacity={0.82}
            >
              <Text style={styles.finishBtnText}>Volver a Rutinas</Text>
              <ArrowRight size={18} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <View pointerEvents="none" style={{ position: 'absolute', left: -9999, top: 0 }}>
        <WorkoutShareCard
          ref={shareCardRef}
          workoutData={workoutData}
          userName={userProfile?.name || userProfile?.username}
          userAvatar={userProfile?.profile_image_url}
          accentColor={colors.tint}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  trophyWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  routineName: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  finishBtn: {
    width: '100%',
    height: 52,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});
