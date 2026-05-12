import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The PWA app runs on its own port so it can coexist with the main website
// frontend during dev. Default 5174.
export default defineConfig({
  server: {
    port: 5174,
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Retreats by Traveon — Audit App',
        short_name: 'Retreats Audit',
        description: 'Property audit & review companion for Retreats by Traveon',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Audit photos can be large; raise the precache limit so the app
        // shell + chunks fit comfortably.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/api\/pwa\//.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pwa-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ url }) => /\/uploads\//.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pwa-uploads',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
});
