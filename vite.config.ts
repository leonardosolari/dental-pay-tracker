// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Cambiato da '::' a '0.0.0.0' per migliore compatibilità con Docker
    port: 8080,
    // Aggiungi questa sezione per il proxy
    proxy: {
      '/api': {
        target: 'http://backend:5000', // Indirizza le chiamate a /api al servizio backend di Docker
        changeOrigin: true,
        // Non serve rewrite perché il tuo backend ha già il prefisso /api
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));