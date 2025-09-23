import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: {
    resolve: true
  },
  format: ["esm", "cjs"],
  sourcemap: true,
  clean: true,
  target: "es2020",
  treeshake: true,
  tsconfig: "./tsconfig.build.json"
});