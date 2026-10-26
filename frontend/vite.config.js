/* frontend/vite.config.js */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
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
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
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
    VitePWA({
      registerType: 'autoUpdate', // <-- CAMBIO AQUI: Actualización automática
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'logo.webp', 'icons/icon-96.png', 'icons/icon-192.png'],
      manifest: {
        name: 'Pro Fitness Glass',
        short_name: 'Pro Fitness Glass',
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
      injectManifest: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,webmanifest}'
        ],
        globIgnores: [
          '**/node_modules/**/*',
          'stats.html',
          'noticias/**/*.html',
          'calculadora-1rm/**/*.html',
          'calculadora-calorias-macros/**/*.html',
          'ejercicios/**/*.html',
          'aver.jpg',
          'entrenamiento.png',
          'nutrici*.png',
          'graficas.png',
          'social.png',
          'mapa.png',
          'ajustes.png',
          'perfil.png',
          'trainer-profile.jpg',
          'assets/themes/**/*',
          'assets/*GymLocationModal*',
          'assets/*BarcodeScanner*',
          'assets/*vendor-recharts*',
          'assets/*AdminPanel*',
          'assets/*TrainerPanel*',
          'assets/*RoutineEditor*',
          'assets/*html2canvas*'
        ],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: {
        enabled: false, // <-- APAGADO para evitar dolores de cabeza con la caché en móviles durante el desarrollo
        type: 'module',
      }
    }),
    visualizer({
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
    {
      name: 'css-before-js',
      enforce: 'post',
      transformIndexHtml(html) {
        // Eliminar modulepreload pesados innecesarios en el arranque inicial (como recharts)
        let cleaned = html.replace(/<link\s+[^>]*rel=["']modulepreload["'][^>]*href=["'][^"']*vendor-recharts[^"']*["'][^>]*>\s*/gi, '');
        const cssLinks = cleaned.match(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi);
        if (!cssLinks || cssLinks.length === 0) return cleaned;
        for (const link of cssLinks) {
          cleaned = cleaned.replace(link, '');
        }
        return cleaned.replace(
          /(<script\s+type=["']module["'][^>]*>)/i,
          `${cssLinks.join('\n  ')}\n  $1`
        );
      },
    },
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1500, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/') ||
              id.includes('/react-router') ||
              id.includes('/@remix-run/router')
            ) {
              return 'vendor-react';
            }
            if (id.includes('/recharts/') || id.includes('/d3-')) {
              return 'vendor-recharts';
            }
            if (id.includes('/lucide-react/') || id.includes('/react-icons/') || id.includes('/@heroicons/')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  },
});








