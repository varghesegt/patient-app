import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const CSP_HEADER =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "img-src 'self' data: blob: https:; " +
  "connect-src 'self' https://overpass-api.de https://*.tile.openstreetmap.org; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "object-src 'none';";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allow LAN & ngrok access
    port: 5173,
    strictPort: false,
    allowedHosts: ["localhost", "127.0.0.1", ".ngrok-free.app"],
    hmr: {
      protocol: "ws",
      host: "localhost", // change to ngrok hostname if needed
      port: 5173,
    },
    // ✅ Dev server middleware for CSP
    setupMiddlewares: (middlewares) => {
      middlewares.use((req, res, next) => {
        res.setHeader("Content-Security-Policy", CSP_HEADER);
        next();
      });
      return middlewares;
    },
  },
  preview: {
    port: 4173,
    headers: {
      "Content-Security-Policy": CSP_HEADER,
    },
  },
});
