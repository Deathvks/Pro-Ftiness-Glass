import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Send,
  Paperclip,
  User,
  Check,
  CheckCheck,
  MessageCircle,
  ClipboardList,
  Sparkles,
  BarChart3,
  Bot,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react-native';

import apiClient, { BACKEND_BASE_URL } from '@/services/apiClient';
import { initSocket } from '@/services/socket';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import ThemeBackground from '@/components/ThemeBackground';
import TrainerProfileModal from '@/components/TrainerProfileModal';
import { GlassButton } from '@/components/ui/GlassButton';
import ChatVideoMessage from '@/components/chat/ChatVideoMessage';
import FullscreenVideoModal from '@/components/chat/FullscreenVideoModal';

interface TrainerInfo {
  id: string | number;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface ChatMessage {
  id: string | number;
  sender_id: string | number;
  receiver_id: string | number;
  content: string;
  created_at: string;
  read_at?: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  temp?: boolean;
  is_closed?: boolean;
}

const getFullMediaUrl = (path: string | null | undefined) => {
  if (!path || path === 'null') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('blob:') || path.startsWith('file:')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
};

const formatTime = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatDateHeader = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString([], {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  } catch {
    return '';
  }
};

export default function AsesoriaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastText = getContrastTextColor(colors.tint);

  const userProfile = useAppStore(state => state.userProfile);
  const userId = userProfile?.id;
  const isTrainee =
    userProfile?.role === 'trainee' ||
    userProfile?.role === 'trainer' ||
    userProfile?.role === 'admin';

  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTrainerProfile, setShowTrainerProfile] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Mark messages as read in backend and update store count
  const markAsRead = useCallback(async (otherId: string | number) => {
    try {
      await apiClient(`/chat/mark-read/${otherId}`, { method: 'POST' });
      const fetchUnreadChats = useAppStore.getState().fetchUnreadChats;
      if (fetchUnreadChats) fetchUnreadChats();
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  }, []);

  // Fetch trainer & chat history
  const fetchData = useCallback(async () => {
    try {
      setHasError(false);

      // Load cached first if present
      const [savedTrainer, savedMsgs] = await Promise.all([
        AsyncStorage.getItem('pfg_asesoria_trainer'),
        AsyncStorage.getItem('pfg_asesoria_messages'),
      ]);

      if (savedTrainer) {
        try {
          const parsed = JSON.parse(savedTrainer);
          setTrainer(parsed);
        } catch (_) {}
      }

      if (savedMsgs) {
        try {
          const parsedMsgs = JSON.parse(savedMsgs);
          if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) {
            setMessages(parsedMsgs);
            setLoading(false);
          }
        } catch (_) {}
      }

      // Fetch fresh data from backend
      const trainerRes = await apiClient('/chat/trainer-info');
      if (trainerRes) {
        setTrainer(trainerRes);
        AsyncStorage.setItem('pfg_asesoria_trainer', JSON.stringify(trainerRes));
      }

      const activeTrainerId = trainerRes?.id || (savedTrainer ? JSON.parse(savedTrainer)?.id : null);
      if (activeTrainerId) {
        const historyData = await apiClient(`/chat/history/${activeTrainerId}`);
        const msgs = Array.isArray(historyData) ? historyData : [];
        setMessages(msgs);
        AsyncStorage.setItem('pfg_asesoria_messages', JSON.stringify(msgs));
        markAsRead(activeTrainerId);
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
      if (messages.length === 0) {
        setHasError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [markAsRead, messages.length]);

  // Handle incoming socket message
  const handleNewMessage = useCallback(
    (message: any) => {
      if (!message) return;
      if (message.type === 'refresh') {
        fetchData();
        return;
      }
      const currentUserId = useAppStore.getState().userProfile?.id;
      if (message.sender_id && String(message.sender_id) !== String(currentUserId)) {
        markAsRead(message.sender_id);
      }
      setMessages(prev => {
        if (message.id && prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    },
    [fetchData, markAsRead]
  );

  // Handle socket messages_read
  const handleMessagesRead = useCallback(({ byUserId }: { byUserId: string | number }) => {
    setMessages(prev =>
      prev.map(msg =>
        String(msg.receiver_id) === String(byUserId) && !msg.read_at
          ? { ...msg, read_at: new Date().toISOString() }
          : msg
      )
    );
  }, []);

  // Setup sockets
  useEffect(() => {
    fetchData();

    const socket = initSocket();
    if (socket) {
      socket.on('chat_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);
    }

    return () => {
      if (socket) {
        socket.off('chat_message', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
      }
    };
  }, [fetchData, handleNewMessage, handleMessagesRead]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !trainer || uploading) return;

    const content = newMessage.trim();
    setNewMessage('');

    const tempId = 'temp-' + Date.now();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender_id: userId || 'me',
      receiver_id: trainer.id,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
      temp: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await apiClient('/chat/send', {
        method: 'POST',
        body: { receiverId: trainer.id, content },
      });

      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === tempId ? { ...res, read_at: msg.read_at || res.read_at } : msg
        );
        if (res?.botReply && !updated.some(m => m.id === res.botReply.id)) {
          return [...updated, res.botReply];
        }
        return updated;
      });

      if (res?.botReply && trainer?.id) {
        markAsRead(trainer.id);
      }
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje.');
      setNewMessage(content);
    }
  };

  // Video attachment picker and uploader
  const handlePickVideo = async () => {
    if (!trainer || uploading) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso necesario',
          'Se necesita acceso a tus vídeos para enviar revisiones de técnica a tu entrenador.'
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
      if (asset.fileSize && asset.fileSize > 150 * 1024 * 1024) {
        Alert.alert('Archivo demasiado grande', 'El vídeo supera el límite de 150MB.');
        return;
      }

      setUploading(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const ext = asset.uri.split('.').pop() || 'mp4';
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || `workout_${Date.now()}.${ext}`,
        type: asset.mimeType || `video/${ext === 'mov' ? 'quicktime' : 'mp4'}`,
      } as any);
      formData.append('receiverId', String(trainer.id));

      const sentMessage = await apiClient('/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        scrollToBottom();
      }
    } catch (error: any) {
      console.error('Error al subir vídeo:', error);
      Alert.alert('Error', error?.message || 'Error al subir el vídeo.');
    } finally {
      setUploading(false);
    }
  };

  // Non-trainee consultation request
  const handleRequestInfo = async () => {
    if (!trainer) return;
    const content =
      'Hola, me gustaría solicitar información sin compromiso sobre la asesoría personal.';

    const tempId = 'temp-' + Date.now();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender_id: userId || 'me',
      receiver_id: trainer.id,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
      temp: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await apiClient('/chat/send', {
        method: 'POST',
        body: { receiverId: trainer.id, content },
      });

      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === tempId ? { ...res, read_at: msg.read_at || res.read_at } : msg
        );
        if (res?.botReply && !updated.some(m => m.id === res.botReply.id)) {
          return [...updated, res.botReply];
        }
        return updated;
      });

      if (res?.botReply && trainer?.id) {
        markAsRead(trainer.id);
      }
      scrollToBottom();
    } catch (error) {
      console.error('Error al solicitar info:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    }
  };

  // Determine chat blocking and promo state
  let isChatBlocked = false;
  let showPromo = false;
  let blockMessage = '';

  if (!isTrainee && !loading && trainer) {
    if (messages.length === 0) {
      showPromo = true;
      isChatBlocked = true;
    } else {
      showPromo = false;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && String(lastMsg.sender_id) === String(userProfile?.id)) {
        isChatBlocked = true;
        blockMessage = 'Esperando respuesta del entrenador...';
      } else {
        isChatBlocked = false;
      }
    }
  }

  // Render Bot message with push notifications link
  const renderMessageContent = (msg: ChatMessage, isMe: boolean) => {
    if (msg.attachment_type === 'bot_reply') {
      const parts = msg.content.split('[notificaciones push]');
      if (parts.length > 1) {
        return (
          <Text style={[styles.messageText, { color: isMe ? contrastText : colors.text }]}>
            {parts[0]}
            <Text
              style={[styles.linkText, { color: colors.tint }]}
              onPress={() => router.push('/settings')}
            >
              notificaciones push
            </Text>
            {parts[1]}
          </Text>
        );
      }
    }

    return (
      <Text style={[styles.messageText, { color: isMe ? contrastText : colors.text }]}>
        {msg.content}
      </Text>
    );
  };

  // Render Promo Card for non-trainees
  const renderPromoCard = () => (
    <View style={styles.promoContainer}>
      <View
        style={[
          styles.promoCard,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderColor: colors.tint + '40',
          },
        ]}
      >
        <Text style={[styles.promoTitle, { color: colors.text }]}>
          Da el salto en tu transformación
        </Text>

        <View style={styles.promoFeatures}>
          <View style={styles.promoItem}>
            <View style={[styles.promoIconWrap, { backgroundColor: colors.tint + '1a' }]}>
              <MessageCircle size={18} color={colors.tint} />
            </View>
            <Text style={[styles.promoDesc, { color: colors.textSecondary }]}>
              El entrenador personal estará siempre disponible para resolver tus dudas y ayudarte a dar un paso más.
            </Text>
          </View>

          <View style={styles.promoItem}>
            <View style={[styles.promoIconWrap, { backgroundColor: colors.tint + '1a' }]}>
              <ClipboardList size={18} color={colors.tint} />
            </View>
            <Text style={[styles.promoDesc, { color: colors.textSecondary }]}>
              Acceso a rutinas 100% personalizadas o ajustadas por el entrenador según tu caso particular.
            </Text>
          </View>

          <View style={styles.promoItem}>
            <View style={[styles.promoIconWrap, { backgroundColor: colors.tint + '1a' }]}>
              <Sparkles size={18} color={colors.tint} />
            </View>
            <Text style={[styles.promoDesc, { color: colors.textSecondary }]}>
              Dieta y comidas: el entrenador se encargará de ajustarlo todo a tus objetivos con opciones personalizadas.
            </Text>
          </View>

          <View style={styles.promoItem}>
            <View style={[styles.promoIconWrap, { backgroundColor: colors.tint + '1a' }]}>
              <BarChart3 size={18} color={colors.tint} />
            </View>
            <Text style={[styles.promoDesc, { color: colors.textSecondary }]}>
              Seguimiento continuo mientras mantengas activa la asesoría.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.requestBtn, { backgroundColor: colors.tint }]}
          onPress={handleRequestInfo}
          activeOpacity={0.85}
        >
          <Text style={[styles.requestBtnText, { color: contrastText }]}>
            Solicitar hablar sin compromiso
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ThemeBackground />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 14),
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            backgroundColor: isDark ? 'rgba(10, 10, 15, 0.75)' : 'rgba(255, 255, 255, 0.85)',
          },
        ]}
      >
        <GlassButton
          style={styles.backButton}
          onPress={() => router.back()}
          theme={theme}
          noShadow
        >
          <ChevronLeft size={23} color={colors.text} strokeWidth={2.3} accessibilityLabel="Volver" />
        </GlassButton>

        {loading && !trainer ? (
          <View style={styles.headerLoading}>
            <View
              style={[
                styles.headerAvatarSkeleton,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            />
            <View style={{ gap: 4 }}>
              <View
                style={[
                  styles.headerNameSkeleton,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              />
              <View
                style={[
                  styles.headerHandleSkeleton,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              />
            </View>
          </View>
        ) : trainer ? (
          <TouchableOpacity
            style={styles.headerProfileBtn}
            onPress={() => setShowTrainerProfile(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.headerAvatarWrap, { borderColor: colors.tint }]}>
              {trainer.profile_image_url ? (
                <Image
                  source={{ uri: getFullMediaUrl(trainer.profile_image_url) || '' }}
                  style={styles.headerAvatar}
                  contentFit="cover"
                />
              ) : (
                <Image
                  source={require('@/assets/images/trainer-profile.jpg')}
                  style={styles.headerAvatar}
                  contentFit="cover"
                />
              )}
            </View>
            <View>
              <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
                {trainer.name}
              </Text>
              <Text style={[styles.headerUsername, { color: colors.textSecondary }]}>
                @{trainer.username}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.headerName, { color: colors.text }]}>Asesoría</Text>
        )}

        {trainer && (
          <TouchableOpacity
            style={[
              styles.infoButton,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
            ]}
            onPress={() => setShowTrainerProfile(true)}
            activeOpacity={0.8}
          >
            <Info size={18} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Conversation Container with Keyboard Avoidance */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        {loading && messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Conectando con tu asesoría...
            </Text>
          </View>
        ) : hasError ? (
          <View style={styles.centerContainer}>
            <View style={[styles.errorCircle, { backgroundColor: '#f59e0b1f' }]}>
              <AlertCircle size={32} color="#f59e0b" />
            </View>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              No se pudo cargar la conversación
            </Text>
            <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
              El servidor tardó en responder. Puedes reintentar la conexión de inmediato.
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.tint }]}
              onPress={fetchData}
              activeOpacity={0.8}
            >
              <RefreshCw size={16} color={contrastText} />
              <Text style={[styles.retryBtnText, { color: contrastText }]}>Reintentar conexión</Text>
            </TouchableOpacity>
          </View>
        ) : messages.length === 0 && !showPromo ? (
          <View style={styles.centerContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              ]}
            >
              <User size={36} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Comienza tu asesoría personal con tu Entrenador.
            </Text>
            <TouchableOpacity
              onPress={() => setShowTrainerProfile(true)}
              style={styles.viewProfileBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewProfileBtnText, { color: colors.tint }]}>Ver perfil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => String(item.id || index)}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={showPromo ? renderPromoCard() : undefined}
            renderItem={({ item: msg, index }) => {
              const isMe = String(msg.sender_id) === String(userId);
              const showDate =
                index === 0 ||
                new Date(msg.created_at).toDateString() !==
                  new Date(messages[index - 1].created_at).toDateString();
              const isBot = !isMe && msg.attachment_type === 'bot_reply';

              return (
                <View key={msg.id || index}>
                  {/* Date separator */}
                  {showDate && (
                    <View style={styles.dateSeparator}>
                      <View
                        style={[
                          styles.dateBadge,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.05)',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                          },
                        ]}
                      >
                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                          {formatDateHeader(msg.created_at)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Message Row */}
                  <View
                    style={[
                      styles.messageRow,
                      isMe ? styles.messageRowMe : styles.messageRowOther,
                    ]}
                  >
                    {/* Bot Avatar */}
                    {isBot && (
                      <View style={[styles.botAvatar, { backgroundColor: colors.tint + '20' }]}>
                        <Bot size={18} color={colors.tint} />
                      </View>
                    )}

                    {/* Bubble */}
                    <View
                      style={[
                        styles.messageBubble,
                        isMe
                          ? [styles.bubbleMe, { backgroundColor: colors.tint }]
                          : [
                              styles.bubbleOther,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.06)'
                                  : 'rgba(255, 255, 255, 0.9)',
                                borderColor: isDark
                                  ? 'rgba(255, 255, 255, 0.12)'
                                  : 'rgba(0, 0, 0, 0.08)',
                              },
                            ],
                      ]}
                    >
                      {/* Bot Header */}
                      {isBot && (
                        <Text style={[styles.botHeaderLabel, { color: colors.tint }]}>
                          Coordinador
                        </Text>
                      )}

                      {/* Video attachment */}
                      {Boolean(msg.attachment_url && msg.attachment_type?.startsWith('video/')) ? (
                        <ChatVideoMessage
                          url={getFullMediaUrl(msg.attachment_url) || msg.attachment_url || ''}
                          accentColor={isMe ? contrastText : colors.tint}
                          onOpenFullscreen={url => setFullscreenVideo(url)}
                        />
                      ) : null}

                      {/* Content */}
                      {msg.content ? renderMessageContent(msg, isMe) : null}

                      {/* Timestamp & Read Receipt */}
                      <View style={styles.bubbleFooter}>
                        <Text
                          style={[
                            styles.timeText,
                            {
                              color: isMe
                                ? (contrastText === '#000000' ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)')
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {formatTime(msg.created_at || new Date().toISOString())}
                        </Text>

                        {isMe && (
                          <View style={styles.receiptWrap}>
                            {msg.read_at ? (
                              <CheckCheck
                                size={14}
                                color={contrastText === '#000000' ? '#0284c7' : '#38bdf8'}
                                strokeWidth={2.5}
                              />
                            ) : (
                              <Check
                                size={14}
                                color={contrastText === '#000000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)'}
                                strokeWidth={2}
                              />
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input Bar or Blocked Notice */}
        {isChatBlocked ? (
          <View
            style={[
              styles.blockedContainer,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: isDark ? 'rgba(10, 10, 15, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <Text style={[styles.blockedNotice, { color: colors.textSecondary }]}>
              {blockMessage || 'El chat se encuentra bloqueado.'}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.inputBar,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: isDark ? 'rgba(10, 10, 15, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            {/* Video Attachment Button */}
            <TouchableOpacity
              onPress={handlePickVideo}
              disabled={uploading}
              style={[
                styles.attachBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              activeOpacity={0.7}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Paperclip size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Input Field */}
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Escribe un mensaje..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.textInput, { color: colors.text, maxHeight: 100 }]}
                multiline
                editable={!uploading}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!newMessage.trim() || uploading}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: colors.tint,
                  opacity: !newMessage.trim() || uploading ? 0.45 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              <Send size={18} color={contrastText} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Trainer Profile Modal */}
      <TrainerProfileModal
        visible={showTrainerProfile}
        onClose={() => setShowTrainerProfile(false)}
        trainer={trainer}
      />

      {/* Fullscreen Video Modal */}
      <FullscreenVideoModal
        visible={!!fullscreenVideo}
        url={fullscreenVideo}
        onClose={() => setFullscreenVideo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerAvatarSkeleton: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerNameSkeleton: {
    width: 100,
    height: 14,
    borderRadius: 6,
  },
  headerHandleSkeleton: {
    width: 60,
    height: 11,
    borderRadius: 5,
  },
  headerProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerName: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerUsername: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  errorCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
  viewProfileBtn: {
    marginTop: 10,
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  botHeaderLabel: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  linkText: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  receiptWrap: {
    marginLeft: 2,
  },
  promoContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  promoCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  promoFeatures: {
    gap: 14,
    marginBottom: 20,
  },
  promoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  promoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  promoDesc: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  requestBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  requestBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  blockedContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  blockedNotice: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 42,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
