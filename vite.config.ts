/// <reference types="vitest" />
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 3015,
    // Cloudflare Tunnel / ngrok — host changes each session
    allowedHosts: [".trycloudflare.com", ".ngrok-free.app", ".ngrok.io", "localhost"],
  },
  preview: {
    allowedHosts: ["memorix-portal.kaspx.com", "localhost", "127.0.0.1"],
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
