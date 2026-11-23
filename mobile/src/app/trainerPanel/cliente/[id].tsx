import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { AdminButton, AdminCard, AdminLoad, AdminMetrics, AdminScreen, AdminText, styles, useAdminAction } from '@/components/admin/AdminUI';
import { CalendarProgressView } from '@/components/progress/CalendarProgressView';
import { SocialUserAvatar } from '@/components/social/SocialUserAvatar';
import { TrainerAnamnesis } from '@/components/trainer/TrainerAnamnesis';
import { useAppColors } from '@/hooks/useAppColors';
import { TRAINING_DAYS, saveTrainerAnamnesis, trainerClients, trainerRoutines, trainerWorkouts, type TrainerClient } from '@/services/trainerService';
import { getContrastTextColor } from '@/utils/colorUtils';

export default function TrainerClientScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const [edit, setEdit] = useState(mode === 'edit');
  return <AdminScreen title={edit ? 'Editar cuestionario' : 'Ficha del cliente'} fallback="/trainerPanel">
    <AdminLoad load={trainerClients}>{(clients, reload) => {
      const client = clients.find(person => String(person.id) === id && person.isActive);
      if (!client) return <AdminCard><AdminText>Cliente activo no encontrado.</AdminText></AdminCard>;
      if (edit) return <TrainerAnamnesis client={client} editing onFinish={() => {
        if (mode === 'edit' && router.canGoBack()) router.back();
        else { reload(); setEdit(false); }
      }} />;
      return <ClientDetail key={client.id} client={client} onEdit={() => setEdit(true)} />;
    }}</AdminLoad>
  </AdminScreen>;
}

function ClientDetail({ client, onEdit }: { client: TrainerClient; onEdit: () => void }) {
  const colors = useAppColors();
  const { busy, run } = useAdminAction();
  const [days, setDays] = useState(() => Array.isArray(client.anamnesisData?.trainingDays)
    ? client.anamnesisData.trainingDays.map(String) : []);
  const { weight, height, age, gender, goal, activity_level: activity } = client;
  const calories = weight && height && age && gender && goal
    ? Math.round((10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161)) * (activity || 1.2) +
      (goal === 'lose' ? -500 : goal === 'gain' ? 500 : 0))
    : null;

  return <>
    <AdminCard>
      <View style={styles.toggle}>
        <SocialUserAvatar user={client} size={52} />
        <View style={{ flex: 1 }}>
          <AdminText strong>{client.name}</AdminText>
          <AdminText secondary>@{client.username}</AdminText>
        </View>
      </View>
      <AdminButton icon={Pencil} label="Editar cuestionario" onPress={onEdit} />
    </AdminCard>
    <AdminCard title="Metas nutricionales">
      {calories && weight ? <AdminMetrics entries={[
        ['kcal', calories], ['g de proteína', Math.round(weight * (goal === 'lose' ? 2 : goal === 'gain' ? 1.8 : 1.6))],
        ['ml de agua', Math.round(weight * 35)], ['g de azúcar', Math.round(calories * 0.1 / 4)],
      ]} /> : <AdminText secondary>Faltan datos del perfil para calcular las metas.</AdminText>}
    </AdminCard>
    <AdminCard title="Días de entrenamiento">
      <View style={styles.actions}>{TRAINING_DAYS.map(([day, label]) => {
        const selected = days.includes(day);
        return <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: selected, disabled: busy }}
          disabled={busy} style={[styles.choice, { borderColor: colors.border, backgroundColor: selected ? colors.tint : colors.card }]}
          onPress={() => void run(async () => {
            const next = selected ? days.filter(value => value !== day) : [...days, day];
            await saveTrainerAnamnesis(client.id, { trainingDays: next });
            setDays(next);
          })}>
          <Text style={{ color: selected ? getContrastTextColor(colors.tint) : colors.text, fontWeight: '700' }}>{label}</Text>
        </Pressable>;
      })}</View>
    </AdminCard>
    <AdminLoad query={String(client.id)} load={() => Promise.all([trainerWorkouts(client.id), trainerRoutines()])}>
      {([workouts, routines]) => {
        const assigned = routines.filter(routine => routine.AssignedClients?.some(person => person.id === client.id));
        return <>
          <AdminCard title="Rutinas asignadas">
            {assigned.length ? assigned.map(routine => <View key={routine.id}>
              <AdminText strong>{routine.name}</AdminText>
              <AdminText secondary>{routine.RoutineExercises?.length ?? 0} ejercicios</AdminText>
            </View>) : <AdminText secondary>Este cliente no tiene rutinas asignadas.</AdminText>}
          </AdminCard>
          <AdminText strong>Historial de entrenamientos</AdminText>
          <CalendarProgressView clientHistory={{ workouts, routines }} />
        </>;
      }}
    </AdminLoad>
  </>;
}
