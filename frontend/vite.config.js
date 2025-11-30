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
        // Esta configuración divide el código en "chunks" (pedazos) lógicos.
        // En lugar de un solo archivo JS de 600KB, crea varios más pequeños.
        manualChunks: {
          // 1. Núcleo de React (se carga siempre)
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async', 'react-i18next', 'i18next'],
          // 2. Utilidades y Estado (ligeros pero usados en toda la app)
          'state-utils': ['zustand', 'date-fns', 'uuid'],
          // 3. UI Libraries (pueden ser pesadas)
          'ui-components': ['@headlessui/react', '@hello-pangea/dnd'],
          // 4. Iconos (suelen ocupar mucho espacio si no se separan)
          'icons': ['lucide-react', 'react-icons', '@heroicons/react', '@mui/icons-material'],
          // 5. Gráficos (Recharts es muy pesada, la separamos para que solo cargue en Dashboard/Progress)
          'charts': ['recharts'],
          // 6. Escáner (solo necesario para Nutrition)
          'scanner': ['html5-qrcode'],
        }
      }
    },
    // Aumentamos el límite de aviso de tamaño de chunk para que no moleste en la consola,
    // ya que hemos controlado manualmente la división.
    chunkSizeWarningLimit: 1000,
    // --- FIN DE LA MODIFICACIÓN ---
  },
});