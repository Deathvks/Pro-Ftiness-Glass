import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, MessageSquareText, Sparkles, Star, X } from 'lucide-react-native';

import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import { getMyRating, submitAppRating } from '@/services/ratingService';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

interface AppRatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (rating: number) => void;
}

const RATING_LABELS: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Necesita mejorar', subtitle: 'Cuéntanos qué falló para solucionarlo cuanto antes.' },
  2: { title: 'Algo justa', subtitle: '¿Qué echas en falta en tus entrenamientos?' },
  3: { title: 'Está bien', subtitle: '¿Qué detalle la haría pasar a excelente?' },
  4: { title: '¡Muy buena!', subtitle: 'Nos alegra que te ayude en el gimnasio.' },
  5: { title: '¡Increíble!', subtitle: 'Gracias por apoyar a Pro Fitness Glass.' },
};

export function AppRatingModal({ visible, onClose, onSuccess }: AppRatingModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const userProfile = useAppStore(state => state.userProfile);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const { showToast } = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingRating, setHasExistingRating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setSubmitted(false);
    setLoadingInitial(true);

    getMyRating()
      .then((res: any) => {
        if (!active) return;
        const data = res?.rating ? res : res?.data;
        if (data && typeof data.rating === 'number' && data.rating > 0) {
          setRating(data.rating);
          setComment(typeof data.comment === 'string' ? data.comment : '');
          setHasExistingRating(true);
        } else {
          setRating(0);
          setComment('');
          setHasExistingRating(false);
        }
      })
      .catch(() => {
        if (!active) return;
        setHasExistingRating(false);
      })
      .finally(() => {
        if (active) setLoadingInitial(false);
      });

    return () => {
      active = false;
    };
  }, [visible]);

  const handleSelectStar = (star: number) => {
    setRating(star);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleSubmit = async () => {
    if (rating < 1 || submitting) {
      showToast('Selecciona de 1 a 5 estrellas antes de enviar.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await submitAppRating(rating, comment.trim());
      if (userProfile?.id) {
        await AsyncStorage.setItem(`has_rated_app_${userProfile.id}`, 'true').catch(() => {});
      }
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setHasExistingRating(true);
      setSubmitted(true);
      showToast(
        hasExistingRating ? '¡Valoración actualizada! Gracias por tu opinión.' : '¡Muchas gracias por valorar Pro Fitness Glass!',
        'success'
      );
      onSuccess?.(rating);
      setTimeout(() => {
        onClose();
      }, 950);
    } catch (error: any) {
      showToast(error?.message || 'No se pudo guardar tu valoración. Inténtalo de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const labelInfo = rating > 0 ? RATING_LABELS[rating] : null;
  const contrastText = getContrastTextColor(colors.tint);

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      scrollable
      avoidKeyboard
      maxHeight="86%"
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#f59e0b', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBadge}
          >
            <Star size={20} color="#ffffff" fill="#ffffff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              {hasExistingRating ? 'Tu valoración de la app' : '¿Qué nota nos pones?'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tu opinión nos ayuda a seguir mejorándola gratis
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          accessibilityLabel="Cerrar modal de valoración"
          style={[
            styles.closeBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
          ]}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loadingInitial ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando tu valoración...
          </Text>
        </View>
      ) : submitted ? (
        <View style={styles.successBox}>
          <View style={[styles.successIcon, { backgroundColor: '#10b98120' }]}>
            <CheckCircle2 size={36} color="#10b981" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            ¡Gracias por tu valoración!
          </Text>
          <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
            Has puntuado la app con {rating} {rating === 1 ? 'estrella' : 'estrellas'}.
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.starsCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => {
                const active = star <= rating;
                return (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.75}
                    onPress={() => handleSelectStar(star)}
                    accessibilityRole="button"
                    accessibilityLabel={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
                    style={[
                      styles.starBtn,
                      active && {
                        backgroundColor: 'rgba(245, 158, 11, 0.14)',
                        borderColor: 'rgba(245, 158, 11, 0.35)',
                      },
                    ]}
                  >
                    <Star
                      size={32}
                      color={active ? '#f59e0b' : colors.textSecondary}
                      fill={active ? '#f59e0b' : 'transparent'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {labelInfo ? (
              <View style={styles.ratingFeedback}>
                <View style={styles.feedbackPill}>
                  <Sparkles size={12} color="#f59e0b" />
                  <Text style={styles.feedbackTitle}>{labelInfo.title}</Text>
                </View>
                <Text style={[styles.feedbackSub, { color: colors.textSecondary }]}>
                  {labelInfo.subtitle}
                </Text>
              </View>
            ) : (
              <Text style={[styles.promptHint, { color: colors.textSecondary }]}>
                Toca las estrellas para valorar tu experiencia
              </Text>
            )}
          </View>

          <View style={styles.commentSection}>
            <View style={styles.commentLabelRow}>
              <MessageSquareText size={14} color={colors.textSecondary} />
              <Text style={[styles.commentLabel, { color: colors.textSecondary }]}>
                Comentario o sugerencia (opcional)
              </Text>
            </View>
            <TextInput
              value={comment}
              onChangeText={text => setComment(text.slice(0, 500))}
              placeholder="¿Qué es lo que más te gusta o qué mejorarías?"
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              textAlignVertical="top"
              style={[
                styles.commentInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                },
              ]}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {comment.length}/500
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={rating < 1 || submitting}
            onPress={() => void handleSubmit()}
            style={[
              styles.submitBtn,
              {
                backgroundColor: rating >= 1 ? colors.tint : colors.border,
                opacity: rating < 1 || submitting ? 0.6 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={contrastText} />
            ) : (
              <Text style={[styles.submitText, { color: rating >= 1 ? contrastText : colors.textSecondary }]}>
                {hasExistingRating ? 'Actualizar valoración' : 'Enviar valoración'}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  successBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  successDesc: {
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  starsCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  starBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingFeedback: {
    alignItems: 'center',
    gap: 4,
  },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f59e0b',
  },
  feedbackSub: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  promptHint: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  commentSection: {
    gap: 6,
  },
  commentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  commentInput: {
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  submitBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

export default AppRatingModal;
