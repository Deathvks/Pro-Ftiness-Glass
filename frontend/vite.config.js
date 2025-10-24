/* frontend/vite.config.js */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // CAMBIO: Escucha en todas las interfaces de red
    port: 5173, // Puedes mantener el puerto por defecto o cambiarlo si es necesario

    // --- Mantenemos el proxy ---
    proxy: {
      // Redirige peticiones de /api a tu backend
      '/api': {
        target: 'http://localhost:3001', // El proxy SÍ debe apuntar a localhost porque corre en la misma máquina que Vite
        changeOrigin: true,
      }
    }
    // --- Fin del proxy ---
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pro Fitness Glass',
        short_name: 'FitTrack-Pro',
        description:
          'Tu compañero de fitness definitivo para registrar entrenamientos y progreso.',
        theme_color: '#0c111b',
        background_color: '#0c111b',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
});