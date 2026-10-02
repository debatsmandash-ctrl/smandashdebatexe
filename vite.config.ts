// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [VitePWA({
      strategies: "generateSW",
      injectRegister: null,
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      manifest: false,
      workbox: {
        swDest: "sw.js",
        globPatterns: ["**/*.{js,css,html,png,svg,webp,woff2,json}"],
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/~oauth(?:\/|$)/],
        runtimeCaching: [
          { urlPattern: ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin && !url.pathname.startsWith("/~oauth"), handler: "NetworkFirst", options: { cacheName: "debate-pages-v122", networkTimeoutSeconds: 4, expiration: { maxEntries: 24 } } },
          { urlPattern: ({ url }) => url.origin === self.location.origin && /\/assets\/[^/]+-[a-zA-Z0-9_-]+\.(?:js|css|png|jpg|webp|woff2)$/.test(url.pathname), handler: "CacheFirst", options: { cacheName: "debate-assets-v122", expiration: { maxEntries: 180, maxAgeSeconds: 60 * 60 * 24 * 30 } } },
        ],
      },
    })],
  },
  // Vercel needs Nitro's Build Output API adapter so SSR is deployed as a
  // Vercel Function instead of being emitted as a Cloudflare worker.
  nitro: {
    preset: "vercel",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
