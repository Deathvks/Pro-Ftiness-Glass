import { useState } from 'react';
import { View } from 'react-native';
import { Activity, Ban, LogIn, RefreshCw, ShieldAlert } from 'lucide-react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useAppColors } from '@/hooks/useAppColors';
import apiClient from '@/services/apiClient';
import { adminWrite } from '@/services/adminService';
import { AdminButton, AdminCard, AdminInput, AdminLoad, AdminPager, AdminRecords, AdminText, adminDate, adminSearch, confirmAdmin, styles, useAdminAction } from './AdminUI';
import { AdminBadge, AdminIconButton, AdminSegments, AdminTiles } from './AdminControls';

type ActivityDay = { date: string; success: number; failure: number };
type SecurityStats = { totalLogs: number; successfulLogins: number; failedLogins: number; blockedIps: number; totalBlockedIps: number; blockedAttempts: number; autoBans: number; chartData: ActivityDay[] };
type SecurityLog = { id: number; eventType: string; ipAddress: string; details?: string; userAgent?: string; createdAt: string; userId?: number };
type BlockedIP = { ipAddress: string; reason?: string; createdAt: string; expiresAt?: string };

const PAGE_SIZE = 20;
const loadBlocked = () => apiClient('/admin/security/blacklist');

export default function AdminSecurity() {
  const [range, setRange] = useState<number>(7);
  const [tab, setTab] = useState<'alerts' | 'success' | 'blocked'>('alerts');
  return <>
    <AdminCard>
      <AdminSegments options={[[1, '24 horas'], [7, '7 días'], [30, '30 días']]} value={range} onChange={setRange} />
    </AdminCard>
    <AdminLoad<SecurityStats> load={() => apiClient(`/admin/security/stats?range=${range}`)} query={String(range)}>{(stats, reload) => <>
      <AdminTiles tiles={[
        { label: 'Eventos', value: stats.totalLogs, icon: Activity },
        { label: 'Accesos correctos', value: stats.successfulLogins, icon: LogIn, color: '#22c55e' },
        { label: 'Accesos fallidos', value: stats.failedLogins, icon: ShieldAlert, color: '#ef4444', detail: `${stats.blockedAttempts} intentos bloqueados` },
        { label: 'IPs bloqueadas', value: stats.blockedIps, icon: Ban, color: '#f59e0b', detail: `${stats.totalBlockedIps} activas · ${stats.autoBans} automáticas` },
      ]} />
      <AdminCard>
        <View style={styles.toggle}>
          <AdminText strong>Actividad de inicio de sesión</AdminText>
          <AdminIconButton icon={RefreshCw} label="Actualizar métricas" onPress={reload} />
        </View>
        <SecurityChart data={stats.chartData} />
      </AdminCard>
    </>}</AdminLoad>
    <AdminSegments options={[[ 'alerts', 'Alertas'], ['success', 'Accesos'], ['blocked', 'Lista negra']]} value={tab} onChange={setTab} />
    {tab === 'blocked' ? <Blacklist /> : <SecurityEvents key={range + tab} range={range} type={tab === 'alerts' ? 'ALERTS' : 'SUCCESS'} />}
  </>;
}

function SecurityChart({ data }: { data: ActivityDay[] }) {
  const colors = useAppColors();
  if (!data.length) return <AdminText secondary>No hay actividad en el periodo.</AdminText>;
  const peak = Math.max(1, ...data.flatMap(row => [row.success, row.failure]));
  const series = (field: 'success' | 'failure') => data.map((row, index) => {
    const x = data.length === 1 ? 160 : 12 + 296 * index / (data.length - 1);
    return `${x},${104 - 92 * row[field] / peak}`;
  }).join(' ');
  const label = (date: string) => date.slice(5).split('-').reverse().join('/');
  return <>
    <Svg width="100%" height={116} viewBox="0 0 320 116" accessibilityLabel="Gráfico de accesos correctos y fallidos por fecha">
      {[12, 58, 104].map(y => <Line key={y} x1={12} x2={308} y1={y} y2={y} stroke={colors.border} />)}
      {([['success', '#22c55e'], ['failure', '#ef4444']] as const).map(([key, color]) => data.length === 1
        ? <Circle key={key} cx={160} cy={104 - 92 * data[0][key] / peak} r={4} fill={color} />
        : <Polyline key={key} points={series(key)} stroke={color} fill="none" strokeWidth={2.5} />)}
    </Svg>
    <View style={styles.toggle}><AdminText secondary>{label(data[0].date)}</AdminText><AdminText secondary>{label(data[data.length - 1].date)}</AdminText></View>
    <View style={styles.actions}><AdminBadge tone="positive">Correctos</AdminBadge><AdminBadge tone="danger">Fallidos</AdminBadge></View>
  </>;
}

