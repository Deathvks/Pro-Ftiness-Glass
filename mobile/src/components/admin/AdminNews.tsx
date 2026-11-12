import { useState } from 'react';
import { Image, View } from 'react-native';
import { Eye, Heart, Newspaper, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react-native';
import apiClient, { BACKEND_BASE_URL } from '@/services/apiClient';
import { adminWrite } from '@/services/adminService';
import { AdminButton, AdminCard, AdminEditor, AdminInput, AdminLoad, AdminMetrics, AdminPager, AdminRecords, AdminText, AdminToggle, adminDate, adminSearch, confirmAdmin, styles, useAdminAction } from './AdminUI';
import { AdminBadge, AdminIconButton, AdminSegments, AdminSelect, AdminTiles } from './AdminControls';

type Article = {
  id: number; slug: string; title: string; summary: string; content: string; image_url?: string; category?: string; tags?: string;
  author_name?: string; seo_title?: string; seo_description?: string; reading_time?: number; is_published?: boolean; published_at?: string; views_count?: number; likes_count?: number;
};
type ArticleDraft = Omit<Partial<Article>, 'id' | 'reading_time'> & { reading_time?: number | string };
const loadNews = () => apiClient('/news/admin/list');
const loadAutomation = () => apiClient('/news/admin/automation/status');
const textFields = [
  ['title', 'Título'], ['slug', 'Slug'], ['summary', 'Resumen'], ['content', 'Contenido (HTML)'],
  ['image_url', 'URL de portada'], ['category', 'Categoría'], ['tags', 'Etiquetas'],
  ['author_name', 'Autor'], ['seo_title', 'Título SEO'], ['seo_description', 'Descripción SEO'], ['reading_time', 'Tiempo de lectura (minutos)'],
] as const;

export default function AdminNews() {
  const [tab, setTab] = useState('articles');
  return <>
    <AdminSegments options={[[ 'articles', 'Artículos'], ['analytics', 'Visitas y analítica'], ['automation', 'Automatización Gemini']]} value={tab} onChange={setTab} />
    {tab === 'articles' && <Publications />}
    {tab === 'automation' && <AdminLoad<Automation> load={loadAutomation}>{(data, reload) => <AutomationPanel data={data} reload={reload} />}</AdminLoad>}
    {tab === 'analytics' && <NewsAnalytics />}
  </>;
}

function Publications() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<{ article?: Article } | null>(null);
  const { busy, run } = useAdminAction();
  return <AdminLoad<{ news: Article[]; total: number }> load={loadNews}>{({ news, total }, reload) => <>
    <AdminCard title="Gestión de noticias y blog">
      <View style={styles.actions}>
        <AdminButton icon={Plus} label="Crear noticia" variant="primary" onPress={() => setEditor({})} />
        <AdminIconButton icon={RefreshCw} label="Actualizar noticias" onPress={reload} />
      </View>
      <AdminInput search label="Buscar noticia" value={search} onChangeText={setSearch} />
      <AdminSegments options={[[ 'all', 'Todas'], ['live', 'Publicadas'], ['draft', 'Borradores']]} value={filter} onChange={setFilter} />
      <AdminBadge>{total} noticias</AdminBadge>
    </AdminCard>
    <AdminRecords key={search + filter} items={news.filter(row => (filter === 'all' || Boolean(row.is_published) === (filter === 'live')) && adminSearch(search, row.title, row.category, row.tags))}
      keyFor={row => String(row.id)} render={row => (
        <AdminCard>
          {!!row.image_url && /^(https?:\/\/|\/)/.test(row.image_url) && <Image source={{ uri: row.image_url.startsWith('/') ? BACKEND_BASE_URL + row.image_url : row.image_url }} resizeMode="cover" style={{ width: '100%', aspectRatio: 2.2, borderRadius: 15 }} />}
          <View style={styles.actions}>
            <AdminBadge tone={row.is_published ? 'positive' : 'warning'}>{row.is_published ? 'Publicada' : 'Borrador'}</AdminBadge>
            <AdminBadge tone="accent">{row.category || 'Noticia'}</AdminBadge>
          </View>
          <AdminText strong>{row.title}</AdminText>
          <AdminText secondary>{adminDate(row.published_at)}</AdminText>
          {!!row.summary && <AdminText secondary numberOfLines={3}>{row.summary}</AdminText>}
          <View style={styles.actions}><AdminBadge>{row.views_count ?? 0} lecturas</AdminBadge><AdminBadge>{row.likes_count ?? 0} me gusta</AdminBadge></View>
          <View style={styles.actions}>
            <AdminIconButton icon={Pencil} label="Editar noticia" disabled={busy} onPress={() => void run(() => apiClient('/news/admin/article/' + encodeURIComponent(row.slug)), undefined, response => setEditor({ article: response.article }))} />
            <AdminButton label={row.is_published ? 'Pasar a borrador' : 'Publicar'} disabled={busy} onPress={() => confirmAdmin(row.is_published ? 'Retirar publicación' : 'Publicar noticia',
              `Se cambiará el estado de «${row.title}».`, () => void run(() => adminWrite('/news/' + row.id, 'PUT', { is_published: !row.is_published }), 'Estado actualizado.', reload))} />
            <AdminIconButton icon={Sparkles} label="Adaptar con IA" disabled={busy} onPress={() => confirmAdmin('Adaptar artículo', `Se iniciará la adaptación de «${row.title}».`, () => void run(() =>
              adminWrite('/news/admin/automation/optimize-existing', 'POST', { articleId: row.id, forceAll: true }), 'Adaptación iniciada. Consulta Automatización.'))} />
            <AdminIconButton icon={Trash2} label="Eliminar noticia" danger disabled={busy} onPress={() => confirmAdmin('Eliminar noticia', `Se eliminará «${row.title}».`, () => void run(() =>
              adminWrite('/news/' + row.id, 'DELETE'), 'Noticia eliminada.', reload), 'Eliminar')} />
          </View>
        </AdminCard>
      )} />
    {editor && <ArticleEditor article={editor.article} onClose={() => setEditor(null)} onSave={() => { setEditor(null); reload(); }} />}
  </>}</AdminLoad>;
}

