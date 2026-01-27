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
    // Optimización agresiva de imágenes
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      svg: {
        multipass: true,
        plugins: [
          // Configuración corregida para evitar el warning de removeViewBox
          {
            name: 'preset-default',
            params: {
              overrides: {
                // removeViewBox: false, // Ya no se pone aquí si da problemas en nuevas versiones de SVGO
              },
            },
          },
          'removeDimensions', // Mueve dimensiones al viewBox si es necesario
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-libs';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('html5-qrcode')) {
              return 'scanner';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'maps';
            }
            if (id.includes('remotion')) {
              return 'remotion-libs';
            }
            return 'vendor';
          }
        }
      }
    },
  },
});