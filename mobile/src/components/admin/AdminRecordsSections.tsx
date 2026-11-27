import { useState } from 'react';
import { Image, Linking, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, Clock, Cpu, Database, FileCheck, FileWarning, HardDrive, Layers, Radio, RefreshCw, Send, Star, UserCheck, Users, X, Zap } from 'lucide-react-native';
import apiClient, { BACKEND_BASE_URL } from '@/services/apiClient';
import { adminWrite } from '@/services/adminService';
import useAppStore from '@/store/useAppStore';
import { AdminButton, AdminCard, AdminInput, AdminLoad, AdminMetrics, AdminRecords, AdminText, adminDate, adminSearch, confirmAdmin, styles, useAdminAction } from './AdminUI';
import { AdminBadge, AdminIconButton, AdminMeter, AdminSegments, AdminSelect, AdminTiles } from './AdminControls';

const loadReports = () => apiClient('/admin/reports');
const loadRatings = () => apiClient('/admin/ratings');
const loadUploads = () => apiClient('/admin/upload-logs');
const loadServer = () => apiClient('/admin/server-resources');
const loadRetention = () => apiClient('/admin/retention-rescue');

type Report = { id: number; subject: string; description: string; category?: string; username: string; email?: string; created_at: string; deviceInfo?: string | Record<string, unknown>; images?: string[] };
type Rating = { id: number; User?: { username?: string; name?: string }; rating: number; comment?: string; createdAt: string };
type Upload = { id: number; file_name: string; file_type?: string; status: string; createdAt: string; uploader_id?: number; cloudinary_url?: string; error_message?: string };

