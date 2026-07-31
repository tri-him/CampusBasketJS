import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "CampusBasket",
        short_name: "CampusBasket",
        description: "Campus marketplace",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/shop192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/shop512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});