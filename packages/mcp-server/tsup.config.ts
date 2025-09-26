import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2022',
  outDir: 'dist',
  splitting: false,
  bundle: true,
  treeshake: true,
  metafile: true,
  external: ['firebase-admin']
});
