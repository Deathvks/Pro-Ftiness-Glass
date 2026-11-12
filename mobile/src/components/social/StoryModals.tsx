import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import {
  Camera, Check, Clock, Globe, Heart, Image as ImageIcon, Shield, ShieldAlert, Sparkles, Trash2, Users, X, Zap,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassSwitch } from '@/components/ui/LiquidGlassSwitch';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import { getThemeBaseBackground, getThemeSurfaceMode, getUnselectedControlColors } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import { selectUserStories } from '@/store/storySlice';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { SocialUserAvatar } from './SocialUserAvatar';

export type StoryComposerStep = 'terms' | 'upload';
type StoryPrivacy = 'friends' | 'public';
export type StoryUploadFile = File | { uri: string; name: string; type: string };
const MAX_VIDEO_SECONDS = 15;
const MAX_STORY_BYTES = 50 * 1024 * 1024;
const STORY_ASPECT_RATIO = 9 / 16;
const PHOTO_PREVIEW_MAX_HEIGHT = 300;

const STORY_RULES = [
  { icon: Clock, label: 'Duración de 24 horas', text: 'Las historias se eliminan automáticamente al cabo de 24 horas.' },
  { icon: Shield, label: 'Privacidad', text: 'Tú eliges si tu historia la ven tus amigos o todos los usuarios.' },
  { icon: Sparkles, label: 'Moderación con IA', text: 'Las fotos se revisan automáticamente para bloquear contenido inapropiado.' },
];

const AUDIENCES = [
  { value: 'friends', icon: Users, label: 'Solo amigos' },
  { value: 'public', icon: Globe, label: 'Todo el mundo' },
] as const;

export function StoryComposerModal({ visible, step, session, busy, onClose, onAccept, onUpload }: {
  visible: boolean;
  step: StoryComposerStep;
  session: number;
  busy: boolean;
  onClose: () => void;
  onAccept: () => void;
  onUpload: (file: StoryUploadFile, privacy: StoryPrivacy, hdr: boolean) => Promise<string | undefined>;
}) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = getThemeSurfaceMode(theme) !== 'light';
  const background = getThemeBaseBackground(theme);
  const unselected = getUnselectedControlColors(theme);
  const terms = step === 'terms';
  const Icon = terms ? ShieldAlert : Camera;

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={background}
      sheetStyle={{ backgroundColor: background }}
      maxHeight="94%"
      scrollable
      dismissible={!busy}
    >
      <View style={styles.sheetHeader}>
        <View style={[styles.headerIcon, { backgroundColor: colors.tint + '18' }]}><Icon size={23} color={colors.tint} /></View>
        <Text accessibilityRole="header" style={[styles.sheetTitle, { color: colors.text }]}>{terms ? 'Historias' : 'Compartir historia'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" disabled={busy} onPress={onClose}
          style={({ pressed }) => [styles.iconButton, { backgroundColor: unselected.backgroundColor, opacity: busy || pressed ? 0.55 : 1 }]}>
          <X size={19} color={colors.textSecondary} />
        </Pressable>
      </View>
      <ScrollView key={step + ':' + session} contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {terms ? (
          <>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Antes de publicar tu primera historia, revisa cómo funciona.</Text>
            <View style={styles.group}>
              {STORY_RULES.map(({ icon, label, text }) => (
                <StoryRow key={label} icon={icon} label={label} description={text} />
              ))}
            </View>
            <StorySubmit label="Aceptar y continuar" onPress={onAccept} />
          </>
        ) : <StoryUploadForm busy={busy} isDark={isDark} onUpload={onUpload} />}
      </ScrollView>
    </SwipeableBottomSheet>
  );
}

function StoryRow({ icon: Icon, label, description, disabled, selected, onPress, children }: {
  icon: LucideIcon;
  label: string;
  description?: string;
  disabled?: boolean;
  selected?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const style = [
    styles.row,
    getUnselectedControlColors(theme),
    selected && { borderWidth: 1, borderColor: colors.tint, backgroundColor: colors.tint + '18' },
  ];
  const content = <>
    <View style={[styles.rowIcon, { backgroundColor: colors.tint + '18' }]}><Icon size={19} color={colors.tint} /></View>
    <View style={styles.rowCopy}>
      <Text style={[styles.rowTitle, { color: selected === false ? colors.textSecondary : colors.text }]}>{label}</Text>
      {!!description && <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{description}</Text>}
    </View>
    {selected && <Check size={18} color={colors.tint} />}
    {children}
  </>;
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable accessibilityRole={selected === undefined ? 'button' : 'radio'}
      accessibilityState={selected === undefined ? { disabled } : { checked: selected, disabled }}
      disabled={disabled} onPress={onPress} style={({ pressed }) => [style, pressed && { opacity: 0.72 }]}>
      {content}
    </Pressable>
  );
}

