import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X, ArrowLeft } from 'lucide-react-native';

interface FullscreenVideoModalProps {
  visible: boolean;
  url: string | null;
  onClose: () => void;
}

export default function FullscreenVideoModal({
  visible,
  url,
  onClose,
}: FullscreenVideoModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible || !url) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close Button Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 16),
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Video Player */}
        <VideoPlayerWrapper url={url} />
      </View>
    </Modal>
  );
}

function VideoPlayerWrapper({ url }: { url: string }) {
  const player = useVideoPlayer(url, p => {
    p.loop = false;
    p.play();
  });

  return (
    <View style={styles.playerContainer}>
      <VideoView
        player={player}
        style={styles.fullVideo}
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
