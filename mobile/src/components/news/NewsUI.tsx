import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ArrowRight, CalendarDays, Clock3, Eye, Newspaper, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getAppleCardSurfaceStyle } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { resolveNewsImage, type NewsArticle } from '@/services/newsService';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

const logo = require('@/assets/images/logo.webp');
export const DEFAULT_AUTHOR = 'Equipo Científico PFG';

export function newsDate(value?: string) {
  const date = new Date(value ?? '');
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NewsSurface({ children }: { children: ReactNode }) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  return <View style={[styles.surface, { backgroundColor: colors.card, borderColor: colors.border }, getAppleCardSurfaceStyle(theme, 24)]}>{children}</View>;
}

export function NewsCover({ article, featured = false, badges = true }: { article: NewsArticle; featured?: boolean; badges?: boolean }) {
  const colors = useAppColors();
  const uri = resolveNewsImage(article.image_url);
  return <View style={[styles.cover, { aspectRatio: featured ? 1.6 : 16 / 9, backgroundColor: colors.tabBar }]}>
    <Newspaper size={34} color={colors.textMuted} strokeWidth={1.5} />
    {!!uri && <Image source={{ uri }} recyclingKey={uri} contentFit="cover" transition={150} style={StyleSheet.absoluteFill} />}
    {featured && <LinearGradient colors={['#00000040', '#00000000', '#00000038']} style={StyleSheet.absoluteFill} pointerEvents="none" />}
    {badges && <View style={styles.coverTags}>
      {featured && <View style={[styles.categoryPill, styles.featuredPill, { backgroundColor: colors.tint }]}>
        <Sparkles size={12} color={getContrastTextColor(colors.tint)} />
        <Text style={[styles.categoryText, { color: getContrastTextColor(colors.tint) }]}>Destacada</Text>
      </View>}
      {!!article.category && <View style={styles.categoryPill}><Text style={styles.categoryText}>{article.category}</Text></View>}
    </View>}
  </View>;
}

export function NewsAuthor({ article, size = 36 }: { article: NewsArticle; size?: number }) {
  const colors = useAppColors();
  const uri = resolveNewsImage(article.author_avatar);
  return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: colors.tint + '22' }}>
    <Image source={logo} contentFit="contain" style={StyleSheet.absoluteFill} />
    {!!uri && <Image source={{ uri }} contentFit="cover" recyclingKey={uri} style={StyleSheet.absoluteFill} />}
  </View>;
}

export function NewsMeta({ article, showViews = false }: { article: NewsArticle; showViews?: boolean }) {
  const colors = useAppColors();
  const date = newsDate(article.published_at);
  const items = [
    ...(date ? [{ icon: CalendarDays, label: date }] : []),
    { icon: Clock3, label: `${article.reading_time || 4} min` },
    ...(showViews ? [{ icon: Eye, label: `${(article.views_count ?? 0).toLocaleString('es-ES')} lecturas` }] : []),
  ];
  return <View style={styles.meta}>
    {items.map(({ icon: Icon, label }) => <View key={label} style={styles.metaItem}>
      <Icon size={13} color={colors.textSecondary} />
      <Text style={[styles.metaText, { color: colors.textSecondary }]}>{label}</Text>
    </View>)}
  </View>;
}

export function NewsCard({ article, onPress, featured = false }: { article: NewsArticle; onPress: () => void; featured?: boolean }) {
  const colors = useAppColors();
  const onAccent = getContrastTextColor(colors.tint);
  return <Pressable accessibilityRole="button" accessibilityLabel={article.title} onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
    <NewsSurface>
      <NewsCover article={article} featured={featured} />
      <View style={styles.cardBody}>
        <NewsMeta article={article} showViews={!featured} />
        <Text numberOfLines={featured ? 3 : 2} style={[styles.cardTitle, featured && styles.featuredTitle, { color: colors.text }]}>{article.title}</Text>
        {!!article.summary && <Text numberOfLines={featured ? 4 : 2} style={[styles.summary, { color: colors.textSecondary }]}>{article.summary}</Text>}
        {featured && <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <NewsAuthor article={article} size={32} />
          <View style={styles.authorText}>
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{article.author_name || DEFAULT_AUTHOR}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{article.views_count ? `${article.views_count.toLocaleString('es-ES')} lecturas` : 'Recién publicado'}</Text>
          </View>
          <View style={[styles.read, { backgroundColor: colors.tint }]}>
            <Text style={{ color: onAccent, fontSize: 12, fontWeight: '800' }}>Leer artículo</Text><ArrowRight size={14} color={onAccent} />
          </View>
        </View>}
      </View>
    </NewsSurface>
  </Pressable>;
}

export function NewsAction({ label, onPress, disabled = false, active = false }: { label: string; onPress: () => void; disabled?: boolean; active?: boolean }) {
  const colors = useAppColors();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected: active || undefined }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.action, { backgroundColor: active ? colors.tint : colors.card, borderColor: colors.border, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}>
    <Text style={{ color: active ? getContrastTextColor(colors.tint) : colors.text, fontSize: 13, fontWeight: '800' }}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  surface: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cover: { width: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverTags: { position: 'absolute', left: 12, right: 12, top: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryPill: { borderRadius: 20, backgroundColor: '#151515df', paddingHorizontal: 10, paddingVertical: 5 },
  featuredPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryText: { color: '#fff', fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.25 },
  cardBody: { padding: 15, gap: 8 },
  cardTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800', letterSpacing: -0.3 },
  featuredTitle: { fontSize: 23, lineHeight: 29 },
  summary: { fontSize: 14, lineHeight: 21 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 5, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  authorText: { flex: 1, minWidth: 85, gap: 2 },
  read: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 10 },
  action: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, paddingVertical: 7, minHeight: 42, justifyContent: 'center' },
});
