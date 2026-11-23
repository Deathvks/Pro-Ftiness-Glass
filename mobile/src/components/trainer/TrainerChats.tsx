import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  Archive,
  Bell,
  Bot,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  Mail,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  UserPlus,
  Video,
} from 'lucide-react-native';

import {
  AdminButton,
  AdminCard,
  AdminText,
} from '@/components/admin/AdminUI';
import ChatVideoMessage from '@/components/chat/ChatVideoMessage';
import FullscreenVideoModal from '@/components/chat/FullscreenVideoModal';
import { GlassButton, LiquidCloseButton } from '@/components/ui/GlassButton';
import ModalThemeBackground, {
  getThemedModalBorderColor,
  getThemedModalCardColor,
} from '@/components/ui/ModalThemeBackground';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import apiClient, { API_BASE_URL } from '@/services/apiClient';
import { initSocket } from '@/services/socket';
import { changeTrainerClient, type TrainerPerson } from '@/services/trainerService';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

const CACHE_KEY = 'pfg_trainer_chats';
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

type ChatMessage = {
  id: number | string;
  sender_id: number | string;
  receiver_id: number | string;
  content: string;
  created_at: string;
  read_at?: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  bot_reminder_level?: number | null;
  bot_push_status?: string | null;
  bot_email_status?: string | null;
  is_closed?: boolean | null;
  temp?: boolean;
  Sender?: {
    id: number;
    username: string;
    profile_image_url?: string | null;
  };
};

type ChatClient = TrainerPerson & {
  lastSeen?: string | null;
  trainer_id?: number | null;
  trainer_name?: string | null;
  lastMessage?: ChatMessage | null;
  botReminders?: ChatMessage[];
  unreadCount?: number;
};

type BotStepInfo = {
  level: 0 | 1 | 2 | 3;
  urgency: 1 | 2 | 3;
  remainingHours: number;
  label: string;
  targetHours: number;
  nextLevel: 1 | 2 | 3 | 4;
  remindersMap: Record<number, ChatMessage>;
};

let memoryChatsCache: ChatClient[] | null = null;

function resolveMediaUrl(path?: string | null): string | null {
  if (!path || path === 'null') return null;
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('file:')) {
    return path;
  }
  const serverBase = API_BASE_URL.replace('/api', '');
  return `${serverBase}${path.startsWith('/') ? path : `/${path}`}`;
}

function normalizeStr(str?: string | null): string {
  return str
    ? str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    : '';
}

function isUserOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatLastSeen(lastSeen?: string | null): string {
  if (!lastSeen) return 'Sin conexión';
  if (isUserOnline(lastSeen)) return 'En línea';
  const diffMin = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return new Date(lastSeen).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

function formatMessageTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatChatListTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  }
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Hoy';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatCountdown(hours: number): string {
  if (hours <= 0) return 'Pendiente cron';
  if (hours < 1) {
    return `En ${Math.max(1, Math.round(hours * 60))} min`;
  }
  if (hours < 24) {
    return `En ${Math.round(hours)}h`;
  }
  const days = Math.floor(hours / 24);
  const remH = Math.round(hours % 24);
  return remH > 0 ? `En ${days}d ${remH}h` : `En ${days}d`;
}

function calcBotInfo(client: ChatClient): BotStepInfo | null {
  if (client.role !== 'user' || !client.lastMessage || client.lastMessage.is_closed) {
    return null;
  }

  const allReminders = (client.botReminders || []).filter(r => !r.is_closed);
  const lastMsgIsHuman =
    !client.lastMessage.bot_reminder_level && client.lastMessage.attachment_type !== 'bot_reply';

  const remindersMap: Record<number, ChatMessage> = {};
  let level: 0 | 1 | 2 | 3 = 0;

  if (!lastMsgIsHuman) {
    const sorted = [...allReminders].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    for (const r of sorted) {
      const lvl = Number(r.bot_reminder_level || 0);
      if (lvl >= 1 && lvl <= 3 && !remindersMap[lvl]) {
        remindersMap[lvl] = r;
        if (lvl > level) level = lvl as 1 | 2 | 3;
      }
    }
    const lastLvl = Number(client.lastMessage.bot_reminder_level || 0);
    if (lastLvl >= 1 && lastLvl <= 3 && lastLvl > level) {
      level = lastLvl as 1 | 2 | 3;
      if (!remindersMap[lastLvl]) remindersMap[lastLvl] = client.lastMessage;
    }
  }

  const refMsg = level > 0 && remindersMap[level] ? remindersMap[level] : client.lastMessage;
  const elapsedHours = (Date.now() - new Date(refMsg.created_at).getTime()) / (1000 * 60 * 60);

  let targetHours = 72;
  let nextLevel: 1 | 2 | 3 | 4 = 1;
  let stepName = 'Aviso 1';

  if (level === 0) {
    targetHours = 72;
    nextLevel = 1;
    stepName = 'Aviso 1';
  } else if (level === 1) {
    targetHours = 48;
    nextLevel = 2;
    stepName = 'Aviso 2';
  } else if (level === 2) {
    targetHours = 24;
    nextLevel = 3;
    stepName = 'Aviso 3';
  } else {
    targetHours = 24;
    nextLevel = 4;
    stepName = 'Cierre auto';
  }

  const remainingHours = Math.max(0, targetHours - elapsedHours);
  const urgency: 1 | 2 | 3 = remainingHours <= 24 ? 1 : level > 0 || remainingHours <= 48 ? 2 : 3;

  return {
    level,
    urgency,
    remainingHours,
    label: `${stepName} · ${formatCountdown(remainingHours)}`,
    targetHours,
    nextLevel,
    remindersMap,
  };
}

