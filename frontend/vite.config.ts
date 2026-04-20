import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Aggiorna il Service Worker immediatamente quando viene trovata una nuova versione
      registerType: 'autoUpdate',
      
      // Risorse statiche da includere nella precache
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      
      manifest: {
        name: 'BeatMatch: Spotify Quiz',
        short_name: 'BeatMatch',
        description: 'Sfida i tuoi amici sui tuoi brani preferiti di Spotify',
        theme_color: '#c79a00',
        background_color: '#020203',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        inlineWorkboxRuntime: true, 
        importScripts: ['/sw-push-listener.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/],
        
        // Pulisce le vecchie cache per evitare conflitti di versione
        cleanupOutdatedCaches: true,

        // 3. GESTIONE CACHE DINAMICA (API e Immagini)
        runtimeCaching: [
          {
            // Caching API Backend Locale
            urlPattern: /^http:\/\/127\.0\.0\.1:5000\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'beatmatch-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12 // 12 ore
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Caching Immagini Spotify (CacheFirst = molto veloce)
            urlPattern: /^https:\/\/i\.scdn\.co\/image\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'spotify-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 giorni
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  
  preview: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
});