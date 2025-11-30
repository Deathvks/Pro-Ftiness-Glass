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
    rollupOptions: {
      output: {
        // ESTRATEGIA SEGURA:
        // Solo separamos lo que es verdaderamente pesado y opcional.
        // React y el resto de utilidades van juntas en 'vendor' para evitar errores de inicialización.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. Material UI (Muy pesado, separar siempre)
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-libs';
            }
            // 2. Gráficos (Solo se usa en Dashboard)
            if (id.includes('recharts')) {
              return 'recharts';
            }
            // 3. Escáner (Solo se usa en Nutrición)
            if (id.includes('html5-qrcode')) {
              return 'scanner';
            }

            // 4. RESTO: Todo al vendor principal.
            // Esto asegura que React, ReactDOM, Router, Zustand, etc. estén juntos
            // y disponibles inmediatamente, solucionando el error de "createContext".
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
});