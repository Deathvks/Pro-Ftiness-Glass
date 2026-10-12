/* mobile/src/components/workout/RestTimerModal.tsx */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {
  Clock,
  Play,
  Pause,
  X,
  Plus,
  Minus,
  CheckCircle,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { formatWorkoutTime } from '@/utils/workoutHelpers';

interface RestTimerModalProps {
  visible: boolean;
  initialSeconds?: number;
  onClose: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  visible,
  initialSeconds = 90,
  onClose,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [totalTime, setTotalTime] = useState(initialSeconds);

  useEffect(() => {
    if (visible) {
      setTimeLeft(initialSeconds);
      setTotalTime(initialSeconds);
      setIsPaused(false);
    }
  }, [visible, initialSeconds]);

  useEffect(() => {
    if (!visible || isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, isPaused, timeLeft]);

  const handleAddSeconds = (secs: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setTimeLeft(prev => Math.max(0, prev + secs));
    setTotalTime(prev => Math.max(prev, prev + secs));
  };

  const handleTogglePause = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setIsPaused(prev => !prev);
  };

  const handleFinishEarly = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onClose();
  };

  if (!visible) return null;

  const progressPercent = totalTime > 0 ? Math.min(100, Math.max(0, ((totalTime - timeLeft) / totalTime) * 100)) : 100;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.35)' }]} onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <Clock size={20} color={colors.tint} style={{ marginRight: 8 }} />
            <Text style={[styles.title, { color: colors.text }]}>Tiempo de Descanso</Text>
          </View>

          {/* Giant Countdown */}
          <Text
            style={[
              styles.countdownText,
              {
                color: timeLeft === 0 ? '#22c55e' : colors.tint,
              },
            ]}
          >
            {formatWorkoutTime(timeLeft)}
          </Text>

          {/* Progress track */}
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: colors.tint,
                },
              ]}
            />
          </View>

          {/* Quick Adjustment Buttons (+30s / -15s) */}
          <View style={styles.quickAdjustRow}>
            <TouchableOpacity
              onPress={() => handleAddSeconds(-15)}
              style={[
                styles.adjustPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Minus size={14} color={colors.text} style={{ marginRight: 4 }} />
              <Text style={[styles.adjustText, { color: colors.text }]}>15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTogglePause}
              style={[
                styles.pausePlayBtn,
                {
                  backgroundColor: colors.tint,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                  shadowColor: colors.tint,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
              activeOpacity={0.8}
            >
              {isPaused ? (
                <Play size={20} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
              ) : (
                <Pause size={20} color="#fff" fill="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAddSeconds(30)}
              style={[
                styles.adjustPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Plus size={14} color={colors.text} style={{ marginRight: 4 }} />
              <Text style={[styles.adjustText, { color: colors.text }]}>30s</Text>
            </TouchableOpacity>
          </View>

          {/* Saltar Descanso Button */}
          <TouchableOpacity
            onPress={handleFinishEarly}
            style={[
              styles.skipBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
            activeOpacity={0.75}
          >
            <CheckCircle size={16} color={colors.tint} style={{ marginRight: 6 }} />
            <Text style={[styles.skipText, { color: colors.text }]}>Listo / Continuar Serie</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
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
    maxWidth: 340,
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  countdownText: {
    fontSize: 58,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
    marginBottom: 16,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  quickAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  adjustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  adjustText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pausePlayBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 46,
    borderRadius: 20,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
