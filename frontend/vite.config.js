/* frontend/vite.config.js */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import Sitemap from 'vite-plugin-sitemap';
import { visualizer } from 'rollup-plugin-visualizer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    // Mantenemos esto porque reduce el peso de las imágenes sin romper el código
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                // Configuración por defecto
              },
            },
          },
          'removeDimensions',
        ],
      },
      png: { quality: 75 },
      jpeg: { quality: 75 },
      webp: { quality: 75, lossless: false },
    }),
    Sitemap({
      hostname: 'https://pro-fitness-glass.zeabur.app',
      readable: true,
      dynamicRoutes: [
        '/',
        '/login',
        '/register',
        '/social',
        '/explore',
        '/privacy-policy'
      ],
      robots: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin', '/settings']
        }
      ]
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon-32x32.png', 'apple-touch-icon.webp'],
      manifest: {
        name: 'Pro Fitness Glass',
        short_name: 'FitTrack-Pro',
        description: 'Tu compañero de fitness definitivo para registrar entrenamientos y progreso.',
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
    visualizer({
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1500, // Subimos el límite para que no avise, ya que haremos un solo bundle grande
    // Hemos eliminado 'rollupOptions' con 'manualChunks'. 
    // Dejamos que Vite decida cómo dividir el código, que es lo más seguro.
  },
});