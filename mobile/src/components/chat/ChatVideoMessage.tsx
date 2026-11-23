import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Maximize2 } from 'lucide-react-native';

interface ChatVideoMessageProps {
  url: string;
  accentColor?: string;
  onOpenFullscreen?: (url: string) => void;
}

export default function ChatVideoMessage({
  url,
  accentColor = '#0284c7',
  onOpenFullscreen,
}: ChatVideoMessageProps) {
  const player = useVideoPlayer(url, p => {
    p.loop = false;
  });

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
      />
      {onOpenFullscreen && (
        <TouchableOpacity
          onPress={() => onOpenFullscreen(url)}
          style={styles.fullscreenBtn}
          activeOpacity={0.7}
        >
          <Maximize2 size={12} color={accentColor} />
          <Text style={[styles.fullscreenText, { color: accentColor }]}>
            Abrir vídeo en pantalla completa
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  fullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
    paddingBottom: 2,
  },
  fullscreenText: {
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
