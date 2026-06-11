import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Fútbol Tracker M26',
        short_name: 'M26',
        description:
          'Seguimiento del torneo de selecciones 2026: fixture, grupos, eliminatorias, estadísticas, plantillas y noticias.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#0d1424',
        theme_color: '#0d9488',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // incluir banderas e iconos en el precache para uso offline
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // escudos y fotos: cache-first para que el fixture funcione offline
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(r2\.thesportsdb\.com|a\.espncdn\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 3600 },
            },
          },
        ],
      },
    }),
  ],
  server: { host: true },
})
