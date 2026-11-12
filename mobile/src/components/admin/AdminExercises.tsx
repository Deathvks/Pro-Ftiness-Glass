import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Download, Pencil, Play, RefreshCw, Trash2, Video } from 'lucide-react-native';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';
import { useAppColors } from '@/hooks/useAppColors';
import { getSetting, updateSetting } from '@/services/adminService';
import apiClient, { BACKEND_BASE_URL } from '@/services/apiClient';
import { deleteExercise, importYouTubePlaylist, updateExercise } from '@/services/exerciseService';
import { AdminButton, AdminCard, AdminEditor, AdminInput, AdminLoad, AdminRecords, AdminText, adminSearch, confirmAdmin, styles, useAdminAction } from './AdminUI';
import { AdminBadge, AdminIconButton, AdminSelect } from './AdminControls';

type Exercise = { id: number; name: string; muscle_group?: string; category?: string; equipment?: string; video_url?: string; description?: string; images?: string[]; image_url_start?: string; image_url_end?: string };
type ExercisePhoto = { uri: string; asset?: ImagePicker.ImagePickerAsset };
const mediaUrl = (uri: string) => uri.startsWith('/') ? BACKEND_BASE_URL + uri : uri;
const loadExercises = () => apiClient('/exercise-list/exercises');
const loadPlaylist = () => getSetting('admin_youtube_playlist');

