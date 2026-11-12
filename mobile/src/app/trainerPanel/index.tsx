import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Link, Pencil, RefreshCw, Trash2, Unlink, UserPlus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { AdminBadge, AdminIconButton, AdminSegments, AdminSelect } from '@/components/admin/AdminControls';
import { AdminButton, AdminCard, AdminInput, AdminLoad, AdminRecords, AdminScreen, AdminText, adminSearch, confirmAdmin, styles, useAdminAction } from '@/components/admin/AdminUI';
import AdminExercises from '@/components/admin/AdminExercises';
import { SocialUserAvatar } from '@/components/social/SocialUserAvatar';
import { TrainerChats } from '@/components/trainer/TrainerChats';
import { TrainerRoutines } from '@/components/trainer/TrainerRoutines';
import { useAppColors } from '@/hooks/useAppColors';
import { TRAINING_DAYS, changeTrainerClient, trainerClients, type TrainerClient } from '@/services/trainerService';
import useAppStore from '@/store/useAppStore';

type TrainerTab = 'active' | 'chats' | 'past' | 'exercises' | 'routines';
const DATES = [['all', 'Cualquier fecha'], ['today', 'Hoy'], ['week', 'Última semana'], ['month', 'Último mes']] as const;

export default function TrainerPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<TrainerTab>('active');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState<(typeof DATES)[number][0]>('all');
  const [focus, setFocus] = useState(0);
  const unread = Number(useAppStore(state => state.unreadChats) || 0);
  const clientTab = tab === 'active' || tab === 'past';

  useFocusEffect(useCallback(() => { setFocus(value => value + 1); }, []));

  return <AdminScreen title="Panel de Entrenador" fallback="/(tabs)/hub">
    <AdminButton icon={UserPlus} label="Añadir nuevo cliente" variant="primary" onPress={() => router.push('/trainerPanel/alta')} />
    <AdminSegments<TrainerTab> value={tab} onChange={setTab} options={[
      ['active', 'Activos'], ['chats', unread ? 'Asesorías (' + unread + ')' : 'Asesorías'],
      ['past', 'Antiguos clientes'], ['exercises', 'Librería de ejercicios'], ['routines', 'Mis rutinas'],
    ]} />
    {(clientTab || tab === 'chats') && <View style={styles.stack}>
      <AdminInput search label="Buscar por nombre o usuario" value={search} onChangeText={setSearch} />
      <AdminSelect label="Fecha de alta" options={DATES} value={date} onChange={setDate} />
    </View>}
    {tab === 'exercises' && <AdminExercises trainerMode />}
    {tab === 'chats' && <TrainerChats focus={focus} search={search} matchesDate={value => matchesDate(value, date)} />}
    {tab === 'routines' && <TrainerRoutines focus={focus} />}
    {clientTab && <AdminLoad query={String(focus)} load={trainerClients}>{(clients, reload) => {
      const filtered = clients.filter(client => client.isActive === (tab === 'active') &&
        adminSearch(search, client.name, client.username) && matchesDate(client.createdAt, date));
      return <>
        <View style={styles.toggle}>
          <View style={styles.actions}>
            <AdminText strong>{tab === 'active' ? 'Mis clientes' : 'Antiguos clientes'}</AdminText>
            <AdminBadge tone="accent">{filtered.length}</AdminBadge>
          </View>
          <AdminIconButton icon={RefreshCw} label="Actualizar clientes" onPress={reload} />
        </View>
        <AdminRecords key={JSON.stringify([tab, search, date])} items={filtered} keyFor={client => String(client.id)}
          emptyLabel="No se encontraron clientes con esos filtros." render={client => <ClientCard client={client} reload={reload} />} />
      </>;
    }}</AdminLoad>}
  </AdminScreen>;
}

function matchesDate(value: string | undefined, filter: (typeof DATES)[number][0]) {
  if (filter === 'all' || !value) return true;
  const today = new Date();
  const date = new Date(value);
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const difference = (day(today) - day(date)) / 86400000;
  return difference >= 0 && difference <= { today: 0, week: 7, month: 30 }[filter];
}

function ClientCard({ client, reload }: { client: TrainerClient; reload: () => void }) {
  const router = useRouter();
  const colors = useAppColors();
  const { busy, run } = useAdminAction();
  const path = '/trainerPanel/cliente/[id]' as const;
  const id = String(client.id);
  const days = Array.isArray(client.anamnesisData?.trainingDays) ? client.anamnesisData.trainingDays.map(String) : [];
  const today = String(new Date().getDay());
  const status = client.trainedToday ? 'Entrenó hoy' : days.includes(today) ? 'Entrenamiento pendiente' : 'Sin entrenar hoy';
  const actions = {
    unlink: { title: 'Dar de baja', message: 'pasará a Antiguos clientes', success: 'Cliente dado de baja.' },
    link: { title: 'Revincular', message: 'volverá a tus clientes activos', success: 'Cliente revinculado.' },
    delete: { title: 'Eliminar', message: 'se eliminará junto con sus datos', success: 'Cliente eliminado.' },
  };
  function change(action: keyof typeof actions) {
    const { title, message, success } = actions[action];
    confirmAdmin(title + ' cliente', client.name + ' ' + message + '.', () =>
      void run(() => changeTrainerClient(client.id, action), success, reload), title);
  }

  return <AdminCard>
    <Pressable accessibilityRole={client.isActive ? 'button' : undefined} disabled={!client.isActive}
      onPress={() => router.push({ pathname: path, params: { id } })} style={panelStyles.identity}>
      <SocialUserAvatar user={client} size={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AdminText strong numberOfLines={1}>{client.name}</AdminText>
        <AdminText secondary numberOfLines={1}>@{client.username}</AdminText>
      </View>
      {client.isActive && <ChevronRight size={17} color={colors.textSecondary} />}
    </Pressable>
    <View style={styles.actions}>
      {client.isActive && <AdminBadge tone={client.trainedToday ? 'positive' : 'neutral'}>{status}</AdminBadge>}
      <AdminBadge tone={client.isAnamnesisComplete ? 'positive' : 'warning'}>{client.isAnamnesisComplete ? 'Cuestionario completo' : 'Cuestionario pendiente'}</AdminBadge>
    </View>
    {client.isActive && <View style={styles.actions}>{TRAINING_DAYS.map(([day, label]) => (
      <View key={day} accessible accessibilityLabel={label + (days.includes(day) ? ', programado' : '')}>
        <AdminBadge tone={day === today && client.trainedToday ? 'positive' : days.includes(day) ? 'accent' : 'neutral'}>
          {label === 'Miércoles' ? 'X' : label[0]}
        </AdminBadge>
      </View>
    ))}</View>}
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}><AdminText secondary>{client.createdAt ? 'Alta · ' + new Date(client.createdAt).toLocaleDateString('es-ES') : 'Alta sin fecha'}</AdminText></View>
      {client.isActive ? <View style={styles.actions}>
        <AdminIconButton icon={Pencil} label="Editar cuestionario" disabled={busy} onPress={() => router.push({ pathname: path, params: { id, mode: 'edit' } })} />
        <AdminIconButton icon={Unlink} label="Dar de baja" disabled={busy} onPress={() => change('unlink')} />
        {!client.isLinked && <AdminIconButton icon={Trash2} label="Eliminar cliente" danger disabled={busy} onPress={() => change('delete')} />}
      </View> : <AdminButton icon={Link} label="Revincular" disabled={busy} onPress={() => change('link')} />}
    </View>
  </AdminCard>;
}

const panelStyles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
});