function ArticleEditor({ article, onClose, onSave }: { article?: Article; onClose: () => void; onSave: () => void }) {
  const [draft, setDraft] = useState<ArticleDraft>(() => article ?? { category: 'Entrenamiento', is_published: false });
  const [topic, setTopic] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const { busy, run } = useAdminAction();
  const valid = draft.title?.trim() && draft.summary?.trim() && draft.content?.trim() &&
    (!draft.reading_time || (/^\d+$/.test(String(draft.reading_time)) && Number(draft.reading_time) > 0));

  function save() {
    const payload = Object.fromEntries(textFields.map(([key]) => [key, String(draft[key] ?? '').trim()]));
    const data = { ...payload, reading_time: payload.reading_time ? Number(payload.reading_time) : undefined, is_published: Boolean(draft.is_published) };
    void run(() => article ? adminWrite('/news/' + article.id, 'PUT', data) : adminWrite('/news', 'POST', data), 'Noticia guardada.', onSave);
  }

  function formatContent(open: string, close: string) {
    const content = draft.content || '';
    const before = content.slice(0, selection.start);
    const selected = content.slice(selection.start, selection.end);
    const after = content.slice(selection.end);
    setDraft(previous => ({ ...previous, content: before + open + selected + close + after }));
    const end = selection.end + open.length;
    setSelection({ start: end, end });
  }

  return <AdminEditor title={article ? 'Editar noticia' : 'Crear noticia'} onClose={onClose} busy={busy}>
    {!article && <>
      <AdminInput label="Tema para generar con IA" value={topic} onChangeText={setTopic} />
      <AdminButton label="Generar borrador" disabled={busy || !topic.trim()} onPress={() => void run(() =>
        adminWrite('/news/generate-ai', 'POST', { topic: topic.trim(), category: draft.category }, { timeout: 60_000 }), 'Borrador generado.', response =>
          setDraft(previous => ({ ...previous, ...response.article, is_published: false })))} />
    </>}
    {textFields.map(([key, label]) => <View key={key} style={{ gap: 6 }}>
      {key === 'content' && <View style={styles.actions}>
        <AdminButton label="Título" onPress={() => formatContent('<h2>', '</h2>')} />
        <AdminButton label="Negrita" onPress={() => formatContent('<strong>', '</strong>')} />
        <AdminButton label="Lista" onPress={() => formatContent('<ul><li>', '</li></ul>')} />
      </View>}
      <AdminInput label={label} value={String(draft[key] ?? '')}
      onChangeText={value => setDraft(previous => ({ ...previous, [key]: value }))}
      onSelectionChange={key === 'content' ? event => setSelection(event.nativeEvent.selection) : undefined}
      multiline={key === 'content' || key === 'summary'} autoCapitalize={key === 'slug' || key === 'image_url' ? 'none' : undefined}
      keyboardType={key === 'reading_time' ? 'number-pad' : key === 'image_url' ? 'url' : 'default'} />
    </View>)}
    <AdminButton label="Pulir contenido con IA" disabled={busy || !draft.content?.trim()} onPress={() => void run(() =>
      adminWrite('/news/admin/polish-content', 'POST', { title: draft.title, summary: draft.summary, content: draft.content, category: draft.category }), 'Contenido revisado.', response =>
        setDraft(previous => ({ ...previous, ...response.article })))} />
    <AdminToggle label="Publicada" value={Boolean(draft.is_published)} onChange={value => setDraft(previous => ({ ...previous, is_published: value }))} />
    <View style={styles.actions}>
      <AdminButton label="Cancelar" disabled={busy} onPress={onClose} />
      <AdminButton label={busy ? 'Procesando…' : 'Guardar'} variant="primary" disabled={busy || !valid} onPress={save} />
    </View>
  </AdminEditor>;
}

