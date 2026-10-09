import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import {
  ShieldAlert,
  Clock,
  Shield,
  Lock,
  X,
  Camera,
  Image as ImageIcon,
  Heart,
  Trash2,
  Globe,
  Users,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/routineHelpers';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { SocialUserAvatar } from './SocialUserAvatar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==========================================
// 1. STORY TERMS MODAL
// ==========================================
export function StoryTermsModal({
  visible,
  onAccept,
  onReject,
}: {
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentTextColor = getContrastTextColor(colors.tint);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onReject}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.2)',
            },
          ]}
          onPress={onReject}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.termsCardWrapper}>
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
            />
            <View style={[styles.termsCard, { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)', backgroundColor: 'transparent' }]}>
              <View style={[styles.shieldIconBox, { backgroundColor: colors.tint + '15', borderColor: colors.tint + '30' }]}>
                <ShieldAlert size={34} color={colors.tint} />
              </View>

              <Text style={[styles.termsTitle, { color: colors.text }]}>Historias Efímeras</Text>
              <Text style={[styles.termsSubtitle, { color: colors.textSecondary }]}>
                Antes de subir tu primera historia, debes conocer cómo funciona este espacio en nuestra comunidad.
              </Text>

              <View style={styles.termsList}>
                <View style={[styles.termsItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Clock size={20} color="#3b82f6" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>Duración Limitada</Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                      Todo el contenido se elimina automáticamente de los servidores tras <Text style={{ fontWeight: '700', color: colors.text }}>24 horas</Text>.
                    </Text>
                  </View>
                </View>

                <View style={[styles.termsItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Shield size={20} color={colors.tint} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>Privacidad</Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                      Puedes elegir si compartir tu historia con <Text style={{ fontWeight: '700', color: colors.text }}>todos los usuarios</Text> o solo con <Text style={{ fontWeight: '700', color: colors.text }}>tus amigos</Text>.
                    </Text>
                  </View>
                </View>

                <View style={[styles.termsItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Lock size={20} color="#a855f7" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>Responsabilidad</Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                      No subas contenido ofensivo ni inapropiado. Respeta las normas de la comunidad.
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={onAccept}
                activeOpacity={0.85}
                style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              >
                <Text style={[styles.primaryButtonText, { color: accentTextColor }]}>
                  Aceptar y Continuar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onReject} activeOpacity={0.7} style={styles.secondaryButton}>
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </GlassView>
    </Modal>
  );
}

// ==========================================
// 2. UPLOAD STORY MODAL
// ==========================================
export function UploadStoryModal({
  visible,
  onClose,
  onUpload,
  isUploading,
}: {
  visible: boolean;
  onClose: () => void;
  onUpload: (fileData: any, privacy: string) => Promise<void>;
  isUploading: boolean;
}) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [privacy, setPrivacy] = useState<'friends' | 'public'>('friends');

  useEffect(() => {
    if (!visible) {
      setSelectedAsset(null);
      setPrivacy('friends');
    }
  }, [visible]);

  const handlePickMedia = async (useCamera = false) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.85,
        videoMaxDuration: 15,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAsset(result.assets[0]);
      }
    } catch (err) {
      console.error('Error selecting media:', err);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedAsset) return;
    const fileData = {
      uri: selectedAsset.uri,
      name: selectedAsset.fileName || (selectedAsset.type === 'video' ? 'story.mp4' : 'story.jpg'),
      type: selectedAsset.mimeType || (selectedAsset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    };
    await onUpload(fileData, privacy);
  };

  const accentTextColor = getContrastTextColor(colors.tint);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.2)',
            },
          ]}
          onPress={onClose}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.uploadCardWrapper}>
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
            />
            <View style={[styles.uploadCard, { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)', backgroundColor: 'transparent' }]}>
              {/* Header */}
              <View style={styles.uploadHeader}>
                <Text style={[styles.uploadTitle, { color: colors.text }]}>Compartir Historia</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

            {/* Media Preview or Picker Buttons */}
            {selectedAsset ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: selectedAsset.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setSelectedAsset(null)}
                  style={styles.changeMediaBtn}
                >
                  <X size={16} color="#ffffff" />
                  <Text style={styles.changeMediaText}>Cambiar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickOptionsContainer}>
                <TouchableOpacity
                  onPress={() => handlePickMedia(false)}
                  activeOpacity={0.8}
                  style={[styles.pickButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]}
                >
                  <ImageIcon size={28} color={colors.tint} />
                  <Text style={[styles.pickButtonText, { color: colors.text }]}>Galería</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handlePickMedia(true)}
                  activeOpacity={0.8}
                  style={[styles.pickButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]}
                >
                  <Camera size={28} color={colors.tint} />
                  <Text style={[styles.pickButtonText, { color: colors.text }]}>Cámara</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Privacy Selector */}
            <Text style={[styles.privacyLabel, { color: colors.textSecondary }]}>¿Quién puede verla?</Text>
            <View style={styles.privacyRow}>
              <TouchableOpacity
                onPress={() => setPrivacy('friends')}
                activeOpacity={0.8}
                style={[
                  styles.privacyPill,
                  {
                    backgroundColor: privacy === 'friends' ? colors.tint : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    borderColor: privacy === 'friends' ? colors.tint : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                  },
                ]}
              >
                <Users size={16} color={privacy === 'friends' ? accentTextColor : colors.textSecondary} style={{ marginRight: 6 }} />
                <Text
                  style={[
                    styles.privacyText,
                    {
                      color: privacy === 'friends' ? accentTextColor : colors.textSecondary,
                      fontWeight: privacy === 'friends' ? '700' : '500',
                    },
                  ]}
                >
                  Solo Amigos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPrivacy('public')}
                activeOpacity={0.8}
                style={[
                  styles.privacyPill,
                  {
                    backgroundColor: privacy === 'public' ? colors.tint : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    borderColor: privacy === 'public' ? colors.tint : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                  },
                ]}
              >
                <Globe size={16} color={privacy === 'public' ? accentTextColor : colors.textSecondary} style={{ marginRight: 6 }} />
                <Text
                  style={[
                    styles.privacyText,
                    {
                      color: privacy === 'public' ? accentTextColor : colors.textSecondary,
                      fontWeight: privacy === 'public' ? '700' : '500',
                    },
                  ]}
                >
                  Todo el mundo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleConfirmUpload}
              disabled={!selectedAsset || isUploading}
              activeOpacity={0.85}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.tint,
                  opacity: !selectedAsset || isUploading ? 0.5 : 1,
                  marginTop: 16,
                },
              ]}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={accentTextColor} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: accentTextColor }]}>
                  Compartir Historia
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </GlassView>
  </Modal>
  );
}

