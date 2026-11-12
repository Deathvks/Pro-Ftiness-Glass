import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CircleCheck, CircleX, Clock, Mail, RefreshCw, Send } from 'lucide-react-native';
import apiClient from '@/services/apiClient';
import { adminWrite, getAllUsers, getCronJobs, getPushLogs, sendCustomPush, testCronJob } from '@/services/adminService';
import { PUSH_OPTIONS } from '@/config/settingsSections';
import { AdminButton, AdminCard, AdminChoices, AdminInput, AdminLoad, AdminMetrics, AdminPager, AdminRecords, AdminText, adminDate, adminSearch, confirmAdmin, styles, useAdminAction } from './AdminUI';
import { AdminBadge, AdminIconButton, AdminSegments, AdminSelect, AdminTiles } from './AdminControls';

const ranges = [[1, '24 horas'], [3, '3 días'], [7, '7 días'], [14, '14 días'], [30, '30 días']] as const;
type DeliveryLog = { id: number; status: string; title?: string; body?: string; subject?: string; type?: string; sent_at?: string; created_at?: string; recipient_email?: string; user_id?: number; User?: { username?: string }; error_message?: string };
type LogPage = { logs: DeliveryLog[]; totalPages: number };
type EmailStats = { total: number; success: number; failed: number; successRate: number };
type CronJob = { id: number; name: string; description: string; schedule: string; frequency: string; status: string };
type Recipient = { id: number; username: string; email: string };

function DeliveryHistory({ email = false }: { email?: boolean }) {
  const [page, setPage] = useState(1);
  const [range, setRange] = useState<number>(30);
  const [status, setStatus] = useState('all');
  const [title, setTitle] = useState('');
  const [submittedTitle, setSubmittedTitle] = useState('');

  async function load(): Promise<{ logs: LogPage; stats?: EmailStats }> {
    if (!email) return { logs: await getPushLogs(page, status, submittedTitle, range) };
    const [logs, stats] = await Promise.all([
      apiClient(`/admin/email-logs?page=${page}&limit=20&status=${status}&range=${range}`),
      apiClient(`/admin/email-stats?range=${range}`),
    ]);
    return { logs, stats };
  }

  return <>
    <AdminCard title={email ? 'Historial de correos' : 'Historial de push'}>
      <AdminSelect label="Estado" options={[
        ['all', 'Todos los estados'],
        email ? ['sent', 'Enviados'] : ['success', 'Correctos'],
        email ? ['failed', 'Fallidos'] : ['error', 'Fallidos'],
      ]} value={status} onChange={value => { setStatus(value); setPage(1); }} />
      <AdminSegments options={ranges} value={range} onChange={value => { setRange(value); setPage(1); }} />
      {!email && <>
        <AdminInput search label="Buscar por título exacto" value={title} onChangeText={setTitle} onSubmitEditing={() => { setSubmittedTitle(title.trim()); setPage(1); }} />
        <AdminButton label="Buscar" onPress={() => { setSubmittedTitle(title.trim()); setPage(1); }} />
      </>}
    </AdminCard>
    <AdminLoad load={load} query={JSON.stringify([page, range, status, submittedTitle])}>{({ logs, stats }, reload) => <>
      {!!stats && <AdminTiles tiles={[
        { label: 'Total de correos', value: stats.total, icon: Mail },
        { label: 'Enviados', value: stats.success, icon: CircleCheck, color: '#22c55e', detail: `${stats.successRate}% de éxito` },
        { label: 'Fallidos', value: stats.failed, icon: CircleX, color: '#ef4444' },
      ]} />}
      <View style={styles.toggle}><AdminText strong>Entregas</AdminText><AdminIconButton icon={RefreshCw} label="Actualizar historial" onPress={reload} /></View>
      <AdminRecords key={page} items={logs.logs} pageSize={20} keyFor={log => String(log.id)} render={log => (
        <AdminCard title={log.subject || log.title || 'Entrega'}>
          <View style={styles.actions}>
            <AdminBadge tone={['success', 'sent'].includes(log.status) ? 'positive' : 'danger'}>{['success', 'sent'].includes(log.status) ? 'Enviado' : 'Fallido'}</AdminBadge>
            <AdminText secondary>{adminDate(log.sent_at || log.created_at)}</AdminText>
          </View>
          <AdminText secondary>{log.recipient_email || log.User?.username || (log.user_id != null ? `Usuario #${log.user_id}` : '—')}{log.type ? ` · ${log.type}` : ''}</AdminText>
          {!!log.body && <AdminText>{log.body}</AdminText>}
          {!!log.error_message && <AdminText>{log.error_message}</AdminText>}
        </AdminCard>
      )} />
      <AdminPager page={page} total={logs.totalPages} onChange={setPage} />
    </>}</AdminLoad>
  </>;
}

export function AdminEmails() {
  return <DeliveryHistory email />;
}

