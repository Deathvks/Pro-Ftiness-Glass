/* frontend/vite.config.js */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.webp'],
      manifest: {
        name: 'Pro Fitness Glass',
        short_name: 'FitTrack-Pro',
        description: 'Tu compañero de fitness definitivo para registrar entrenamientos y progreso.',
        theme_color: '#0c111b',
        background_color: '#0c111b',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.webp',
            sizes: '192x192',
            type: 'image/webp',
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable',
          },
        ],
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      devOptions: {
        enabled: true,
        type: 'module',
      }
    }),
  ],
  build: {
    sourcemap: false,
    // --- INICIO DE LA MODIFICACIÓN (Optimización de Rendimiento) ---
    rollupOptions: {
      output: {
        // Usamos una función para un control total sobre los chunks
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. Núcleo de React (Crítico)
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/react-helmet') || id.includes('/i18next')) {
              return 'react-vendor';
            }
            // 2. Estado y Utilidades
            if (id.includes('/zustand/') || id.includes('/date-fns/') || id.includes('/uuid/')) {
              return 'state-utils';
            }
            // 3. UI Libraries & MUI (Pesado)
            // Agrupamos MUI y Emotion juntos
            if (id.includes('/@mui/material/') || id.includes('/@emotion/') || id.includes('/@headlessui/') || id.includes('/@hello-pangea/')) {
              return 'ui-libs';
            }
            // 4. Iconos (Suelen ser muchos archivos pequeños)
            if (id.includes('/lucide-react/') || id.includes('/react-icons/') || id.includes('/@heroicons/') || id.includes('/@mui/icons-material/')) {
              return 'icons';
            }
            // 5. Gráficos (Pesado, solo para Dashboard/Progress)
            if (id.includes('/recharts/')) {
              return 'charts';
            }
            // 6. Escáner
            if (id.includes('/html5-qrcode/')) {
              return 'scanner';
            }

            // 7. CATCH-ALL: Todo lo demás va a un chunk genérico de proveedores
            // Esto evita que librerías olvidadas inflen el archivo principal de la app
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // --- FIN DE LA MODIFICACIÓN ---
  },
});