function getDeliveryBadge(status?: string | null): { label: string; color: string } {
  if (status === 'ok' || status === 'manual_ok') {
    return { label: status === 'manual_ok' ? 'Reenviado OK' : 'Enviado OK', color: '#22c55e' };
  }
  if (status === 'error') {
    return { label: 'Error', color: '#ef4444' };
  }
  if (status === 'skipped') {
    return { label: 'Omitido', color: '#f59e0b' };
  }
  return { label: 'Sin registro', color: '#64748b' };
}

function AvatarCircle({
  name,
  uri,
  size = 46,
  online = false,
  tint,
  isDark,
}: {
  name?: string | null;
  uri?: string | null;
  size?: number;
  online?: boolean;
  tint: string;
  isDark: boolean;
}) {
  const resolved = resolveMediaUrl(uri);
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {resolved ? (
        <Image
          source={{ uri: resolved }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: tint + '22',
            borderWidth: 1,
            borderColor: tint + '44',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: tint, fontWeight: '800', fontSize: Math.round(size * 0.38) }}>
            {initial}
          </Text>
        </View>
      )}
      {online && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: Math.max(10, Math.round(size * 0.25)),
            height: Math.max(10, Math.round(size * 0.25)),
            borderRadius: 99,
            backgroundColor: '#22c55e',
            borderWidth: 2,
            borderColor: isDark ? '#0f172a' : '#ffffff',
          }}
        />
      )}
    </View>
  );
}

