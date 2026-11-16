import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { ArrowRight, CheckCircle2, X } from 'lucide-react-native';

import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

const DISMISS_KEY = 'pfg_dismiss_migration_success_banner_v1';

export function MaintenanceNoticeBanner({ style }: { style?: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [isDismissed, setIsDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(DISMISS_KEY)
      .then(val => {
        if (active) {
          setIsDismissed(val === 'true');
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!loaded || isDismissed || pathname === '/mantenimiento') {
    return null;
  }

  const handleDismiss = () => {
    AsyncStorage.setItem(DISMISS_KEY, 'true').catch(() => {});
    setIsDismissed(true);
  };

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.12)',
          borderColor: 'rgba(16, 185, 129, 0.32)',
        },
        style,
      ]}
    >
      <View style={styles.leftCol}>
        <View style={styles.badge}>
          <CheckCircle2 size={12} color="#10b981" />
          <Text style={styles.badgeText}>Migración completada</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/mantenimiento' as any)}
          style={styles.msgRow}
          activeOpacity={0.75}
        >
          <Text style={[styles.msgText, { color: colors.textSecondary }]} numberOfLines={1}>
            Datos seguros en profitnessglass.es
          </Text>
          <Text style={styles.moreLink}>Más info</Text>
          <ArrowRight size={12} color="#10b981" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleDismiss}
        accessibilityLabel="Cerrar aviso"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.closeBtn}
      >
        <X size={15} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
  },
  leftCol: {
    flex: 1,
    gap: 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  msgText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  moreLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MaintenanceNoticeBanner;
