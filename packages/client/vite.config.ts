import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 0,
    target: "es2022",
  },
  preview: {
    port: 3000,
  },
  resolve: {
    dedupe: ["proxy-deep", "styled-components"],
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
    exclude: ["@latticexyz/noise", "buffer"],
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
