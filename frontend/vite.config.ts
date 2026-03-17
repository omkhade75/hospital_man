import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/vapi": {
        target: "https://api.vapi.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vapi/, ""),
      },
      "/api/murf": {
        target: "https://api.murf.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/murf/, ""),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
