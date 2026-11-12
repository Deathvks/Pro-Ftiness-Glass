import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Dumbbell, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react-native';
import { Image, View } from 'react-native';
import { AdminBadge, AdminIconButton } from '@/components/admin/AdminControls';
import { AdminButton, AdminCard, AdminEditor, AdminInput, AdminLoad, AdminRecords, AdminText, AdminToggle, adminSearch, confirmAdmin, styles, useAdminAction } from '@/components/admin/AdminUI';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { deleteRoutine } from '@/services/routineService';
import { assignTrainerRoutine, trainerClients, trainerRoutines, type TrainerClient, type TrainerRoutine } from '@/services/trainerService';

export function TrainerRoutines({ focus }: { focus: number }) {
  const router = useRouter();
  const [assigning, setAssigning] = useState<TrainerRoutine>();
  const { busy, run } = useAdminAction();
  const openEditor = (routine?: TrainerRoutine) => router.push({
    pathname: '/routine-editor',
    params: { trainer: '1', ...(routine && { id: String(routine.id) }) },
  });

  return <>
    <AdminLoad query={String(focus)} load={() => Promise.all([trainerRoutines(), trainerClients()])}>{([routines, clients], reload) => <>
      <View style={styles.toggle}>
        <AdminText strong>Mis rutinas</AdminText>
        <AdminIconButton icon={RefreshCw} label="Actualizar rutinas" onPress={reload} />
      </View>
      <AdminButton icon={Plus} label="Nueva rutina" variant="primary" onPress={() => openEditor()} />
      <AdminRecords items={routines} keyFor={routine => String(routine.id)}
        emptyLabel="Todavía no tienes rutinas para clientes." render={routine => {
          const image = routine.image_url;
          return <AdminCard>
            {!!image && !/^(file|content|blob):/i.test(image) && <Image accessibilityIgnoresInvertColors source={{ uri: image.startsWith('/') ? BACKEND_BASE_URL + image : image }}
              style={{ width: '100%', aspectRatio: 3, borderRadius: 14 }} />}
            <View style={styles.toggle}>
              <View style={{ flex: 1, gap: 4 }}>
                <AdminText strong>{routine.name}</AdminText>
                {!!routine.description && <AdminText secondary numberOfLines={2}>{routine.description}</AdminText>}
              </View>
              <AdminIconButton icon={Pencil} label="Editar rutina" disabled={busy} onPress={() => openEditor(routine)} />
              <AdminIconButton icon={Trash2} label="Eliminar rutina" danger disabled={busy} onPress={() =>
                confirmAdmin('Eliminar rutina', 'Los clientes asignados perderán «' + routine.name + '».', () =>
                  void run(() => deleteRoutine(String(routine.id)), 'Rutina eliminada.', reload), 'Eliminar')} />
            </View>
            <View style={styles.actions}>
              <Dumbbell size={16} />
              <AdminText secondary>{routine.RoutineExercises?.length ?? 0} ejercicios</AdminText>
              <AdminBadge>{routine.AssignedClients?.length ?? 0} clientes</AdminBadge>
            </View>
            <AdminButton icon={Users} label="Asignar clientes" disabled={busy} onPress={() => setAssigning(routine)} />
          </AdminCard>;
        }} />
      {assigning && <RoutineAssignments key={assigning.id} routine={assigning} clients={clients} onClose={() => setAssigning(undefined)}
        onSave={() => { setAssigning(undefined); reload(); }} />}
    </>}</AdminLoad>
  </>;
}

function RoutineAssignments({ routine, clients, onClose, onSave }: {
  routine: TrainerRoutine; clients: TrainerClient[]; onClose: () => void; onSave: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set(routine.AssignedClients?.map(person => person.id)));
  const { busy, run } = useAdminAction();
  const visible = clients.filter(person => person.isActive && adminSearch(search, person.name, person.username));

  return <AdminEditor title="Asignar clientes" onClose={onClose} busy={busy} showCloseButton>
    <AdminText strong>{routine.name}</AdminText>
    <AdminInput search label="Buscar cliente" value={search} onChangeText={setSearch} />
    <AdminRecords key={search} items={visible} keyFor={person => String(person.id)} emptyLabel="No se encontraron clientes activos."
      render={person => <AdminToggle label={person.name + ' · @' + person.username} value={selected.has(person.id)} onChange={checked => {
        if (busy) return;
        setSelected(previous => {
          const next = new Set(previous);
          if (checked) next.add(person.id);
          else next.delete(person.id);
          return next;
        });
      }} />} />
    <AdminButton label={busy ? 'Guardando…' : 'Guardar asignaciones'} variant="primary" disabled={busy}
      onPress={() => void run(() => assignTrainerRoutine(routine.id, [...selected]), 'Asignaciones guardadas.', onSave)} />
  </AdminEditor>;
}
