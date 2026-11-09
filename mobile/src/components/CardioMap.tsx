import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { CardioPoint } from '@/utils/cardio';

const mapDocument = (dark: boolean) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
  <style>
    html, body, #map { height: 100%; margin: 0; background: ${dark ? '#121317' : '#e9edf0'}; }
    #map { font: 13px system-ui, sans-serif; }
    #unavailable { padding: 16px; color: ${dark ? '#fff' : '#222'}; }
  </style>
</head>
<body>
  <div id="map"><div id="unavailable">Cargando mapa…</div></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
    if (window.L) {
      document.getElementById('unavailable').remove();
      const map = L.map('map', { zoomControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/${dark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);
      const pathLayer = L.polyline([], { weight: 5, opacity: 0.85 }).addTo(map);
      const marker = L.circleMarker([0, 0], { radius: 7, color: '#fff', weight: 2, fillOpacity: 1 });
      let initialized = false;
      window.updateCardioMap = ({ path, position, follow, color }) => {
        pathLayer.setStyle({ color });
        pathLayer.setLatLngs(path);
        if (position) {
          if (!initialized) map.setView(position, 16);
          else if (follow) map.panTo(position);
          marker.setLatLng(position).setStyle({ fillColor: color }).addTo(map);
        } else if (path.length) {
          map.fitBounds(pathLayer.getBounds(), { padding: [18, 18], maxZoom: 17 });
        }
        initialized = Boolean(position || path.length);
      };
      window.addEventListener('message', event => {
        if (event.source === window.parent && event.data?.type === 'cardio-map') {
          window.updateCardioMap(event.data.payload);
        }
      });
    } else {
      document.getElementById('unavailable').textContent = 'Mapa no disponible';
    }
  </script>
</body>
</html>`;

interface CardioMapProps {
  path: CardioPoint[];
  position?: CardioPoint | null;
  follow?: boolean;
  color: string;
  dark: boolean;
}

export function CardioMap({ path, position, follow = false, color, dark }: CardioMapProps) {
  const nativeMap = useRef<WebView<object>>(null);
  const webMap = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const source = useMemo(() => ({ html: mapDocument(dark) }), [dark]);

  useEffect(() => {
    if (!ready) return;
    const payload = { path, position, follow, color };
    if (Platform.OS === 'web') {
      webMap.current?.contentWindow?.postMessage({ type: 'cardio-map', payload }, '*');
    } else {
      nativeMap.current?.injectJavaScript(`window.updateCardioMap?.(${JSON.stringify(payload)}); true;`);
    }
  }, [ready, source, path, position, follow, color]);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe
          ref={webMap}
          title="Mapa de la ruta GPS"
          sandbox="allow-scripts"
          srcDoc={source.html}
          onLoad={() => {
            setReady(true);
            webMap.current?.contentWindow?.postMessage({ type: 'cardio-map', payload: { path, position, follow, color } }, '*');
          }}
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      ) : (
        <WebView<object>
          ref={nativeMap}
          source={source}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith('data:text/html')}
          onLoadStart={() => setReady(false)}
          onLoadEnd={() => setReady(true)}
          setSupportMultipleWindows={false}
          scrollEnabled={false}
          style={styles.container}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});
