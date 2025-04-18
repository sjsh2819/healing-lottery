import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: { outDir: "dist" },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    open: true,
  },
}));
