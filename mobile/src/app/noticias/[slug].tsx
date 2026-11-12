import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, ArrowRight, Copy, Share2, ThumbsUp } from 'lucide-react-native';
import { ActivityIndicator, Linking, Platform, Pressable, Share, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import NewsMarkdown from '@/components/news/NewsMarkdown';
import { DEFAULT_AUTHOR, NewsAction, NewsAuthor, NewsCard, NewsCover, NewsMeta, NewsSurface } from '@/components/news/NewsUI';
import { useAppColors } from '@/hooks/useAppColors';
import { useNewsResource } from '@/hooks/useNewsResource';
import { useToast } from '@/hooks/useToast';
import { getNewsArticle, NEWS_SITE_URL, reactToNews, recordNewsView, resolveNewsLink, type NewsArticle, type NewsDetail } from '@/services/newsService';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

const READER_FONT_SIZES = [17, 19, 21] as const;
const TOOLS = [
  { title: 'Calculadora de 1RM', path: '/calculadora-1rm', description: 'Fuerza máxima y porcentajes de carga' },
  { title: 'Calculadora de macros', path: '/calculadora-calorias-macros', description: 'Calorías y distribución de macronutrientes' },
  { title: 'Guía de ejercicios y rutinas', path: '/ejercicios', description: 'Técnica y rutinas de gimnasio' },
];

export default function NewsArticleRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ArticleScreen key={slug} slug={typeof slug === 'string' ? slug : ''} />;
}

function ArticleScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const colors = useAppColors();
  const [progress, setProgress] = useState(0);
  const scroll = useRef({ offset: 0, contentHeight: 0, viewportHeight: 0 });
  const { data, loading, error, reload } = useNewsResource(slug ? 'article:' + slug : '', () => getNewsArticle(slug));
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/noticias');

  function updateProgress() {
    const { offset, contentHeight, viewportHeight } = scroll.current;
    if (!contentHeight || !viewportHeight) return;
    const distance = contentHeight - viewportHeight;
    setProgress(distance <= 1 ? 100 : Math.min(100, Math.max(0, Math.round(offset / distance * 100))));
  }

  function onScroll({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) {
    scroll.current.offset = nativeEvent.contentOffset.y;
    updateProgress();
  }

  return (
    <AnimatedScreen
      fixedHeader
      paddingBottom={52}
      onScroll={onScroll}
      onLayout={event => { scroll.current.viewportHeight = event.nativeEvent.layout.height; updateProgress(); }}
      onContentSizeChange={(_, height) => { scroll.current.contentHeight = height; updateProgress(); }}
      header={<GlobalHeader title="Noticias y Artículos" showBackButton hideRightButtons showBackground={false} onBackPress={goBack} />}
      afterHeader={data && (
        <View pointerEvents="none" accessible accessibilityRole="progressbar" accessibilityLabel="Progreso de lectura"
          accessibilityValue={{ min: 0, max: 100, now: progress }} style={[styles.progress, { backgroundColor: colors.border }]}>
          <View style={{ width: `${progress}%`, height: '100%', backgroundColor: colors.tint }} />
        </View>
      )}
    >
      <View style={styles.container}>
        {data ? <ArticleReader key={data.article.id} data={data} /> : loading ? (
          <ActivityIndicator accessibilityLabel="Cargando artículo" color={colors.tint} style={{ marginTop: 32 }} />
        ) : (
          <NewsSurface><View style={styles.panel}>
            <Text accessibilityRole="alert" style={[styles.sectionTitle, { color: colors.text }]}>
              {(error as Error & { status?: number } | undefined)?.status === 404 || !slug ? 'Artículo no encontrado' : 'No se pudo cargar el artículo'}
            </Text>
            <View style={styles.actions}>
              {!!slug && <NewsAction label="Reintentar" onPress={reload} />}
              <NewsAction label="Volver a noticias" onPress={goBack} />
            </View>
          </View></NewsSurface>
        )}
      </View>
    </AnimatedScreen>
  );
}

