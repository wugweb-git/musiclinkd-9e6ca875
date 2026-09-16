// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
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
  },
});
