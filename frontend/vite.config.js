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
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                // Configuración segura para SVGO
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. MAPAS: Agrupamos leaflet y react-leaflet juntos para evitar roturas
            if (id.includes('leaflet')) {
              return 'maps';
            }
            
            // 2. ICONOS: Aislamos Lucide y React Icons (Aquí estaba el fallo de 'Activity')
            // Al ponerlos aparte, evitamos conflictos de inicialización con React Core
            if (id.includes('lucide') || id.includes('react-icons') || id.includes('heroicons')) {
              return 'icons';
            }

            // 3. REACT CORE: Detección estricta para no atrapar otras librerías
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react-router-dom/')) {
              return 'react-vendor';
            }

            // 4. LIBRERÍAS PESADAS: Separación estándar
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-libs';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('html5-qrcode')) {
              return 'scanner';
            }
            if (id.includes('remotion')) {
              return 'remotion-libs';
            }

            // 5. RESTO
            return 'vendor';
          }
        }
      }
    },
  },
});