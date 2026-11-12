import { useState, type ComponentType, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronDown, type LucideProps } from 'lucide-react-native';
import { SelectModal } from '@/components/ui/SelectModal';
import { getAppleCardSurfaceStyle, getThemeSurfaceMode } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

type Icon = ComponentType<LucideProps>;
type Option<T> = readonly [T, string];
type Tone = 'neutral' | 'accent' | 'positive' | 'warning' | 'danger' | 'blue' | 'violet';
const tonePairs = {
  positive: ['#166534', '#86efac'],
  warning: ['#92400e', '#fcd34d'],
  danger: ['#b91c1c', '#fca5a5'],
  blue: ['#075985', '#7dd3fc'],
  violet: ['#6b21a8', '#d8b4fe'],
} as const;

export function AdminBadge({ children, tone = 'neutral', style }: { children: ReactNode; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const dark = getThemeSurfaceMode(theme) !== 'light';
  const ink = tone === 'neutral' ? colors.textSecondary : tone === 'accent' ? colors.text : tonePairs[tone][dark ? 1 : 0];
  const fill = tone === 'neutral' ? colors.border : (tone === 'accent' ? colors.tint : ink) + '19';
  return <View style={[styles.badge, { backgroundColor: fill }, style]}><Text style={{ color: ink, fontSize: 11, fontWeight: '700' }}>{children}</Text></View>;
}

export function AdminIconButton({ icon: Glyph, label, onPress, danger = false, disabled = false }: {
  icon: Icon; label: string; onPress: () => void; danger?: boolean; disabled?: boolean;
}) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const ink = danger ? tonePairs.danger[getThemeSurfaceMode(theme) === 'light' ? 0 : 1] : colors.textSecondary;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled}
    style={({ pressed }) => [styles.iconButton, { backgroundColor: danger ? ink + '18' : colors.border, opacity: disabled ? 0.45 : pressed ? 0.6 : 1 }]}>
    <Glyph size={17} color={ink} />
  </Pressable>;
}

export function AdminSelect<T extends string | number>({ label, options, value, onChange }: {
  label: string; options: readonly Option<T>[]; value: T; onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const current = options.find(([item]) => value === item)?.[1] || label;
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={label + ', ' + current} accessibilityState={{ expanded: open }}
      onPress={() => setOpen(true)} style={({ pressed }) => [styles.select, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.65 : 1 }]}>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>{label}</Text>
        <Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{current}</Text>
      </View>
      <ChevronDown size={16} color={colors.textSecondary} />
    </Pressable>
    {open && <SelectModal visible onClose={() => setOpen(false)} title={label} theme={theme} colors={colors}
      value={value} options={options.map(([item, text]) => ({ value: item, label: text }))}
      onSelect={selected => { const choice = options.find(([item]) => item === selected); if (choice) onChange(choice[0]); setOpen(false); }} />}
  </>;
}

export function AdminSegments<T extends string | number>({ options, value, onChange }: {
  options: readonly Option<T>[]; value: T; onChange: (value: T) => void;
}) {
  const colors = useAppColors();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.track, { backgroundColor: colors.card, borderColor: colors.border }]}
    contentContainerStyle={styles.segmentContent} keyboardShouldPersistTaps="handled">
    {options.map(([option, label]) => {
      const selected = option === value;
      return <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(option)}
        style={[styles.segment, selected && { backgroundColor: colors.tint }]}>
        <Text style={{ color: selected ? getContrastTextColor(colors.tint) : colors.textSecondary, fontWeight: selected ? '800' : '600', fontSize: 13 }}>{label}</Text>
      </Pressable>;
    })}
  </ScrollView>;
}

type Tile = { label: string; value: string | number; icon: Icon; detail?: string; color?: string };
export function AdminTiles({ tiles }: { tiles: readonly Tile[] }) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  return <View style={styles.tileGrid}>
    {tiles.map(({ label, value, icon: Glyph, detail, color }) => (
      <View key={label} style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }, getAppleCardSurfaceStyle(theme, 20)]}>
        <View style={[styles.tileIcon, { backgroundColor: (color || colors.tint) + '23' }]}>
          <Glyph size={17} color={getThemeSurfaceMode(theme) === 'light' ? colors.text : color || colors.tint} />
        </View>
        <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.tileValue, { color: colors.text }]}>{value}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>{label}</Text>
        {!!detail && <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 11 }}>{detail}</Text>}
      </View>
    ))}
  </View>;
}

export function AdminMeter({ value, color, label }: { value: number; color?: string; label: string }) {
  const colors = useAppColors();
  const percent = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: percent }}
    style={[styles.meter, { backgroundColor: colors.border }]}>
    <View style={{ height: '100%', width: (percent + '%') as DimensionValue, backgroundColor: color || colors.tint, borderRadius: 8 }} />
  </View>;
}

const styles = StyleSheet.create({
  badge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 7, alignSelf: 'flex-start' },
  iconButton: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 13 },
  select: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flexGrow: 0, borderRadius: 22, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth },
  segmentContent: { flexGrow: 1, gap: 3, padding: 4 },
  segment: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: 36, paddingHorizontal: 12, borderRadius: 18 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '47%', flexGrow: 1, minHeight: 108, justifyContent: 'center', padding: 13, gap: 4, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  tileIcon: { width: 29, height: 29, borderRadius: Platform.OS === 'ios' ? 9 : 10, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontSize: 27, fontWeight: '800', letterSpacing: -0.7, fontVariant: ['tabular-nums'] },
  meter: { height: 6, borderRadius: 8, overflow: 'hidden' },
});
