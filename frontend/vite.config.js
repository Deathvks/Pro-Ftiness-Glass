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
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'apple-touch-icon.png', 'logo.webp'],
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
          'noticias/**/*.html'
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
        const cssLinks = html.match(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi);
        if (!cssLinks || cssLinks.length === 0) return html;
        let cleaned = html;
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
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  },
});