export function TrainerChats({
  focus,
  search,
  matchesDate,
}: {
  focus: number;
  search: string;
  matchesDate: (value?: string) => boolean;
}) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const currentUser = useAppStore(state => state.userProfile);
  const { addToast } = useToast();

  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isAdmin = currentUser?.role === 'admin';
  const accentText = getContrastTextColor(colors.tint);
  const modalCardColor = getThemedModalCardColor(theme);
  const modalBorderColor = getThemedModalBorderColor(theme);

  const [clients, setClients] = useState<ChatClient[]>(() => memoryChatsCache || []);
  const [loading, setLoading] = useState(() => !memoryChatsCache);
  const [refreshing, setRefreshing] = useState(false);

  const [showBotSection, setShowBotSection] = useState(true);
  const [showClosedFolder, setShowClosedFolder] = useState(false);

  // Conversation modal state
  const [activeClient, setActiveClient] = useState<ChatClient | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);

  // Bot edit modal
  const [editingBotMsg, setEditingBotMsg] = useState<ChatMessage | null>(null);
  const [editBotText, setEditBotText] = useState('');
  const [savingBotEdit, setSavingBotEdit] = useState(false);

  // Bot sequence modal
  const [botModalClient, setBotModalClient] = useState<ChatClient | null>(null);
  const [busyReminder, setBusyReminder] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const activeClientIdRef = useRef<number | null>(null);

  useEffect(() => {
    activeClientIdRef.current = activeClient ? activeClient.id : null;
  }, [activeClient]);

  const persistCache = useCallback((list: ChatClient[]) => {
    memoryChatsCache = list;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list)).catch(() => {});
  }, []);

  const syncUnreadGlobal = useCallback(() => {
    useAppStore.getState().fetchUnreadChats?.();
  }, []);

  const loadChats = useCallback(
    async (silent = false) => {
      try {
        const res = await apiClient('/chat/trainer-chats');
        const list = Array.isArray(res) ? (res as ChatClient[]) : [];
        setClients(list);
        persistCache(list);
        setBotModalClient(prev =>
          prev ? list.find(c => c.id === prev.id) || prev : null
        );
        setActiveClient(prev =>
          prev ? list.find(c => c.id === prev.id) || prev : null
        );
        syncUnreadGlobal();
      } catch (err) {
        if (!silent) {
          addToast('No se pudieron cargar los chats de asesoría.', 'error');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [addToast, persistCache, syncUnreadGlobal]
  );

  // Load cache from AsyncStorage on mount
  useEffect(() => {
    if (!memoryChatsCache) {
      AsyncStorage.getItem(CACHE_KEY)
        .then(raw => {
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryChatsCache = parsed;
            setClients(parsed);
            setLoading(false);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Load chats whenever screen focuses or reloads
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiClient('/chat/trainer-chats');
        if (!active) return;
        const list = Array.isArray(res) ? (res as ChatClient[]) : [];
        setClients(list);
        persistCache(list);
        setBotModalClient(prev =>
          prev ? list.find(c => c.id === prev.id) || prev : null
        );
        setActiveClient(prev =>
          prev ? list.find(c => c.id === prev.id) || prev : null
        );
        syncUnreadGlobal();
      } catch {
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [focus, persistCache, syncUnreadGlobal]);

  const markAsRead = useCallback(
    async (clientId: number) => {
      try {
        await apiClient(`/chat/mark-read/${clientId}`, { method: 'POST' });
        setClients(prev => {
          const next = prev.map(c => (c.id === clientId ? { ...c, unreadCount: 0 } : c));
          persistCache(next);
          return next;
        });
        syncUnreadGlobal();
      } catch {}
    },
    [persistCache, syncUnreadGlobal]
  );

  const openChat = useCallback(
    async (client: ChatClient) => {
      setActiveClient(client);
      setMessages([]);
      setDraft('');
      setLoadingHistory(true);

      try {
        const history = await apiClient(`/chat/history/${client.id}`);
        setMessages(Array.isArray(history) ? history : []);
        if ((client.unreadCount || 0) > 0) {
          void markAsRead(client.id);
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 120);
      } catch (err) {
        addToast('Error al cargar el historial de mensajes.', 'error');
      } finally {
        setLoadingHistory(false);
      }
    },
    [addToast, markAsRead]
  );

  // Real-time sockets
  useEffect(() => {
    const socket = initSocket();
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      if (!message) return;
      const openId = activeClientIdRef.current;

      if (
        openId &&
        (String(message.sender_id) === String(openId) ||
          String(message.receiver_id) === String(openId))
      ) {
        setMessages(prev => {
          if (message.id && prev.some(m => String(m.id) === String(message.id))) {
            return prev;
          }
          return [...prev, message];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

        if (String(message.sender_id) === String(openId)) {
          void markAsRead(openId);
        }
      }

      void loadChats(true);
    };

    const handleMessagesRead = ({ byUserId }: { byUserId: number | string }) => {
      setMessages(prev =>
        prev.map(msg =>
          String(msg.receiver_id) === String(byUserId) && !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    };

    const handleMessageEdited = (updatedMsg: ChatMessage) => {
      if (!updatedMsg?.id) return;
      setMessages(prev =>
        prev.map(m => (String(m.id) === String(updatedMsg.id) ? { ...m, ...updatedMsg } : m))
      );
      setClients(prev => {
        const next = prev.map(c =>
          c.lastMessage && String(c.lastMessage.id) === String(updatedMsg.id)
            ? { ...c, lastMessage: { ...c.lastMessage, ...updatedMsg } }
            : c
        );
        persistCache(next);
        return next;
      });
    };

    socket.on('chat_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_edited', handleMessageEdited);

    return () => {
      socket.off('chat_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_edited', handleMessageEdited);
    };
  }, [loadChats, markAsRead, persistCache]);

  // Filtered lists
  const filteredClients = useMemo(() => {
    const q = normalizeStr(search);
    return clients.filter(client => {
      if (q) {
        const nameMatch =
          normalizeStr(client.name).includes(q) ||
          normalizeStr(client.username).includes(q) ||
          normalizeStr(client.trainer_name).includes(q);
        if (!nameMatch) return false;
      }
      if (!matchesDate(client.lastMessage?.created_at ?? undefined)) return false;
      return true;
    });
  }, [clients, matchesDate, search]);

  const activeChats = useMemo(
    () => filteredClients.filter(c => !c.lastMessage?.is_closed),
    [filteredClients]
  );

  const closedChats = useMemo(
    () => filteredClients.filter(c => Boolean(c.lastMessage?.is_closed)),
    [filteredClients]
  );

  const botProspects = useMemo(() => {
    if (!isAdmin) return [];
    const list: { client: ChatClient; info: BotStepInfo }[] = [];
    for (const c of activeChats) {
      const info = calcBotInfo(c);
      if (info && info.urgency <= 2) {
        list.push({ client: c, info });
      }
    }
    return list.sort((a, b) => {
      if (a.info.urgency !== b.info.urgency) return a.info.urgency - b.info.urgency;
      return a.info.remainingHours - b.info.remainingHours;
    });
  }, [activeChats, isAdmin]);

  // Actions
  const handleLinkToAsesoria = useCallback(
    (client: ChatClient) => {
      Alert.alert(
        'Añadir a Asesoría',
        `¿Convertir a ${client.name || client.username} en asesorado activo?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Añadir',
            onPress: async () => {
              try {
                await changeTrainerClient(client.id, 'link');
                addToast(`${client.name || client.username} añadido a Asesoría.`, 'success');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                await loadChats(true);
              } catch (err: any) {
                addToast(err?.message || 'Error al vincular cliente.', 'error');
              }
            },
          },
        ]
      );
    },
    [addToast, loadChats]
  );

  const handleSendMessage = async () => {
    if (!activeClient || !draft.trim() || sending || uploadingVideo) return;
    const content = draft.trim();
    const receiverId = activeClient.id;
    const tempId = `temp-${Date.now()}`;

    const optimistic: ChatMessage = {
      id: tempId,
      sender_id: currentUser?.id || 'me',
      receiver_id: receiverId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
      temp: true,
    };

    setDraft('');
    setSending(true);
    setMessages(prev => [...prev, optimistic]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 60);

    try {
      const sent = await apiClient('/chat/send', {
        method: 'POST',
        body: { receiverId, content },
      });
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId ? { ...sent, read_at: m.read_at || sent?.read_at } : m
        )
      );
      void loadChats(true);
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setDraft(content);
      addToast(err?.message || 'No se pudo enviar el mensaje.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handlePickVideo = async () => {
    if (!activeClient || uploadingVideo) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso necesario',
          'Se necesita acceso a tus vídeos para enviarlos en el chat.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
        Alert.alert('Archivo demasiado grande', 'El vídeo supera el límite de 150MB.');
        return;
      }

      setUploadingVideo(true);
      const ext = asset.uri.split('.').pop() || 'mp4';
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || `trainer_video_${Date.now()}.${ext}`,
        type: asset.mimeType || `video/${ext === 'mov' ? 'quicktime' : 'mp4'}`,
      } as any);
      formData.append('receiverId', String(activeClient.id));

      const sentMsg = await apiClient('/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (sentMsg) {
        setMessages(prev => [...prev, sentMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
        void loadChats(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (err: any) {
      addToast(err?.message || 'Error al subir el vídeo.', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveBotEdit = async () => {
    if (!editingBotMsg || !editBotText.trim() || savingBotEdit) return;
    setSavingBotEdit(true);
    try {
      const updated = await apiClient(`/chat/message/${editingBotMsg.id}`, {
        method: 'PUT',
        body: { content: editBotText.trim() },
      });
      setMessages(prev =>
        prev.map(m => (String(m.id) === String(editingBotMsg.id) ? { ...m, ...updated } : m))
      );
      setEditingBotMsg(null);
      setEditBotText('');
      addToast('Mensaje del bot actualizado.', 'success');
      void loadChats(true);
    } catch (err: any) {
      addToast(err?.message || 'Error al editar el mensaje.', 'error');
    } finally {
      setSavingBotEdit(false);
    }
  };

  const handleForceBotReminder = async (client: ChatClient, level: 1 | 2 | 3) => {
    if (busyReminder) return;
    setBusyReminder(true);
    try {
      const res = await apiClient(`/chat/trainer/bot-reminder/${client.id}/${level}`, {
        method: 'POST',
      });
      const st = res?.status || {};
      addToast(
        `Aviso ${level} enviado (Push: ${st.push || 'ok'}, Email: ${st.email || 'ok'})`,
        'success'
      );
      await loadChats(true);
    } catch (err: any) {
      addToast(err?.message || `Error al enviar Aviso ${level}.`, 'error');
    } finally {
      setBusyReminder(false);
    }
  };

  const handleResendReminderChannel = (
    client: ChatClient,
    level: number,
    channel: 'push' | 'email'
  ) => {
    Alert.alert(
      `Reenviar ${channel === 'push' ? 'Push' : 'Email'}`,
      `¿Reenviar notificación ${channel === 'push' ? 'push' : 'por correo'} del Aviso ${level} a ${client.name || client.username}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reenviar',
          onPress: async () => {
            setBusyReminder(true);
            try {
              const res = await apiClient(
                `/chat/trainer/bot-reminder-resend/${client.id}/${level}?type=${channel}`,
                { method: 'POST' }
              );
              const channelResult = res?.status?.[channel];
              addToast(
                `${channel === 'push' ? 'Push' : 'Email'} Aviso ${level}: ${channelResult || 'enviado'}`,
                channelResult === 'error' ? 'error' : 'success'
              );
              await loadChats(true);
            } catch (err: any) {
              addToast(err?.message || 'Error al reenviar recordatorio.', 'error');
            } finally {
              setBusyReminder(false);
            }
          },
        },
      ]
    );
  };

  const renderClientCard = (client: ChatClient, closedVariant = false) => {
    const botInfo = isAdmin ? calcBotInfo(client) : null;
    const online = isUserOnline(client.lastSeen);
    const unread = Number(client.unreadCount || 0);
    const isProspect = client.role === 'user';

    const roleBadgeText = closedVariant
      ? 'Cerrado'
      : isProspect
        ? 'Consulta'
        : client.role === 'trainer'
          ? 'Entrenador'
          : 'Asesorado';

    const previewText = closedVariant
      ? 'Cerrado por inactividad'
      : client.lastMessage
        ? client.lastMessage.attachment_type === 'bot_reply'
          ? `🤖 ${client.lastMessage.content}`
          : client.lastMessage.attachment_url
            ? '🎥 Vídeo enviado'
            : client.lastMessage.content
        : 'Sin mensajes aún';

    return (
      <Pressable
        key={client.id}
        accessibilityRole="button"
        onPress={() => void openChat(client)}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <AdminCard
          style={
            closedVariant
              ? { opacity: 0.78 }
              : unread > 0
                ? { borderColor: colors.tint + '66' }
                : undefined
          }
        >
          <View style={styles.chatRow}>
            <AvatarCircle
              name={client.name || client.username}
              uri={client.profile_image_url}
              size={48}
              online={online && !closedVariant}
              tint={colors.tint}
              isDark={isDark}
            />

            <View style={{ flex: 1, gap: 3 }}>
              <View style={styles.topLine}>
                <Text
                  numberOfLines={1}
                  style={[styles.clientName, { color: colors.text }]}
                >
                  {client.name || client.username}
                </Text>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {formatChatListTime(client.lastMessage?.created_at)}
                </Text>
              </View>

              <View style={styles.badgeLine}>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: closedVariant
                        ? isDark
                          ? 'rgba(148,163,184,0.16)'
                          : 'rgba(100,116,139,0.12)'
                        : isProspect
                          ? '#f59e0b22'
                          : colors.tint + '22',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: closedVariant
                        ? colors.textSecondary
                        : isProspect
                          ? '#f59e0b'
                          : colors.tint,
                    }}
                  >
                    {roleBadgeText}
                  </Text>
                </View>

                {!!client.trainer_name && isAdmin && !isProspect && (
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 11, color: colors.textSecondary, flexShrink: 1 }}
                  >
                    · Entrenador: {client.trainer_name}
                  </Text>
                )}

                {!closedVariant && (
                  <Text style={{ fontSize: 11, color: online ? '#22c55e' : colors.textSecondary }}>
                    · {formatLastSeen(client.lastSeen)}
                  </Text>
                )}
              </View>

              <View style={styles.previewLine}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.previewText,
                    {
                      color: unread > 0 ? colors.text : colors.textSecondary,
                      fontWeight: unread > 0 ? '600' : '400',
                    },
                  ]}
                >
                  {previewText}
                </Text>
                {unread > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.tint }]}>
                    <Text style={{ color: accentText, fontSize: 11, fontWeight: '800' }}>
                      {unread}
                    </Text>
                  </View>
                )}
              </View>

              {(botInfo || (isProspect && !closedVariant)) && (
                <View style={styles.quickActionRow}>
                  {isAdmin && botInfo && (
                    <TouchableOpacity
                      onPress={() => setBotModalClient(client)}
                      style={[
                        styles.miniActionPill,
                        {
                          backgroundColor:
                            botInfo.urgency === 1
                              ? '#ef444420'
                              : '#f59e0b20',
                          borderColor:
                            botInfo.urgency === 1
                              ? '#ef444455'
                              : '#f59e0b55',
                        },
                      ]}
                    >
                      <Bot
                        size={12}
                        color={botInfo.urgency === 1 ? '#ef4444' : '#f59e0b'}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: botInfo.urgency === 1 ? '#ef4444' : '#f59e0b',
                        }}
                      >
                        {botInfo.label}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {isProspect && !closedVariant && (
                    <TouchableOpacity
                      onPress={() => handleLinkToAsesoria(client)}
                      style={[
                        styles.miniActionPill,
                        {
                          backgroundColor: colors.tint + '1A',
                          borderColor: colors.tint + '44',
                        },
                      ]}
                    >
                      <UserPlus size={12} color={colors.tint} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.tint }}>
                        Añadir a Asesoría
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </AdminCard>
      </Pressable>
    );
  };

  const botModalInfo = botModalClient ? calcBotInfo(botModalClient) : null;
  const isActiveChatClosed = Boolean(activeClient?.lastMessage?.is_closed);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionPageTitle, { color: colors.text }]}>
            Asesorías ({activeChats.length})
          </Text>
          <AdminText secondary>
            {isAdmin
              ? 'Conversaciones activas, seguimiento bot e historial cerrado.'
              : 'Mensajes y vídeos de tus asesorados.'}
          </AdminText>
        </View>
        <TouchableOpacity
          accessibilityLabel="Recargar asesorías"
          onPress={() => {
            setRefreshing(true);
            void loadChats(false);
          }}
          style={[
            styles.refreshBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <RefreshCw size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading && clients.length === 0 ? (
        <AdminCard>
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.tint} />
            <AdminText secondary>Cargando conversaciones...</AdminText>
          </View>
        </AdminCard>
      ) : null}

      {refreshing ? (
        <View style={styles.refreshStrip}>
          <ActivityIndicator size="small" color={colors.tint} />
          <AdminText secondary>Actualizando chats...</AdminText>
        </View>
      ) : null}

      {/* Admin: Secuencia Bot */}
      {isAdmin && botProspects.length > 0 && (
        <AdminCard style={{ borderColor: '#f59e0b55' }}>
          <TouchableOpacity
            onPress={() => setShowBotSection(v => !v)}
            style={styles.sectionHeaderRow}
          >
            <View style={styles.sectionTitleGroup}>
              <Bot size={18} color="#f59e0b" />
              <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
                Secuencia Bot ({botProspects.length})
              </Text>
            </View>
            {showBotSection ? (
              <ChevronDown size={18} color={colors.textSecondary} />
            ) : (
              <ChevronRight size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {showBotSection && (
            <View style={{ gap: 8, marginTop: 10 }}>
              {botProspects.map(({ client, info }) => {
                const lastRem = info.level > 0 ? info.remindersMap[info.level] : null;
                const pushSt = getDeliveryBadge(lastRem?.bot_push_status);
                const emailSt = getDeliveryBadge(lastRem?.bot_email_status);

                return (
                  <TouchableOpacity
                    key={`bot-${client.id}`}
                    onPress={() => setBotModalClient(client)}
                    style={[
                      styles.botProspectRow,
                      {
                        borderColor:
                          info.urgency === 1 ? '#ef444444' : colors.border,
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.03)'
                          : 'rgba(0,0,0,0.03)',
                      },
                    ]}
                  >
                    <AvatarCircle
                      name={client.name || client.username}
                      uri={client.profile_image_url}
                      size={38}
                      tint={colors.tint}
                      isDark={isDark}
                    />
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={styles.topLine}>
                        <Text
                          numberOfLines={1}
                          style={{ color: colors.text, fontWeight: '700', fontSize: 14, flex: 1 }}
                        >
                          {client.name || client.username}
                        </Text>
                        <View style={styles.dotsRow}>
                          {[1, 2, 3].map(step => (
                            <View
                              key={step}
                              style={[
                                styles.stepDot,
                                {
                                  backgroundColor:
                                    info.level >= step
                                      ? '#f59e0b'
                                      : isDark
                                        ? 'rgba(255,255,255,0.18)'
                                        : 'rgba(0,0,0,0.14)',
                                },
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                      <View style={styles.botSubRow}>
                        <Clock
                          size={12}
                          color={info.urgency === 1 ? '#ef4444' : '#f59e0b'}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: info.urgency === 1 ? '#ef4444' : '#f59e0b',
                          }}
                        >
                          {info.label}
                        </Text>
                        {lastRem && (
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                            · Push: {pushSt.label} · Mail: {emailSt.label}
                          </Text>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </AdminCard>
      )}

      {/* Active Chats */}
      {!loading && activeChats.length === 0 ? (
        <AdminCard>
          <AdminText secondary>No hay chats activos con el filtro actual.</AdminText>
        </AdminCard>
      ) : (
        <View style={{ gap: 10 }}>
          {activeChats.map(client => renderClientCard(client, false))}
        </View>
      )}

      {/* Carpeta de Cerrados */}
      {closedChats.length > 0 && (
        <View style={{ gap: 8, marginTop: 4 }}>
          <TouchableOpacity
            onPress={() => setShowClosedFolder(v => !v)}
            style={[
              styles.closedFolderToggle,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.sectionTitleGroup}>
              <Archive size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                Carpeta de Cerrados ({closedChats.length})
              </Text>
            </View>
            {showClosedFolder ? (
              <ChevronDown size={16} color={colors.textSecondary} />
            ) : (
              <ChevronRight size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {showClosedFolder && (
            <View style={{ gap: 10 }}>
              {closedChats.map(client => renderClientCard(client, true))}
            </View>
          )}
        </View>
      )}

      {/* Conversation Modal */}
      <Modal
        visible={Boolean(activeClient)}
        animationType="slide"
        onRequestClose={() => setActiveClient(null)}
      >
        <View style={{ flex: 1 }}>
          <ModalThemeBackground theme={theme} />
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header */}
            <View
              style={[
                styles.chatModalHeader,
                {
                  paddingTop: Math.max(insets.top, 14),
                  borderBottomColor: modalBorderColor,
                  backgroundColor: modalCardColor,
                },
              ]}
            >
              <AvatarCircle
                name={activeClient?.name || activeClient?.username}
                uri={activeClient?.profile_image_url}
                size={40}
                online={isUserOnline(activeClient?.lastSeen)}
                tint={colors.tint}
                isDark={isDark}
              />

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}
                >
                  {activeClient?.name || activeClient?.username}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: colors.textSecondary, fontSize: 12 }}
                >
                  @{activeClient?.username} ·{' '}
                  {isUserOnline(activeClient?.lastSeen)
                    ? 'En línea'
                    : formatLastSeen(activeClient?.lastSeen)}
                </Text>
              </View>

              {activeClient?.role === 'user' && (
                <GlassButton
                  theme={theme}
                  onPress={() => handleLinkToAsesoria(activeClient)}
                  style={{ height: 34, paddingHorizontal: 12, borderRadius: 17 }}
                >
                  <View style={styles.rowCenter}>
                    <UserPlus size={14} color={colors.tint} />
                    <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>
                      Añadir
                    </Text>
                  </View>
                </GlassButton>
              )}

              {isAdmin &&
                activeClient?.role === 'user' &&
                !isActiveChatClosed && (
                  <GlassButton
                    theme={theme}
                    onPress={() => {
                      const target = activeClient;
                      setActiveClient(null);
                      setTimeout(() => setBotModalClient(target), 150);
                    }}
                    style={{ width: 34, height: 34, paddingHorizontal: 0, borderRadius: 17 }}
                  >
                    <Bot size={16} color="#f59e0b" />
                  </GlassButton>
                )}

              <LiquidCloseButton
                accessibilityLabel="Cerrar chat"
                onPress={() => setActiveClient(null)}
                iconColor={colors.text}
              />
            </View>

            {isActiveChatClosed && (
              <View
                style={[
                  styles.closedBanner,
                  {
                    backgroundColor: '#f59e0b18',
                    borderBottomColor: '#f59e0b44',
                  },
                ]}
              >
                <Archive size={14} color="#f59e0b" />
                <Text style={{ color: colors.text, fontSize: 12, flex: 1 }}>
                  Conversación cerrada por inactividad. Enviar un mensaje reactivará el contacto.
                </Text>
              </View>
            )}

            {/* Messages */}
            {loadingHistory ? (
              <View style={styles.centerFlex}>
                <ActivityIndicator color={colors.tint} />
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.centerFlex}>
                <MessageCircle size={34} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 10, fontSize: 14 }}>
                  Aún no hay mensajes en esta conversación.
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, idx) => String(item.id || idx)}
                contentContainerStyle={styles.messagesContainer}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: false })
                }
                renderItem={({ item: msg, index }) => {
                  const isClientSender =
                    Boolean(activeClient) &&
                    String(msg.sender_id) === String(activeClient?.id);
                  const isBot = !isClientSender && msg.attachment_type === 'bot_reply';
                  const showDate =
                    index === 0 ||
                    new Date(msg.created_at).toDateString() !==
                      new Date(messages[index - 1].created_at).toDateString();
                  const hasVideo = Boolean(
                    msg.attachment_url &&
                      (msg.attachment_type?.startsWith('video/') ||
                        /\.(mp4|mov|webm|m4v)(\?|$)/i.test(msg.attachment_url))
                  );
                  const bubbleTextColor = isClientSender ? colors.text : accentText;

                  return (
                    <View>
                      {showDate && (
                        <View style={styles.dateSeparator}>
                          <View
                            style={[
                              styles.dateBadge,
                              {
                                backgroundColor: modalCardColor,
                                borderColor: modalBorderColor,
                              },
                            ]}
                          >
                            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                              {formatDateSeparator(msg.created_at)}
                            </Text>
                          </View>
                        </View>
                      )}

                      <View
                        style={[
                          styles.msgRow,
                          isClientSender ? styles.msgRowLeft : styles.msgRowRight,
                        ]}
                      >
                        <View
                          style={[
                            styles.bubble,
                            isClientSender
                              ? {
                                  backgroundColor: modalCardColor,
                                  borderColor: modalBorderColor,
                                  borderWidth: 1,
                                  borderBottomLeftRadius: 6,
                                }
                              : {
                                  backgroundColor: colors.tint,
                                  borderBottomRightRadius: 6,
                                },
                          ]}
                        >
                          {isBot && (
                            <View style={styles.botBubbleHeader}>
                              <View style={styles.rowCenter}>
                                <Bot size={13} color={bubbleTextColor} />
                                <Text
                                  style={{
                                    color: bubbleTextColor,
                                    fontSize: 11,
                                    fontWeight: '800',
                                    opacity: 0.9,
                                  }}
                                >
                                  Bot Coordinador
                                </Text>
                              </View>
                              <TouchableOpacity
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={() => {
                                  setEditingBotMsg(msg);
                                  setEditBotText(msg.content);
                                }}
                              >
                                <Edit3 size={13} color={bubbleTextColor} />
                              </TouchableOpacity>
                            </View>
                          )}

                          {hasVideo && (
                            <ChatVideoMessage
                              url={resolveMediaUrl(msg.attachment_url) || msg.attachment_url || ''}
                              accentColor={bubbleTextColor}
                              onOpenFullscreen={url => setFullscreenVideo(url)}
                            />
                          )}

                          {!!msg.content && (
                            <Text style={[styles.msgText, { color: bubbleTextColor }]}>
                              {msg.content}
                            </Text>
                          )}

                          <View style={styles.msgFooter}>
                            <Text
                              style={{
                                fontSize: 10,
                                color: isClientSender ? colors.textSecondary : bubbleTextColor,
                                opacity: isClientSender ? 1 : 0.78,
                              }}
                            >
                              {formatMessageTime(msg.created_at)}
                            </Text>

                            {!isClientSender && !msg.temp && (
                              msg.read_at ? (
                                <CheckCheck size={13} color={bubbleTextColor} style={{ opacity: 0.95 }} />
                              ) : (
                                <Check size={13} color={bubbleTextColor} style={{ opacity: 0.65 }} />
                              )
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}

            {/* Composer */}
            <View
              style={[
                styles.composerBar,
                {
                  paddingBottom: Math.max(insets.bottom, 12),
                  borderTopColor: modalBorderColor,
                  backgroundColor: modalCardColor,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => void handlePickVideo()}
                disabled={uploadingVideo}
                style={[
                  styles.attachBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                {uploadingVideo ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <Video size={20} color={colors.tint} />
                )}
              </TouchableOpacity>

              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Escribe una respuesta..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={2000}
                style={[
                  styles.composerInput,
                  {
                    color: colors.text,
                    borderColor: modalBorderColor,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)',
                  },
                ]}
              />

              <TouchableOpacity
                onPress={() => void handleSendMessage()}
                disabled={!draft.trim() || sending || uploadingVideo}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: colors.tint,
                    opacity: !draft.trim() || sending || uploadingVideo ? 0.45 : 1,
                  },
                ]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={accentText} />
                ) : (
                  <Send size={18} color={accentText} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>

        <FullscreenVideoModal
          visible={Boolean(fullscreenVideo)}
          url={fullscreenVideo}
          onClose={() => setFullscreenVideo(null)}
        />
      </Modal>

      {/* Edit Bot Message Modal */}
      <Modal
        visible={Boolean(editingBotMsg)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingBotMsg(null)}
      >
        <View style={styles.centerOverlay}>
          <View
            style={[
              styles.dialogCard,
              { backgroundColor: modalCardColor, borderColor: modalBorderColor },
            ]}
          >
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>
                Editar mensaje del Bot
              </Text>
              <LiquidCloseButton
                accessibilityLabel="Cerrar editor"
                onPress={() => setEditingBotMsg(null)}
                iconColor={colors.text}
              />
            </View>

            <TextInput
              value={editBotText}
              onChangeText={setEditBotText}
              multiline
              style={[
                styles.editBotInput,
                {
                  color: colors.text,
                  borderColor: modalBorderColor,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                },
              ]}
            />

            <View style={styles.dialogActions}>
              <AdminButton label="Cancelar" onPress={() => setEditingBotMsg(null)} />
              <AdminButton
                label={savingBotEdit ? 'Guardando...' : 'Guardar'}
                variant="primary"
                disabled={savingBotEdit || !editBotText.trim()}
                onPress={() => void handleSaveBotEdit()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Bot Sequence Timeline Modal */}
      <Modal
        visible={Boolean(botModalClient)}
        transparent
        animationType="slide"
        onRequestClose={() => setBotModalClient(null)}
      >
        <View style={styles.centerOverlay}>
          <View
            style={[
              styles.dialogCard,
              {
                backgroundColor: modalCardColor,
                borderColor: modalBorderColor,
                maxHeight: '85%',
              },
            ]}
          >
            <View style={styles.dialogHeader}>
              <View style={styles.rowCenter}>
                <Bot size={20} color="#f59e0b" />
                <Text style={[styles.dialogTitle, { color: colors.text }]}>
                  Secuencia Bot · {botModalClient?.name || botModalClient?.username}
                </Text>
              </View>
              <LiquidCloseButton
                accessibilityLabel="Cerrar secuencia bot"
                onPress={() => setBotModalClient(null)}
                iconColor={colors.text}
              />
            </View>

            {botModalInfo ? (
              <View style={{ gap: 12 }}>
                <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '700' }}>
                  Próximo paso: {botModalInfo.label}
                </Text>

                {([1, 2, 3] as const).map(lvl => {
                  const sentMsg = botModalInfo.remindersMap[lvl];
                  const isSent = Boolean(sentMsg) || botModalInfo.level >= lvl;
                  const canForce = !isSent && botModalInfo.level === lvl - 1;
                  const pushBadge = getDeliveryBadge(sentMsg?.bot_push_status);
                  const emailBadge = getDeliveryBadge(sentMsg?.bot_email_status);

                  return (
                    <View
                      key={lvl}
                      style={[
                        styles.timelineStepCard,
                        {
                          borderColor: isSent ? '#f59e0b55' : modalBorderColor,
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(0,0,0,0.03)',
                        },
                      ]}
                    >
                      <View style={styles.topLine}>
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                          Aviso {lvl} ({lvl === 1 ? '72h' : lvl === 2 ? '48h' : '24h'})
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: isSent ? '#22c55e' : colors.textSecondary,
                          }}
                        >
                          {isSent
                            ? sentMsg
                              ? formatChatListTime(sentMsg.created_at)
                              : 'Enviado'
                            : canForce
                              ? 'Siguiente'
                              : 'En cola'}
                        </Text>
                      </View>

                      {isSent && botModalClient && (
                        <View style={styles.deliveryRow}>
                          <TouchableOpacity
                            disabled={busyReminder}
                            onPress={() =>
                              handleResendReminderChannel(botModalClient, lvl, 'push')
                            }
                            style={[
                              styles.deliveryPill,
                              { borderColor: pushBadge.color + '66' },
                            ]}
                          >
                            <Bell size={12} color={pushBadge.color} />
                            <Text style={{ color: pushBadge.color, fontSize: 11, fontWeight: '700' }}>
                              Push: {pushBadge.label}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            disabled={busyReminder}
                            onPress={() =>
                              handleResendReminderChannel(botModalClient, lvl, 'email')
                            }
                            style={[
                              styles.deliveryPill,
                              { borderColor: emailBadge.color + '66' },
                            ]}
                          >
                            <Mail size={12} color={emailBadge.color} />
                            <Text style={{ color: emailBadge.color, fontSize: 11, fontWeight: '700' }}>
                              Email: {emailBadge.label}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {canForce && botModalClient && (
                        <View style={{ marginTop: 8 }}>
                          <AdminButton
                            label={busyReminder ? 'Enviando...' : `Forzar Aviso ${lvl}`}
                            icon={Sparkles}
                            disabled={busyReminder}
                            onPress={() => void handleForceBotReminder(botModalClient, lvl)}
                          />
                        </View>
                      )}
                    </View>
                  );
                })}

                <AdminButton
                  label="Abrir Chat"
                  variant="primary"
                  icon={MessageCircle}
                  onPress={() => {
                    const target = botModalClient;
                    setBotModalClient(null);
                    if (target) setTimeout(() => void openChat(target), 150);
                  }}
                />
              </View>
            ) : (
              <AdminText secondary>
                Este usuario ya no tiene una secuencia de seguimiento pendiente.
              </AdminText>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default TrainerChats;

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionPageTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  refreshStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  previewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  miniActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  botProspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  botSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  closedFolderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chatModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  centerFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  messagesContainer: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: StyleSheet.hairlineWidth,
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    gap: 4,
  },
  botBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  msgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  centerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dialogCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    flexShrink: 1,
  },
  editBotInput: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  timelineStepCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  deliveryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
});
