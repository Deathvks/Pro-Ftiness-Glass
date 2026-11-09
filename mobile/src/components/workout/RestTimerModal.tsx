/* mobile/src/components/workout/RestTimerModal.tsx */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  X,
  ArrowLeft,
  Plus,
  Minus,
  Minimize2,
  Play,
  Pause,
  Square,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import { SwipeableSheetModal } from '@/components/ui/SwipeableBottomSheet';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

interface RestTimerModalProps {
  visible?: boolean;
  initialSeconds?: number;
  onClose?: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  visible: propVisible,
  initialSeconds = 90,
  onClose,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const restTimerEndTime = useAppStore(state => state.restTimerEndTime);
  const restTimerInitialDuration = useAppStore(state => state.restTimerInitialDuration);
  const startRestTimer = useAppStore(state => state.startRestTimer);
  const stopRestTimer = useAppStore(state => state.stopRestTimer);
  const addRestTime = useAppStore(state => state.addRestTime);
  const resetRestTimer = useAppStore(state => state.resetRestTimer);
  const plannedRestTime = useAppStore(state => state.plannedRestTime) || initialSeconds || 90;
  const setRestTimerMode = useAppStore(state => state.setRestTimerMode);
  const togglePauseRestTimer = useAppStore(state => state.togglePauseRestTimer);
  const isRestTimerPaused = useAppStore(state => state.isRestTimerPaused);
  const restTimerRemaining = useAppStore(state => state.restTimerRemaining);
  const restTimerMode = useAppStore(state => state.restTimerMode);

  // La visibilidad se controla tanto por store (modal abierto) como por prop visible opcional
  const isVisible = restTimerMode === 'modal' || Boolean(propVisible);

  const [timeLeft, setTimeLeft] = useState(0);
  const [view, setView] = useState<'select' | 'timer'>(
    restTimerEndTime || isRestTimerPaused ? 'timer' : 'select'
  );
  const [customDuration, setCustomDuration] = useState('');

  // Sincronizar vista inicial si hay un cronómetro en marcha
  useEffect(() => {
    if (restTimerEndTime || isRestTimerPaused) {
      setView('timer');
    } else {
      setView('select');
    }
  }, [restTimerEndTime, isRestTimerPaused, isVisible]);

  useEffect(() => {
    if (!restTimerEndTime && !isRestTimerPaused) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      let remaining = 0;
      if (isRestTimerPaused && restTimerRemaining !== null) {
        remaining = Math.ceil(restTimerRemaining / 1000);
      } else if (restTimerEndTime) {
        remaining = Math.ceil((restTimerEndTime - Date.now()) / 1000);
      }
      setTimeLeft(Math.max(0, remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [restTimerEndTime, isRestTimerPaused, restTimerRemaining]);

  const parseTimeToSeconds = (timeStr: string) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const m = parseInt(parts[0] || '0', 10);
      const s = parseInt(parts[1] || '0', 10);
      return m * 60 + s;
    }
    const sec = parseInt(timeStr, 10);
    return isNaN(sec) ? 0 : sec;
  };

  const handleStartPreset = (duration: number) => {
    if (duration > 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      startRestTimer(duration);
      setTimeLeft(duration);
      setView('timer');
    }
  };

  const handleStartCustom = () => {
    const duration = parseTimeToSeconds(customDuration);
    if (duration > 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      startRestTimer(duration);
      setTimeLeft(duration);
      setView('timer');
      setCustomDuration('');
    }
  };

  const goBackToSelect = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    resetRestTimer();
    setView('select');
  };

