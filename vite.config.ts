import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the built site works on GitHub Pages project subpaths.
  base: "./",
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          qrcode: ["qrcode", "jsqr"],
          xlsx: ["xlsx", "jszip"],
        },
      },
    },
  },
});