function ArticleReader({ data }: { data: NewsDetail }) {
  const { article, prevArticle, nextArticle, relatedNews } = data;
  const router = useRouter();
  const colors = useAppColors();
  const authenticated = useAppStore(state => state.isAuthenticated);
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const [fontStep, setFontStep] = useState(0);
  const [views, setViews] = useState<number>();
  const request = useRef<ReturnType<typeof recordNewsView> | null>(null);
  const deviceType = width >= 768 ? Platform.OS === 'web' ? 'desktop' : 'tablet' : 'mobile';
  const pageUrl = `${NEWS_SITE_URL}/noticias/${encodeURIComponent(article.slug)}`;
  const tags = [...new Set((article.tags ?? '').split(',').map(tag => tag.trim()).filter(Boolean))];
  const author = article.author_name || DEFAULT_AUTHOR;

  useEffect(() => {
    let active = true;
    request.current ??= recordNewsView(article.slug, deviceType);
    void request.current.then(response => {
      if (active && typeof response.views_count === 'number') setViews(response.views_count);
    }).catch(() => {});
    return () => { active = false; };
  }, [article.slug, deviceType]);

  function openArticle(slug: string) {
    if (slug !== article.slug) router.replace({ pathname: '/noticias/[slug]', params: { slug } });
  }

  function openLink(value: string) {
    try {
      const url = resolveNewsLink(value, article.slug);
      if (!url) return;
      const match = url.match(/^https?:\/\/(?:www\.)?profitnessglass\.es\/noticias\/([^/?#]+)\/?$/i);
      if (match) {
        openArticle(decodeURIComponent(match[1]));
        return;
      }
      void Linking.openURL(url).catch(() => showToast('No se pudo abrir el enlace.', 'error'));
    } catch {
      showToast('No se pudo abrir el enlace.', 'error');
    }
  }

  async function copyLink() {
    try {
      await Clipboard.setStringAsync(pageUrl);
      showToast('Enlace copiado.', 'success');
    } catch {
      showToast('No se pudo copiar el enlace.', 'error');
    }
  }

  async function share() {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator.share === 'function') await navigator.share({ title: article.title, url: pageUrl });
        else await copyLink();
        return;
      }
      await Share.share({ title: article.title, message: `${article.title}\n${pageUrl}` });
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) showToast('No se pudo compartir el artículo.', 'error');
    }
  }

  return (
    <>
      <View style={styles.articleHeader}>
        <View style={styles.topRow}>
          {!!article.category && <NewsAction label={article.category} onPress={() => router.dismissTo({
            pathname: '/noticias', params: { category: article.category, search: '', page: '1' },
          })} />}
          <NewsAction label={`Aa · ${['Normal', 'Grande', 'Muy grande'][fontStep]}`}
            onPress={() => setFontStep(step => (step + 1) % READER_FONT_SIZES.length)} />
        </View>
        <Text accessibilityRole="header" style={[styles.articleTitle, { color: colors.text }]}>{article.title}</Text>
        {!!article.summary && <Text style={[styles.lead, { color: colors.textSecondary }]}>{article.summary}</Text>}
        <View style={[styles.byline, { borderColor: colors.border }]}>
          <NewsAuthor article={article} size={42} />
          <View style={styles.bylineText}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Por {author}</Text>
            <NewsMeta article={{ ...article, views_count: views ?? article.views_count }} showViews />
          </View>
        </View>
        <View style={styles.actions}>
          <ReaderIcon icon={Share2} label="Compartir artículo" onPress={() => void share()} />
          <ReaderIcon icon={Copy} label="Copiar enlace" onPress={() => void copyLink()} />
        </View>
      </View>

      {!!article.image_url && <NewsSurface><NewsCover article={article} badges={false} /></NewsSurface>}
      {!!article.content && <NewsMarkdown content={article.content} fontSize={READER_FONT_SIZES[fontStep]} onOpenLink={openLink} />}
      <ArticleReaction article={article} />

      {!!tags.length && <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Temas relacionados</Text>
        <View style={styles.actions}>{tags.map(tag => (
          <NewsAction key={tag} label={'#' + tag.replace(/^#/, '')} onPress={() => router.dismissTo({
            pathname: '/noticias', params: { search: tag.replace(/^#/, ''), category: 'Todas', page: '1' },
          })} />
        ))}</View>
      </View>}

      <NewsSurface><View style={styles.panel}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Herramientas de gimnasio</Text>
        {TOOLS.map(tool => <Pressable key={tool.path} accessibilityRole="link" onPress={() => openLink(tool.path)}
          style={[styles.tool, { borderTopColor: colors.border }]}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{tool.title}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{tool.description}</Text>
          </View>
          <ArrowRight size={17} color={colors.textSecondary} />
        </Pressable>)}
        <View style={styles.actions}>
          <NewsAction label="Ver asesorías" onPress={() => router.push(authenticated ? '/asesoria' : '/register')} />
        </View>
      </View></NewsSurface>

      <NewsSurface><View style={[styles.panel, styles.authorCard]}>
        <NewsAuthor article={article} size={48} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{author}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Publicado en Pro Fitness Glass.</Text>
        </View>
      </View></NewsSurface>

      {!!(prevArticle || nextArticle) && <View style={styles.navigation}>
        {!!prevArticle && <ArticleNavigation label="Noticia anterior" article={prevArticle} onPress={() => openArticle(prevArticle.slug)} />}
        {!!nextArticle && <ArticleNavigation label="Siguiente noticia" article={nextArticle} onPress={() => openArticle(nextArticle.slug)} next />}
      </View>}
      {!!relatedNews.length && <View style={styles.section}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>También te puede interesar</Text>
        {relatedNews.map(item => <NewsCard key={item.slug} article={item} onPress={() => openArticle(item.slug)} />)}
      </View>}
    </>
  );
}

