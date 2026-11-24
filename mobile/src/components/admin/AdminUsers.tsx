import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, Droplets, Mail, Monitor, Pencil, Plus, RefreshCw, Smartphone, Sparkles, Sun, Trash2, Users, X } from 'lucide-react-native';
import { SocialUserAvatar } from '@/components/social/SocialUserAvatar';
import { adminWrite, createUser, deleteUser, getAllUsers, updateUser } from '@/services/adminService';
import useAppStore from '@/store/useAppStore';
import { AdminButton, AdminCard, AdminChoices, AdminEditor, AdminInput, AdminLoad, AdminRecords, AdminText, AdminToggle, adminDate, adminSearch, confirmAdmin, styles, useAdminAction } from './AdminUI';
import { AdminBadge, AdminIconButton, AdminMeter, AdminSegments, AdminSelect, AdminTiles } from './AdminControls';
import { AdminSystemBar } from './AdminSystemBar';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';

type AdminUser = {
  id: number; username: string; name?: string; email: string; role: string; is_verified?: boolean; level?: number;
  lastSeen?: string; createdAt?: string; referralCount?: number; latest_device?: string;
  latest_app_version?: string | null; latest_app_channel?: string | null; latest_app_os?: string | null;
  beta_version?: string | null; is_beta?: boolean;
  goal?: string; height?: number; age?: number; routineCount?: number; workoutCount?: number; nutritionCount?: number;
  profile_image_url?: string;
  hasVoluntaryPush?: boolean; hasVoluntaryEmail?: boolean; pushSubCount?: number;
  google_id?: string; discord_id?: string; x_id?: string; github_id?: string; spotify_id?: string; facebook_id?: string;
};
const roles = [['user', 'Usuario'], ['trainer', 'Entrenador'], ['admin', 'Administrador']] as const;
const roleLabel = (role: string) => roles.find(([value]) => value === role)?.[1] ?? role;
const dateValue = (value?: string) => Date.parse(value ?? '') || 0;
const getName = (user: AdminUser) => user.username || user.name || 'Usuario';
const unlocks = [
  { label: 'Galaxia', count: 3, icon: Sparkles, color: '#a855f7' },
  { label: 'Desierto', count: 5, icon: Sun, color: '#f59e0b' },
  { label: 'Océano', count: 7, icon: Droplets, color: '#0ea5e9' },
] as const;
const providers = [['google_id', 'Google'], ['discord_id', 'Discord'], ['x_id', 'X'], ['github_id', 'GitHub'], ['spotify_id', 'Spotify'], ['facebook_id', 'Facebook']] as const;
const platformNames: Record<string, string> = { app: 'App nativa', pwa: 'PWA', mobile: 'Web móvil', desktop: 'Escritorio', web: 'Web' };
const filterField = { flexBasis: '46%' as const, flexGrow: 1 };

export default function AdminUsers() {
  return <>
    <AdminSystemBar />
    <AdminLoad<AdminUser[]> load={getAllUsers}>{(users, reload) => <UserDirectory users={users} reload={reload} />}</AdminLoad>
  </>;
}

