/* mobile/src/components/modals/WeeklyRecapModal.tsx */
import React, { useRef, useState, useMemo } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, 
  Image, ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  PieChart, Dumbbell, Clock, Flame, Sparkles, X, Share2, 
  Trophy, Calendar, Quote, User 
} from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import useAppStore from '@/store/useAppStore';
import { 
  getFunWeightComparison, 
  getFunCalorieComparison, 
  getFunTimeComparison, 
  getRandomQuote 
} from '@/utils/funStatsUtils';

interface WeeklyRecapData {
  totalVolume: number;
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
}

interface WeeklyRecapModalProps {
  visible: boolean;
  onClose: () => void;
  weeklyData: WeeklyRecapData | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 340);
const CARD_HEIGHT = CARD_WIDTH * (16 / 9.5);

export const WeeklyRecapModal: React.FC<WeeklyRecapModalProps> = ({
  visible,
  onClose,
  weeklyData,
}) => {
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);

  const rawImage = userProfile?.profile_image_url || userProfile?.profile_image;
  const avatarUrl = rawImage 
    ? (rawImage.startsWith('http') ? rawImage : `${BACKEND_BASE_URL}${rawImage}`)
    : null;

  const username = userProfile?.username || 'Atleta';

  const volume = weeklyData?.totalVolume || 0;
  const workouts = weeklyData?.totalWorkouts || 0;
  const seconds = weeklyData?.totalDuration || 0;
  const calories = weeklyData?.totalCalories || 0;

  const weightComp = useMemo(() => volume > 0 ? getFunWeightComparison(volume) : null, [volume]);
  const timeComp = useMemo(() => seconds > 0 ? getFunTimeComparison(seconds) : null, [seconds]);
  const calorieComp = useMemo(() => calories > 0 ? getFunCalorieComparison(calories) : null, [calories]);
  const quote = useMemo(() => getRandomQuote(), [visible]);

  const timeFormatted = useMemo(() => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  }, [seconds]);

  const weekRange = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    const end = new Date(now.setDate(diff + 6));
    const month = end.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
    return `SEM ${start.getDate()} - ${end.getDate()} ${month}`;
  }, []);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir Resumen Semanal',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Compartir', 'Compartir no está disponible en este dispositivo.');
      }
    } catch (err) {
      console.error('Error al capturar resumen semanal:', err);
      Alert.alert('Error', 'No se pudo generar la imagen para compartir.');
    } finally {
      setIsSharing(false);
    }
  };

  if (!visible || !weeklyData) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>

          {/* BOTÓN CERRAR */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={22} color="#fff" />
          </TouchableOpacity>

          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* TARJETA VISUAL CAPTURABLE */}
            <View ref={cardRef} collapsable={false} style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
              {/* Fondos degradados estelares */}
              <LinearGradient
                colors={['#070a14', '#0d1326', '#090b14']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.glowOrb, { top: -60, left: -60, backgroundColor: 'rgba(59, 130, 246, 0.22)' }]} />
              <View style={[styles.glowOrb, { bottom: -60, right: -60, backgroundColor: 'rgba(168, 85, 247, 0.22)' }]} />

              <View style={styles.cardInner}>

                {/* CABECERA */}
                <View style={styles.cardHeader}>
                  <View style={styles.athleteInfo}>
                    <View style={styles.avatarWrapper}>
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                      ) : (
                        <User size={20} color="#3b82f6" />
                      )}
                      <View style={styles.trophyBadge}>
                        <Trophy size={9} color="#000" />
                      </View>
                    </View>
                    <View>
                      <Text style={styles.username} numberOfLines={1}>{username}</Text>
                      <Text style={styles.resumenBadge}>RESUMEN SEMANAL</Text>
                    </View>
                  </View>

                  <View style={styles.datePill}>
                    <Calendar size={11} color="#93c5fd" style={{ marginRight: 4 }} />
                    <Text style={styles.dateText}>{weekRange}</Text>
                  </View>
                </View>

                {/* GRID 2x2 DE STATS */}
                <View style={styles.statsGrid}>
                  
                  {/* Card 1: Sesiones */}
                  <View style={styles.statBox}>
                    <View style={[styles.statIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                      <Dumbbell size={16} color="#60a5fa" />
                    </View>
                    <Text style={styles.statValue}>{workouts}</Text>
                    <Text style={styles.statLabel}>Sesiones</Text>
                    <Text style={styles.statSub}>{workouts > 0 ? 'Entrenadas esta semana' : 'Sin sesiones'}</Text>
                  </View>

                  {/* Card 2: Volumen */}
                  <View style={styles.statBox}>
                    <View style={[styles.statIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                      <Trophy size={16} color="#c084fc" />
                    </View>
                    <Text style={styles.statValue}>{volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume}kg`}</Text>
                    <Text style={styles.statLabel}>Volumen</Text>
                    <Text style={styles.statSub} numberOfLines={1}>
                      {weightComp ? `${weightComp.icon} ${weightComp.highlight}` : `${volume} kg totales`}
                    </Text>
                  </View>

                  {/* Card 3: Tiempo */}
                  <View style={styles.statBox}>
                    <View style={[styles.statIconBox, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
                      <Clock size={16} color="#38bdf8" />
                    </View>
                    <Text style={styles.statValue}>{timeFormatted}</Text>
                    <Text style={styles.statLabel}>Tiempo</Text>
                    <Text style={styles.statSub} numberOfLines={1}>
                      {timeComp ? `${timeComp.icon} ${timeComp.highlight}` : 'Tiempo activo'}
                    </Text>
                  </View>

                  {/* Card 4: Calorías */}
                  <View style={styles.statBox}>
                    <View style={[styles.statIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                      <Flame size={16} color="#f87171" />
                    </View>
                    <Text style={styles.statValue}>{calories}</Text>
                    <Text style={styles.statLabel}>Calorías</Text>
                    <Text style={styles.statSub} numberOfLines={1}>
                      {calorieComp ? `${calorieComp.icon} ${calorieComp.highlight}` : 'kcal quemadas'}
                    </Text>
                  </View>

                </View>

                {/* FRASE MOTIVACIONAL */}
                <View style={styles.quoteBox}>
                  <Text style={styles.quoteText}>"{quote}"</Text>
                </View>

                {/* PIE BRANDING */}
                <View style={styles.cardFooter}>
                  <View style={styles.brandRow}>
                    <Sparkles size={14} color="#60a5fa" style={{ marginRight: 6 }} />
                    <Text style={styles.brandTitle}>PRO FITNESS GLASS</Text>
                  </View>
                  <Text style={styles.brandSlogan}>Progreso visual continuo</Text>
                </View>

              </View>
            </View>

            {/* BOTÓN COMPARTIR */}
            <View style={[styles.actionButtons, { width: CARD_WIDTH }]}>
              <TouchableOpacity
                style={[
                  styles.shareBtn, 
                  { 
                    backgroundColor: colors.tint,
                    shadowColor: colors.tint 
                  }
                ]}
                onPress={handleShare}
                disabled={isSharing}
                activeOpacity={0.85}
              >
                {isSharing ? (
                  <ActivityIndicator color={getContrastColor(colors.tint, theme)} />
                ) : (
                  <>
                    <Share2 size={18} color={getContrastColor(colors.tint, theme)} style={{ marginRight: 8 }} />
                    <Text style={[styles.shareBtnText, { color: getContrastColor(colors.tint, theme) }]}>
                      Compartir Resumen
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    maxHeight: '94%',
    alignItems: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 50,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  cardInner: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  glowOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1f1f23',
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  trophyBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#eab308',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resumenBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#60a5fa',
    letterSpacing: 1,
    marginTop: 2,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 12,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    marginTop: 2,
  },
  statSub: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  quoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 16,
  },
  cardFooter: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#60a5fa',
    letterSpacing: 2,
  },
  brandSlogan: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButtons: {
    marginTop: 18,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