// ==========================================
// 3. STORY VIEWER MODAL
// ==========================================
export function StoryViewerModal({
  visible,
  userId,
  onClose,
}: {
  visible: boolean;
  userId: string | number | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const userProfile = useAppStore(state => state.userProfile);
  const stories = useAppStore(state => state.stories) || [];
  const myStories = useAppStore(state => state.myStories) || [];
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
        items: myStories,
      }
    : stories.find((s: any) => String(s.userId) === String(userId));

  const items = storyUser?.items || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
    }
  }, [visible, userId]);

  const currentStory = items[currentIndex];

  useEffect(() => {
    if (!visible || !currentStory) return;

    // Mark as viewed
    if (userId && currentStory.id) {
      markStoryAsViewed(userId, currentStory.id);
    }

    // Reset and start animation
    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        if (currentIndex < items.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          onClose();
        }
      }
    });

    return () => animation.stop();
  }, [currentIndex, visible, currentStory]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
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
        handleNext();
      }
    }
  };

  if (!visible || !storyUser || items.length === 0) return null;

  let mediaUrl = currentStory?.media_url || currentStory?.url || '';
  if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('blob:')) {
    const clean = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;
    mediaUrl = `${BACKEND_BASE_URL}${clean}`;
  }

  const isLiked = currentStory?.isLiked || (Array.isArray(currentStory?.likes) && currentStory.likes.some((l: any) => String(l.userId || l.id) === String(userProfile?.id)));
  const likesCount = Array.isArray(currentStory?.likes) ? currentStory.likes.length : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerContainer}>
        {/* Story Media */}
        {mediaUrl ? (
          <Image
            source={{ uri: mediaUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#9ca3af' }}>No se pudo cargar la imagen</Text>
          </View>
        )}

        {/* Tap areas for Prev / Next */}
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={styles.tapLeft} onPress={handlePrev} />
          <Pressable style={styles.tapRight} onPress={handleNext} />
        </View>

        {/* Top Header & Progress */}
        <View style={[styles.viewerTop, { paddingTop: insets.top + 10 }]}>
          {/* Progress Indicators */}
          <View style={styles.progressRow}>
            {items.map((_: any, idx: number) => {
              let width: any = '0%';
              if (idx < currentIndex) width = '100%';
              else if (idx === currentIndex) {
                width = progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                });
              }
              return (
                <View key={idx} style={styles.progressBarBg}>
                  <Animated.View style={[styles.progressBarFill, { width }]} />
                </View>
              );
            })}
          </View>

          {/* User Info Bar */}
          <View style={styles.viewerUserBar}>
            <SocialUserAvatar
              user={{ username: storyUser.username, avatar: storyUser.avatar }}
              size={36}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.viewerUsername} numberOfLines={1}>
                {storyUser.username} {isMe && '(Tú)'}
              </Text>
              <Text style={styles.viewerTime}>
                {currentStory?.created_at ? new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.viewerCloseBtn}>
              <X size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={[styles.viewerBottom, { paddingBottom: insets.bottom + 16 }]}>
          {isMe ? (
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.8}
              style={styles.deleteStoryBtn}
            >
              <Trash2 size={20} color="#ef4444" />
              <Text style={styles.deleteStoryText}>Eliminar historia</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleLike}
              activeOpacity={0.8}
              style={[
                styles.likeStoryBtn,
                { backgroundColor: isLiked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 0, 0, 0.4)' },
              ]}
            >
              <Heart
                size={22}
                color={isLiked ? '#ef4444' : '#ffffff'}
                fill={isLiked ? '#ef4444' : 'transparent'}
              />
              {likesCount > 0 && (
                <Text style={styles.likeStoryCount}>{likesCount}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  termsCardWrapper: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  termsCard: {
    padding: 24,
    borderWidth: 1,
    borderRadius: 28,
    alignItems: 'center',
  },
  shieldIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  termsTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  termsSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  termsList: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  termsItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Upload styles
  uploadCardWrapper: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  uploadCard: {
    padding: 22,
    borderWidth: 1,
    borderRadius: 28,
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  pickOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pickButton: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewContainer: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeMediaBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeMediaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  privacyLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  privacyPill: {
    flex: 1,
    height: 42,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    fontSize: 13,
  },

  // Story Viewer styles
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
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
    height: '100%',
    backgroundColor: '#ffffff',
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
  viewerCloseBtn: {
    padding: 6,
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
  likeStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  likeStoryCount: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteStoryText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