function UserDirectory({ users, reload }: { users: AdminUser[]; reload: () => void }) {
  const currentUser = useAppStore(state => state.userProfile);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [device, setDevice] = useState('all');
  const [versionFilter, setVersionFilter] = useState('all');
  const [sort, setSort] = useState('activity');
  const [period, setPeriod] = useState<number>(30);
  const [now] = useState(Date.now);
  const [level, setLevel] = useState<number>(0);
  const [stage, setStage] = useState('all');
  const [consentFilter, setConsentFilter] = useState('all');
  const [editor, setEditor] = useState<{ user?: AdminUser; photo?: boolean } | null>(null);
  const { busy, run } = useAdminAction();
  const regularUsers = users.filter(user => !['admin', 'trainer', 'entrenador'].includes(user.role));
  const consentStats = {
    total: regularUsers.length,
    voluntaryAny: regularUsers.filter(u => Boolean(u.hasVoluntaryPush) || Boolean(u.hasVoluntaryEmail)).length,
    voluntaryPush: regularUsers.filter(u => Boolean(u.hasVoluntaryPush)).length,
    voluntaryEmail: regularUsers.filter(u => Boolean(u.hasVoluntaryEmail)).length,
    onlyMandatory: regularUsers.filter(u => !u.hasVoluntaryPush && !u.hasVoluntaryEmail).length,
  };
  const funnel = regularUsers.filter(user => !period || dateValue(user.createdAt) >= now - period * 86_400_000);
  const funnelUsers = new Set(funnel.map(user => user.id));
  const stages: Record<string, (user: AdminUser) => boolean> = {
    profile: user => !user.goal || !(user.height || user.age),
    routine: user => !user.routineCount,
    workout: user => !user.workoutCount,
    second: user => user.workoutCount === 1,
    nutrition: user => !user.nutritionCount,
  };
  const steps = [
    { id: 'profile', label: 'Perfil físico', detail: 'Completaron su perfil', color: '#0ea5e9', count: funnel.filter(user => !stages.profile(user)).length },
    { id: 'routine', label: '1ª rutina', detail: 'Crearon una rutina', color: '#a855f7', count: funnel.filter(user => !stages.routine(user)).length },
    { id: 'workout', label: '1er entreno', detail: 'Registraron un entrenamiento', color: '#f59e0b', count: funnel.filter(user => !stages.workout(user)).length },
    { id: 'second', label: '2º entreno', detail: 'Volvieron a entrenar', color: '#10b981', count: funnel.filter(user => (user.workoutCount ?? 0) >= 2).length },
    { id: 'nutrition', label: '1ª comida', detail: 'Usaron el diario nutricional', color: '#ec4899', count: funnel.filter(user => !stages.nutrition(user)).length },
  ];
  const drop = steps.slice(0, 4).map((step, index) => ({
    from: index ? steps[index - 1].label : 'Registro',
    to: step.label,
    count: Math.max(0, (index ? steps[index - 1].count : funnel.length) - step.count),
  })).sort((a, b) => b.count - a.count)[0];
  const versionCounts = new Map<string, number>();
  let betaCount = 0;
  let trackedCount = 0;
  for (const user of users) {
    if (user.is_beta) betaCount += 1;
    const primaryVersion = user.is_beta ? (user.beta_version || user.latest_app_version) : user.latest_app_version;
    if (primaryVersion) {
      trackedCount += 1;
      versionCounts.set(primaryVersion, (versionCounts.get(primaryVersion) ?? 0) + 1);
    }
  }
  const versionBreakdown = Array.from(versionCounts.entries())
    .map(([version, count]) => ({ version, count }))
    .sort((a, b) => b.count - a.count || b.version.localeCompare(a.version));

  const filtered = users.filter(user => {
    const platform = user.latest_device || 'web';
    const deviceGroup = ['app', 'pwa'].includes(platform) ? 'app' : platform === 'mobile' ? 'mobile' : 'web';
    const userLevel = user.level || 1;
    const userRole = user.role === 'entrenador' ? 'trainer' : user.role;
    const hasVersion = Boolean(user.latest_app_version || user.beta_version);
    const matchesVersion =
      versionFilter === 'all' ||
      (versionFilter === 'beta' && Boolean(user.is_beta)) ||
      (versionFilter === 'stable' && hasVersion && !user.is_beta) ||
      (versionFilter === 'unknown' && !hasVersion) ||
      (versionFilter.startsWith('ver:') &&
        (user.latest_app_version === versionFilter.slice(4) || user.beta_version === versionFilter.slice(4)));
    const matchesConsent =
      consentFilter === 'all' ||
      (consentFilter === 'voluntary_any' && (Boolean(user.hasVoluntaryPush) || Boolean(user.hasVoluntaryEmail))) ||
      (consentFilter === 'voluntary_push' && Boolean(user.hasVoluntaryPush)) ||
      (consentFilter === 'voluntary_email' && Boolean(user.hasVoluntaryEmail)) ||
      (consentFilter === 'only_mandatory' && !user.hasVoluntaryPush && !user.hasVoluntaryEmail);
    return (role === 'all' || userRole === role) && (device === 'all' || deviceGroup === device) &&
      matchesVersion &&
      (!level || (userLevel >= level && (level === 41 || userLevel < level + 10))) &&
      (stage === 'all' || (funnelUsers.has(user.id) && stages[stage](user))) &&
      matchesConsent &&
      adminSearch(search, user.username, user.name, user.email);
  }).sort((a, b) => {
    if (sort === 'name') return getName(a).localeCompare(getName(b), 'es');
    if (sort === 'date') return dateValue(b.createdAt) - dateValue(a.createdAt);
    return dateValue(b.lastSeen) - dateValue(a.lastSeen);
  });

  return (
    <>
      <AdminTiles tiles={[
        { label: 'Total usuarios', value: users.length, icon: Users },
        ...unlocks.map(({ label, count, icon, color }) => ({ label, icon, color, value: users.filter(user => user.role === 'admin' || (user.referralCount ?? 0) >= count).length })),
      ]} />
      <AdminCard title="Embudo de activación y abandono">
        <AdminBadge tone="accent">{funnel.length} usuarios evaluados</AdminBadge>
        <AdminSegments options={[[7, '7 días'], [30, '30 días'], [0, 'Todo']]} value={period} onChange={setPeriod} />
        {steps.map((step, index) => {
          const percent = funnel.length ? Math.round(step.count / funnel.length * 100) : 0;
          return <View key={step.id} style={{ gap: 6 }}>
            <View style={styles.toggle}><AdminText strong>{index + 1}. {step.label}</AdminText><AdminText strong>{percent}%</AdminText></View>
            <AdminMeter label={step.label} value={percent} color={step.color} />
            <View style={styles.toggle}>
              <View style={{ flex: 1 }}><AdminText secondary>{step.detail} · {step.count}</AdminText></View>
              <AdminBadge tone={stage === step.id ? 'accent' : 'neutral'}>{funnel.filter(stages[step.id]).length} pendientes</AdminBadge>
            </View>
          </View>;
        })}
        {drop.count > 0 && <AdminBadge tone="warning">Mayor abandono · {drop.from} → {drop.to} · {drop.count}</AdminBadge>}
        <AdminSelect label="Filtrar por etapa" options={[[ 'all', 'Todas las etapas'], ...steps.map(step => [step.id, 'Pendientes · ' + step.label] as const)]} value={stage} onChange={setStage} />
      </AdminCard>
      <AdminCard title="Consentimiento de notificaciones (Push / Email)">
        <AdminText secondary>
          Voluntarias (Push/Email): {consentStats.voluntaryAny} · Solo obligatorias: {consentStats.onlyMandatory}
        </AdminText>
        <AdminText secondary>
          Push activas: {consentStats.voluntaryPush} · Email voluntario: {consentStats.voluntaryEmail} (sobre {consentStats.total} usuarios)
        </AdminText>
        <AdminSelect
          label="Filtrar por avisos"
          options={[
            ['all', 'Todos los avisos'],
            ['voluntary_any', 'Con voluntarias (Push/Email)'],
            ['voluntary_push', 'Push activadas'],
            ['voluntary_email', 'Email voluntario'],
            ['only_mandatory', 'Solo obligatorias'],
          ]}
          value={consentFilter}
          onChange={setConsentFilter}
        />
      </AdminCard>
      <AdminCard title="Versiones y canal Beta">
        <AdminText secondary>
          En Beta: {betaCount} · Con versión detectada: {trackedCount} · Sin versión: {Math.max(0, users.length - trackedCount)}
        </AdminText>
        {versionBreakdown.length > 0 && (
          <View style={userCardStyles.tags}>
            {versionBreakdown.map(item => (
              <AdminBadge key={item.version} tone={/(?:^|[-.])(beta|alpha|rc)(?:[.-]|\d|$)/i.test(item.version) ? 'warning' : 'blue'}>
                v{item.version} · {item.count}
              </AdminBadge>
            ))}
          </View>
        )}
      </AdminCard>
      <AdminCard title="Gestión de usuarios">
        <View style={styles.actions}>
          <AdminButton icon={Plus} label="Crear usuario" variant="primary" onPress={() => setEditor({})} />
          <AdminIconButton icon={RefreshCw} label="Actualizar usuarios" onPress={reload} />
        </View>
        <AdminInput search label="Buscar por nombre o correo" value={search} onChangeText={setSearch} autoCapitalize="none" />
        <View style={styles.actions}>
          <View style={filterField}><AdminSelect label="Rol" options={[[ 'all', 'Todos'], ...roles, ['trainee', 'Asesoría']]} value={role} onChange={setRole} /></View>
          <View style={filterField}><AdminSelect label="Plataforma" options={[[ 'all', 'Todas'], ['app', 'App / PWA'], ['mobile', 'Web móvil'], ['web', 'Escritorio']]} value={device} onChange={setDevice} /></View>
          <View style={filterField}>
            <AdminSelect
              label="Versión"
              options={[
                ['all', 'Todas'],
                ['beta', `En Beta (${betaCount})`],
                ['stable', 'Solo estable'],
                ['unknown', 'Sin versión'],
                ...versionBreakdown.map(item => [`ver:${item.version}`, `v${item.version} (${item.count})`] as const),
              ]}
              value={versionFilter}
              onChange={setVersionFilter}
            />
          </View>
          <View style={filterField}><AdminSelect label="Nivel" options={[[0, 'Todos'], [1, '1–10'], [11, '11–20'], [21, '21–30'], [31, '31–40'], [41, '41+']]} value={level} onChange={setLevel} /></View>
          <View style={filterField}><AdminSelect label="Orden" options={[[ 'activity', 'Última actividad'], ['date', 'Registro'], ['name', 'Nombre']]} value={sort} onChange={setSort} /></View>
        </View>
        <AdminBadge>{filtered.length} resultados</AdminBadge>
      </AdminCard>
      <AdminRecords key={JSON.stringify([search, role, device, versionFilter, level, stage, consentFilter, period, sort])} items={filtered} keyFor={user => String(user.id)} render={user => (
        <UserSummaryCard user={user} online={now - dateValue(user.lastSeen) < 5 * 60_000} profileComplete={!stages.profile(user)}
          onEdit={() => setEditor({ user })} onPhoto={() => setEditor({ user, photo: true })}
          deleteDisabled={busy || String(user.id) === String(currentUser?.id)}
          onDelete={() => confirmAdmin('Eliminar usuario', `Se eliminará la cuenta de ${getName(user)}.`, () => void run(() => deleteUser(user.id), 'Usuario eliminado.', reload), 'Eliminar')} />
      )} />
      <AdminCard title="Acciones globales">
        <AdminText secondary>Restablece las animaciones de nivel vistas de todos los usuarios.</AdminText>
        <AdminButton icon={Sparkles} label="Restablecer animaciones de nivel" variant="danger" disabled={busy}
          onPress={() => confirmAdmin('Restablecer animaciones de nivel', 'Se restablecerán las animaciones de nivel de todos los usuarios.', () => void run(() => adminWrite('/admin/reset-milestones', 'POST'), 'Animaciones restablecidas.'))} />
      </AdminCard>
      {editor && <UserEditor user={editor.user} photoOnly={editor.photo} onClose={() => { setEditor(null); if (editor.photo) reload(); }} onSave={() => { setEditor(null); reload(); }} />}
    </>
  );
}

