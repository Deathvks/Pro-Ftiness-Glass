import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, TrendingUp, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { NewsAction, NewsCard, NewsCover, NewsSurface } from '@/components/news/NewsUI';
import { useAppColors } from '@/hooks/useAppColors';
import { useNewsResource } from '@/hooks/useNewsResource';
import { DEFAULT_NEWS_QUERY, listNews, NEWS_CATEGORIES, type NewsArticle, type NewsQuery } from '@/services/newsService';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

export default function NewsIndex() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; search?: string; page?: string }>();
  const signedIn = useAppStore(state => state.isAuthenticated);
  const colors = useAppColors();
  const scroll = useRef<ScrollViewInstance>(null);
  const { width } = useWindowDimensions();
  const parsedPage = Number(params.page);
  const query: NewsQuery = {
    page: Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    category: typeof params.category === 'string' && params.category.trim() ? params.category.trim() : DEFAULT_NEWS_QUERY.category,
    search: typeof params.search === 'string' ? params.search.trim().slice(0, 100) : '',
  };
  const { data, loading, error, reload } = useNewsResource('list:' + JSON.stringify(query), () => listNews(query));
  const categories = Array.from(new Set([...NEWS_CATEGORIES, ...(data?.categories || []), query.category]));
  const featured = query.page === 1 && !query.search ? data?.news[0] : undefined;
  const popular = query.page === 1 && query.category === 'Todas' && !query.search ? data?.popularNews ?? [] : [];
  const rows = featured ? data?.news.slice(1) : data?.news;
  const pageCount = data?.totalPages ?? 0;

  function updateQuery(change: Partial<NewsQuery>) {
    const next = { ...query, ...change };
    router.setParams({ category: next.category, search: next.search, page: String(next.page) });
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  const open = (article: NewsArticle) => router.push({ pathname: '/noticias/[slug]', params: { slug: article.slug } });
  return (
    <AnimatedScreen scrollRef={scroll} paddingBottom={48} keyboardShouldPersistTaps="handled"
      header={<GlobalHeader title="Noticias y Artículos" showBackButton hideRightButtons onBackPress={() =>
        router.canGoBack() ? router.back() : router.replace(signedIn ? '/(tabs)/hub' : '/login')} />}>
      <View style={styles.container}>
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Guías científicas y noticias</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Artículos y guías de fitness basados en evidencia para tu entrenamiento, fuerza y nutrición.</Text>
        </View>

        {!!featured && <View style={styles.section}>
          <View style={styles.headingRow}>
            <View style={[styles.dot, { backgroundColor: colors.tint }]} />
            <Text style={[styles.kicker, { color: colors.textSecondary }]}>Última noticia publicada</Text>
          </View>
          <NewsCard article={featured} featured onPress={() => open(featured)} />
        </View>}

        {!!popular.length && <View style={styles.section}>
          <View style={styles.headingRow}>
            <View style={[styles.popularIcon, { backgroundColor: colors.tint + '25' }]}><TrendingUp size={17} color={colors.text} /></View>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Más leídas</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {popular.map((article, index) => (
              <Pressable accessibilityRole="button" accessibilityLabel={article.title} key={article.slug} onPress={() => open(article)} style={styles.popularCard}>
                <NewsSurface>
                  <NewsCover article={article} badges={false} />
                  <View style={styles.popularText}>
                    <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>{index + 1}. {article.category || 'Noticias'}</Text>
                    <Text numberOfLines={2} style={[styles.popularTitle, { color: colors.text }]}>{article.title}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{(article.views_count ?? 0).toLocaleString('es-ES')} lecturas</Text>
                  </View>
                </NewsSurface>
              </Pressable>
            ))}
          </ScrollView>
        </View>}

        <View style={styles.section}>
          <View style={styles.filterHeading}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Explorar artículos</Text>
            {!!data && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{data.total} {data.total === 1 ? 'artículo' : 'artículos'}</Text>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.carousel}>
            {categories.map(category => {
              const selected = category === query.category;
              const count = category === 'Todas' ? data?.totalAll : data?.categoryCounts[category];
              const color = selected ? getContrastTextColor(colors.tint) : colors.text;
              return <Pressable key={category} accessibilityRole="button" accessibilityState={{ selected }}
                onPress={() => updateQuery({ category, page: 1 })}
                style={[styles.filter, { backgroundColor: selected ? colors.tint : colors.card, borderColor: colors.border }]}>
                <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{category}{typeof count === 'number' ? ` · ${count}` : ''}</Text>
              </Pressable>;
            })}
          </ScrollView>
          <NewsSearch key={query.search} search={query.search} onSearch={search => updateQuery({ search, page: 1 })} />
        </View>

        {loading && <ActivityIndicator accessibilityLabel="Cargando noticias" color={colors.tint} />}
        {!!error && <NewsSurface><View style={styles.notice}>
          <Text accessibilityRole="alert" style={[styles.sectionTitle, { color: colors.text }]}>{data ? 'No se pudieron actualizar las noticias' : 'No se pudieron cargar las noticias'}</Text>
          <NewsAction label="Reintentar" onPress={reload} />
        </View></NewsSurface>}
        {!loading && !error && data?.news.length === 0 && <NewsSurface><View style={styles.notice}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>No se encontraron artículos</Text>
          {(query.search || query.category !== 'Todas') && <NewsAction label="Quitar filtros" onPress={() => updateQuery(DEFAULT_NEWS_QUERY)} />}
          {query.page > 1 && <NewsAction label="Primera página" onPress={() => updateQuery({ page: 1 })} />}
        </View></NewsSurface>}

        {!!rows?.length && <View style={width >= 650 ? styles.grid : styles.section}>
          {rows.map(article => (
            <View key={article.slug} style={width >= 650 ? styles.gridItem : undefined}>
              <NewsCard article={article} onPress={() => open(article)} />
            </View>
          ))}
        </View>}
        {pageCount > 1 && <NewsPager page={query.page} pages={pageCount} onChange={page => updateQuery({ page })} />}
      </View>
    </AnimatedScreen>
  );
}

