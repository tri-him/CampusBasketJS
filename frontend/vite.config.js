import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'CampusBasket',
        short_name: 'CampusBasket',
        description: 'Your campus e-commerce marketplace',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon/shop192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon/shop512.png', // Ensure a 512x512 icon exists here too if possible
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon/shop512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});