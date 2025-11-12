import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "localhost",
    port: 3011,
    strictPort: true,
    hmr: {
      host: "localhost",
      clientPort: 3011,
      protocol: "ws",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@tanstack/react-query",
          ],
          monaco: ["monaco-editor", "@monaco-editor/react"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          supabase: ["@supabase/supabase-js"],
          charts: ["recharts"],
          ui: ["lucide-react", "@radix-ui/react-tooltip", "@radix-ui/react-dialog"],
        },
      },
    },
  },
}));
