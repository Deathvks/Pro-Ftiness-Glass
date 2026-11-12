import { useEffect, useState } from 'react';
import { ChevronRight, RefreshCw, Send } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';
import { AdminBadge, AdminIconButton, AdminSegments } from '@/components/admin/AdminControls';
import { AdminButton, AdminCard, AdminEditor, AdminInput, AdminLoad, AdminRecords, AdminText, adminDate, adminSearch, styles, useAdminAction } from '@/components/admin/AdminUI';
import { SocialUserAvatar } from '@/components/social/SocialUserAvatar';
import { useAppColors } from '@/hooks/useAppColors';
import apiClient, { BACKEND_BASE_URL } from '@/services/apiClient';
import { initSocket } from '@/services/socket';
import type { TrainerPerson } from '@/services/trainerService';
import useAppStore from '@/store/useAppStore';

type Message = {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
  is_closed?: boolean;
};
type Conversation = TrainerPerson & { unreadCount: number; lastMessage?: Message | null; created_at?: string };

export function TrainerChats({ focus, search, matchesDate }: {
  focus: number; search: string; matchesDate: (value?: string) => boolean;
}) {
  const [selected, setSelected] = useState<Conversation>();
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const colors = useAppColors();

  return <AdminLoad<Conversation[]> query={String(focus)} refreshMs={15000} load={() => apiClient('/chat/trainer-chats')}>{(conversations, reload) => {
    const visible = conversations.filter(person => Boolean(person.lastMessage?.is_closed) === (filter === 'closed') &&
      adminSearch(search, person.name, person.username) && matchesDate(person.created_at));
    return <>
      <View style={styles.toggle}>
        <AdminText strong>Conversaciones</AdminText>
        <AdminIconButton icon={RefreshCw} label="Actualizar conversaciones" onPress={reload} />
      </View>
      <AdminSegments options={[[ 'open', 'Abiertas'], ['closed', 'Cerradas']]} value={filter} onChange={setFilter} />
      <AdminRecords key={filter + search} items={visible} keyFor={person => String(person.id)}
        emptyLabel="No hay conversaciones con esos filtros." render={person => <AdminCard>
          <Pressable accessibilityRole="button" onPress={() => setSelected(person)} style={styles.toggle}>
            <SocialUserAvatar user={person} size={42} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <AdminText strong numberOfLines={1}>{person.name || person.username}</AdminText>
              <AdminText secondary numberOfLines={1}>{person.lastMessage?.content || (person.lastMessage?.attachment_url ? 'Archivo adjunto' : 'Sin mensajes')}</AdminText>
            </View>
            {person.unreadCount > 0 && <AdminBadge tone="accent">{person.unreadCount}</AdminBadge>}
            <ChevronRight size={17} color={colors.textSecondary} />
          </Pressable>
        </AdminCard>} />
      {selected && <TrainerConversation key={selected.id} person={selected} onClose={() => { setSelected(undefined); reload(); }} />}
    </>;
  }}</AdminLoad>;
}

function TrainerConversation({ person, onClose }: { person: Conversation; onClose: () => void }) {
  const ownId = useAppStore(state => state.userProfile?.id);
  const [draft, setDraft] = useState('');
  const { busy, run } = useAdminAction();
  const closed = Boolean(person.lastMessage?.is_closed);

  useEffect(() => {
    const markRead = () => {
      void apiClient('/chat/mark-read/' + person.id, { method: 'POST', queueWhenOffline: false })
        .then(() => useAppStore.getState().fetchUnreadChats(), () => {});
    };
    const socket = initSocket();
    const incoming = (message: Message) => {
      if (String(message.sender_id) === String(person.id)) markRead();
    };
    markRead();
    socket?.on('chat_message', incoming);
    return () => { socket?.off('chat_message', incoming); };
  }, [person.id]);

  return <AdminEditor title={person.name || person.username} onClose={onClose} showCloseButton busy={busy}>
    <AdminLoad<Message[]> load={() => apiClient('/chat/history/' + person.id)} refreshMs={8000}>{(messages, reload) => <>
      <View style={styles.toggle}>
        <AdminText strong>Mensajes</AdminText>
        <AdminIconButton icon={RefreshCw} label="Actualizar mensajes" onPress={reload} />
      </View>
      <AdminRecords items={[...messages].reverse()} keyFor={message => String(message.id)} pageSize={20}
        emptyLabel="Todavía no hay mensajes." render={message => <AdminCard>
          <View style={styles.toggle}>
            <AdminText strong>{message.attachment_type === 'bot_reply' ? 'Respuesta automática' :
              String(message.sender_id) === String(person.id) ? person.name : String(message.sender_id) === String(ownId) ? 'Tú' : 'Entrenador'}</AdminText>
            <AdminText secondary>{adminDate(message.created_at)}</AdminText>
          </View>
          {!!message.content && <AdminText>{message.content}</AdminText>}
          {!!message.attachment_url && <AdminButton label="Abrir archivo adjunto" onPress={() => {
            const path = message.attachment_url!;
            const url = /^https?:\/\//i.test(path) ? path : BACKEND_BASE_URL + '/' + path.replace(/^\/+/, '');
            void run(() => Linking.openURL(url));
          }} />}
        </AdminCard>} />
      {closed ? <AdminText secondary>Conversación cerrada.</AdminText> : <>
        <AdminInput label="Mensaje" value={draft} onChangeText={setDraft} editable={!busy} multiline />
        <AdminButton icon={Send} label="Enviar" variant="primary" disabled={busy || !draft.trim()} onPress={() =>
          void run(() => apiClient('/chat/send', {
            method: 'POST', body: { receiverId: person.id, content: draft.trim() }, queueWhenOffline: false,
          }), undefined, () => { setDraft(''); reload(); })} />
      </>}
    </>}</AdminLoad>
  </AdminEditor>;
}
