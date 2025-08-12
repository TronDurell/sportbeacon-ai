import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    historyApiFallback: true
  },
  build: {
    // Production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log statements in production
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
    },
    rollupOptions: {
      output: {
        // Optimize chunk splitting
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          utils: ['lodash', 'date-fns'],
        },
      },
    },
    // Source maps for development only
    sourcemap: mode !== 'production',
  },
  define: {
    // Environment variables
    __DEV__: mode !== 'production',
    __PROD__: mode === 'production',
  },
  esbuild: {
    // Remove console statements in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
})); 