import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassView } from 'expo-glass-effect';
import { ADMIN_SECTIONS } from '@/config/adminSections';
import { AdminScreen } from '@/components/admin/AdminUI';
import { AdminSystemBar } from '@/components/admin/AdminSystemBar';
import { useAppColors } from '@/hooks/useAppColors';
import { getAppleCardSurfaceStyle, getThemeSurfaceMode, shouldUseContentGlass } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import apiClient from '@/services/apiClient';

export default function AdminIndex() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const dark = getThemeSurfaceMode(theme) !== 'light';
  const isIOS = Platform.OS === 'ios';
  return (
    <AdminScreen title="Panel Admin" fallback="/(tabs)/hub">
      <AdminSystemBar />
      <View accessibilityLabel="Apartados del panel Admin"
        style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }, getAppleCardSurfaceStyle(theme, 24)]}>
        {shouldUseContentGlass(theme) && <GlassView pointerEvents="none" glassEffectStyle="regular" colorScheme={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
        {ADMIN_SECTIONS.map(({ id, label, icon: Icon }, index) => {
          const danger = id === 'security';
          const accent = danger ? dark ? '#fca5a5' : '#b91c1c' : colors.tint;
          return <View key={id}>
            {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            <Pressable accessibilityRole="button"
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                router.push({ pathname: '/admin/[section]', params: { section: id } });
              }}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: accent + '20' }]}><Icon color={dark || danger ? accent : colors.text} size={isIOS ? 18 : 17} /></View>
              <Text style={[styles.label, { color: colors.text, fontWeight: isIOS ? '600' : '700' }]}>{label}</Text>
              <View style={styles.trailing}>
                {id === 'reports' && <ReportCount dark={dark} />}
                <ChevronRight size={17} color={colors.textSecondary} style={{ opacity: 0.55 }} />
              </View>
            </Pressable>
          </View>;
        })}
      </View>
    </AdminScreen>
  );
}

function ReportCount({ dark }: { dark: boolean }) {
  const [count, setCount] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    void apiClient('/admin/reports').then(
      reports => { if (active && Array.isArray(reports)) setCount(reports.length); },
      () => {},
    );
    return () => { active = false; };
  }, []));
  if (count === 0) return null;
  return (
    <View accessible accessibilityLabel={`${count} reportes pendientes`}
      style={[styles.reportCount, { backgroundColor: dark ? '#fca5a522' : '#fee2e2' }]}>
      <Text style={[styles.reportNumber, { color: dark ? '#fca5a5' : '#b91c1c' }]}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 51, paddingVertical: 7, paddingHorizontal: 14 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  icon: { width: 34, height: 34, borderRadius: 10, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 15 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportCount: { minWidth: 22, minHeight: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 2 },
  reportNumber: { fontSize: 11, lineHeight: 14, fontWeight: '800', fontVariant: ['tabular-nums'], includeFontPadding: false, textAlign: 'center' },
});
