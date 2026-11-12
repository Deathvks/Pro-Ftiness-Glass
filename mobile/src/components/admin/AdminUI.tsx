import { useEffect, useEffectEvent, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { Search, X, type LucideProps } from 'lucide-react-native';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import { getAppleCardSurfaceStyle, getThemeSurfaceMode, shouldUseContentGlass } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

export function AdminScreen({ title, fallback = '/admin', children }: { title: string; fallback?: Href; children: ReactNode }) {
  const router = useRouter();
  return (
    <AnimatedScreen
      keyboardShouldPersistTaps="handled"
      header={<GlobalHeader title={title} showBackButton hideRightButtons onBackPress={() => router.canGoBack() ? router.back() : router.replace(fallback)} />}
    >
      <View style={styles.stack}>{children}</View>
    </AnimatedScreen>
  );
}

export function AdminCard({ title, style, children }: { title?: string; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, getAppleCardSurfaceStyle(theme, 24), style]}>
      {shouldUseContentGlass(theme) && (
        <GlassView pointerEvents="none" glassEffectStyle="regular" colorScheme={getThemeSurfaceMode(theme) === 'light' ? 'light' : 'dark'} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
      )}
      {!!title && <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>}
      {children}
    </View>
  );
}

export function AdminText({ children, strong = false, secondary = false, numberOfLines }: { children: ReactNode; strong?: boolean; secondary?: boolean; numberOfLines?: number }) {
  const colors = useAppColors();
  return <Text numberOfLines={numberOfLines} style={{ color: secondary ? colors.textSecondary : colors.text, fontSize: secondary ? 13 : 15, fontWeight: strong ? '700' : '400' }}>{children}</Text>;
}

export function AdminButton({ label, onPress, variant = 'plain', disabled = false, icon: Icon }: {
  label: string; onPress: () => void; variant?: 'plain' | 'primary' | 'danger'; disabled?: boolean; icon?: ComponentType<LucideProps>;
}) {
  const colors = useAppColors();
  const primary = variant === 'primary';
  const danger = variant === 'danger';
  const backgroundColor = primary ? colors.tint : danger ? '#b91c1c' : colors.card;
  const color = primary ? getContrastTextColor(colors.tint) : danger ? '#ffffff' : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor, borderColor: colors.border, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}
    >
      {!!Icon && <Icon color={color} size={16} />}
      <Text style={{ color, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

export function AdminInput({ label, search = false, style, ...props }: TextInputProps & { label: string; search?: boolean }) {
  const colors = useAppColors();
  return (
    <View style={{ gap: 5 }}>
      {!search && <AdminText strong>{label}</AdminText>}
      <View style={[styles.inputShell, { backgroundColor: colors.background === 'transparent' ? colors.tabBar : colors.background, borderColor: colors.border }]}>
        {search && <Search size={17} color={colors.textSecondary} />}
        <TextInput
          accessibilityLabel={label}
          placeholder={search ? label : undefined}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }, props.multiline && { minHeight: 108, textAlignVertical: 'top' }, style]}
          {...props}
        />
      </View>
    </View>
  );
}

export function AdminChoices<T extends string | number>({ options, value, onChange }: {
  options: readonly (readonly [T, string])[]; value: T; onChange: (value: T) => void;
}) {
  const colors = useAppColors();
  return (
    <View style={styles.actions}>
      {options.map(([option, label]) => {
        const selected = value === option;
        return (
          <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={option} onPress={() => onChange(option)}
            style={[styles.choice, { backgroundColor: selected ? colors.tint : colors.card, borderColor: selected ? colors.tint : colors.border }]}>
            <Text style={{ color: selected ? getContrastTextColor(colors.tint) : colors.text, fontWeight: '600' }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AdminToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}><AdminText>{label}</AdminText></View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} />
    </View>
  );
}

export function AdminEditor({ title, onClose, busy = false, showCloseButton = false, children }: { title: string; onClose: () => void; busy?: boolean; showCloseButton?: boolean; children: ReactNode }) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  return (
    <SwipeableBottomSheet visible onClose={onClose} dismissible={!busy} scrollable avoidKeyboard maxHeight="92%"
      isDark={getThemeSurfaceMode(theme) !== 'light'} backgroundColor={colors.background === 'transparent' ? colors.card : colors.background}>
      <View style={styles.editorHeader}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text, flex: 1 }]}>{title}</Text>
        {showCloseButton && <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" disabled={busy} onPress={onClose}
          style={[styles.editorClose, { backgroundColor: colors.border, opacity: busy ? 0.4 : 1 }]}>
          <X size={18} color={colors.text} />
        </Pressable>}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.stack, { paddingHorizontal: 18, paddingBottom: 24 }]}>
        {children}
      </ScrollView>
    </SwipeableBottomSheet>
  );
}

export function AdminMetrics({ entries }: { entries: readonly (readonly [string, string | number | null | undefined])[] }) {
  return (
    <View style={styles.metrics}>
      {entries.map(([label, value]) => (
        <View key={label} style={styles.metric}>
          <AdminText strong>{value ?? '—'}</AdminText>
          <AdminText secondary>{label}</AdminText>
        </View>
      ))}
    </View>
  );
}

