import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Set the root directory to /frontend
  root: resolve(__dirname, './frontend'),

  // Set public assets dir
  publicDir: resolve(__dirname, './frontend/public'),

  resolve: {
    alias: {
      '@': resolve(__dirname, './frontend/src'),
      '@components': resolve(__dirname, './frontend/src/components'),
      '@pages': resolve(__dirname, './frontend/src/pages'),
      '@contexts': resolve(__dirname, './frontend/src/contexts'),
      '@providers': resolve(__dirname, './frontend/src/providers'),
      '@routes': resolve(__dirname, './frontend/src/routes'),
      '@services': resolve(__dirname, './frontend/src/services'),
      '@utils': resolve(__dirname, './frontend/src/utils'),
      '@types': resolve(__dirname, './frontend/src/types'),
      '@hooks': resolve(__dirname, './frontend/src/hooks'),
      '@ai': resolve(__dirname, './frontend/src/ai'),
      '@analytics': resolve(__dirname, './frontend/src/analytics'),
      '@mobile': resolve(__dirname, './frontend/src/mobile'),
      '@community': resolve(__dirname, './frontend/src/community'),
      '@reports': resolve(__dirname, './frontend/src/reports'),

      // External aliases
      '@frontend': resolve(__dirname, './frontend'),
      '@backend': resolve(__dirname, './backend'),
      '@lib': resolve(__dirname, './lib'),
    },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },

  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ],
    },
  },

  build: {
    target: 'es2015',
    outDir: resolve(__dirname, 'dist'),
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    rollupOptions: {
      input: resolve(__dirname, './frontend/index.html'),
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['@headlessui/react', '@heroicons/react'],
          sentry: ['@sentry/react', '@sentry/tracing'],
          stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
  },

  server: {
    port: 3000,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },

  preview: {
    port: 4173,
    host: true,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      '@sentry/react',
      '@sentry/tracing',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
    ],
  },
});
