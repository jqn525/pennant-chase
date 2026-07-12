import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-icon.svg", "portraits/*.png", "gear/*.png"],
      manifest: {
        name: "Pennant Chase",
        short_name: "Pennant",
        description: "Build a baseball club and chase the Pennant Cup.",
        theme_color: "#0d2418",
        background_color: "#091a12",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/pennant-chase/",
        scope: "/pennant-chase/",
        icons: [{ src: "pwa-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,woff2}"] },
    }),
  ],
  base: "/pennant-chase/", // served from github.io/pennant-chase/
});
