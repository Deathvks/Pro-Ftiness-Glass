import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Download, Sparkles, X } from 'lucide-react-native';

import {
  APP_VERSION,
  hasSeenCurrentWelcome,
  isRemoteNewer,
} from '@/config/version';
import {
  getThemedModalBorderColor,
  getThemedModalSurfaceColor,
} from '@/components/ui/ModalThemeBackground';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

const REMOTE_VERSION_URL = 'https://profitnessglass.es/version.json';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419';

export function VersionUpdater() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const contrastText = getContrastTextColor(colors.tint);

  const [remoteRelease, setRemoteRelease] = useState<{
    version: string;
    downloadUrl?: string;
    releaseNotes?: string;
  } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const lastCheckRef = useRef(0);
  const inFlightRef = useRef(false);

  const checkRemoteVersion = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastCheckRef.current < 30000) return;
    if (inFlightRef.current) return;

    lastCheckRef.current = now;
    inFlightRef.current = true;

    try {
      const response = await fetch(`${REMOTE_VERSION_URL}?t=${now}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data?.version) return;

      if (isRemoteNewer(APP_VERSION, data.version)) {
        setRemoteRelease({
          version: data.version,
          downloadUrl: data.downloadUrl,
          releaseNotes: data.releaseNotes || data.notes,
        });
        return;
      }

      // Si estamos en la versión actual o superior, comprobar novedades no vistas
      if (isAuthenticated && data.welcome?.title) {
        const storedTitle = await AsyncStorage.getItem('lastSeenWelcomeTitle').catch(() => null);
        if (!hasSeenCurrentWelcome(storedTitle, data.welcome.title)) {
          useAppStore.setState({
            showWelcomeModal: true,
            welcomeRemoteData: data,
            welcomeRemoteVersion: APP_VERSION,
          } as any);
        }
      }
    } catch {
      // Sin conexión o timeout puntual: no interrumpir al usuario
    } finally {
      inFlightRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkRemoteVersion(true);
    }, 1800);

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void checkRemoteVersion(false);
      }
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [checkRemoteVersion]);

  const handleApplyUpdate = async () => {
    if (!remoteRelease || isUpdating) return;
    setIsUpdating(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
        return;
      }
      const targetUrl =
        Platform.OS === 'android'
          ? remoteRelease.downloadUrl || GOOGLE_PLAY_URL
          : 'https://profitnessglass.es';
      await Linking.openURL(targetUrl);
    } catch {
      // Silenciar si no hay navegador disponible
    } finally {
      setIsUpdating(false);
    }
  };

  if (!remoteRelease || isDismissed) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { top: Math.max(insets.top + 8, 14) },
      ]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: getThemedModalSurfaceColor(theme),
            borderColor: colors.tint + '55',
            shadowColor: '#000',
          },
        ]}
      >
        <Sparkles size={15} color={colors.tint} />
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
          Nueva versión <Text style={{ color: colors.tint, fontWeight: '900' }}>v{remoteRelease.version}</Text>
        </Text>

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isUpdating}
          onPress={() => void handleApplyUpdate()}
          style={[styles.updateBtn, { backgroundColor: colors.tint }]}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={contrastText} />
          ) : (
            <>
              <Download size={12} color={contrastText} />
              <Text style={[styles.updateBtnText, { color: contrastText }]}>Actualizar</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsDismissed(true)}
          accessibilityLabel="Cerrar aviso de versión"
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
          style={[
            styles.closeBtn,
            { borderColor: getThemedModalBorderColor(theme) },
          ]}
        >
          <X size={13} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 990,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 13,
    paddingRight: 8,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  text: {
    fontSize: 12.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  updateBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VersionUpdater;
