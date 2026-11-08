/* mobile/src/components/workout/DynamicIslandTimer.tsx */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timer, Pause, Play, Plus, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

export const DynamicIslandTimer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  const restTimerEndTime = useAppStore(state => state.restTimerEndTime);
  const restTimerInitialDuration = useAppStore(state => state.restTimerInitialDuration);
  const stopRestTimer = useAppStore(state => state.stopRestTimer);
  const setRestTimerMode = useAppStore(state => state.setRestTimerMode);
  const addRestTime = useAppStore(state => state.addRestTime);
  const togglePauseRestTimer = useAppStore(state => state.togglePauseRestTimer);
  const isRestTimerPaused = useAppStore(state => state.isRestTimerPaused);
  const restTimerRemaining = useAppStore(state => state.restTimerRemaining);
  const restTimerMode = useAppStore(state => state.restTimerMode);

  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);
  const [isBlinking, setIsBlinking] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animación suave de apertura y cierre
  const animWidth = useRef(new Animated.Value(215)).current;
  const animHeight = useRef(new Animated.Value(38)).current;
  const animRadius = useRef(new Animated.Value(20)).current;

  const longPressTimerRef = useRef<any>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    if (!restTimerEndTime && !isRestTimerPaused) return;

    const updateTimer = () => {
      let diff = 0;
      if (isRestTimerPaused && restTimerRemaining !== null) {
        diff = Math.ceil(restTimerRemaining / 1000);
      } else if (restTimerEndTime) {
        const now = Date.now();
        diff = Math.ceil((restTimerEndTime - now) / 1000);
      }

      if (diff <= 0) {
        setTimeLeft(0);
        setProgress(0);
      } else {
        setTimeLeft(diff);
        const total = restTimerInitialDuration || 1;
        const p = Math.min(100, Math.max(0, (diff / total) * 100));
        setProgress(p);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [restTimerEndTime, restTimerInitialDuration, isRestTimerPaused, restTimerRemaining]);

  const isFinished = timeLeft === 0;

  useEffect(() => {
    if (isFinished && (restTimerEndTime || isRestTimerPaused)) {
      const blink = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500);
      return () => clearInterval(blink);
    } else {
      setIsBlinking(true);
    }
  }, [isFinished, restTimerEndTime, isRestTimerPaused]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animWidth, {
        toValue: isExpanded ? 340 : 215,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }),
      Animated.spring(animHeight, {
        toValue: isExpanded ? 230 : 38,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }),
      Animated.spring(animRadius, {
        toValue: isExpanded ? 44 : 20,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }),
    ]).start();
  }, [isExpanded]);

  // Solo se muestra cuando está minimizado y hay un cronómetro activo o pausado
  if (restTimerMode !== 'minimized' || (!restTimerEndTime && !isRestTimerPaused)) {
    return null;
  }

  const formatTime = (seconds: number) => {
    if (seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePressIn = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
      setIsExpanded(true);
    }, 350);
  };

  const handlePressOut = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleTapPill = () => {
    if (isLongPressRef.current) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setRestTimerMode('modal');
  };

  const handleTogglePause = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    togglePauseRestTimer();
  };

  const handleStop = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    setIsExpanded(false);
    stopRestTimer();
  };

  const handleAddQuickTime = (secs: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    addRestTime(secs);
    setIsExpanded(false);
  };

  // Posicionamiento dinámico en la Isla Dinámica de hardware (iPhone 14 Pro, 15, 16) o margen superior seguro
  const topPosition = insets.top > 50 ? insets.top - 46 : insets.top > 30 ? insets.top - 20 : 12;

  return (
    <>
      {/* Overlay transparente cuando está expandido para cerrar al pulsar fuera */}
      {isExpanded && (
        <Pressable
          style={styles.backdropOverlay}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setIsExpanded(false);
          }}
        />
      )}

      <Animated.View
        style={[
          styles.islandContainer,
          {
            top: topPosition,
            width: animWidth,
            height: animHeight,
            borderRadius: animRadius,
            borderColor: isFinished
              ? isBlinking
                ? '#ef4444'
                : 'rgba(255, 255, 255, 0.15)'
              : 'rgba(255, 255, 255, 0.18)',
            shadowColor: isFinished ? '#ef4444' : '#000',
            shadowOpacity: isFinished ? 0.6 : 0.45,
          },
        ]}
      >
        {/* Barra de progreso inferior fina en estado contraído */}
        {!isExpanded && !isFinished && (
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
                backgroundColor: colors.tint,
              },
            ]}
          />
        )}

        {/* --- 1. ESTADO CONTRAÍDO (Cápsula Dynamic Island) --- */}
        {!isExpanded ? (
          <View style={styles.compactRow}>
            {/* Pulsar para abrir en grande o mantener para expandir */}
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleTapPill}
              style={styles.compactLeftTouchable}
            >
              <View
                style={[
                  styles.compactIconCircle,
                  {
                    backgroundColor: isFinished
                      ? 'rgba(239, 68, 68, 0.25)'
                      : colors.tint + '25',
                  },
                ]}
              >
                <Timer
                  size={14}
                  color={isFinished ? '#ef4444' : colors.tint}
                  strokeWidth={2.5}
                />
              </View>
              <Text
                style={[
                  styles.compactTimerText,
                  {
                    color: isFinished
                      ? '#ef4444'
                      : isRestTimerPaused
                      ? '#f59e0b'
                      : '#ffffff',
                  },
                ]}
              >
                {formatTime(timeLeft)}
              </Text>
            </Pressable>

            <View style={styles.compactDivider} />

            {/* Controles rápidos (Pausa/Play + Cerrar) */}
            <View style={styles.compactActions}>
              <TouchableOpacity
                onPress={handleTogglePause}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                style={[
                  styles.compactPlayBtn,
                  {
                    backgroundColor: isRestTimerPaused
                      ? colors.tint
                      : 'rgba(255, 255, 255, 0.14)',
                  },
                ]}
              >
                {isRestTimerPaused ? (
                  <Play size={12} color="#ffffff" fill="#ffffff" />
                ) : (
                  <Pause size={12} color="#ffffff" fill="#ffffff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStop}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                style={styles.compactCloseBtn}
              >
                <X size={13} color="rgba(255, 255, 255, 0.6)" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* --- 2. ESTADO EXPANDIDO (Live Activity Widget) --- */
          <View style={styles.expandedContent}>
            {/* Encabezado */}
            <View style={styles.expandedHeader}>
              <View style={styles.expandedStatusWrap}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isFinished
                        ? '#ef4444'
                        : isRestTimerPaused
                        ? '#f59e0b'
                        : '#10b981',
                    },
                  ]}
                />
                <Text style={styles.expandedStatusLabel}>
                  {isFinished
                    ? '¡Descanso Finalizado!'
                    : isRestTimerPaused
                    ? 'En Pausa'
                    : 'En Descanso'}
                </Text>
              </View>
              <Text
                style={[
                  styles.expandedTitleText,
                  { color: isFinished ? '#ef4444' : '#ffffff' },
                ]}
              >
                {formatTime(timeLeft)}
              </Text>
            </View>

            {/* Botones de incremento rápido */}
            <View style={styles.quickAddRow}>
              <TouchableOpacity
                onPress={() => handleAddQuickTime(15)}
                style={styles.quickAddBtn}
              >
                <Plus size={13} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.quickAddBtnText}>15s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAddQuickTime(30)}
                style={styles.quickAddBtn}
              >
                <Plus size={13} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.quickAddBtnText}>30s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAddQuickTime(60)}
                style={styles.quickAddBtn}
              >
                <Plus size={13} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.quickAddBtnText}>1 min</Text>
              </TouchableOpacity>
            </View>

            {/* Botonera de acciones principales */}
            <View style={styles.expandedActionsRow}>
              <TouchableOpacity
                onPress={handleStop}
                style={[styles.expandedCircleBtn, styles.stopBtnBg]}
              >
                <X size={20} color="#ef4444" strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTogglePause}
                style={[
                  styles.expandedPlayBigBtn,
                  {
                    backgroundColor: isRestTimerPaused
                      ? colors.tint
                      : 'rgba(255, 255, 255, 0.16)',
                  },
                ]}
              >
                {isRestTimerPaused ? (
                  <Play size={24} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
                ) : (
                  <Pause size={24} color="#ffffff" fill="#ffffff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setIsExpanded(false);
                  setRestTimerMode('modal');
                }}
                style={[styles.expandedCircleBtn, styles.modalBtnBg]}
              >
                <Timer size={20} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 99998,
  },
  islandContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 99999,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 12,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    zIndex: 2,
  },
  compactRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  compactLeftTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: '100%',
  },
  compactIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTimerText: {
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.8,
  },
  compactDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 6,
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactPlayBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expandedStatusLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandedTitleText: {
    fontSize: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  quickAddBtn: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quickAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  expandedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  expandedCircleBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtnBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  modalBtnBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  expandedPlayBigBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
