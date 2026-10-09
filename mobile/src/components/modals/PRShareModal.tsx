/* mobile/src/components/modals/PRShareModal.tsx */
import React, { useRef, useState } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, 
  Image, ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, TrendingUp, Calendar, X, Share2, Sparkles, ChevronRight, User } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import useAppStore from '@/store/useAppStore';

interface PRData {
  exerciseName: string;
  newWeight: number;
  oldWeight: number;
  date: string;
}

interface PRShareModalProps {
  visible: boolean;
  onClose: () => void;
  prData: PRData | null;
  onSwitchPR?: () => void;
  hasMultiplePRs?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 340);
const CARD_HEIGHT = CARD_WIDTH * (16 / 9.5); // Aspect ratio ~ 9:16 adapted for modal view

export const PRShareModal: React.FC<PRShareModalProps> = ({
  visible,
  onClose,
  prData,
  onSwitchPR,
  hasMultiplePRs = false,
}) => {
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);

  if (!prData) return null;

  const { exerciseName, newWeight, oldWeight, date } = prData;
  const numNew = parseFloat(String(newWeight || 0));
  const numOld = parseFloat(String(oldWeight || 0));
  const diff = Number((numNew - numOld).toFixed(2));
  const hasImprovement = diff > 0 && numOld > 0;

  const rawImage = userProfile?.profile_image_url || userProfile?.profile_image;
  const avatarUrl = rawImage 
    ? (rawImage.startsWith('http') ? rawImage : `${BACKEND_BASE_URL}${rawImage}`)
    : null;

  const username = userProfile?.username || 'Atleta';
  const dateFormatted = new Date(date || Date.now()).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase().replace('.', '');

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
          dialogTitle: 'Compartir Récord',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Compartir', 'Compartir no está disponible en este dispositivo.');
      }
    } catch (err) {
      console.error('Error al capturar PR share card:', err);
      Alert.alert('Error', 'No se pudo generar la imagen para compartir.');
    } finally {
      setIsSharing(false);
    }
  };

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
              {/* Fondos y resplandores degradados */}
              <LinearGradient
                colors={['#0a0a0c', '#15151c', '#09090b']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.glowOrb, { top: -60, left: -60, backgroundColor: 'rgba(234, 179, 8, 0.22)' }]} />
              <View style={[styles.glowOrb, { bottom: -60, right: -60, backgroundColor: 'rgba(245, 158, 11, 0.2)' }]} />

              <View style={styles.cardInner}>
                
                {/* CABECERA: Atleta + Fecha */}
                <View style={styles.cardHeader}>
                  <View style={styles.athleteInfo}>
                    <View style={styles.avatarWrapper}>
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                      ) : (
                        <User size={20} color="#eab308" />
                      )}
                    </View>
                    <View>
                      <Text style={styles.username} numberOfLines={1}>{username}</Text>
                      <View style={styles.badgeRow}>
                        <Trophy size={11} color="#eab308" />
                        <Text style={styles.badgeText}>NUEVO RÉCORD</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.datePill}>
                    <Calendar size={11} color="#9ca3af" style={{ marginRight: 4 }} />
                    <Text style={styles.dateText}>{dateFormatted}</Text>
                  </View>
                </View>

                {/* CENTRO: Ejercicio y Peso */}
                <View style={styles.heroSection}>
                  <View style={styles.trophyIconBox}>
                    <LinearGradient
                      colors={['#eab308', '#ca8a04']}
                      style={styles.trophyGradient}
                    >
                      <Trophy size={36} color="#000" />
                    </LinearGradient>
                  </View>

                  <Text style={styles.exerciseName} numberOfLines={2}>{exerciseName}</Text>

                  <View style={styles.weightRow}>
                    <Text style={styles.weightNumber}>{numNew}</Text>
                    <Text style={styles.weightUnit}>KG</Text>
                  </View>

                  {/* Incremento / Mejora */}
                  {hasImprovement ? (
                    <View style={styles.improvementBadge}>
                      <TrendingUp size={14} color="#22c55e" style={{ marginRight: 6 }} />
                      <Text style={styles.improvementText}>+{diff} kg superados</Text>
                      <Text style={styles.previousText}> (antes: {numOld} kg)</Text>
                    </View>
                  ) : (
                    <View style={styles.firstRecordBadge}>
                      <Sparkles size={13} color="#eab308" style={{ marginRight: 6 }} />
                      <Text style={styles.firstRecordText}>¡Marca personal establecida!</Text>
                    </View>
                  )}
                </View>

                {/* PIE: Branding Pro Fitness Glass */}
                <View style={styles.cardFooter}>
                  <View style={styles.brandRow}>
                    <Sparkles size={14} color="#eab308" style={{ marginRight: 6 }} />
                    <Text style={styles.brandTitle}>PRO FITNESS GLASS</Text>
                  </View>
                  <Text style={styles.brandSlogan}>Supérate cada día</Text>
                </View>

              </View>
            </View>

            {/* BOTONES DE ACCIÓN */}
            <View style={[styles.actionButtons, { width: CARD_WIDTH }]}>
              {hasMultiplePRs && (
                <TouchableOpacity 
                  style={[styles.switchPRBtn, { borderColor: colors.border }]} 
                  onPress={onSwitchPR}
                  activeOpacity={0.8}
                >
                  <Text style={styles.switchPRBtnText}>Ver otros récords recientes</Text>
                  <ChevronRight size={16} color="#fff" />
                </TouchableOpacity>
              )}

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
                      Compartir Récord
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
    borderColor: 'rgba(234, 179, 8, 0.35)',
    shadowColor: '#eab308',
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
    borderColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  username: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#eab308',
    letterSpacing: 1,
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
    color: '#d1d5db',
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  trophyIconBox: {
    marginBottom: 14,
  },
  trophyGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
  },
  weightNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  weightUnit: {
    fontSize: 22,
    fontWeight: '900',
    color: '#eab308',
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#22c55e',
  },
  previousText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  firstRecordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  firstRecordText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#eab308',
  },
  cardFooter: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#eab308',
    letterSpacing: 2,
  },
  brandSlogan: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButtons: {
    marginTop: 18,
    gap: 10,
  },
  switchPRBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  switchPRBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 6,
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
