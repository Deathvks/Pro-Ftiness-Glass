/* mobile/src/components/OfflineDownloadFloatingBar.tsx */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Download, X } from 'lucide-react-native';

import {
  subscribeToOfflineDownload,
  cancelOfflineDownloadSession,
  OfflineDownloadState,
} from '@/services/offlineExerciseService';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

export function OfflineDownloadFloatingBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [downloadState, setDownloadState] = useState<OfflineDownloadState>({
    isDownloading: false,
    progress: { current: 0, total: 0, percent: 0, bytesDownloaded: 0 },
    error: null,
    result: null,
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = subscribeToOfflineDownload(state => {
      setDownloadState(state);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Animación de pulso continuo en el icono de descarga
  useEffect(() => {
    if (downloadState.isDownloading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [downloadState.isDownloading, pulseAnim]);

  if (!downloadState.isDownloading) {
    return null;
  }

  const { progress } = downloadState;

  const handleOpenSettingsOffline = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pfg_settings_target_tab', 'offline');
    }
    router.push('/settings');
  };

  const handleCancel = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    cancelOfflineDownloadSession();
    useAppStore.getState().showToast?.('Descarga offline cancelada.');
  };

  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <View
      style={[
        styles.outerContainer,
        {
          top: Math.max(insets.top + 6, 12),
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handleOpenSettingsOffline}
        style={({ pressed }) => [
          styles.pillContainer,
          {
            borderColor: colors.tint + '55',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
        />

        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginRight: 8 }}>
          <Download size={16} color={colors.tint} strokeWidth={2.4} />
        </Animated.View>

        <Text style={[styles.textLabel, { color: colors.text }]} numberOfLines={1}>
          Descargando offline:{' '}
          <Text style={{ fontWeight: '900', color: colors.tint }}>{progress.percent}%</Text>
          <Text style={[styles.subCountText, { color: colors.textSecondary }]}>
            {' '}({progress.current}/{progress.total})
          </Text>
        </Text>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          activeOpacity={0.7}
          style={[
            styles.closeBtn,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    maxWidth: '92%',
  },
  textLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginRight: 6,
  },
  subCountText: {
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
});
