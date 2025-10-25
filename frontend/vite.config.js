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
      // --- INICIO DE LA MODIFICACIÓN ---
      // Cambiado apple-touch-icon.png a .webp
      includeAssets: ['favicon.ico', 'apple-touch-icon.webp'],
      // --- FIN DE LA MODIFICACIÓN ---
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
            // --- INICIO DE LA MODIFICACIÓN ---
            // Cambiado .png a .webp y type a image/webp
            src: 'pwa-192x192.webp',
            sizes: '192x192',
            type: 'image/webp',
            // --- FIN DE LA MODIFICACIÓN ---
          },
          {
            // --- INICIO DE LA MODIFICACIÓN ---
            // Cambiado .png a .webp y type a image/webp
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            // --- FIN DE LA MODIFICACIÓN ---
          },
          {
            // --- INICIO DE LA MODIFICACIÓN ---
            // Cambiado .png a .webp y type a image/webp
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable',
            // --- FIN DE LA MODIFICACIÓN ---
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
});