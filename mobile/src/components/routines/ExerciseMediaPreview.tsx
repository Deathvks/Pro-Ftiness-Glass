import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export const ExerciseMediaPreview = ({ item, getImageUrl }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

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
      }, 1500); // 1.5 seconds per frame
      return () => clearInterval(interval);
    }
  }, [images.length, item.video_url, item.youtube_id]);

  if (item.video_url || item.youtube_id) {
    const uri = item.video_url || `https://www.youtube.com/embed/${item.youtube_id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0`;
    return (
      <View style={{ width: "100%", height: "100%", backgroundColor: "#000" }}>
        <WebView 
          source={{ uri }} 
          style={{ flex: 1, backgroundColor: "#000" }} 
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={true}
          scrollEnabled={false}
        />
      </View>
    );
  }

  return (
    <Image 
      source={{ uri: images[currentIndex] || images[0] }} 
      style={{ width: "100%", height: "100%" }} 
      resizeMode="cover" 
    />
  );
};