function UserSummaryCard({ user, online, profileComplete, onEdit, onPhoto, onDelete, deleteDisabled }: {
  user: AdminUser; online: boolean; profileComplete: boolean;
  onEdit: () => void; onPhoto: () => void; onDelete: () => void; deleteDisabled: boolean;
}) {
  const colors = useAppColors();
  const trainer = ['trainer', 'entrenador'].includes(user.role);
  const provider = providers.find(([field]) => user[field])?.[1];
  const device = user.latest_device ?? 'web';
  const DeviceIcon = ['app', 'pwa', 'mobile'].includes(device) ? Smartphone : Monitor;
  const verificationColor = user.is_verified ? '#166534' : '#b91c1c';
  const Verification = user.is_verified ? Check : X;
  const divider = { borderTopColor: colors.border };
  const miniBackground = { backgroundColor: colors.card, borderColor: colors.border };
  return (
    <AdminCard style={userCardStyles.card}>
      <View style={userCardStyles.header}>
        <Pressable accessibilityRole={trainer ? 'button' : undefined} accessibilityLabel={trainer ? 'Cambiar foto del entrenador' : undefined}
          disabled={!trainer} onPress={trainer ? onPhoto : undefined} style={userCardStyles.avatar}>
          <SocialUserAvatar user={user} size={42} />
          {trainer && <View pointerEvents="none" style={userCardStyles.cameraMark}><Camera size={9} color="#fff" /></View>}
          <View style={userCardStyles.avatarMarks}>
            <View accessible accessibilityLabel={'Inicio de sesión con ' + (provider ?? 'correo')} style={[userCardStyles.miniMark, miniBackground]}>
              {provider ? <Text style={[userCardStyles.provider, { color: colors.text }]}>{provider[0]}</Text> : <Mail size={9} color={colors.textSecondary} />}
            </View>
            <View accessible accessibilityLabel={platformNames[device] ?? device} style={[userCardStyles.miniMark, miniBackground]}>
              <DeviceIcon size={9} color={colors.textSecondary} />
            </View>
          </View>
        </Pressable>
        <View style={userCardStyles.identity}>
          <Text numberOfLines={1} style={[userCardStyles.name, { color: colors.text }]}>{getName(user)}</Text>
          <Text numberOfLines={1} style={[userCardStyles.smallText, { color: colors.textSecondary }]}>{user.email}</Text>
        </View>
        <View style={userCardStyles.actions}>
          <AdminIconButton icon={Pencil} label="Editar usuario" onPress={onEdit} />
          <AdminIconButton icon={Trash2} label="Eliminar usuario" danger disabled={deleteDisabled} onPress={onDelete} />
        </View>
      </View>

      <View style={[userCardStyles.band, divider]}>
        <View style={userCardStyles.tags}>
          <AdminBadge tone={user.role === 'admin' ? 'accent' : trainer ? 'warning' : 'neutral'}>{roleLabel(user.role)}</AdminBadge>
          <AdminBadge>Nivel {user.level ?? 1}</AdminBadge>
          {(user.beta_version || user.latest_app_version) && (
            <AdminBadge tone={user.is_beta ? 'warning' : 'blue'}>
              {user.is_beta ? `Beta · v${user.beta_version || user.latest_app_version}` : `v${user.latest_app_version}`}
            </AdminBadge>
          )}
        </View>
        <View accessible accessibilityLabel={user.is_verified ? 'Cuenta verificada' : 'Cuenta sin verificar'}
          style={[userCardStyles.verification, { backgroundColor: user.is_verified ? '#dcfce7' : '#fee2e2' }]}>
          <Verification color={verificationColor} size={12} strokeWidth={2.8} />
        </View>
      </View>

      <View style={[userCardStyles.band, divider]}>
        <View style={userCardStyles.dates}>
          <Text numberOfLines={1} style={[userCardStyles.smallText, { color: colors.textSecondary }]}>Registro · {adminDate(user.createdAt)}</Text>
          <View style={userCardStyles.activity}>
            <View style={[userCardStyles.statusDot, { backgroundColor: online ? colors.success : colors.textMuted }]} />
            <Text numberOfLines={1} style={[userCardStyles.smallText, { color: colors.textSecondary }]}>
              {online ? 'En línea' : user.lastSeen ? adminDate(user.lastSeen) : 'Sin actividad'}
            </Text>
          </View>
        </View>
        <View style={userCardStyles.referrals}>
          <View accessible accessibilityLabel={`${user.referralCount ?? 0} referidos`} style={[userCardStyles.referralCount, { backgroundColor: colors.border }]}>
            <Text style={[userCardStyles.provider, { color: colors.text }]}>{user.referralCount ?? 0}</Text>
          </View>
          {unlocks.filter(item => user.role === 'admin' || (user.referralCount ?? 0) >= item.count).map(({ label, icon: Icon, color }) => (
            <View accessible accessibilityLabel={label} key={label} style={[userCardStyles.unlock, { backgroundColor: color, borderColor: colors.card }]}>
              <Icon color={getContrastTextColor(color)} size={10} />
            </View>
          ))}
        </View>
      </View>

      <View style={[userCardStyles.progress, divider]}>
        <AdminBadge tone={profileComplete ? 'positive' : 'neutral'}>Perfil {profileComplete ? '✓' : '—'}</AdminBadge>
        <AdminBadge tone={user.routineCount ? 'blue' : 'neutral'}>Rutinas {user.routineCount ?? 0}</AdminBadge>
        <AdminBadge tone={user.workoutCount ? 'violet' : 'neutral'}>Entrenos {user.workoutCount ?? 0}</AdminBadge>
        <AdminBadge tone={user.nutritionCount ? 'warning' : 'neutral'}>Comidas {user.nutritionCount ?? 0}</AdminBadge>
      </View>
    </AdminCard>
  );
}