function NewsSearch({ search, onSearch }: { search: string; onSearch: (search: string) => void }) {
  const [input, setInput] = useState(search);
  const colors = useAppColors();
  return <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Search size={18} color={colors.textSecondary} />
    <TextInput accessibilityLabel="Buscar artículos" placeholder="Buscar artículos…" placeholderTextColor={colors.textSecondary}
      returnKeyType="search" maxLength={100} autoCapitalize="none" value={input} onChangeText={setInput}
      onSubmitEditing={() => onSearch(input.trim())} style={[styles.searchInput, { color: colors.text }]} />
    {!!input && <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={6}
      onPress={() => { setInput(''); onSearch(''); }}><X size={18} color={colors.textSecondary} /></Pressable>}
    <NewsAction label="Buscar" onPress={() => onSearch(input.trim())} />
  </View>;
}

function NewsPager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  const colors = useAppColors();
  const visible = [...new Set([1, page - 1, page, page + 1, pages])].filter(value => value >= 1 && value <= pages).sort((a, b) => a - b);
  return <View style={styles.pager}>
    <View style={styles.pageNumbers}>
      {visible.map((value, index) => <View key={value} style={styles.pageNumbers}>
        {index > 0 && value - visible[index - 1] > 1 && <Text style={{ color: colors.textSecondary }}>…</Text>}
        <NewsAction label={String(value)} active={page === value} onPress={() => onChange(value)} />
      </View>)}
    </View>
    <View style={styles.filterHeading}>
      <NewsAction label="Anterior" disabled={page <= 1} onPress={() => onChange(page - 1)} />
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{page} / {pages}</Text>
      <NewsAction label="Siguiente" disabled={page >= pages} onPress={() => onChange(page + 1)} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 860, alignSelf: 'center', gap: 22 },
  intro: { gap: 5 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 21 },
  section: { gap: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.55, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3, flexShrink: 1 },
  popularIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  carousel: { gap: 8 },
  popularCard: { width: 158 },
  popularText: { padding: 10, gap: 4 },
  popularTitle: { minHeight: 36, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  filterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  filter: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9, minHeight: 39, justifyContent: 'center' },
  search: { flexDirection: 'row', gap: 9, alignItems: 'center', paddingHorizontal: 11, paddingVertical: 4, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, minHeight: 44 },
  notice: { padding: 16, alignItems: 'flex-start', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
  gridItem: { width: '48.5%' },
  pager: { gap: 10 },
  pageNumbers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 },
});