function SecurityEvents({ range, type }: { range: number; type: 'ALERTS' | 'SUCCESS' }) {
  const [page, setPage] = useState(1);
  return <>
    <AdminLoad<SecurityLog[]> query={JSON.stringify([range, page, type])} load={() => apiClient(`/admin/security/logs?limit=${PAGE_SIZE + 1}&offset=${(page - 1) * PAGE_SIZE}&range=${range}&type=${type}`)}>{(logs, reload) => <>
      <AdminCard><View style={styles.toggle}>
        <AdminText strong>{type === 'ALERTS' ? 'Alertas de seguridad' : 'Accesos autorizados'}</AdminText>
        <AdminIconButton icon={RefreshCw} label="Actualizar eventos" onPress={reload} />
      </View></AdminCard>
      <AdminRecords items={logs.slice(0, PAGE_SIZE)} keyFor={row => String(row.id)} render={row => (
        <AdminCard title={row.eventType}>
          <AdminBadge tone={type === 'ALERTS' ? 'danger' : 'positive'}>{row.ipAddress}</AdminBadge>
          <AdminText secondary>{adminDate(row.createdAt)}{row.userId ? ` · Usuario #${row.userId}` : ''}</AdminText>
          {!!row.details && <AdminText>{row.details}</AdminText>}
          {!!row.userAgent && <AdminText secondary>{row.userAgent}</AdminText>}
        </AdminCard>
      )} />
      <AdminPager page={page} total={logs.length > PAGE_SIZE ? page + 1 : page} onChange={setPage} />
    </>}</AdminLoad>
  </>;
}

function Blacklist() {
  const [ip, setIP] = useState('');
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const { busy, run } = useAdminAction();
  const address = ip.trim();
  const validAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(address)
    ? address.split('.').every(part => Number(part) <= 255)
    : address.includes(':') && /^[\da-f:.]+$/i.test(address);
  return <AdminLoad<BlockedIP[]> load={loadBlocked}>{(rows, reload) => <>
    <AdminCard title="Bloquear dirección">
      <AdminInput label="Dirección IP" value={ip} onChangeText={setIP} autoCapitalize="none" />
      <AdminInput label="Motivo" value={reason} onChangeText={setReason} />
      <AdminButton label="Bloquear IP" variant="danger" disabled={busy || !validAddress} onPress={() =>
        confirmAdmin('Bloquear IP', `Se bloqueará el acceso desde ${address}.`, () => void run(() =>
          adminWrite('/admin/security/blacklist', 'POST', { ipAddress: address, reason: reason.trim() }),
          'Dirección bloqueada.', () => { setIP(''); setReason(''); reload(); }), 'Bloquear')} />
    </AdminCard>
    <AdminCard title="Direcciones bloqueadas">
      <AdminInput label="Buscar IP o motivo" value={search} onChangeText={setSearch} autoCapitalize="none" />
      <AdminButton label="Actualizar lista" onPress={reload} />
    </AdminCard>
    <AdminRecords key={search} items={rows.filter(row => adminSearch(search, row.ipAddress, row.reason))} keyFor={row => row.ipAddress} render={row => (
      <AdminCard title={row.ipAddress}>
        <AdminText secondary>{adminDate(row.createdAt)} · {row.expiresAt ? `Caduca ${adminDate(row.expiresAt)}` : 'Sin caducidad'}</AdminText>
        {!!row.reason && <AdminText>{row.reason}</AdminText>}
        <View style={styles.actions}><AdminButton label="Desbloquear" disabled={busy} onPress={() =>
          confirmAdmin('Desbloquear IP', `Se retirará el bloqueo de ${row.ipAddress}.`, () => void run(() =>
            adminWrite('/admin/security/blacklist/' + encodeURIComponent(row.ipAddress), 'DELETE'), 'Dirección desbloqueada.', reload))} /></View>
      </AdminCard>
    )} />
  </>}</AdminLoad>;
}