const userCardStyles = StyleSheet.create({
  card: { padding: 12, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  identity: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  smallText: { fontSize: 11, flexShrink: 1 },
  avatar: { paddingBottom: 5, paddingRight: 3 },
  avatarMarks: { position: 'absolute', right: 0, bottom: 0, flexDirection: 'row', gap: 1 },
  cameraMark: { position: 'absolute', left: 0, top: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#c2410c', alignItems: 'center', justifyContent: 'center' },
  miniMark: { borderRadius: 9, borderWidth: 1, width: 15, height: 15, alignItems: 'center', justifyContent: 'center' },
  provider: { fontSize: 11, fontWeight: '800', includeFontPadding: false },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  band: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flexShrink: 1 },
  verification: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dates: { flex: 1, minWidth: 0, gap: 3 },
  activity: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  referrals: { flexDirection: 'row', alignItems: 'center', paddingRight: 3 },
  referralCount: { minWidth: 23, height: 23, paddingHorizontal: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 3 },
  unlock: { marginRight: -3, width: 18, height: 18, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  progress: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});

function UserEditor({ user, photoOnly, onClose, onSave }: { user?: AdminUser; photoOnly?: boolean; onClose: () => void; onSave: () => void }) {
  const [username, setUsername] = useState(user ? getName(user) : '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'user');
  const [level, setLevel] = useState(String(user?.level ?? 1));
  const [verified, setVerified] = useState(Boolean(user?.is_verified));
  const [photo, setPhoto] = useState(user?.profile_image_url);
  const { busy, run } = useAdminAction();
  const self = useAppStore(state => String(state.userProfile?.id) === String(user?.id));
  const valid = username.trim() && email.includes('@') && (user && !password || password.length >= 6) &&
    (!user || (/^\d+$/.test(level) && Number(level) >= 1));
  const photoRoute = `/admin/users/${user?.id}/profile-image`;

  function save() {
    const payload = {
      username: username.trim(), email: email.trim(), is_verified: verified,
      ...(!user || user.role !== role ? { role } : {}),
      ...(password ? { password } : {}),
      ...(user && Number(level) !== (user.level ?? 1) ? { level: Number(level) } : {}),
    };
    void run(() => user ? updateUser(user.id, payload) : createUser(payload), 'Usuario guardado.', result => {
      if (self) {
        const state = useAppStore.getState();
        if (state.userProfile?.id === user?.id) state.setUserProfile({ ...state.userProfile, ...result });
      }
      onSave();
    });
  }

  function changePhoto() {
    void run(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      if (result.canceled) return;
      const asset = result.assets[0];
      const form = new FormData();
      if (asset.file) form.append('profileImage', asset.file);
      else form.append('profileImage', { uri: asset.uri, name: asset.fileName || 'profile.jpg', type: asset.mimeType || 'image/jpeg' } as unknown as Blob);
      const saved = await adminWrite(photoRoute, 'POST', form);
      setPhoto(saved.profile_image_url);
    });
  }

  return (
    <AdminEditor title={photoOnly ? 'Foto del entrenador' : user ? 'Editar usuario' : 'Crear usuario'} onClose={onClose} busy={busy}>
      {!photoOnly && <>
      <AdminInput label="Nombre de usuario" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <AdminInput label="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <AdminInput label={user ? 'Nueva contraseña (opcional)' : 'Contraseña (mínimo 6 caracteres)'} value={password} onChangeText={setPassword} secureTextEntry />
      <AdminText strong>Rol</AdminText>
      {self ? <AdminText>{roleLabel(role)}</AdminText> : <AdminChoices options={roles} value={role} onChange={setRole} />}
      {user && <AdminInput label="Nivel" value={level} onChangeText={setLevel} keyboardType="number-pad" />}
      <AdminToggle label="Cuenta verificada" value={verified} onChange={setVerified} />
      </>}
      {user && ['trainer', 'entrenador'].includes(user.role) && <>
        {!!photo && <SocialUserAvatar user={{ ...user, profile_image_url: photo }} size={64} />}
        <View style={styles.actions}>
          <AdminButton label="Cambiar foto" disabled={busy} onPress={changePhoto} />
          {!!photo && <AdminButton label="Quitar foto" disabled={busy} onPress={() => confirmAdmin('Quitar foto', 'Se eliminará la foto del entrenador.', () => void run(() => adminWrite(photoRoute, 'DELETE'), 'Foto eliminada.', () => setPhoto(undefined)))} />}
        </View>
      </>}
      {photoOnly ? <AdminButton label="Cerrar" disabled={busy} onPress={onClose} /> : <View style={styles.actions}>
        <AdminButton label="Cancelar" disabled={busy} onPress={onClose} />
        <AdminButton label={busy ? 'Guardando…' : 'Guardar'} variant="primary" disabled={!valid || busy} onPress={save} />
      </View>}
    </AdminEditor>
  );
}
