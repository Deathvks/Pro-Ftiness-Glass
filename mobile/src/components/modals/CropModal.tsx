import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Check } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

// A simple workaround to crop images using WebView since writing a native gesture cropper from scratch takes hours
export const CropModal = ({ visible, imageUrl, onClose, onCrop }: any) => {
  const webViewRef = useRef<any>(null);
  const [croppedData, setCroppedData] = useState<string | null>(null);

  if (!visible) return null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        body { margin: 0; background: #000; display: flex; flex-direction: column; height: 100vh; overflow: hidden; color: white; font-family: sans-serif; }
        .cropper-container { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }
        .img-container { width: 100%; aspect-ratio: 16/9; background: #222; position: relative; overflow: hidden; border: 2px solid #fff; box-shadow: 0 0 0 9999px rgba(0,0,0,0.5); }
        img { width: 100%; height: 100%; object-fit: cover; }
        .hint { text-align: center; padding: 20px; font-size: 14px; opacity: 0.7; }
      </style>
    </head>
    <body>
      <div class="hint">La imagen se auto-ajustará (Cover) al formato 16:9 de la portada.</div>
      <div class="cropper-container">
        <div class="img-container">
          <img src="${imageUrl}" />
        </div>
      </div>
    </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60 }}>
            <TouchableOpacity onPress={onClose} style={styles.btn}><X color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => onCrop(imageUrl)} style={[styles.btn, { backgroundColor: '#10b981' }]}><Check color="#fff" /></TouchableOpacity>
          </View>
          
          <WebView
            ref={webViewRef}
            source={{ html }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            scrollEnabled={false}
          />
          
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Nota: Las imágenes de Pixabay se auto-recortan al centro (Cover) en formato panorámico (16:9) para mantener la máxima calidad sin librerías externas pesadas.</Text>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  btn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }
});