export function AdminNotifications() {
  const [tab, setTab] = useState('history');
  return <>
    <AdminSegments options={[[ 'history', 'Historial'], ['send', 'Enviar nueva'], ['cron', 'Programadas']]} value={tab} onChange={setTab} />
    {tab === 'history' && <DeliveryHistory />}
    {tab === 'send' && <AdminLoad<Recipient[]> load={getAllUsers}>{users => <PushForm users={users} />}</AdminLoad>}
    {tab === 'cron' && <ScheduledNotifications />}
  </>;
}

function PushForm({ users }: { users: Recipient[] }) {
  const [audience, setAudience] = useState('user');
  const [query, setQuery] = useState('');
  const [recipient, setRecipient] = useState<Recipient>();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const { busy, run } = useAdminAction();

  function send() {
    const target = audience === 'all' ? 'ALL' : recipient?.id;
    if (target == null || !title.trim() || !message.trim()) return;
    confirmAdmin('Publicar aviso', target === 'ALL' ? 'Se publicará para todos los usuarios.' : `Se publicará para ${recipient?.username}.`,
      () => void run(() => sendCustomPush({ title: title.trim(), message: message.trim(), url: url.trim() || undefined, target_user_id: target }),
        result => result.message, () => { setTitle(''); setMessage(''); setUrl(''); }), 'Publicar');
  }

  return <AdminCard title="Enviar aviso">
    <AdminChoices options={[[ 'user', 'Un usuario'], ['all', 'Todos los usuarios']]} value={audience} onChange={setAudience} />
    {audience === 'user' && <>
      <AdminInput search label="Buscar destinatario" value={query} onChangeText={value => { setQuery(value); setRecipient(undefined); }} autoCapitalize="none" />
      {recipient ? <AdminText strong>{recipient.username} · {recipient.email}</AdminText> :
        query.trim() ? users.filter(user => adminSearch(query, user.username, user.email, user.id)).slice(0, 8).map(user => (
          <AdminButton key={user.id} label={`${user.username} · ${user.email}`} onPress={() => { setRecipient(user); setQuery(user.username); }} />
        )) : null}
    </>}
    <AdminInput label="Título" value={title} onChangeText={setTitle} />
    <AdminInput label="Mensaje" value={message} onChangeText={setMessage} multiline />
    <AdminInput label="Enlace (opcional)" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
    <AdminButton icon={Send} label={busy ? 'Publicando…' : 'Publicar aviso'} variant="primary" disabled={busy || !title.trim() || !message.trim() || (audience === 'user' && !recipient)} onPress={send} />
  </AdminCard>;
}

function ScheduledNotifications() {
  const { busy, run } = useAdminAction();
  return <AdminLoad<CronJob[]> load={getCronJobs}>{(jobs, reload) => <>
    <AdminCard><AdminButton label="Actualizar tareas" onPress={reload} /></AdminCard>
    <AdminRecords items={jobs} keyFor={job => String(job.id)} render={job => (
      <AdminCard title={job.name}>
        <View style={styles.actions}><AdminBadge tone="accent">{job.schedule}</AdminBadge><AdminBadge>{job.frequency}</AdminBadge></View>
        <AdminText>{job.description}</AdminText>
        <AdminButton icon={Clock} label="Probar tarea" disabled={busy} onPress={() => confirmAdmin('Probar tarea', `Se ejecutará la prueba de «${job.name}».`, () => void run(() => testCronJob(job.id), 'Prueba ejecutada.', reload))} />
      </AdminCard>
    )} />
  </>}</AdminLoad>;
}

const environmentChecks = [['mx', 'MX'], ['spf', 'SPF'], ['dkim', 'DKIM'], ['dmarc', 'DMARC'], ['smtp', 'SMTP'], ['frontendUrl', 'URL de la app'], ['webPush', 'VAPID'], ['androidPush', 'Firebase Admin']] as const;
const reviewChecks = [
  ['inboxes', 'Recepción y autenticación del correo'], ['registration', 'Registro y verificación'], ['recovery', 'Recuperación de contraseña'],
  ['twoFactor', 'Código de inicio de sesión en dos pasos'], ['emailOptOut', 'Baja y bloqueo por correo'], ['browser', 'Push web en navegador'],
  ['android', 'Push y recordatorios en Android'], ['donDominio', 'Acuerdo de tratamiento de DonDominio'], ['firebase', 'Condiciones del servicio push'],
  ['activityBasis', 'Base legal de los avisos de actividad'], ['emailRetention', 'Conservación de registros de correo'],
] as const;
const emailCategories = [['training', 'Entrenamiento'], ['activity', 'Actividad'], ['coaching', 'Asesoría']] as const;

type EmailConsent = { email: string; verified: boolean; training: boolean; activity: boolean; coaching: boolean };
type PushTest = { inAppSaved?: boolean; pushStatus?: string };
type PushDevice = { id: number; type: 'android' | 'web'; updatedAt: string };
type Review = Record<string, { reviewedAt: string } | null>;
const loadConsent = () => apiClient('/admin/email-unsubscribe-test');
const loadReview = () => apiClient('/admin/notification-tests/review');
const loadDevices = () => apiClient('/admin/notification-tests/devices');

