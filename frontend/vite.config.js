/* frontend/vite.config.js */
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
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
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    entries: [
      'index.html',
      'src/**/*.{js,jsx}'
    ],
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime'
    ]
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
      registerType: 'prompt',
      injectRegister: false,
      includeManifestIcons: false,
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
          'index.html',
          'manifest.webmanifest',
          'favicon.ico',
          'logo.webp',
          'pwa-*.webp',
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
      name: 'non-blocking-splash-css',
      enforce: 'post',
      transformIndexHtml(html) {
        const releaseVersion = JSON.parse(
          readFileSync(new URL('./public/version.json', import.meta.url), 'utf8')
        ).version;
        const storageBootstrap = `<script data-pfg-storage-bootstrap>
          (() => {
            const appVersion = ${JSON.stringify(releaseVersion)};
            const clearCommunityStorage = () => {
              localStorage.removeItem('pfg_social_feed_cache');
              localStorage.removeItem('pfg_social_feed_scope');
              localStorage.removeItem('viewed_stories_cache');
              localStorage.removeItem('user_gym');
              for (let index = localStorage.length - 1; index >= 0; index -= 1) {
                const key = localStorage.key(index);
                if (key?.startsWith('user_gym_')) localStorage.removeItem(key);
              }
            };

            try {
              const params = new URLSearchParams(window.location.search);
              if (['reset', 'repair', 'clear', 'clean'].some((key) => params.has(key))) {
                localStorage.clear();
                sessionStorage.clear();
                if ('caches' in window) caches.delete('api-read-cache').catch(() => {});
                const cleanUrl = window.location.origin + window.location.pathname.replace(/\\/$/, '') + '/login';
                window.location.replace(cleanUrl);
                return;
              }

              const versionKey = 'pfg_app_version';
              const previousVersion = localStorage.getItem(versionKey);
              if (previousVersion !== appVersion) {
                localStorage.removeItem('pfg_auto_reloaded_version');
                localStorage.removeItem('pfg_crash_loop_count');
                localStorage.removeItem('profitness_insights_expanded');
                try {
                  const rawCache = localStorage.getItem('pfg_cached_initial_state_v1');
                  if (rawCache) {
                    const parsed = JSON.parse(rawCache);
                    if (!(parsed?.userProfile && typeof parsed.userProfile === 'object' && parsed.userProfile.id)) {
                      localStorage.removeItem('pfg_cached_initial_state_v1');
                    }
                  }
                } catch {
                  localStorage.removeItem('pfg_cached_initial_state_v1');
                }
                clearCommunityStorage();
                localStorage.removeItem('pfg_pending_target_view');
                localStorage.setItem('lastView', 'dashboard');
                if ('caches' in window) {
                  const preserved = new Set(['exercise-offline-cache', 'remote-exercise-images-cache', 'vite-hashed-assets']);
                  caches.keys().then((keys) => Promise.all(
                    keys.filter((key) => !preserved.has(key) && !key.startsWith('workbox-precache'))
                      .map((key) => caches.delete(key))
                  )).catch(() => {});
                }
                sessionStorage.clear();
                localStorage.setItem(versionKey, appVersion);
                localStorage.setItem('pfg_cache_version', appVersion);
              } else {
                const crashCount = parseInt(localStorage.getItem('pfg_crash_loop_count') || '0', 10);
                if (crashCount >= 1) {
                  localStorage.removeItem('pfg_cached_initial_state_v1');
                  localStorage.removeItem('pfg_cache_version');
                  clearCommunityStorage();
                  localStorage.setItem('lastView', 'dashboard');
                  sessionStorage.clear();
                  if (crashCount >= 3) localStorage.clear();
                }
              }
            } catch (error) {
              console.warn('[AppBootstrap] No se pudo sanear el estado local:', error);
            }
          })();
        </script>`;

        // 1. Eliminar modulepreload pesados innecesarios en el arranque inicial
        let cleaned = html.replace(/<link\s+[^>]*rel=["']modulepreload["'][^>]*href=["'][^"']*vendor-recharts[^"']*["'][^>]*>\s*/gi, '');
        // 2. Mover hojas de estilo y scripts de entrada al final de <body> (después de #root y .app-splash-screen)
        // para que el navegador pinte el splash inline en 0ms sin pantalla blanca al recargar con Shift
        const cssLinks = cleaned.match(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
        const scriptTags = cleaned.match(/<script\s+type=["']module["'][^>]*><\/script>/gi) || [];
        const preloadLinks = cleaned.match(/<link\s+[^>]*rel=["']modulepreload["'][^>]*>/gi) || [];
        for (const tag of [...cssLinks, ...scriptTags, ...preloadLinks]) {
          cleaned = cleaned.replace(tag, '');
        }
        const injectedAtBodyEnd = [...preloadLinks, ...cssLinks, storageBootstrap, ...scriptTags].join('\n  ');
        return cleaned.replace('</body>', `  ${injectedAtBodyEnd}\n</body>`);
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








