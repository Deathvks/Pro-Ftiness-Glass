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

  const getYoutubeId = (url) => {
    if (!url) return null;
    if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0];
    if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
    return null;
  };

  if (item.video_url || item.youtube_id) {
    const yid = item.youtube_id || getYoutubeId(item.video_url);
    
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

    // Fallback si no es un video de youtube
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

  return (
    <Image 
      source={{ uri: images[currentIndex] || images[0] }} 
      style={{ width: "100%", height: "100%" }} 
      resizeMode="cover" 
    />
  );
};
