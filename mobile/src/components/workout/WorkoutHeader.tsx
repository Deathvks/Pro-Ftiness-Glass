/* mobile/src/components/workout/WorkoutHeader.tsx */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {
  ChevronLeft,
  Play,
  Pause,
  Square,
  Calculator,
  Activity,
  Timer,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { formatWorkoutTime } from '@/utils/workoutHelpers';
import { getContrastTextColor } from '@/utils/colorUtils';
import { BACKEND_BASE_URL } from '@/services/apiClient';

interface WorkoutHeaderProps {
  routineName: string;
  routineImage?: string | null;
  timer: number;
  isWorkoutPaused: boolean;
  hasWorkoutStarted: boolean;
  onBackClick: () => void;
  onTogglePause: () => void;
  onFinishClick: () => void;
  onShowCalculator: () => void;
  onShowHeatmap: () => void;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  routineName,
  routineImage,
  timer,
  isWorkoutPaused,
  hasWorkoutStarted,
  onBackClick,
  onTogglePause,
  onFinishClick,
  onShowCalculator,
  onShowHeatmap,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const getFullImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const imgUri = getFullImageUrl(routineImage);
  const playBtnTextColor = getContrastTextColor(colors.tint);

  const handlePlayPause = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onTogglePause();
  };

  const handleFinish = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    onFinishClick();
  };

  const handleBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onBackClick();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.75)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Imagen de fondo si la rutina tiene portada */}
      {imgUri ? (
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: imgUri }}
            style={[styles.bgImage, { opacity: isDark ? 0.6 : 0.45 }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={
              isDark
                ? ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.92)']
                : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.95)']
            }
            locations={[0, 0.3, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}

      <View style={styles.content}>
        {/* Fila superior: Botón atrás alineado a la izquierda como en el Frontend */}
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.75}
            style={[
              styles.iconBtnPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <ChevronLeft size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Atrás</Text>
          </TouchableOpacity>
        </View>

        {/* Título de la rutina */}
        <Text style={[styles.routineTitle, { color: colors.text }]} numberOfLines={2}>
          {routineName || 'Entrenamiento'}
        </Text>

        {/* Aviso de Iniciar Cronómetro si está pausado al montar */}
        {!hasWorkoutStarted ? (
          <View
            style={[
              styles.startPromptBadge,
              {
                backgroundColor: colors.tint + '18',
                borderColor: colors.tint + '45',
              },
            ]}
          >
            <Timer size={14} color={colors.tint} style={{ marginRight: 6 }} />
            <Text style={[styles.startPromptText, { color: colors.tint }]}>
              TOCA PLAY PARA EMPEZAR
            </Text>
          </View>
        ) : null}

        {/* Cronómetro Gigante Monospace */}
        <Text
          style={[
            styles.timerText,
            {
              color: hasWorkoutStarted && !isWorkoutPaused ? colors.tint : colors.text,
            },
          ]}
        >
          {formatWorkoutTime(timer)}
        </Text>

        {/* Dynamic Island Floating Controls Pill */}
        <View
          style={[
            styles.floatingIsland,
            {
              backgroundColor: isDark ? 'rgba(24, 24, 27, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          {/* Botón Mapa Muscular */}
          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              onShowHeatmap();
            }}
            style={styles.islandSideBtn}
            activeOpacity={0.7}
          >
            <Activity size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Botón Calculadora rápida */}
          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              onShowCalculator();
            }}
            style={styles.islandSideBtn}
            activeOpacity={0.7}
          >
            <Calculator size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.islandDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]} />

          {/* Botón Central Play / Pause */}
          <TouchableOpacity
            onPress={handlePlayPause}
            style={[
              styles.islandPlayBtn,
              hasWorkoutStarted && !isWorkoutPaused
                ? {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
                  }
                : {
                    backgroundColor: colors.tint,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.85)',
                    shadowColor: colors.tint,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.5 : 0.3,
                    shadowRadius: 10,
                    elevation: 5,
                  },
            ]}
            activeOpacity={0.8}
          >
            {isWorkoutPaused ? (
              <Play
                size={26}
                color={hasWorkoutStarted ? colors.text : playBtnTextColor}
                fill={hasWorkoutStarted ? colors.text : playBtnTextColor}
                style={{ marginLeft: 3 }}
              />
            ) : (
              <Pause size={24} color={colors.text} fill={colors.text} />
            )}
          </TouchableOpacity>

          <View style={[styles.islandDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]} />

          {/* Botón Terminar / Stop */}
          <TouchableOpacity
            onPress={handleFinish}
            style={styles.islandSideBtn}
            activeOpacity={0.7}
          >
            <Square size={22} color="#ef4444" fill="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    zIndex: 2,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTitle: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  startPromptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  startPromptText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: 54,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
    marginBottom: 18,
    textAlign: 'center',
  },
  floatingIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  islandSideBtn: {
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  islandDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
  islandPlayBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
});