function ReaderIcon({ icon: Icon, label, onPress }: { icon: typeof Copy; label: string; onPress: () => void }) {
  const colors = useAppColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={[styles.icon, { backgroundColor: colors.card, borderColor: colors.border }]}><Icon size={18} color={colors.text} /></Pressable>;
}

function ArticleReaction({ article }: { article: NewsArticle }) {
  const colors = useAppColors();
  const { showToast } = useToast();
  const [liked, setLiked] = useState<boolean>();
  const [count, setCount] = useState<number>();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const storageKey = `liked_article_${article.id}`;

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(storageKey).then(value => { if (active) setLiked(value === 'true'); }, () => {
      if (active) setLiked(false);
    });
    return () => { active = false; };
  }, [storageKey]);

  async function toggle() {
    if (inFlight.current || liked === undefined) return;
    inFlight.current = true;
    setBusy(true);
    const next = !liked;
    try {
      const result = await reactToNews(article.slug, next);
      setLiked(next);
      setCount(result.likes_count);
      await AsyncStorage.setItem(storageKey, String(next));
    } catch {
      showToast('No se pudo guardar la valoración.', 'error');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const ink = liked ? getContrastTextColor(colors.tint) : colors.text;
  return <NewsSurface><View style={styles.panel}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>¿Te ha resultado útil?</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ selected: liked, busy }} disabled={liked === undefined || busy}
      onPress={() => void toggle()} style={[styles.reaction, { backgroundColor: liked ? colors.tint : colors.card, borderColor: colors.border, opacity: busy ? 0.5 : 1 }]}>
      <ThumbsUp color={ink} size={16} />
      <Text style={{ color: ink, fontSize: 13, fontWeight: '800' }}>{liked ? 'Marcado como útil' : 'Me ha servido'} · {count ?? article.likes_count ?? 0}</Text>
    </Pressable>
  </View></NewsSurface>;
}

function ArticleNavigation({ label, article, onPress, next = false }: { label: string; article: NewsArticle; onPress: () => void; next?: boolean }) {
  const colors = useAppColors();
  const Icon = next ? ArrowRight : ArrowLeft;
  return <View style={{ flex: 1, minWidth: 135 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${article.title}`} onPress={onPress}>
      <NewsSurface><View style={styles.panel}>
        <View style={styles.actions}><Icon size={14} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800' }}>{label}</Text></View>
        <Text numberOfLines={2} style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{article.title}</Text>
      </View></NewsSurface>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 20 },
  articleHeader: { gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  articleTitle: { fontSize: 32, lineHeight: 39, fontWeight: '900', letterSpacing: -0.7 },
  lead: { fontSize: 17, lineHeight: 25 },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  bylineText: { flex: 1, gap: 5 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  panel: { padding: 15, gap: 9 },
  reaction: { minHeight: 44, borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start', alignItems: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 13, paddingVertical: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, minHeight: 49, paddingVertical: 7 },
  authorCard: { flexDirection: 'row', alignItems: 'center' },
  navigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' },
  progress: { height: 4, overflow: 'hidden' },
});