  const handleClose = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (restTimerEndTime || isRestTimerPaused) {
      setRestTimerMode('minimized');
    } else {
      stopRestTimer();
    }
    if (onClose) onClose();
  };

  const handleStopAndClose = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    stopRestTimer();
    if (onClose) onClose();
  };

  const handleMinimize = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setRestTimerMode('minimized');
    if (onClose) onClose();
  };

  const handlePauseToggle = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    togglePauseRestTimer();
  };

  const handleAddTime = (seconds: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    addRestTime(seconds);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  const total = restTimerInitialDuration || 1;
  const progress =
    total > 0 && timeLeft > 0
      ? ((total - timeLeft) / total) * 100
      : timeLeft === 0
      ? 100
      : 0;

  // Parámetros de la circunferencia SVG
  const radius = 80;
  const circumference = 2 * Math.PI * radius; // ~502.65
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <SwipeableSheetModal
      visible={isVisible}
      onClose={handleClose}
      backdropColor={isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.4)'}
      dragAreaHeight={120}
      sheetStyle={[
        styles.modalContent,
        {
          backgroundColor: isDark ? 'rgba(20, 20, 28, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
        },
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="none"
        style={[
          styles.dragHandle,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.25)'
              : 'rgba(0, 0, 0, 0.2)',
          },
        ]}
      />

      {/* Botón Cerrar (Esquina superior derecha) */}
      <TouchableOpacity
        onPress={handleClose}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.closeBtn}
      >
        <X size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* ===================== VISTA 1: SELECCIONAR ===================== */}
      {view === 'select' && (
        <View style={styles.viewBody}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Seleccionar Descanso
          </Text>

          {/* Anillo de tiempo previo */}
          <View style={styles.circleContainer}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <Circle
                cx="100"
                cy="100"
                r={radius}
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
                strokeWidth="8"
                fill="transparent"
              />
              <Circle
                cx="100"
                cy="100"
                r={radius}
                stroke={colors.tint}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                strokeLinecap="round"
                fill="transparent"
                origin="100, 100"
                rotation="-90"
              />
            </Svg>
            <View style={styles.circleTextOverlay}>
              <Text style={[styles.timerCountdownText, { color: colors.textSecondary }]}>
                {restTimerEndTime ? formatTime(timeLeft) : '0:00'}
              </Text>
            </View>
          </View>

          {/* Botón Iniciar Planeado */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleStartPreset(plannedRestTime)}
            style={[styles.primaryActionBtn, { backgroundColor: colors.tint }]}
          >
            <Text style={styles.primaryActionBtnText}>
              Iniciar Planeado ({formatTime(plannedRestTime)})
            </Text>
          </TouchableOpacity>

          {/* Grid de presets (1m, 2m, 3m) */}
          <View style={styles.presetsGrid}>
            {[60, 120, 180].map(time => (
              <TouchableOpacity
                key={time}
                activeOpacity={0.75}
                onPress={() => handleStartPreset(time)}
                style={[
                  styles.presetItemBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.07)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <Text style={[styles.presetNumber, { color: colors.text }]}>
                  {time / 60}
                </Text>
                <Text style={[styles.presetUnit, { color: colors.textSecondary }]}>
                  min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input personalizado M:SS */}
          <View style={styles.customRow}>
            <TextInput
              placeholder="M:SS (ej. 1:45)"
              placeholderTextColor={colors.textSecondary}
              value={customDuration}
              onChangeText={setCustomDuration}
              keyboardType="numbers-and-punctuation"
              style={[
                styles.customInput,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.07)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.14)'
                    : 'rgba(0, 0, 0, 0.1)',
                  color: colors.text,
                },
              ]}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleStartCustom}
              style={[styles.customStartBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={styles.customStartBtnText}>Iniciar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ===================== VISTA 2: TIMER ACTIVO ===================== */}
      {view === 'timer' && (
        <View style={styles.viewBody}>
          {/* Botón Atrás a la selección */}
          <TouchableOpacity
            onPress={goBackToSelect}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Botón Minimizar a Isla Dinámica */}
          <TouchableOpacity
            onPress={handleMinimize}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.minimizeBtn}
          >
            <Minimize2 size={20} color={colors.tint} />
          </TouchableOpacity>

          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Tiempo de Descanso
          </Text>

          {/* Anillo de cuenta regresiva SVG circular animado */}
          <View style={styles.circleContainer}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <Circle
                cx="100"
                cy="100"
                r={radius}
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
                strokeWidth="8"
                fill="transparent"
              />
              <Circle
                cx="100"
                cy="100"
                r={radius}
                stroke={timeLeft === 0 ? '#ef4444' : colors.tint}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                origin="100, 100"
                rotation="-90"
              />
            </Svg>
            <View style={styles.circleTextOverlay}>
              <Text
                style={[
                  styles.timerCountdownText,
                  {
                    color:
                      timeLeft === 0
                        ? '#ef4444'
                        : isRestTimerPaused
                        ? '#f59e0b'
                        : colors.text,
                  },
                ]}
              >
                {formatTime(timeLeft)}
              </Text>
            </View>
          </View>

          {/* Controles de temporizador: Pausar/Reanudar y ±10s */}
          <View style={styles.timerControlsCol}>
            <View style={styles.pauseResumeRow}>
              <TouchableOpacity
                onPress={handlePauseToggle}
                activeOpacity={0.85}
                style={[
                  styles.pauseBigCircleBtn,
                  {
                    backgroundColor: isRestTimerPaused
                      ? colors.tint
                      : isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.07)',
                    borderColor: isRestTimerPaused
                      ? colors.tint
                      : isDark
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.12)',
                  },
                ]}
              >
                {isRestTimerPaused ? (
                  <Play size={28} color="#ffffff" fill="#ffffff" style={{ marginLeft: 3 }} />
                ) : (
                  <Pause size={28} color={isDark ? '#ffffff' : colors.text} fill={isDark ? '#ffffff' : colors.text} />
                )}
              </TouchableOpacity>
            </View>

            {/* Botones -10s y +10s */}
            <View style={styles.adjustTimeRow}>
              <TouchableOpacity
                onPress={() => handleAddTime(-10)}
                disabled={timeLeft === 0}
                style={[
                  styles.adjustTimeBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                    opacity: timeLeft === 0 ? 0.4 : 1,
                  },
                ]}
              >
                <Minus size={18} color={colors.text} />
                <Text style={[styles.adjustTimeBtnText, { color: colors.text }]}>
                  -10 seg
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAddTime(10)}
                style={[
                  styles.adjustTimeBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <Plus size={18} color={colors.text} />
                <Text style={[styles.adjustTimeBtnText, { color: colors.text }]}>
                  +10 seg
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón Finalizar / Omitir descanso */}
            <TouchableOpacity
              onPress={handleStopAndClose}
              activeOpacity={0.8}
              style={[
                styles.stopRestBtn,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                },
              ]}
            >
              <Square size={13} color="#ef4444" fill="#ef4444" style={{ marginRight: 6 }} />
              <Text style={styles.stopRestBtnText}>Terminar Descanso</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SwipeableSheetModal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 42,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 20,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 20,
    zIndex: 10,
    padding: 6,
  },
  backBtn: {
    position: 'absolute',
    top: 18,
    left: 20,
    zIndex: 10,
    padding: 6,
  },
  minimizeBtn: {
    position: 'absolute',
    top: 18,
    right: 56,
    zIndex: 10,
    padding: 6,
  },
  viewBody: {
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  circleContainer: {
    width: 200,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  circleTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCountdownText: {
    fontSize: 44,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  primaryActionBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 18,
  },
  presetItemBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  presetUnit: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  customRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  customStartBtn: {
    paddingHorizontal: 22,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customStartBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  timerControlsCol: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  pauseResumeRow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBigCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  adjustTimeRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  adjustTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  adjustTimeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stopRestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    marginTop: 18,
    width: '100%',
    maxWidth: 260,
  },
  stopRestBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
});