export function AdminNotificationTests() {
  const router = useRouter();
  const [environment, setEnvironment] = useState<Record<string, boolean | null>>();
  const [mailboxes, setMailboxes] = useState<{ email: string; accepted: boolean }[]>();
  const [subscriptionId, setSubscriptionId] = useState(0);
  const [purpose, setPurpose] = useState('service');
  const [result, setResult] = useState<PushTest>();
  const { busy, run } = useAdminAction();

  return <>
    <AdminCard title="Configuración de correo y push">
      <AdminButton label="Comprobar configuración" disabled={busy} onPress={() => void run(() => apiClient('/admin/notification-tests/status'), undefined, setEnvironment)} />
      {!!environment && <AdminMetrics entries={environmentChecks.map(([key, label]) =>
        [label, environment[key] == null ? 'Indeterminado' : environment[key] ? 'Correcto' : 'Revisar'] as const)} />}
      <AdminButton label="Probar buzones del dominio" disabled={busy} onPress={() => confirmAdmin('Probar buzones', 'Se enviará un correo de prueba a los buzones configurados.', () => void run(() => adminWrite('/admin/email-mailbox-test', 'POST', {}), undefined, response => setMailboxes(response.results)))} />
      {mailboxes?.map(entry => <AdminText key={entry.email}>{entry.email} · {entry.accepted ? 'Aceptado por SMTP' : 'Revisar'}</AdminText>)}
    </AdminCard>
    <AdminLoad<EmailConsent> load={loadConsent}>{(consent, reload) => (
      <AdminCard title="Prueba de baja de correos">
        <AdminText secondary>{consent.email} · {consent.verified ? 'Verificado' : 'Sin verificar'}</AdminText>
        {emailCategories.map(([category, label]) => (
          <View key={category} style={styles.toggle}>
            <AdminText>{label}</AdminText>
            <AdminButton label={consent[category] ? 'Enviar prueba' : 'Verificar bloqueo'} disabled={busy || !consent.verified}
              onPress={() => void run(() => adminWrite('/admin/email-unsubscribe-test', 'POST', { category, checkOnly: !consent[category] }),
                response => response.skipped ? 'El envío está bloqueado para esta categoría.' : response.checkedOnly ? 'La categoría permite el envío.' : 'Correo de prueba enviado. Abre el enlace de baja y actualiza el estado.', reload)} />
          </View>
        ))}
        <AdminButton label="Actualizar estado" onPress={reload} />
        <AdminButton label="Abrir ajustes" onPress={() => router.push('/settings')} />
      </AdminCard>
    )}</AdminLoad>
    <AdminLoad<PushDevice[]> load={loadDevices}>{(devices, reload) => (
      <AdminCard title="Probar entrega a un dispositivo">
        {!devices.length && <AdminText secondary>Tu cuenta no tiene dispositivos registrados para push.</AdminText>}
        <AdminSelect label="Dispositivo" options={devices.map(device =>
          [device.id, `${device.type === 'android' ? 'Android' : 'Navegador'} #${device.id} · ${adminDate(device.updatedAt)}`] as const)}
          value={subscriptionId} onChange={value => { setSubscriptionId(value); setResult(undefined); }} />
        <AdminSelect label="Categoría" options={[[ 'service', 'Servicio'], ...PUSH_OPTIONS.map(option => [option.purpose, option.title] as const)]} value={purpose} onChange={setPurpose} />
        <AdminButton label="Enviar push de prueba" variant="primary" disabled={busy || !devices.some(device => device.id === subscriptionId)} onPress={() => void run(() =>
          adminWrite('/admin/notification-tests/push', 'POST', { subscriptionId, purpose }), undefined, setResult)} />
        {!!result && <AdminMetrics entries={[[ 'Aviso en la app', result.inAppSaved ? 'Guardado' : 'No guardado'], ['Estado del push', result.pushStatus]]} />}
        <AdminButton label="Actualizar dispositivos" onPress={reload} />
      </AdminCard>
    )}</AdminLoad>
    <AdminLoad<Review> load={loadReview}>{(review, reload) => (
      <AdminCard title="Comprobaciones manuales">
        {reviewChecks.map(([check, label]) => (
          <View key={check} style={styles.toggle}>
            <View style={{ flex: 1 }}><AdminText>{label}</AdminText>
              {!!review[check] && <AdminText secondary>{adminDate(review[check]?.reviewedAt)}</AdminText>}
            </View>
            <AdminButton label={review[check] ? 'Desmarcar' : 'Marcar'} disabled={busy} onPress={() => void run(() =>
              adminWrite('/admin/notification-tests/review', 'PUT', { check, reviewed: !review[check] }), 'Revisión guardada.', reload)} />
          </View>
        ))}
      </AdminCard>
    )}</AdminLoad>
  </>;
}
