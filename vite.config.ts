import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// De app staat op https://<gebruiker>.github.io/adaptieve-leerapp/ (ADR-0005).
export default defineConfig({
  base: '/adaptieve-leerapp/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true },
      manifest: {
        name: 'Ruimte-expeditie: woorden leren',
        short_name: 'Woordexpeditie',
        description: 'Oefen je woorden uit je eigen huiswerk.',
        lang: 'nl',
        start_url: '/adaptieve-leerapp/',
        scope: '/adaptieve-leerapp/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b1026',
        theme_color: '#0b1026',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
