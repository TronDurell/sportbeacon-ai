import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  target: 'es2022',
  treeshake: true,
  skipNodeModulesBundle: true,
});
