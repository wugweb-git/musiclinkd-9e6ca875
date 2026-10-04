// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import { fileURLToPath } from "node:url";
import sirv from "sirv";

// Dev-only: serves the static /guide design-system reference (guide/index.html etc.)
// straight from disk at http://localhost:<port>/guide — not part of the production build.
function serveGuidePlugin(): Plugin {
  return {
    name: "serve-guide",
    apply: "serve",
    configureServer(server) {
      const serve = sirv("guide", { dev: true, single: false });
      server.middlewares.use("/guide", serve);
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [serveGuidePlugin()],
    resolve: {
      alias: {
        // supabase-js constructs a RealtimeClient whether or not you use realtime, which put the
        // whole websocket stack (55 KB gzip) on the critical path for a feature the app does not
        // have: no `.channel(` and no `postgres_changes` anywhere in src. The stub covers the
        // methods supabase-js calls itself and throws on anything that would open a socket.
        // An absolute file path: the dev dependency optimizer resolves a root-relative "/src/…"
        // from inside node_modules, misses the file, and the page never hydrates.
        "@supabase/realtime-js": fileURLToPath(
          new URL("./src/integrations/supabase/realtime-stub.ts", import.meta.url),
        ),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Without this, Rollup gives each individually-imported lucide-react icon its own
          // chunk — 30+ separate ~500-byte JS files on the client, each a full HTTP round trip.
          // Bundling them into one chunk turns 30+ requests into 1. Verified against production
          // (app.musiclinkd.com): 52 JS chunks on first load, 32 of them single icons.
          manualChunks(id) {
            return id.includes("node_modules/lucide-react") ? "lucide-icons" : undefined;
          },
        },
      },
    },
  },
});