export function AdminPager({ page, total, onChange }: { page: number; total: number; onChange: (value: number) => void }) {
  if (total <= 1 && page <= 1) return null;
  return (
    <View style={styles.toggle}>
      <AdminButton label="Anterior" disabled={page <= 1} onPress={() => onChange(page - 1)} />
      <AdminText secondary>{page} / {Math.max(total, 1)}</AdminText>
      <AdminButton label="Siguiente" disabled={page >= total} onPress={() => onChange(page + 1)} />
    </View>
  );
}

export function AdminRecords<T>({ items, render, keyFor, pageSize = 20, columns = 1, emptyLabel = 'No hay resultados.' }: {
  items: T[]; render: (item: T) => ReactNode; keyFor: (item: T) => string; pageSize?: number; columns?: 1 | 2; emptyLabel?: string;
}) {
  const [requestedPage, setPage] = useState(1);
  const total = Math.ceil(items.length / pageSize);
  const page = Math.min(requestedPage, Math.max(1, total));
  if (!items.length) return <AdminCard><AdminText secondary>{emptyLabel}</AdminText></AdminCard>;
  const visible = items.slice((page - 1) * pageSize, page * pageSize);
  return (
    <>
      {columns === 1 ? visible.map(item => <View key={keyFor(item)}>{render(item)}</View>) : (
        <View style={styles.recordGrid}>
          {visible.map(item => <View key={keyFor(item)} style={styles.recordCell}>{render(item)}</View>)}
          {visible.length % 2 === 1 && <View style={styles.recordCell} />}
        </View>
      )}
      <AdminPager page={page} total={total} onChange={setPage} />
    </>
  );
}

export function AdminLoad<T>({ load, query = '', refreshMs, children }: { load: () => Promise<T>; query?: string; refreshMs?: number; children: (data: T, reload: () => void) => ReactNode }) {
  const colors = useAppColors();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ query: string; key: string; data: T } | { query: string; key: string; error: string }>();
  const key = JSON.stringify([query, revision]);
  const request = useEffectEvent(load);
  const reload = () => setRevision(value => value + 1);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function fetchData() {
      try {
        const data = await request();
        if (active) setResult({ query, key, data });
      } catch (error) {
        if (active) setResult({ query, key, error: adminError(error) });
      } finally {
        if (active && refreshMs) timer = setTimeout(fetchData, refreshMs);
      }
    }
    void fetchData();
    return () => { active = false; clearTimeout(timer); };
  }, [key, query, refreshMs]);

  if (result?.query !== query || ('error' in result && result.key !== key)) {
    return <AdminCard><ActivityIndicator accessibilityLabel="Cargando" color={colors.tint} /></AdminCard>;
  }
  if ('error' in result) return <AdminCard><AdminText>{result.error}</AdminText><AdminButton label="Reintentar" onPress={reload} /></AdminCard>;
  return <>
    {result.key !== key && <ActivityIndicator accessibilityLabel="Actualizando" color={colors.tint} />}
    {children(result.data, reload)}
  </>;
}

export function adminError(error: unknown) {
  if (error instanceof Error) {
    const response = (error as Error & { data?: { message?: string } }).data;
    return response?.message || error.message;
  }
  return 'No se pudo completar la operación.';
}

export function useAdminAction() {
  const { showToast } = useToast();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  async function run<T>(action: () => Promise<T>, success?: string | ((result: T) => string), onSuccess?: (result: T) => void) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const result = await action();
      if (success) showToast(typeof success === 'function' ? success(result) : success, 'success');
      onSuccess?.(result);
    } catch (error) {
      showToast(adminError(error), 'error');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return { busy, run };
}

export function confirmAdmin(title: string, message: string, action: () => void, label = 'Confirmar') {
  if (Platform.OS === 'web') {
    if (globalThis.confirm(title + '\n\n' + message)) action();
    return;
  }
  Alert.alert(title, message, [{ text: 'Cancelar', style: 'cancel' }, { text: label, onPress: action }]);
}

export function adminDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

export function adminSearch(query: string, ...values: (string | number | null | undefined)[]) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const needle = normalize(query.trim());
  return !needle || values.some(value => normalize(String(value ?? '')).includes(needle));
}

export const styles = StyleSheet.create({
  stack: { gap: 12 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 24, padding: 16, gap: 12 },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.35 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 44, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, paddingVertical: 8 },
  choice: { minHeight: 38, justifyContent: 'center', borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, paddingVertical: 6 },
  inputShell: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12 },
  input: { flex: 1, minWidth: 0, paddingVertical: 10, minHeight: 44, fontSize: 15 },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flexGrow: 1, flexBasis: '42%', gap: 3 },
  recordGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 },
  recordCell: { flexBasis: '46%', flexGrow: 1, minWidth: 0 },
  editorHeader: { paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  editorClose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
