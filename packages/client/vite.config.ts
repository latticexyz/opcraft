import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 0,
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
      target: "es2020",
    },
    exclude: ["@latticexyzy/network"],
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
