import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: false,
      includeAssets: ["logo.png", "manifest.json"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json}"],
        globIgnores: ["**/*.html", "api/**"],
        navigateFallback: undefined,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        runtimeCaching: [{
          urlPattern: ({ request, url }) => request.mode === 'navigate' && url.origin === self.location.origin && !/^\/(?:api|_sites|signin-with-chatgpt|signout-with-chatgpt|callback)(?:\/|$)/.test(url.pathname),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'starbucks-genie-pages-v1',
            plugins: [{ cacheKeyWillBeUsed: async ({ request }) => {
              const url = new URL(request.url); url.search = ''; return url.href;
            } }],
            networkTimeoutSeconds: 5,
            cacheableResponse: { statuses: [200] },
            matchOptions: { ignoreSearch: true },
            fetchOptions: { cache: 'no-store' },
            expiration: { maxEntries: 8 },
          },
        }],
      },
    }),
  ],
  server: { port: 3000, proxy: { "/api": "http://127.0.0.1:3001" } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
  },
});
