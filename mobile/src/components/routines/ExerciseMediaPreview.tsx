import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text } from "react-native";
import { WebView } from "react-native-webview";
import { Play } from 'lucide-react-native';

export const ExerciseMediaPreview = ({ item, getImageUrl, staticOnly = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const images = [];
  if (item.images && Array.isArray(item.images)) {
    images.push(...item.images);
  } else if (item.images && typeof item.images === "string") {
    try {
      const parsed = JSON.parse(item.images);
      if (Array.isArray(parsed)) images.push(...parsed);
    } catch(e) {}
  }
  
  if (images.length === 0 && item.image_url_start && item.image_url_end) {
    images.push(item.image_url_start, item.image_url_end);
  } else if (images.length === 0) {
    images.push(getImageUrl(item));
  }

  useEffect(() => {
    if (images.length > 1 && !item.video_url && !item.youtube_id) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [images.length, item.video_url, item.youtube_id]);

  const getYoutubeId = (url) => {
    if (!url) return null;
    if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0];
    if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
    return null;
  };

  const yid = item.youtube_id || getYoutubeId(item.video_url);

  if ((item.video_url || item.youtube_id) && isPlaying && !staticOnly) {
    if (yid) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
          <style>
            body { margin: 0; padding: 0; background: #000; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; }
            iframe { width: 100%; height: 100%; border: none; pointer-events: none; }
          </style>
        </head>
        <body>
          <iframe src="https://www.youtube.com/embed/${yid}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&loop=1&playlist=${yid}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
        </body>
        </html>
      `;
      return (
        <View style={{ width: "100%", height: "100%", backgroundColor: "#000", pointerEvents: "none" }}>
          <WebView 
            source={{ html, baseUrl: 'https://youtube.com' }} 
            style={{ flex: 1, backgroundColor: "#000" }} 
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            scrollEnabled={false}
            pointerEvents="none"
          />
        </View>
      );
    }

    return (
      <View style={{ width: "100%", height: "100%", backgroundColor: "#000", pointerEvents: "none" }}>
        <WebView 
          source={{ uri: item.video_url }} 
          style={{ flex: 1, backgroundColor: "#000" }} 
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          pointerEvents="none"
        />
      </View>
    );
  }

  const thumbUri = yid && images.length === 1 && images[0].includes('placeholder') 
    ? `https://img.youtube.com/vi/${yid}/hqdefault.jpg` 
    : (images[currentIndex] || images[0]);

  return (
    <TouchableOpacity 
      activeOpacity={staticOnly ? 1 : 0.9} 
      style={{ width: "100%", height: "100%" }}
      onPress={() => {
        if (!staticOnly && (item.video_url || item.youtube_id)) setIsPlaying(true);
      }}
      disabled={staticOnly || !(item.video_url || item.youtube_id)}
    >
      <Image 
        source={{ uri: thumbUri }} 
        style={{ width: "100%", height: "100%" }} 
        resizeMode="cover" 
      />
      {!staticOnly && (item.video_url || item.youtube_id) && !isPlaying && (
        <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 32, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Play size={20} color="#fff" fill="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reproducir</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};