function StorySubmit({ label, disabled, busy, onPress }: {
  label: string; disabled?: boolean; busy?: boolean; onPress: () => void;
}) {
  const { tint } = useAppColors();
  const ink = getContrastTextColor(tint);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy }} disabled={disabled}
      onPress={onPress} style={({ pressed }) => [styles.submit, { backgroundColor: tint, opacity: disabled && !busy ? 0.42 : pressed ? 0.76 : 1 }]}>
      {busy && <ActivityIndicator size="small" color={ink} />}
      <Text style={[styles.submitText, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

function StoryUploadForm({ busy, isDark, onUpload }: {
  busy: boolean; isDark: boolean;
  onUpload: (file: StoryUploadFile, privacy: StoryPrivacy, hdr: boolean) => Promise<string | undefined>;
}) {
  const colors = useAppColors();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset>();
  const [privacy, setPrivacy] = useState<StoryPrivacy>('friends');
  const [hdr, setHDR] = useState(false);
  const [canUseHDR, setCanUseHDR] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [photoSize, setPhotoSize] = useState<{ width: number; height: number }>();
  const [error, setError] = useState<string>();
  const pending = useRef(false);
  const isVideo = asset?.type === 'video' || asset?.mimeType?.startsWith('video/');
  const canPublish = Boolean(asset && (!isVideo || videoReady));
  const photoAspect = photoSize && photoSize.width > 0 && photoSize.height > 0
    ? photoSize.width / photoSize.height
    : 1;

  const handleVideoMetadata = useCallback((metadata: { duration: number; hdr: boolean } | null) => {
    if (!metadata || !Number.isFinite(metadata.duration) || metadata.duration <= 0 || metadata.duration > MAX_VIDEO_SECONDS) {
      setVideoReady(false);
      setCanUseHDR(false);
      setHDR(false);
      setError(metadata && metadata.duration > MAX_VIDEO_SECONDS
        ? 'El vídeo no puede durar más de 15 segundos.'
        : 'No se pudo leer este vídeo. Prueba con otro archivo.');
      return;
    }
    setCanUseHDR(metadata.hdr);
    setHDR(metadata.hdr);
    setVideoReady(true);
  }, []);

  async function pickMedia(camera: boolean) {
    if (pending.current || busy) return;
    pending.current = true;
    setError(undefined);
    try {
      if (camera && Platform.OS !== 'web' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
        setError('Permite el acceso a la cámara en los ajustes del dispositivo.');
        return;
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images', 'videos'], allowsEditing: false, quality: 0.85, videoMaxDuration: MAX_VIDEO_SECONDS,
      };
      const result = await (camera ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options));
      if (result.canceled) return;
      const selected = result.assets[0];
      if (!selected) return;
      if ((selected.fileSize ?? selected.file?.size ?? 0) > MAX_STORY_BYTES) {
        setError('El archivo no puede superar los 50 MB.');
        return;
      }
      if ((selected.duration ?? 0) > MAX_VIDEO_SECONDS * 1000) {
        setError('El vídeo no puede durar más de 15 segundos.');
        return;
      }
      const video = selected.type === 'video' || selected.mimeType?.startsWith('video/');
      const potentialHDR = !video && (/^image\/(heic|heif|avif)$/i.test(selected.mimeType ?? '')
        || /\.(heic|heif|avif)(?:[?#]|$)/i.test(selected.fileName || selected.uri));
      setVideoReady(false);
      setCanUseHDR(potentialHDR);
      setHDR(potentialHDR);
      setPhotoSize({ width: selected.width, height: selected.height });
      setAsset(selected);
    } catch {
      setError('No se pudo abrir el selector de fotos y vídeos.');
    } finally {
      pending.current = false;
    }
  }

  async function submit() {
    if (!asset || !canPublish || busy || pending.current) return;
    pending.current = true;
    setError(undefined);
    try {
      setError(await onUpload(asset.file ?? {
        uri: asset.uri,
        name: asset.fileName || (isVideo ? 'story.mp4' : 'story.jpg'),
        type: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
      }, privacy, canUseHDR && hdr));
    } finally {
      pending.current = false;
    }
  }

  return (
    <>
      {asset ? (
        <View style={[
          styles.preview,
          isVideo
            ? styles.videoPreview
            : { aspectRatio: photoAspect, width: Math.min(360, PHOTO_PREVIEW_MAX_HEIGHT * photoAspect) },
        ]}>
          {isVideo
            ? <StoryVideoPreview key={asset.uri} uri={asset.uri} onMetadata={handleVideoMetadata} />
            : <Image key={asset.uri} accessibilityLabel="Vista previa de la historia" source={{ uri: asset.uri }}
                style={StyleSheet.absoluteFill} resizeMode="contain"
                onLoad={({ nativeEvent }) => {
                  const { width, height } = nativeEvent.source;
                  if (width > 0 && height > 0 && (width !== photoSize?.width || height !== photoSize?.height)) {
                    setPhotoSize({ width, height });
                  }
                }} />}
          <Pressable accessibilityRole="button" accessibilityLabel="Quitar archivo" disabled={busy} onPress={() => {
            setAsset(undefined);
            setHDR(false);
            setCanUseHDR(false);
            setVideoReady(false);
            setError(undefined);
          }} style={[styles.iconButton, styles.removeMedia, busy && { opacity: 0.5 }]}>
            <X size={18} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.group}>
          <StoryRow icon={ImageIcon} label="Galería" description="Elige una foto o un vídeo" onPress={() => void pickMedia(false)} />
          <StoryRow icon={Camera} label="Cámara" description="Haz una foto o graba un vídeo" onPress={() => void pickMedia(true)} />
        </View>
      )}
      <View style={styles.group}>
        <Text accessibilityRole="header" style={[styles.rowTitle, { color: colors.text }]}>¿Quién puede verla?</Text>
        {AUDIENCES.map(({ value, icon, label }) => (
          <StoryRow key={value} icon={icon} label={label} selected={privacy === value}
            disabled={busy} onPress={() => setPrivacy(value)} />
        ))}
      </View>
      {canUseHDR && <StoryRow icon={Zap} label="HDR">
        <LiquidGlassSwitch accessibilityLabel="HDR" value={hdr} onValueChange={setHDR} disabled={busy} tintColor={colors.tint} isDark={isDark} />
      </StoryRow>}
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Las fotos se revisan automáticamente antes de publicarse. Los vídeos pueden durar hasta 15 segundos.</Text>
      {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.bodyText, { color: isDark ? '#fca5a5' : '#b91c1c' }]}>{error}</Text>}
      {asset && isVideo && !videoReady && !error && (
        <Text accessibilityLiveRegion="polite" style={[styles.bodyText, { color: colors.textSecondary }]}>Preparando vídeo…</Text>
      )}
      <StorySubmit label={busy ? 'Publicando…' : 'Publicar historia'} disabled={!canPublish || busy} busy={busy} onPress={() => void submit()} />
    </>
  );
}

function StoryVideoPreview({ uri, onMetadata }: {
  uri: string; onMetadata: (metadata: { duration: number; hdr: boolean } | null) => void;
}) {
  const player = useVideoPlayer(uri, instance => {
    instance.muted = true;
    instance.loop = true;
    instance.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const source = useEvent(player, 'sourceLoad');
  const reported = useRef(false);

  useEffect(() => {
    if (status === 'error') {
      onMetadata(null);
    } else if (!reported.current && (source || status === 'readyToPlay')) {
      reported.current = true;
      const tracks = source?.availableVideoTracks ?? player.availableVideoTracks ?? [];
      onMetadata({
        duration: source?.duration ?? player.duration,
        hdr: tracks.some(track => track.videoRange === 'hlg' || track.videoRange === 'pq'),
      });
    }
  }, [onMetadata, player, source, status]);

  return <VideoView player={player} style={StyleSheet.absoluteFill} surfaceType="textureView" contentFit="contain" nativeControls={false} />;
}

function StoryPlaybackVideo({ uri, onReady, onError }: { uri: string; onReady: () => void; onError: () => void }) {
  const player = useVideoPlayer(uri, instance => {
    instance.muted = true;
    instance.loop = true;
    instance.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const reportedError = useRef(false);

  useEffect(() => {
    if (status === 'error' && !reportedError.current) {
      reportedError.current = true;
      onError();
    }
  }, [status, onError]);

  return <VideoView player={player} style={StyleSheet.absoluteFill} surfaceType="textureView"
    contentFit="contain" nativeControls={false} onFirstFrameRender={onReady} />;
}

export function StoryViewerModal({
  userId,
  onClose,
}: {
  userId: string | number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const [viewerSize, setViewerSize] = useState<{ width: number; height: number }>();
  const frameWidth = Math.min(viewerSize?.width ?? window.width, (viewerSize?.height ?? window.height) * STORY_ASPECT_RATIO);
  const userProfile = useAppStore(state => state.userProfile);
  const group = useAppStore(state => state.stories.find((story: { userId: string | number }) => String(story.userId) === String(userId)));
  const items = useAppStore(state => selectUserStories(state, userId));
  const likeStory = useAppStore(state => state.likeStory);
  const markStoryAsViewed = useAppStore(state => state.markStoryAsViewed);
  const deleteMyStory = useAppStore(state => state.deleteMyStory);

  const isMe = String(userId) === String(userProfile?.id);

  // Get current user's story items
  const storyUser = isMe
    ? {
        userId: userProfile?.id,
        username: userProfile?.username || 'Yo',
        avatar: userProfile?.profile_image_url || userProfile?.avatar,
        role: userProfile?.role,
        trainer_id: userProfile?.trainer_id,
        user: userProfile,
      }
    : group;

  const [index, setCurrentIndex] = useState(() => Math.max(0, items.findIndex((item: { viewed: boolean }) => !item.viewed)));
  const currentIndex = Math.min(index, items.length - 1);
  const [progressAnim] = useState(() => new Animated.Value(0));
  const [mediaState, setMediaState] = useState<{ id: string | number; failed: boolean }>();

  const currentStory = items[currentIndex];
  const storyId = currentStory?.id;
  const mediaFailed = mediaState?.id === storyId && mediaState?.failed;
  const mediaReady = mediaState?.id === storyId && mediaState?.failed === false;

  useEffect(() => {
    if (!items.length) onClose();
  }, [items.length, onClose]);

  useEffect(() => {
    progressAnim.setValue(0);
    if (storyId == null || !mediaReady) return;
    void markStoryAsViewed(userId, storyId);

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: true,
      isInteraction: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        if (currentIndex < items.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          onClose();
        }
      }
    });

    return () => animation.stop();
  }, [currentIndex, items.length, markStoryAsViewed, mediaReady, onClose, progressAnim, storyId, userId]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleLike = () => {
    if (userId && currentStory?.id) {
      likeStory(userId, currentStory.id);
    }
  };

  const handleDelete = () => {
    if (currentStory?.id) {
      deleteMyStory(currentStory.id);
      if (items.length <= 1) {
        onClose();
      } else {
        setCurrentIndex(Math.min(currentIndex, items.length - 2));
      }
    }
  };

  if (!storyUser || !currentStory) return null;

  let mediaUrl = currentStory?.media_url || currentStory?.url || '';
  if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('blob:')) {
    const clean = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;
    mediaUrl = `${BACKEND_BASE_URL}${clean}`;
  }

  const isLiked = currentStory?.isLiked || (Array.isArray(currentStory?.likes) && currentStory.likes.some((l: any) => String(l.userId || l.id) === String(userProfile?.id)));
  const likesCount = Array.isArray(currentStory?.likes) ? currentStory.likes.length : 0;
  const isVideo =
    currentStory?.type === 'video' ||
    (Boolean(mediaUrl) && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.mov')));

  return (
    <Modal visible presentationStyle="fullScreen" statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={onClose}>
      <StatusBar style="light" />
      <View style={styles.viewerContainer} onLayout={({ nativeEvent: { layout: { width, height } } }) => {
        if (width > 0 && height > 0) setViewerSize(previous => previous?.width === width && previous.height === height ? previous : { width, height });
      }}>
        {/* Story Media */}
        <View pointerEvents="none" style={[styles.storyFrame, { width: frameWidth, aspectRatio: STORY_ASPECT_RATIO }]}>
          {mediaUrl && !mediaFailed ? (
            isVideo ? (
              <StoryPlaybackVideo key={storyId} uri={mediaUrl}
                onReady={() => setMediaState({ id: storyId, failed: false })}
                onError={() => setMediaState({ id: storyId, failed: true })} />
            ) : (
              <Image
                key={storyId}
                source={{ uri: mediaUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
                onLoad={() => setMediaState({ id: storyId, failed: false })}
                onError={() => setMediaState({ id: storyId, failed: true })}
              />
            )
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#9ca3af' }}>No se pudo cargar el archivo</Text>
            </View>
          )}
          {mediaUrl && !mediaReady && !mediaFailed ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
              <ActivityIndicator accessibilityLabel="Cargando historia" color="#fff" />
            </View>
          ) : null}
        </View>

        {/* Tap areas for Prev / Next */}
        <View style={StyleSheet.absoluteFill}>
          <Pressable accessibilityRole="button" accessibilityLabel="Historia anterior" disabled={currentIndex === 0} style={styles.tapLeft} onPress={handlePrev} />
          <Pressable accessibilityRole="button" accessibilityLabel="Siguiente historia" style={styles.tapRight} onPress={handleNext} />
        </View>

        {/* Top Header & Progress */}
        <View pointerEvents="box-none" style={[styles.viewerTop, { paddingTop: insets.top + 10 }]}>
          <LinearGradient pointerEvents="none" colors={['#000000c9', '#00000083', '#00000000']} style={styles.topShade} />
          {/* Progress Indicators */}
          <View pointerEvents="none" style={styles.progressRow}>
            {items.map((item: { id: string | number }, index: number) => (
              <View key={item.id} style={styles.progressBarBg}>
                {index < currentIndex && <View style={styles.progressBarFill} />}
                {index === currentIndex && <Animated.View style={[styles.progressBarFill, { transform: [{ scaleX: progressAnim }] }]} />}
              </View>
            ))}
          </View>

          {/* User Info Bar */}
          <View pointerEvents="box-none" style={styles.viewerUserBar}>
            <SocialUserAvatar
              user={{
                ...storyUser.user,
                id: storyUser.userId,
                username: storyUser.username,
                avatar: storyUser.avatar,
                role: storyUser.role ?? storyUser.user?.role,
                trainer_id: storyUser.trainer_id ?? storyUser.user?.trainer_id,
              }}
              size={36}
              gapColor="#141418"
              showStoryIndicator={false}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.viewerUsername} numberOfLines={1}>
                {storyUser.username} {isMe && '(Tú)'}
              </Text>
              <Text style={styles.viewerTime}>
                {currentStory?.created_at ? new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
              </Text>
            </View>

            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar historia" onPress={onClose}
              style={({ pressed }) => [styles.iconButton, styles.mediaControl, pressed && { opacity: 0.7 }]}>
              <X size={21} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Bottom Actions */}
        <View pointerEvents="box-none" style={[styles.viewerBottom, { paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient pointerEvents="none" colors={['#00000000', '#00000083', '#000000c9']} style={styles.bottomShade} />
          {isMe ? (
            <Pressable accessibilityRole="button" onPress={handleDelete}
              style={({ pressed }) => [styles.mediaPill, styles.mediaControl, pressed && { opacity: 0.7 }]}>
              <Trash2 size={18} color="#ffafb5" />
              <Text style={styles.deleteStoryText}>Eliminar historia</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel={isLiked ? 'Quitar Me gusta' : 'Me gusta'}
              accessibilityState={{ selected: Boolean(isLiked) }} onPress={handleLike}
              style={({ pressed }) => [styles.mediaPill, styles.mediaControl, isLiked && styles.likedControl, pressed && { opacity: 0.7 }]}>
              <Heart
                size={21}
                color={isLiked ? '#ffafb5' : '#ffffff'}
                fill={isLiked ? '#ffafb5' : 'transparent'}
              />
              {likesCount > 0 && (
                <Text style={styles.likeStoryCount}>{likesCount}</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20, paddingBottom: 12,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: { flex: 1, fontSize: 21, fontWeight: '800', letterSpacing: -0.45 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { gap: 14, paddingHorizontal: 20, paddingBottom: 12 },
  group: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 58, padding: 12,
    borderRadius: 16, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  bodyText: { fontSize: 13, lineHeight: 18 },
  submit: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24,
  },
  submitText: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  preview: { maxWidth: '100%', alignSelf: 'center', borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden' },
  videoPreview: { width: 168, aspectRatio: STORY_ASPECT_RATIO, backgroundColor: '#000000' },
  removeMedia: { position: 'absolute', top: 9, right: 9, backgroundColor: '#000000b5' },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyFrame: { backgroundColor: '#000000', overflow: 'hidden' },
  tapLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '35%',
  },
  tapRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '65%',
  },
  viewerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -30 },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    transformOrigin: 'left center',
  },
  viewerUserBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerUsername: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  viewerTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  viewerBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bottomShade: { position: 'absolute', top: -30, left: 0, right: 0, bottom: 0 },
  mediaControl: { backgroundColor: '#141418cc', borderWidth: StyleSheet.hairlineWidth, borderColor: '#ffffff50' },
  likedControl: { borderColor: '#ffafb5', backgroundColor: '#551c2cdd' },
  mediaPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minWidth: 48, minHeight: 48,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24,
  },
  likeStoryCount: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteStoryText: {
    color: '#ffafb5',
    fontSize: 13,
    fontWeight: '700',
  },
});
