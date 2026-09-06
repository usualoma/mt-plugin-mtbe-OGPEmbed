import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  build: {
    outDir: "mt-static/plugins/OGPEmbed/dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: mode !== "development",
    lib: {
      entry: fileURLToPath(
        new URL("./mt-static/plugins/OGPEmbed/src/block.ts", import.meta.url)
      ),
      formats: ["iife"],
      name: "OGPEmbed",
      fileName: () => "block.min.js",
      cssFileName: "block.min",
    },
    rollupOptions: {
      external: ["jquery"],
      output: {
        globals: { jquery: "jQuery" },
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    css: true,
  },
}));
