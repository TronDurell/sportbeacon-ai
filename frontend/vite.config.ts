import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'SportBeaconAI',
        short_name: 'SportBeacon',
        start_url: '/',
        display: 'standalone',
        background_color: '#0B0F1A',
        theme_color: '#0B5FFF',
        icons: [
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: { 
        clientsClaim: true, 
        skipWaiting: true 
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      "@sportbeacon/memory-sdk": resolve(__dirname, "../packages/memory-sdk/dist/index.js"),
    },
  },
  server: {
    port: 3002,
    host: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
}); 