type Automation = { status: string; currentStep?: string; isGenerating: boolean; nextRunAt?: string; lastRunAt?: string; scheduledHour: number; scheduledMinute: number; logs?: { timestamp?: string; message: string }[]; lastResult?: { articleTitle?: string; error?: string } };

function AutomationPanel({ data, reload }: { data: Automation; reload: () => void }) {
  const [topic, setTopic] = useState('');
  const [time, setTime] = useState<string>();
  const { busy, run } = useAdminAction();
  const savedTime = [data.scheduledHour, data.scheduledMinute].map(value => String(value).padStart(2, '0')).join(':');
  const timeValue = time ?? savedTime;
  const validTime = /^([01]?\d|2[0-3]):[0-5]\d$/.test(timeValue);
  const disabled = busy || data.isGenerating;

  function start(label: string, endpoint: string, body?: object) {
    confirmAdmin(label, 'La tarea se iniciará en el servidor.', () => void run(() => adminWrite(endpoint, 'POST', body), 'Solicitud iniciada.', reload));
  }

  return <>
    <AdminCard title="Estado de la automatización">
      <AdminMetrics entries={[[ 'Estado', data.status], ['Próxima ejecución', adminDate(data.nextRunAt)], ['Última ejecución', adminDate(data.lastRunAt)], ['Paso actual', data.currentStep]]} />
      {!!data.lastResult && <AdminText>{data.lastResult.articleTitle || data.lastResult.error}</AdminText>}
      <AdminButton label="Actualizar estado" onPress={reload} />
    </AdminCard>
    <AdminCard title="Tareas y horario">
      <AdminInput label="Tema (opcional)" value={topic} onChangeText={setTopic} />
      <AdminButton label="Generar noticia ahora" variant="primary" disabled={disabled} onPress={() => start('Generar noticia', '/news/admin/automation/trigger', { topic: topic.trim() || null })} />
      <AdminInput label="Horario del servidor (HH:MM)" value={timeValue} onChangeText={setTime} />
      <AdminButton label="Guardar horario" disabled={busy || !validTime || timeValue === savedTime} onPress={() => {
        const [hour, minute] = timeValue.split(':').map(Number);
        void run(() => adminWrite('/news/admin/automation/schedule', 'POST', { hour, minute }), 'Horario guardado.', () => { setTime(undefined); reload(); });
      }} />
      <AdminButton label="Adaptar artículos pendientes" disabled={disabled} onPress={() => start('Adaptar artículos', '/news/admin/automation/optimize-existing', { forceAll: false })} />
      <AdminButton label="Corregir portadas duplicadas" disabled={disabled} onPress={() => start('Corregir portadas', '/news/admin/fix-duplicate-covers')} />
    </AdminCard>
    {!!data.logs?.length && <AdminCard title="Registro de automatización">
      {data.logs.slice(-15).reverse().map((log, index) => <AdminText key={index} secondary>{log.timestamp ? adminDate(log.timestamp) + ' · ' : ''}{log.message}</AdminText>)}
    </AdminCard>}
  </>;
}

