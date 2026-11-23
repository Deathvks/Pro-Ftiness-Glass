import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Link, UserPlus } from 'lucide-react-native';
import { View } from 'react-native';
import { AdminSegments } from '@/components/admin/AdminControls';
import { AdminButton, AdminCard, AdminInput, AdminLoad, AdminRecords, AdminScreen, AdminText, styles, useAdminAction } from '@/components/admin/AdminUI';
import { SocialUserAvatar } from '@/components/social/SocialUserAvatar';
import { TrainerAnamnesis } from '@/components/trainer/TrainerAnamnesis';
import { changeTrainerClient, createTrainerClient, searchTrainerUsers, type TrainerPerson } from '@/services/trainerService';

export default function AddTrainerClient() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'link'>('create');
  const [name, setName] = useState('');
  const [surname1, setSurname1] = useState('');
  const [surname2, setSurname2] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [client, setClient] = useState<TrainerPerson>();
  const { busy, run } = useAdminAction();
  const finish = () => router.canGoBack() ? router.back() : router.replace('/trainerPanel');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 280);
    return () => clearTimeout(timer);
  }, [search]);

  return <AdminScreen title={client ? 'Cuestionario inicial' : 'Añadir nuevo cliente'} fallback="/trainerPanel">
    {client ? <TrainerAnamnesis client={client} editing={false} onFinish={finish} /> : <>
      <AdminSegments options={[[ 'create', 'Crear cliente'], ['link', 'Vincular usuario']]} value={mode} onChange={setMode} />
      {mode === 'create' ? <AdminCard title="Datos del cliente">
        <AdminInput label="Nombre" value={name} onChangeText={setName} autoCapitalize="words" editable={!busy} />
        <AdminInput label="Primer apellido" value={surname1} onChangeText={setSurname1} autoCapitalize="words" editable={!busy} />
        <AdminInput label="Segundo apellido" value={surname2} onChangeText={setSurname2} autoCapitalize="words" editable={!busy} />
        <AdminButton icon={UserPlus} label={busy ? 'Creando…' : 'Crear y continuar'} variant="primary"
          disabled={busy || !name.trim() || !surname1.trim() || !surname2.trim()} onPress={() => void run(async () => {
            const result = await createTrainerClient({ name: name.trim(), surname1: surname1.trim(), surname2: surname2.trim() });
            setClient(result.client);
          }, 'Cliente creado.')} />
      </AdminCard> : <>
        <AdminInput search label="Buscar por nombre o usuario" value={search} onChangeText={setSearch} autoCapitalize="none" />
        {search.trim().length > 0 && search.trim().length < 3
          ? <AdminText secondary>Escribe al menos tres caracteres.</AdminText>
          : query === search.trim() && <AdminLoad query={query} load={() => searchTrainerUsers(query)}>{people =>
            <AdminRecords key={query} items={people} keyFor={person => String(person.id)} emptyLabel="No se encontraron usuarios disponibles." render={person => (
              <AdminCard>
                <View style={styles.toggle}>
                  <SocialUserAvatar user={person} size={38} />
                  <View style={{ flex: 1 }}>
                    <AdminText strong>{person.name}</AdminText>
                    <AdminText secondary>@{person.username}</AdminText>
                  </View>
                  <AdminButton label="Vincular" icon={Link} disabled={busy} onPress={() => void run(async () => {
                    await changeTrainerClient(person.id, 'link');
                    setClient(person);
                  }, 'Usuario vinculado.')} />
                </View>
              </AdminCard>
            )} />
          }</AdminLoad>}
      </>}
    </>}
  </AdminScreen>;
}