const reportCategories: Record<string, string> = { bug: 'Error', suggestion: 'Sugerencia', performance: 'Rendimiento', ui: 'Interfaz', other: 'Otro' };
const mediaUri = (path: string) => /^https?:\/\//i.test(path) ? path : BACKEND_BASE_URL + (path.startsWith('/') ? path : '/' + path);
const protectedReportSource = (rawPath: string, token?: string | null) => {
  const filename = String(rawPath || '').split('/').pop()?.split('?')[0] || '';
  return {
    uri: `${BACKEND_BASE_URL}/api/admin/reports/image/${encodeURIComponent(filename)}`,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
};

export function AdminReports() {
  const { busy, run } = useAdminAction();
  const insets = useSafeAreaInsets();
  const token = useAppStore((state: { token?: string | null }) => state.token);
  const [previewSource, setPreviewSource] = useState<{ uri: string; headers?: Record<string, string> } | null>(null);

  return <AdminLoad<Report[]> load={loadReports}>{(reports, reload) => <>
    <AdminCard><View style={styles.toggle}>
      <AdminBadge tone="danger" style={{ alignSelf: 'center' }}>{reports.length} reportes pendientes</AdminBadge>
      <AdminIconButton icon={RefreshCw} label="Actualizar reportes" onPress={reload} />
    </View></AdminCard>
    <AdminRecords items={reports} keyFor={report => String(report.id)} render={report => (
      <AdminCard title={report.subject}>
        <View style={styles.actions}>
          <AdminBadge tone="accent">{reportCategories[report.category ?? ''] ?? report.category ?? 'Reporte'}</AdminBadge>
          <AdminText secondary>{adminDate(report.created_at)}</AdminText>
        </View>
        <AdminText secondary>{report.username}</AdminText>
        {!!report.email && <AdminText secondary>{report.email}</AdminText>}
        <AdminText>{report.description}</AdminText>
        {!!report.deviceInfo && <AdminText secondary>{typeof report.deviceInfo === 'string' ? report.deviceInfo : Object.values(report.deviceInfo).filter(value => typeof value === 'string').join(' · ')}</AdminText>}
        {!!report.images?.length && <View style={styles.actions}>{report.images.map((path, index) => {
          const source = protectedReportSource(path, token);
          return (
            <View key={index} style={{ gap: 6 }}>
              <Pressable onPress={() => setPreviewSource(source)}>
                <Image source={source} accessibilityLabel={`Captura ${index + 1}`} style={{ width: 100, height: 100, borderRadius: 12 }} resizeMode="cover" />
              </Pressable>
              <AdminButton label="Ver captura" onPress={() => setPreviewSource(source)} />
            </View>
          );
        })}</View>}
        <AdminButton label="Resolver" variant="primary" disabled={busy} onPress={() => confirmAdmin('Resolver reporte', 'El reporte se retirará de la lista de pendientes.', () => void run(() => adminWrite(`/admin/reports/${report.id}`, 'DELETE'), 'Reporte resuelto.', reload), 'Resolver')} />
      </AdminCard>
    )} />
    <Modal visible={!!previewSource} transparent animationType="fade" onRequestClose={() => setPreviewSource(null)}>
      <Pressable
        onPress={() => setPreviewSource(null)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      >
        <Pressable
          onPress={() => setPreviewSource(null)}
          style={{ position: 'absolute', top: insets.top + 14, right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        >
          <X color="#fff" size={22} />
        </Pressable>
        {!!previewSource && (
          <Image
            source={previewSource}
            style={{ width: '100%', height: '82%' }}
            resizeMode="contain"
          />
        )}
      </Pressable>
    </Modal>
  </>}</AdminLoad>;
}

export function AdminRatings() {
  const [score, setScore] = useState<number>(0);
  return <AdminLoad<Rating[]> load={loadRatings}>{(ratings, reload) => <>
    <AdminTiles tiles={[
      { label: 'Valoraciones', value: ratings.length, icon: Users },
      { label: 'Puntuación media', value: ratings.length ? (ratings.reduce((sum, row) => sum + Number(row.rating), 0) / ratings.length).toFixed(1) + ' / 5' : '—', icon: Star, color: '#f59e0b' },
    ]} />
    <AdminCard>
      <View style={styles.toggle}><AdminText strong>Opiniones de la app</AdminText><AdminIconButton icon={RefreshCw} label="Actualizar valoraciones" onPress={reload} /></View>
      <AdminSegments options={[[0, 'Todas'], ...[5, 4, 3, 2, 1].map(value => [value, `${value} ★`] as const)]} value={score} onChange={setScore} />
    </AdminCard>
    <AdminRecords key={score} items={ratings.filter(row => !score || Number(row.rating) === score)} keyFor={row => String(row.id)} render={row => (
      <AdminCard title={row.User?.username || row.User?.name || 'Usuario'}>
        <AdminBadge tone="warning">{'★'.repeat(Math.max(0, Math.min(5, Number(row.rating) || 0)))} · {row.rating} / 5</AdminBadge>
        {!!row.comment && <AdminText>{row.comment}</AdminText>}
        <AdminText secondary>{adminDate(row.createdAt)}</AdminText>
      </AdminCard>
    )} />
  </>}</AdminLoad>;
}

export function AdminUploads() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const { run } = useAdminAction();
  return <AdminLoad<Upload[]> load={loadUploads}>{(uploads, reload) => <>
    <AdminTiles tiles={[
      { label: 'Subidas correctas', value: uploads.filter(row => row.status === 'success').length, icon: FileCheck, color: '#22c55e' },
      { label: 'Errores', value: uploads.filter(row => row.status === 'error').length, icon: FileWarning, color: '#ef4444' },
    ]} />
    <AdminCard>
      <View style={styles.toggle}><AdminText strong>Historial de subidas</AdminText><AdminIconButton icon={RefreshCw} label="Actualizar subidas" onPress={reload} /></View>
      <AdminInput search label="Buscar archivo" value={search} onChangeText={setSearch} />
      <AdminSegments options={[[ 'all', 'Todas'], ['success', 'Correctas'], ['error', 'Errores']]} value={status} onChange={setStatus} />
    </AdminCard>
    <AdminRecords key={status + search} items={uploads.filter(row => (status === 'all' || row.status === status) && adminSearch(search, row.file_name, row.file_type, row.uploader_id))} keyFor={row => String(row.id)} render={row => (
      <AdminCard title={row.file_name || 'Archivo'}>
        <View style={styles.actions}><AdminBadge tone={row.status === 'success' ? 'positive' : 'danger'}>{row.status === 'success' ? 'Correcta' : 'Error'}</AdminBadge><AdminText secondary>{row.file_type || 'Sin tipo'} · {adminDate(row.createdAt)}</AdminText></View>
        {row.uploader_id != null && <AdminText secondary>Usuario #{row.uploader_id}</AdminText>}
        {!!row.error_message && <AdminText>{row.error_message}</AdminText>}
        {!!row.cloudinary_url && <AdminButton label="Abrir archivo" onPress={() => void run(() => Linking.openURL(mediaUri(row.cloudinary_url!)))} />}
      </AdminCard>
    )} />
  </>}</AdminLoad>;
}

type ServerData = {
  timestamp: number;
  server: {
    hostname: string; platform: string; release: string; uptimeSeconds: number; loadAvg: number[];
    cpu: { model: string; cores: number; usagePercent: number };
    ram: { totalMB: number; usedMB: number; usagePercent: number };
    swap: { totalMB: number; usedMB: number; usagePercent: number };
    disk: { totalGB: string; usedGB: string; usagePercent: number };
  };
  process: { pid: number; uptimeSeconds: number; nodeVersion: string; heapUsedMB: number; heapTotalMB: number; rssMB: number; gcAvailable: boolean };
  database: { dialect: string; status: string; latencyMs: number; name: string };
};
const duration = (seconds: number) => `${Math.floor(seconds / 86400)} d ${Math.floor(seconds / 3600) % 24} h ${Math.floor(seconds / 60) % 60} min`;

export function AdminServer() {
  const { busy, run } = useAdminAction();
  const [auto, setAuto] = useState(false);
  return <AdminLoad<ServerData> load={loadServer} refreshMs={auto ? 5000 : undefined}>{({ server, process, database, timestamp }, reload) => <>
    <AdminCard title="Recursos del servidor">
      <AdminBadge tone="positive">{server.hostname}</AdminBadge>
      <AdminText secondary>{server.platform} {server.release} · {adminDate(new Date(timestamp).toISOString())}</AdminText>
      <View style={styles.actions}>
        <AdminButton icon={Radio} label={auto ? 'Auto (5 s) activo' : 'Auto (5 s)'} variant={auto ? 'primary' : 'plain'} onPress={() => setAuto(value => !value)} />
        <AdminButton icon={RefreshCw} label="Refrescar" onPress={reload} />
      </View>
    </AdminCard>
    <AdminTiles tiles={[
      { label: 'Tiempo activo del servidor', value: duration(server.uptimeSeconds), icon: Clock },
      { label: 'Tiempo activo de la app', value: duration(process.uptimeSeconds), icon: Zap, detail: `Node.js · PID ${process.pid}`, color: '#f59e0b' },
      { label: 'Latencia MySQL', value: database.latencyMs >= 0 ? `${database.latencyMs} ms` : '—', icon: Database, color: '#22c55e' },
      { label: 'Carga del sistema (1 min)', value: server.loadAvg[0] ?? '—', icon: Activity, color: '#0ea5e9' },
    ]} />
    <ResourceCard icon={Cpu} title="Procesador (CPU)" percent={server.cpu.usagePercent} detail={`${server.cpu.model} · ${server.cpu.cores} núcleos`} />
    <ResourceCard icon={Activity} title="Memoria RAM del servidor" percent={server.ram.usagePercent} detail={`${server.ram.usedMB} / ${server.ram.totalMB} MB`}>
      <AdminText secondary>Swap · {server.swap.usedMB} / {server.swap.totalMB} MB</AdminText>
    </ResourceCard>
    <AdminCard title="Proceso Node.js">
      <AdminMetrics entries={[[ 'Versión', process.nodeVersion], ['PID', process.pid], ['Memoria RSS', `${process.rssMB} MB`], ['Heap', `${process.heapUsedMB} / ${process.heapTotalMB} MB`], ['Tiempo activo', duration(process.uptimeSeconds)]]} />
      <AdminMeter label="Heap de Node.js utilizado" value={process.heapTotalMB ? process.heapUsedMB / process.heapTotalMB * 100 : 0} />
      <AdminButton label="Liberar memoria" disabled={busy || !process.gcAvailable} onPress={() => confirmAdmin('Liberar memoria', 'Se ejecutará el recolector de memoria del servidor.', () => void run(() => adminWrite('/admin/free-memory', 'POST'), 'Memoria procesada.', reload))} />
    </AdminCard>
    <ResourceCard icon={HardDrive} title="Almacenamiento" percent={server.disk.usagePercent} detail={`${server.disk.usedGB} / ${server.disk.totalGB} GB`} />
    <AdminCard title="Base de datos">
      <AdminMetrics entries={[[ 'Base de datos', database.name], ['Motor', database.dialect], ['Estado', database.status], ['Latencia', database.latencyMs == null ? '—' : `${database.latencyMs} ms`]]} />
    </AdminCard>
  </>}</AdminLoad>;
}

function ResourceCard({ icon: Icon, title, percent, detail, children }: { icon: typeof Cpu; title: string; percent: number; detail: string; children?: React.ReactNode }) {
  return <AdminCard>
    <View style={styles.toggle}><View style={styles.actions}><Icon size={18} color="#0ea5e9" /><AdminText strong>{title}</AdminText></View><AdminBadge tone={percent >= 85 ? 'warning' : 'accent'}>{percent}%</AdminBadge></View>
    <AdminMeter label={title} value={percent} color={percent >= 85 ? '#f59e0b' : undefined} />
    <AdminText secondary>{detail}</AdminText>
    {children}
  </AdminCard>;
}

type RetentionUser = { id: number; username?: string; name?: string; email?: string; inactiveHours: number; hoursRemaining?: number; estimatedAutoSendAt?: string; previewTitle?: string; previewMessage?: string; isEarlyCohort?: boolean; alreadyRescuedInCurrentCycle?: boolean };
type RetentionLog = { id: number; user_id: number; username?: string; sent_at: string; overall_status: string; email_status: string; push_status: string; recovered: boolean; title?: string; message?: string };
type RecoveryChannel = { key: string; label: string; category: string; platforms?: string[]; scheduleLabel: string; windowLabel: string; sentCount: number; uniqueUsers: number; recoveredUsers: number; recoveryRate: number; detailText?: string };
type RetentionData = {
  summary: {
    totalInactive72h: number; pendingToRescueCount: number; emailEligibleInactiveCount?: number; pendingEmailSendCount?: number;
    upcomingEmailSendCount?: number; emailAuthorizedTotal?: number; earlyCohortPendingCount: number; upcomingCount: number;
    totalSentCount: number; recoveredCount: number;
    channelsSummary?: { totalChannels: number; totalTouches30d: number; activeChannelsCount: number; totalRecoveredAcrossChannels: number };
  };
  recoveryChannels?: RecoveryChannel[];
  eligibleInactiveUsers: RetentionUser[]; upcomingUsers: RetentionUser[]; historyLogs: RetentionLog[];
};

const channelCategoryOptions = [['all', 'Todos'], ['automated', 'Crons'], ['messaging', 'Bot Asesoría'], ['mobile_local', 'Local Móvil'], ['in_app', 'Día 2 / Sem. 2']] as const;

export function AdminRetention() {
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { busy, run } = useAdminAction();
  return <AdminLoad<RetentionData> load={loadRetention}>{({ summary, recoveryChannels = [], eligibleInactiveUsers, upcomingUsers, historyLogs }, reload) => {
    const send = (payload: { userId?: number; onlyEarlyCohort?: boolean }, message: string) =>
      confirmAdmin('Enviar rescate', message, () => void run(() => adminWrite('/admin/retention-rescue/send', 'POST', payload), 'Envío procesado.', reload), 'Enviar');
    return <>
      <AdminTiles tiles={[
        { label: 'Pendientes de rescate', value: summary.pendingToRescueCount, icon: Clock, detail: `${summary.totalInactive72h} inactivos · ${summary.emailEligibleInactiveCount ?? 0} con email`, color: '#f59e0b' },
        { label: 'Próximos', value: summary.upcomingCount, icon: Activity, detail: `${summary.upcomingEmailSendCount ?? 0} email · ${summary.emailAuthorizedTotal ?? 0} total`, color: '#0ea5e9' },
        { label: 'Envíos 72h', value: summary.totalSentCount, icon: Send, detail: `${summary.recoveredCount} recuperados`, color: '#a855f7' },
        { label: 'Canales (30d)', value: summary.channelsSummary?.totalRecoveredAcrossChannels ?? summary.recoveredCount, icon: Layers, detail: `${summary.channelsSummary?.activeChannelsCount ?? recoveryChannels.length} canales · ${summary.channelsSummary?.totalTouches30d ?? 0} toques`, color: '#22c55e' },
      ]} />
      <AdminCard title="Retención a las 72 horas">
        <View style={styles.actions}>
          <AdminButton label="Enviar lote pendiente" variant="primary" disabled={busy || !summary.pendingToRescueCount} onPress={() => send({}, 'Se procesarán hasta 15 usuarios elegibles.')} />
          <AdminButton label="Rescatar altas recientes" disabled={busy || !summary.earlyCohortPendingCount} onPress={() => send({ onlyEarlyCohort: true }, 'Se procesarán hasta 15 altas recientes elegibles.')} />
          <AdminButton label="Actualizar" onPress={reload} />
        </View>
      </AdminCard>
      <AdminCard>
        <AdminSegments options={[['pending', 'Inactivos'], ['channels', 'Canales'], ['history', 'Historial'], ['upcoming', 'Próximos']]} value={tab} onChange={value => { setTab(value); setFilter('all'); }} />
        <AdminInput search label={tab === 'channels' ? 'Buscar canal' : 'Buscar usuario'} value={search} onChangeText={setSearch} />
        {tab === 'channels' && <AdminSelect label="Tipo de canal" value={filter} onChange={setFilter} options={channelCategoryOptions} />}
        {tab !== 'upcoming' && tab !== 'channels' && <AdminSelect label={tab === 'history' ? 'Estado del envío' : 'Cohorte'} value={filter} onChange={setFilter}
          options={tab === 'history' ? [[ 'all', 'Todos'], ['success', 'Correctos'], ['error', 'Con errores'], ['recovered', 'Recuperados']]
            : [[ 'all', 'Todos'], ['pending', 'Pendientes de envío'], ['early', 'Altas recientes'], ['sent', 'Ya rescatados']]} />}
      </AdminCard>
      {tab === 'channels' ? <AdminRecords key={'channels' + filter + search} items={recoveryChannels.filter(ch => (filter === 'all' || ch.category === filter) && adminSearch(search, ch.label, ch.scheduleLabel, ch.detailText))} keyFor={ch => ch.key} render={ch => (
        <AdminCard title={ch.label}>
          <View style={styles.toggle}>
            <View style={{ flex: 1 }}><AdminText secondary>{ch.scheduleLabel} · {ch.windowLabel}</AdminText></View>
            <AdminBadge tone={ch.recoveryRate >= 35 ? 'positive' : ch.recoveryRate > 0 ? 'accent' : 'neutral'}>{ch.recoveryRate}% vuelta</AdminBadge>
          </View>
          <AdminMeter label="Tasa de recuperación" value={ch.recoveryRate} color={ch.recoveryRate >= 35 ? '#22c55e' : undefined} />
          <AdminMetrics entries={[['Toques', ch.sentCount], ['Usuarios', ch.uniqueUsers], ['Vuelven', ch.recoveredUsers]]} />
          {!!ch.detailText && <AdminText secondary>{ch.detailText}</AdminText>}
        </AdminCard>
      )} /> : tab === 'history' ? <AdminRecords key={'history' + filter + search} items={historyLogs.filter(row => (filter === 'all' || (filter === 'recovered' ? row.recovered : filter === 'error' ? row.overall_status !== 'success' : row.overall_status === filter)) && adminSearch(search, row.username, row.user_id))} keyFor={row => String(row.id)} render={row => (
        <AdminCard title={row.username || `Usuario #${row.user_id}`}>
          <AdminText secondary>{adminDate(row.sent_at)} · {row.overall_status}{row.recovered ? ' · Recuperado' : ''}</AdminText>
          <AdminMetrics entries={[[ 'Correo', row.email_status], ['Push', row.push_status]]} />
          {!!row.message && <AdminText>{row.message}</AdminText>}
        </AdminCard>
      )} /> : <AdminRecords key={tab + filter + search} items={(tab === 'upcoming' ? upcomingUsers : eligibleInactiveUsers).filter(row =>
        (filter === 'all' || (filter === 'early' ? row.isEarlyCohort : filter === 'sent' ? row.alreadyRescuedInCurrentCycle : !row.alreadyRescuedInCurrentCycle)) &&
        adminSearch(search, row.username, row.name, row.email, row.id))} keyFor={row => String(row.id)} render={row => (
        <AdminCard title={row.username || row.name || `Usuario #${row.id}`}>
          <AdminText secondary>{row.inactiveHours} h de inactividad{row.isEarlyCohort ? ' · Alta reciente' : ''}{row.alreadyRescuedInCurrentCycle ? ' · Rescate enviado' : ''}</AdminText>
          {!!row.hoursRemaining && <AdminText secondary>Elegible en {row.hoursRemaining} h</AdminText>}
          {!!row.estimatedAutoSendAt && <AdminText secondary>Envío previsto {adminDate(row.estimatedAutoSendAt)}</AdminText>}
          {!!row.previewTitle && <AdminText strong>{row.previewTitle}</AdminText>}
          {!!row.previewMessage && <AdminText>{row.previewMessage}</AdminText>}
          {tab === 'pending' && !row.alreadyRescuedInCurrentCycle && <AdminButton label="Enviar rescate" disabled={busy} onPress={() => send({ userId: row.id }, `Se procesará el envío para ${row.username || row.name || 'este usuario'}.`)} />}
        </AdminCard>
      )} />}
    </>;
  }}</AdminLoad>;
}
