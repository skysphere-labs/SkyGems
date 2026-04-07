import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/v1": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@skygems/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