const isShort = (exercise: Exercise) => /short/i.test(exercise.name) || /\/shorts\//i.test(exercise.video_url ?? '');
const displayName = (exercise: Exercise) => exercise.name.replace(/#shorts?/gi, '').trim() || exercise.name;
const muscleGroups = (exercise: Exercise) => (exercise.muscle_group || 'Otro').split(',').map(group => group.trim()).filter(Boolean);

function mediaAspect(exercise: Exercise) {
  if (exercise.images?.length || exercise.image_url_start || exercise.image_url_end) return 4 / 5;
  return isShort(exercise) ? 9 / 16 : 16 / 9;
}

export default function AdminExercises({ trainerMode = false }: { trainerMode?: boolean } = {}) {
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('');
  const [detail, setDetail] = useState<Exercise>();
  const [editor, setEditor] = useState<Exercise>();
  const { busy, run } = useAdminAction();
  const colors = useAppColors();
  const { width, height } = useWindowDimensions();
  return <AdminLoad<Exercise[]> load={loadExercises}>{(exercises, reload) => {
    const muscles = [...new Set(exercises.map(row => row.muscle_group).filter((value): value is string => Boolean(value)))].sort();
    const visible = exercises.filter(row => (!muscle || row.muscle_group === muscle) && adminSearch(search, row.name, row.muscle_group))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return <>
      {!trainerMode && <AdminCard>
        <View style={exerciseStyles.sectionHeading}>
          <Video color="#ef4444" size={22} />
          <Text accessibilityRole="header" style={[exerciseStyles.heading, { color: colors.text }]}>Importar desde YouTube</Text>
        </View>
        <AdminText secondary>Pega la URL o el ID de una lista de reproducción. Cada vídeo se importará como un ejercicio.</AdminText>
        <AdminLoad<{ value: string | null }> load={loadPlaylist}>{setting => <PlaylistForm initial={setting.value ?? ''} reload={reload} />}</AdminLoad>
      </AdminCard>}
      <View style={exerciseStyles.libraryHeader}>
        <View style={styles.toggle}>
          <View style={exerciseStyles.sectionHeading}>
            <Text accessibilityRole="header" style={[exerciseStyles.heading, { color: colors.text }]}>Librería Global</Text>
            <AdminBadge tone="accent" style={exerciseStyles.centeredBadge}>{exercises.length}</AdminBadge>
          </View>
          <AdminIconButton icon={RefreshCw} label="Actualizar catálogo" onPress={reload} />
        </View>
        <AdminSelect label="Grupo muscular" options={[[ '', 'Todos los grupos'], ...muscles.map(value => [value, value] as const)]} value={muscle} onChange={setMuscle} />
        <AdminInput search label="Buscar ejercicio" value={search} onChangeText={setSearch} />
      </View>
      <AdminRecords key={JSON.stringify([muscle, search])} items={visible} keyFor={row => String(row.id)}
        columns={width >= 640 ? 2 : 1} pageSize={12} emptyLabel="No hay ejercicios que coincidan con la búsqueda." render={row => (
        <AdminCard style={exerciseStyles.exerciseCard}>
          <Pressable accessible={false} onPress={() => setDetail(row)}
            style={({ pressed }) => pressed && exerciseStyles.pressed}>
            <View pointerEvents="none" style={[exerciseStyles.cover, { aspectRatio: mediaAspect(row), backgroundColor: colors.border }]}>
              <ExerciseMediaPreview item={row} staticOnly fitMode="cover" showImageCounter={false} />
              <View style={exerciseStyles.coverTags}>
                {muscleGroups(row).map((group, index) => <Text key={index} style={exerciseStyles.coverTag}>{group}</Text>)}
                {isShort(row) && <Text style={[exerciseStyles.coverTag, exerciseStyles.shortTag]}>Short</Text>}
              </View>
            </View>
          </Pressable>
          <View style={exerciseStyles.exerciseInfo}>
            <Pressable accessibilityRole="button" onPress={() => setDetail(row)} style={exerciseStyles.exerciseName}>
              <AdminText strong>{displayName(row)}</AdminText>
              {!!row.equipment && <Text numberOfLines={1} style={[exerciseStyles.equipment, { color: colors.textSecondary }]}>{row.equipment}</Text>}
            </Pressable>
            {!trainerMode && <AdminIconButton icon={Trash2} label={'Eliminar ' + displayName(row)} danger disabled={busy} onPress={() => confirmAdmin('Eliminar ejercicio', `Se eliminará «${displayName(row)}» del catálogo general. Esto afectará a las rutinas que lo incluyan.`, () => void run(() => deleteExercise(row.id), 'Ejercicio eliminado.', reload), 'Eliminar')} />}
          </View>
        </AdminCard>
      )} />
      {!!detail && <AdminEditor title={displayName(detail)} onClose={() => setDetail(undefined)} showCloseButton>
        <View style={[exerciseStyles.detailPreview, { aspectRatio: mediaAspect(detail), maxHeight: height * 0.55, backgroundColor: colors.border }]}>
          <ExerciseMediaPreview item={detail} playYouTube showImageCounter={false} />
        </View>
        <View style={styles.actions}>
          {muscleGroups(detail).map((group, index) => <AdminBadge key={index} tone="accent">{group}</AdminBadge>)}
          {!!detail.equipment && <AdminBadge>{detail.equipment}</AdminBadge>}
        </View>
        <AdminText strong>Descripción</AdminText>
        <AdminText secondary>{detail.description || 'Sin descripción.'}</AdminText>
        <View style={styles.actions}>
          <AdminButton icon={Pencil} label="Editar ejercicio" variant="primary" onPress={() => { setDetail(undefined); setEditor(detail); }} />
          {!!detail.video_url && /^https?:\/\//i.test(detail.video_url) && <AdminButton icon={Play} label="Abrir vídeo" onPress={() => void run(() => Linking.openURL(detail.video_url!))} />}
        </View>
      </AdminEditor>}
      {!!editor && <ExerciseEditor exercise={editor} trainerMode={trainerMode} onClose={() => setEditor(undefined)} onSave={() => { setEditor(undefined); reload(); }} />}
    </>;
  }}</AdminLoad>;
}

function PlaylistForm({ initial, reload }: { initial: string; reload: () => void }) {
  const [playlist, setPlaylist] = useState(initial);
  const { busy, run } = useAdminAction();
  return <>
    <AdminInput label="URL o ID de la lista" placeholder="Ej. PLxXYZ1234567890…" value={playlist} onChangeText={setPlaylist} autoCapitalize="none" />
    <AdminButton icon={Download} label={busy ? 'Importando…' : 'Importar lista'} variant="danger" disabled={busy || !playlist.trim()} onPress={() =>
      confirmAdmin('Importar ejercicios', 'Los vídeos de la lista se añadirán al catálogo general.', () => void run(async () => {
        await importYouTubePlaylist(playlist.trim());
        reload();
        await updateSetting('admin_youtube_playlist', playlist.trim());
      }, 'Importación completada.'), 'Importar')} />
  </>;
}

const exerciseStyles = StyleSheet.create({
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  heading: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, flexShrink: 1 },
  centeredBadge: { alignSelf: 'center' },
  libraryHeader: { gap: 9, marginTop: 8 },
  exerciseCard: { padding: 0, gap: 0, overflow: 'hidden' },
  pressed: { opacity: 0.74 },
  cover: { width: '100%', overflow: 'hidden' },
  coverTags: { position: 'absolute', left: 11, right: 11, top: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  coverTag: { color: '#fff', backgroundColor: '#161616dc', borderRadius: 13, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  shortTag: { backgroundColor: '#b91c1c' },
  exerciseInfo: { flexDirection: 'row', alignItems: 'flex-start', padding: 13, gap: 8 },
  exerciseName: { flex: 1, minWidth: 0, gap: 5, paddingVertical: 3 },
  equipment: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailPreview: { width: '100%', borderRadius: 16, overflow: 'hidden' },
});

function ExerciseEditor({ exercise, trainerMode, onClose, onSave }: { exercise: Exercise; trainerMode: boolean; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(exercise.name);
  const [muscle, setMuscle] = useState(exercise.muscle_group ?? '');
  const [category, setCategory] = useState(exercise.category ?? '');
  const [equipment, setEquipment] = useState(exercise.equipment ?? '');
  const [video, setVideo] = useState(exercise.video_url ?? '');
  const [photos, setPhotos] = useState<ExercisePhoto[]>(() =>
    (Array.isArray(exercise.images) ? exercise.images : [exercise.image_url_start, exercise.image_url_end]).filter((uri): uri is string => Boolean(uri)).map(uri => ({ uri })));
  const { busy, run } = useAdminAction();

  function addPhoto() {
    void run(async () => {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
      if (!picked.canceled) setPhotos(items => items.length >= 10 ? items : [...items, { uri: picked.assets[0].uri, asset: picked.assets[0] }]);
    });
  }

  function movePhoto(index: number, offset: number) {
    setPhotos(items => {
      const updated = [...items];
      const [item] = updated.splice(index, 1);
      updated.splice(index + offset, 0, item);
      return updated;
    });
  }

  function save() {
    const payload = new FormData();
    const existing: string[] = [];
    let newCount = 0;
    for (const [key, value] of Object.entries({ name, muscle_group: muscle, category, equipment })) payload.append(key, value.trim());
    if (!trainerMode) payload.append('video_url', video.trim());
    const order = photos.map(({ uri, asset }) => {
      if (!asset) {
        existing.push(uri);
        return `existing:${existing.length - 1}`;
      }
      if (asset.file) payload.append('images', asset.file);
      else payload.append('images', { uri, name: asset.fileName || 'exercise.jpg', type: asset.mimeType || 'image/jpeg' } as unknown as Blob);
      return `new:${newCount++}`;
    });
    payload.append('existing_images', JSON.stringify(existing));
    payload.append('image_order', JSON.stringify(order));
    void run(() => updateExercise(exercise.id, payload), 'Ejercicio guardado.', onSave);
  }

  return <AdminEditor title="Editar ejercicio" onClose={onClose} busy={busy}>
    <AdminInput label="Nombre" value={name} onChangeText={setName} />
    <AdminInput label="Grupo muscular" value={muscle} onChangeText={setMuscle} />
    <AdminInput label="Categoría" value={category} onChangeText={setCategory} />
    <AdminInput label="Equipamiento" value={equipment} onChangeText={setEquipment} />
    {!trainerMode && <AdminInput label="URL del vídeo" value={video} onChangeText={setVideo} autoCapitalize="none" keyboardType="url" />}
    <AdminText strong>Imágenes ({photos.length}/10)</AdminText>
    {photos.map((photo, index) => <View key={`${photo.uri}-${index}`} style={styles.actions}>
      <Image source={{ uri: mediaUrl(photo.uri) }} accessibilityLabel={`Imagen ${index + 1}`} style={{ width: 56, height: 56, borderRadius: 10 }} />
      <AdminButton label="Subir" disabled={busy || index === 0} onPress={() => movePhoto(index, -1)} />
      <AdminButton label="Bajar" disabled={busy || index === photos.length - 1} onPress={() => movePhoto(index, 1)} />
      <AdminButton label="Quitar" disabled={busy} onPress={() => setPhotos(items => items.filter((_, position) => index !== position))} />
    </View>)}
    <AdminButton label="Añadir imagen" disabled={busy || photos.length >= 10} onPress={addPhoto} />
    <View style={styles.actions}>
      <AdminButton label="Cancelar" disabled={busy} onPress={onClose} />
      <AdminButton label={busy ? 'Guardando…' : 'Guardar'} variant="primary" disabled={busy || !name.trim()} onPress={save} />
    </View>
  </AdminEditor>;
}