type Visit = { id: number; article_title?: string; page_path?: string; referrer_host?: string; device_type?: string; is_test?: boolean; created_at?: string };
type Analytics = { stats: { totalVisits: number; uniqueVisitors: number; realVisits: number; testVisits: number; todayVisits: number; topArticles: { title: string; count: number }[]; topReferrers: { host: string; count: number }[] }; visits: Visit[]; pagination: { totalPages: number } };

function NewsAnalytics() {
  const [period, setPeriod] = useState('7d');
  const [mode, setMode] = useState('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [testSlug, setTestSlug] = useState('');
  const { busy, run } = useAdminAction();
  const params = new URLSearchParams({ period, mode, page: String(page), pageSize: '20', search: query }).toString();
  return <>
    <AdminCard title="Visitas">
      <AdminSegments options={[[ 'today', 'Hoy'], ['7d', '7 días'], ['30d', '30 días'], ['all', 'Todo']]} value={period} onChange={value => { setPeriod(value); setPage(1); }} />
      <AdminSelect label="Tipo de visita" options={[[ 'all', 'Todas'], ['real', 'Reales'], ['test', 'De prueba']]} value={mode} onChange={value => { setMode(value); setPage(1); }} />
      <AdminInput search label="Buscar título o página" value={search} onChangeText={setSearch} onSubmitEditing={() => { setQuery(search.trim()); setPage(1); }} />
      <AdminButton label="Buscar" onPress={() => { setQuery(search.trim()); setPage(1); }} />
    </AdminCard>
    <AdminLoad<Analytics> query={params} load={() => apiClient('/news/admin/analytics?' + params)}>{({ stats, visits, pagination }, reload) => <>
      <AdminTiles tiles={[
        { label: 'Visitas', value: stats.totalVisits, icon: Eye },
        { label: 'Visitantes únicos', value: stats.uniqueVisitors, icon: Heart, color: '#ec4899' },
        { label: 'Visitas hoy', value: stats.todayVisits, icon: Newspaper, color: '#0ea5e9' },
        { label: 'Visitas reales', value: stats.realVisits, detail: `${stats.testVisits} visitas de prueba`, icon: Eye, color: '#22c55e' },
      ]} />
      <AdminButton icon={RefreshCw} label="Actualizar visitas" onPress={reload} />
      {!!stats.topArticles.length && <AdminCard title="Páginas más visitadas">{stats.topArticles.slice(0, 5).map((item, index) => <AdminText key={index}>{item.title} · {item.count}</AdminText>)}</AdminCard>}
      {!!stats.topReferrers.length && <AdminCard title="Principales orígenes">{stats.topReferrers.slice(0, 5).map((item, index) => <AdminText key={index}>{item.host || 'Directo'} · {item.count}</AdminText>)}</AdminCard>}
      <AdminCard title="Diagnóstico de visitas">
        <AdminInput label="Slug de la noticia (opcional)" value={testSlug} onChangeText={setTestSlug} autoCapitalize="none" />
        <View style={styles.actions}>
          <AdminButton label="Registrar visita de prueba" disabled={busy} onPress={() => void run(() => adminWrite('/news/admin/analytics/test-ping', 'POST', { slug: testSlug.trim() || undefined }), 'Visita de prueba registrada.', reload)} />
          <AdminButton label="Limpiar visitas de prueba" disabled={busy || !stats.testVisits} onPress={() => confirmAdmin('Limpiar visitas de prueba', 'Se borrarán los registros de prueba.', () => void run(() => adminWrite('/news/admin/analytics/test-data', 'DELETE'), 'Visitas de prueba eliminadas.', reload))} />
        </View>
      </AdminCard>
      <AdminRecords key={page} items={visits} keyFor={row => String(row.id)} render={row => <AdminCard title={row.article_title || row.page_path || 'Visita'}>
        <AdminText secondary>{adminDate(row.created_at)} · {row.is_test ? 'Prueba' : 'Real'}{row.device_type ? ` · ${row.device_type}` : ''}</AdminText>
        <AdminText>{row.referrer_host || 'Acceso directo'}</AdminText>
      </AdminCard>} />
      <AdminPager page={page} total={pagination.totalPages} onChange={setPage} />
    </>}</AdminLoad>
  </>;
}
